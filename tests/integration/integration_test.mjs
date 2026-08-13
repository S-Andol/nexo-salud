// Scripted integration test against a running dev server (default http://localhost:3000,
// override with TEST_BASE_URL). Exercises the golden path plus the RN-01..09 edge cases
// and the true concurrency race, hitting the real HTTP API (not calling services
// directly) so it proves the whole stack — routes, auth, validation, business rules,
// DB constraints.
//
// Prerequisite: the app must already be running (`npm run dev` or a deployed instance)
// against a seeded database (`npm run db:seed`) before this script starts.
//
// Run: npm run test:integration

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..", "..");

const { PrismaClient } = await import(pathToFileURL(path.join(PROJECT_DIR, "node_modules/@prisma/client/index.js")));

// Load DATABASE_URL etc. from the project's single .env file (never printed/logged).
const envPath = path.join(PROJECT_DIR, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const prisma = new PrismaClient();
const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;

function ok(desc, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  PASS: ${desc}`);
  } else {
    failed++;
    console.log(`  FAIL: ${desc}${extra ? " -- " + JSON.stringify(extra) : ""}`);
  }
}

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;
  return setCookie.split(";")[0];
}

async function api(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // no body
  }
  return { status: res.status, json, cookie: extractCookie(res) };
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

async function registerPatient(label) {
  const suffix = randomSuffix();
  const body = {
    firstName: "Test",
    lastName: `User${suffix}`,
    dni: String(50000000 + Math.floor(Math.random() * 9000000)),
    birthDate: "1990-05-15",
    email: `test.${suffix}@example.com`,
    phone: "+54 11 4555-1234",
    password: "Testing#2026",
    confirmPassword: "Testing#2026",
  };
  const res = await api("/api/auth/register", { method: "POST", body });
  ok(`${label}: register succeeds (201)`, res.status === 201, res.json);
  return { cookie: res.cookie, patient: res.json?.patient };
}

async function main() {
  console.log("=== Golden path ===");
  const { cookie, patient } = await registerPatient("golden");
  ok("golden: session cookie issued", !!cookie);
  ok("golden: patient summary returned", !!patient?.patientId);

  // Unauthenticated access to a protected API route
  const unauth = await api("/api/appointments");
  ok("unauth: GET /api/appointments without cookie -> 401 UNAUTHENTICATED", unauth.status === 401 && unauth.json?.error?.code === "UNAUTHENTICATED", unauth);

  // Find a specialty + professional + a real available slot far enough in the future
  const specialtiesRes = await api("/api/specialties");
  const specialty = specialtiesRes.json.specialties[0];
  ok("golden: specialties list non-empty", !!specialty);

  const professionalsRes = await api(`/api/professionals?specialtyId=${specialty.id}`);
  const professional = professionalsRes.json.professionals.find((p) => p.nextAvailableSlot);
  ok("golden: found a professional with availability", !!professional, professionalsRes.json);

  // Look ~10 days out for a slot, comfortably clear of the 2h/90d boundaries.
  const today = new Date();
  const targetDate = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
  const dateStr = targetDate.toISOString().slice(0, 10);

  async function findSlotOnOrAfter(professionalId, startDateStr, maxDaysAhead = 20) {
    let d = new Date(startDateStr + "T00:00:00Z");
    for (let i = 0; i < maxDaysAhead; i++) {
      const ds = d.toISOString().slice(0, 10);
      const availRes = await api(`/api/professionals/${professionalId}/availability?date=${ds}`);
      if (availRes.json?.slots?.length > 0) return { date: ds, time: availRes.json.slots[0].time };
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
    return null;
  }

  const slot1 = await findSlotOnOrAfter(professional.id, dateStr);
  ok("golden: found a real open slot ~10 days out", !!slot1, slot1);

  const bookingBody = { specialtyId: specialty.id, professionalId: professional.id, date: slot1.date, time: slot1.time };
  const bookRes = await api("/api/appointments", { method: "POST", body: bookingBody, cookie });
  ok("golden: booking succeeds (201)", bookRes.status === 201, bookRes.json);
  ok(
    "golden: appointment code matches NX-YYYY-XXXXXX",
    /^NX-\d{4}-\d{6}$/.test(bookRes.json?.appointment?.appointmentCode ?? ""),
    bookRes.json
  );
  const firstAppointmentId = bookRes.json?.appointment?.id;

  console.log("=== RN-09: duplicate booking ===");
  const dupRes = await api("/api/appointments", { method: "POST", body: bookingBody, cookie });
  ok("RN-09: identical booking rejected (409 DUPLICATE_BOOKING)", dupRes.status === 409 && dupRes.json?.error?.code === "DUPLICATE_BOOKING", dupRes.json);

  console.log("=== RN-01: past date ===");
  const pastRes = await api("/api/appointments", {
    method: "POST",
    body: { ...bookingBody, date: "2020-01-01", time: "10:00" },
    cookie,
  });
  ok("RN-01: past date rejected (400 PAST_DATE)", pastRes.status === 400 && pastRes.json?.error?.code === "PAST_DATE", pastRes.json);

  console.log("=== RN-06: lead time too short (< 2h) ===");
  const soon = new Date(Date.now() + 30 * 60 * 1000); // 30 min from now
  const soonDate = soon.toISOString().slice(0, 10);
  const soonTime = soon.toISOString().slice(11, 16);
  const shortLeadRes = await api("/api/appointments", {
    method: "POST",
    body: { ...bookingBody, date: soonDate, time: soonTime },
    cookie,
  });
  ok(
    "RN-06: <2h lead rejected (400 LEAD_TIME_TOO_SHORT or OUTSIDE_AVAILABILITY if outside schedule)",
    shortLeadRes.status === 400 && ["LEAD_TIME_TOO_SHORT", "OUTSIDE_AVAILABILITY"].includes(shortLeadRes.json?.error?.code),
    shortLeadRes.json
  );

  console.log("=== RN-07: lead time too long (> 90 days) ===");
  const farFuture = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
  const farDate = farFuture.toISOString().slice(0, 10);
  const farRes = await api("/api/appointments", {
    method: "POST",
    body: { ...bookingBody, date: farDate, time: "10:00" },
    cookie,
  });
  ok(
    "RN-07: >90d lead rejected (400 LEAD_TIME_TOO_LONG or OUTSIDE_AVAILABILITY if outside schedule)",
    farRes.status === 400 && ["LEAD_TIME_TOO_LONG", "OUTSIDE_AVAILABILITY"].includes(farRes.json?.error?.code),
    farRes.json
  );

  console.log("=== RN-08: max 5 future active appointments ===");
  // golden patient already has 1 confirmed appointment; book 4 more distinct slots, then a 6th must fail.
  let bookedSoFar = 1;
  let cursorDate = slot1.date;
  for (let i = 0; i < 6; i++) {
    const nextSlot = await findSlotOnOrAfter(professional.id, cursorDate, 25);
    if (!nextSlot) break;
    // avoid re-picking the exact same slot as an earlier booking
    const attemptBody = { specialtyId: specialty.id, professionalId: professional.id, date: nextSlot.date, time: nextSlot.time };
    const res = await api("/api/appointments", { method: "POST", body: attemptBody, cookie });
    cursorDate = nextSlot.time === "23:45" ? nextSlot.date : nextSlot.date; // advance search next loop via findSlotOnOrAfter's own scan
    // move cursor a day forward to avoid re-finding the same slot next loop
    const d = new Date(nextSlot.date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    cursorDate = d.toISOString().slice(0, 10);

    if (bookedSoFar < 5) {
      ok(`RN-08: booking #${bookedSoFar + 1} succeeds (201)`, res.status === 201, res.json);
      if (res.status === 201) bookedSoFar++;
    } else {
      ok(
        "RN-08: 6th active booking rejected with exact spec message",
        res.status === 409 &&
          res.json?.error?.code === "MAX_ACTIVE_APPOINTMENTS_REACHED" &&
          res.json?.error?.message === "Alcanzaste el límite máximo de 5 turnos futuros.",
        res.json
      );
      break;
    }
  }

  console.log("=== Cancellation state machine ===");
  const cancelRes = await api(`/api/appointments/${firstAppointmentId}/cancel`, { method: "POST", cookie });
  ok("cancel: CONFIRMADO -> CANCELADO succeeds", cancelRes.status === 200 && cancelRes.json?.appointment?.status === "CANCELADO", cancelRes.json);

  const cancelAgainRes = await api(`/api/appointments/${firstAppointmentId}/cancel`, { method: "POST", cookie });
  ok(
    "cancel: cancelling an already-CANCELADO turno rejected (400 INVALID_STATUS_TRANSITION)",
    cancelAgainRes.status === 400 && cancelAgainRes.json?.error?.code === "INVALID_STATUS_TRANSITION",
    cancelAgainRes.json
  );

  console.log("=== Profile update ===");
  const profileRes = await api("/api/profile", {
    method: "PATCH",
    body: { firstName: "Actualizado", lastName: "Apellido", phone: "+54 11 4999-8888" },
    cookie,
  });
  ok("profile: update succeeds and persists new firstName", profileRes.status === 200 && profileRes.json?.patient?.firstName === "Actualizado", profileRes.json);
  ok("profile: dni unchanged (immutable)", profileRes.json?.patient?.dni === patient.dni, profileRes.json);

  console.log("=== Demo account login ===");
  const demoLoginRes = await api("/api/auth/login", {
    method: "POST",
    body: { email: "paciente@nexosalud.demo", password: "DemoPaciente2026!" },
  });
  ok("demo: login succeeds", demoLoginRes.status === 200, demoLoginRes.json);
  if (demoLoginRes.cookie) {
    const demoAppointmentsRes = await api("/api/appointments", { cookie: demoLoginRes.cookie });
    const statuses = new Set((demoAppointmentsRes.json?.appointments ?? []).map((a) => a.status));
    ok(
      "demo: has a mix of CONFIRMADO/FINALIZADO/CANCELADO appointments",
      statuses.has("CONFIRMADO") && statuses.has("FINALIZADO") && statuses.has("CANCELADO"),
      [...statuses]
    );
  }

  console.log("=== Concurrency: two simultaneous bookings for the same slot ===");
  const { cookie: cookieA } = await registerPatient("race-A");
  const { cookie: cookieB } = await registerPatient("race-B");

  // Find a fresh, currently-open slot for the race (different professional/day from
  // anything booked above, to guarantee it's actually open right now).
  const raceProfessionalsRes = await api(`/api/professionals?specialtyId=${specialty.id}`);
  const raceProfessional = raceProfessionalsRes.json.professionals.find((p) => p.nextAvailableSlot) ?? professional;
  const raceStart = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const raceSlot = await findSlotOnOrAfter(raceProfessional.id, raceStart, 30);
  ok("race: found an open slot for the concurrency test", !!raceSlot, raceSlot);

  if (raceSlot) {
    const raceBody = { specialtyId: specialty.id, professionalId: raceProfessional.id, date: raceSlot.date, time: raceSlot.time };
    const [resA, resB] = await Promise.all([
      api("/api/appointments", { method: "POST", body: raceBody, cookie: cookieA }),
      api("/api/appointments", { method: "POST", body: raceBody, cookie: cookieB }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    ok("race: exactly one request succeeds (201) and the other is rejected (409)", statuses[0] === 201 && statuses[1] === 409, { resA: resA.status, resB: resB.status });

    // The loser can legitimately be rejected two ways depending on exact timing:
    // the app-level pre-check (if the winner's transaction already committed by
    // the time the loser's pre-check runs) or the raw DB exclusion constraint /
    // its post-retry pre-check (if both passed pre-check before either committed
    // — a true race). Both are correct outcomes of the same guarantee; only the
    // message text differs, so accept either instead of asserting one specific one.
    const VALID_LOSER_MESSAGES = [
      "Este horario acaba de ser reservado por otra persona. Seleccioná otro horario disponible.",
      "Ese horario ya no está disponible. Elegí otro horario.",
    ];
    const loser = resA.status === 409 ? resA : resB.status === 409 ? resB : null;
    ok(
      "race: loser gets SLOT_UNAVAILABLE via either the pre-check or the DB exclusion constraint",
      loser?.json?.error?.code === "SLOT_UNAVAILABLE" && VALID_LOSER_MESSAGES.includes(loser?.json?.error?.message),
      loser?.json
    );

    // The structural guarantee that actually matters, checked directly in Postgres:
    // no two CONFIRMADO appointments for the same professional ever share an
    // overlapping range, for this slot or anywhere else in the table.
    const overlapRows = await prisma.$queryRaw`
      SELECT a1.id AS id1, a2.id AS id2
      FROM appointments a1
      JOIN appointments a2
        ON a1.professional_id = a2.professional_id
       AND a1.id < a2.id
       AND a1.status = 'CONFIRMADO'
       AND a2.status = 'CONFIRMADO'
       AND a1.range && a2.range
    `;
    ok("race: zero overlapping CONFIRMADO appointments exist in Postgres (DB-verified)", overlapRows.length === 0, overlapRows);
  }

  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Script crashed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
