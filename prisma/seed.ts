/**
 * Seeds fully fictitious demo data: 8 specialties, 12 professionals with varied
 * weekly schedules, 20 patients, ~40 historical (FINALIZADO) + ~20 future
 * (CONFIRMADO) + ~8 CANCELADO appointments, plus the fixed demo account. Safe to
 * re-run: wipes prior seed data first. Run with `npm run db:seed`.
 */
import { PrismaClient, type DayOfWeek } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  addDaysToDateStr,
  addMinutesToTimeStr,
  baToUtc,
  compareTimeStr,
  dayOfWeekForDateStr,
  todayBA,
} from "../src/lib/time/timezone";

const prisma = new PrismaClient();

// --- Deterministic PRNG (mulberry32) so seed output is reproducible run-to-run. ---
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260812);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Built from an explicit \u escape (ASCII source) to avoid any risk of the
// combining-diacritics range being mis-encoded as literal source characters.
const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const SPECIALTIES = [
  { name: "Clínica Médica", description: "Consultas generales de diagnóstico y seguimiento clínico.", appointmentDuration: 30 },
  { name: "Cardiología", description: "Evaluación y seguimiento de la salud cardiovascular.", appointmentDuration: 30 },
  { name: "Dermatología", description: "Diagnóstico y tratamiento de afecciones de la piel.", appointmentDuration: 20 },
  { name: "Traumatología", description: "Diagnóstico y tratamiento de lesiones óseas y articulares.", appointmentDuration: 30 },
  { name: "Pediatría", description: "Atención médica integral para niños y adolescentes.", appointmentDuration: 25 },
  { name: "Oftalmología", description: "Diagnóstico y tratamiento de afecciones oculares.", appointmentDuration: 20 },
  { name: "Psicología", description: "Acompañamiento y abordaje de la salud mental.", appointmentDuration: 60 },
  { name: "Nutrición", description: "Planes de alimentación y seguimiento nutricional.", appointmentDuration: 45 },
] as const;

const SCHEDULE_TEMPLATES: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[][] = [
  [
    { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: "WEDNESDAY", startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "13:00" },
  ],
  [
    { dayOfWeek: "TUESDAY", startTime: "14:00", endTime: "18:00" },
    { dayOfWeek: "THURSDAY", startTime: "14:00", endTime: "18:00" },
  ],
  [
    { dayOfWeek: "MONDAY", startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: "TUESDAY", startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "12:00" },
    { dayOfWeek: "THURSDAY", startTime: "08:00", endTime: "12:00" },
  ],
  [
    { dayOfWeek: "WEDNESDAY", startTime: "15:00", endTime: "19:00" },
    { dayOfWeek: "FRIDAY", startTime: "15:00", endTime: "19:00" },
  ],
  [
    { dayOfWeek: "MONDAY", startTime: "10:00", endTime: "14:00" },
    { dayOfWeek: "THURSDAY", startTime: "10:00", endTime: "14:00" },
    { dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "12:00" },
  ],
  [
    { dayOfWeek: "TUESDAY", startTime: "13:00", endTime: "17:00" },
    { dayOfWeek: "WEDNESDAY", startTime: "13:00", endTime: "17:00" },
    { dayOfWeek: "FRIDAY", startTime: "13:00", endTime: "17:00" },
  ],
  // A professional with two disjoint ranges on the same day (morning + evening).
  [
    { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "12:00" },
    { dayOfWeek: "MONDAY", startTime: "17:00", endTime: "20:00" },
    { dayOfWeek: "THURSDAY", startTime: "09:00", endTime: "12:00" },
  ],
];

const FIRST_NAMES = [
  "Sofía", "Mateo", "Valentina", "Lucas", "Camila", "Joaquín", "Martina", "Benjamín",
  "Isabella", "Thiago", "Emma", "Santiago", "Julieta", "Bautista", "Mía", "Agustín",
  "Renata", "Tomás", "Catalina", "Facundo", "Delfina", "Ignacio", "Victoria", "Franco",
  "Milagros", "Nicolás", "Antonella", "Gael", "Pilar", "Bruno", "Abril", "Dante",
];
const LAST_NAMES = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Martínez", "Díaz", "Pérez",
  "García", "Sánchez", "Romero", "Sosa", "Torres", "Álvarez", "Ruiz", "Ramírez",
  "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Aguirre", "Molina",
];

const PROFESSIONAL_SPECIALTY_PLAN = [
  "Clínica Médica", "Clínica Médica",
  "Cardiología", "Cardiología",
  "Dermatología",
  "Traumatología",
  "Pediatría", "Pediatría",
  "Oftalmología",
  "Psicología", "Psicología",
  "Nutrición",
] as const;

// ---------------------------------------------------------------------------
// Time helpers local to seeding
// ---------------------------------------------------------------------------

type Slot = { date: string; time: string; startUtc: Date; endUtc: Date };
type Range = { start: Date; end: Date };

function generateCandidateTimes(startTime: string, endTime: string, durationMin: number): string[] {
  const times: string[] = [];
  let cursor = startTime;
  while (compareTimeStr(addMinutesToTimeStr(cursor, durationMin), endTime) <= 0) {
    times.push(cursor);
    cursor = addMinutesToTimeStr(cursor, durationMin);
  }
  return times;
}

function buildSlotPool(
  schedules: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[],
  duration: number,
  dateFrom: string,
  dateTo: string
): Slot[] {
  const slots: Slot[] = [];
  let cursor = dateFrom;
  while (cursor <= dateTo) {
    const dow = dayOfWeekForDateStr(cursor);
    for (const range of schedules) {
      if (range.dayOfWeek !== dow) continue;
      for (const time of generateCandidateTimes(range.startTime, range.endTime, duration)) {
        const startUtc = baToUtc(cursor, time);
        const endUtc = new Date(startUtc.getTime() + duration * 60 * 1000);
        slots.push({ date: cursor, time, startUtc, endUtc });
      }
    }
    cursor = addDaysToDateStr(cursor, 1);
  }
  return slots;
}

function overlaps(ranges: Range[], start: Date, end: Date): boolean {
  return ranges.some((r) => start < r.end && end > r.start);
}

async function main() {
  console.log("Wiping previous seed data...");
  await prisma.appointment.deleteMany();
  await prisma.appointmentCodeCounter.deleteMany();
  await prisma.professionalSchedule.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.specialty.deleteMany();

  console.log("Creating specialties...");
  const specialtyByName = new Map<string, { id: string; appointmentDuration: number }>();
  for (const s of SPECIALTIES) {
    const created = await prisma.specialty.create({ data: s });
    specialtyByName.set(s.name, created);
  }

  console.log("Creating professionals + schedules...");
  const professionals: {
    id: string;
    specialtyId: string;
    duration: number;
    schedules: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[];
  }[] = [];

  const usedLicenseNumbers = new Set<string>();
  for (let i = 0; i < PROFESSIONAL_SPECIALTY_PLAN.length; i++) {
    const specialtyName = PROFESSIONAL_SPECIALTY_PLAN[i];
    const specialty = specialtyByName.get(specialtyName)!;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length];

    let license = "";
    do {
      license = `MN ${10000 + Math.floor(rng() * 89999)}`;
    } while (usedLicenseNumbers.has(license));
    usedLicenseNumbers.add(license);

    const schedule = SCHEDULE_TEMPLATES[i % SCHEDULE_TEMPLATES.length];

    const created = await prisma.professional.create({
      data: {
        firstName,
        lastName,
        licenseNumber: license,
        specialtyId: specialty.id,
        description: `Especialista en ${specialtyName.toLowerCase()}, con enfoque en atención personalizada.`,
        active: true,
        schedules: { create: schedule },
      },
      include: { schedules: true },
    });

    professionals.push({
      id: created.id,
      specialtyId: specialty.id,
      duration: specialty.appointmentDuration,
      schedules: created.schedules,
    });
  }

  console.log("Creating patients...");
  const PASSWORD_HASH = await bcrypt.hash("Paciente#2026", 12);
  const patients: string[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const dni = String(30000000 + i * 137 + Math.floor(rng() * 100));
    const email = `${slugify(firstName)}.${slugify(lastName)}${i}@mail.com`;
    const year = 1955 + Math.floor(rng() * 50);
    const month = 1 + Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 27);
    const phone = `+54 11 4${100 + Math.floor(rng() * 800)}-${1000 + Math.floor(rng() * 8999)}`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: PASSWORD_HASH,
        role: "PACIENTE",
        patient: {
          create: {
            firstName,
            lastName,
            dni,
            birthDate: new Date(Date.UTC(year, month - 1, day)),
            phone,
          },
        },
      },
      include: { patient: true },
    });
    patients.push(user.patient!.id);
  }

  console.log("Generating appointments...");
  const today = todayBA();
  const historicalFrom = addDaysToDateStr(today, -180);
  const historicalTo = addDaysToDateStr(today, -1);
  const futureFrom = addDaysToDateStr(today, 1);
  const futureTo = addDaysToDateStr(today, 90);

  const professionalUsedSlots = new Map<string, Set<string>>();
  const patientRanges = new Map<string, Range[]>();
  const patientFutureActiveCount = new Map<string, number>();
  const codeCounters = new Map<number, number>();

  function nextCode(dateStr: string): string {
    const year = Number(dateStr.slice(0, 4));
    const seq = (codeCounters.get(year) ?? 0) + 1;
    codeCounters.set(year, seq);
    return `NX-${year}-${String(seq).padStart(6, "0")}`;
  }

  async function tryCreateAppointment(
    professionalId: string,
    specialtyId: string,
    slot: Slot,
    status: "FINALIZADO" | "CONFIRMADO" | "CANCELADO",
    maxPatientAttempts = 25
  ): Promise<boolean> {
    const key = slot.startUtc.toISOString();
    const used = professionalUsedSlots.get(professionalId) ?? new Set<string>();
    if (used.has(key)) return false;

    const candidatePatients = shuffle(patients);
    for (let attempt = 0; attempt < Math.min(maxPatientAttempts, candidatePatients.length); attempt++) {
      const patientId = candidatePatients[attempt];

      if (status === "CONFIRMADO" && (patientFutureActiveCount.get(patientId) ?? 0) >= 5) continue;

      const ranges = patientRanges.get(patientId) ?? [];
      if (overlaps(ranges, slot.startUtc, slot.endUtc)) continue;

      await prisma.appointment.create({
        data: {
          appointmentCode: nextCode(slot.date),
          patientId,
          professionalId,
          specialtyId,
          startDatetime: slot.startUtc,
          endDatetime: slot.endUtc,
          status,
        },
      });

      used.add(key);
      professionalUsedSlots.set(professionalId, used);
      patientRanges.set(patientId, [...ranges, { start: slot.startUtc, end: slot.endUtc }]);
      if (status === "CONFIRMADO") {
        patientFutureActiveCount.set(patientId, (patientFutureActiveCount.get(patientId) ?? 0) + 1);
      }
      return true;
    }
    return false;
  }

  // Historical (FINALIZADO)
  let historicalCreated = 0;
  const historicalPools = professionals.map((p) => ({
    p,
    pool: shuffle(buildSlotPool(p.schedules, p.duration, historicalFrom, historicalTo)),
  }));
  outerHistorical: while (historicalCreated < 40) {
    let progressed = false;
    for (const entry of historicalPools) {
      if (historicalCreated >= 40) break outerHistorical;
      const slot = entry.pool.pop();
      if (!slot) continue;
      const ok = await tryCreateAppointment(entry.p.id, entry.p.specialtyId, slot, "FINALIZADO");
      if (ok) {
        historicalCreated++;
        progressed = true;
      }
    }
    if (!progressed) break; // pools exhausted
  }

  // Future (CONFIRMADO)
  let futureCreated = 0;
  const futurePools = professionals.map((p) => ({
    p,
    pool: shuffle(buildSlotPool(p.schedules, p.duration, futureFrom, futureTo)),
  }));
  outerFuture: while (futureCreated < 20) {
    let progressed = false;
    for (const entry of futurePools) {
      if (futureCreated >= 20) break outerFuture;
      const slot = entry.pool.pop();
      if (!slot) continue;
      const ok = await tryCreateAppointment(entry.p.id, entry.p.specialtyId, slot, "CONFIRMADO");
      if (ok) {
        futureCreated++;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  // Cancelled (CANCELADO) — drawn from a mixed remaining pool, past or future.
  let cancelledCreated = 0;
  const cancelPools = professionals.map((p) => ({
    p,
    pool: shuffle([
      ...buildSlotPool(p.schedules, p.duration, historicalFrom, historicalTo),
      ...buildSlotPool(p.schedules, p.duration, futureFrom, futureTo),
    ]),
  }));
  outerCancel: while (cancelledCreated < 8) {
    let progressed = false;
    for (const entry of cancelPools) {
      if (cancelledCreated >= 8) break outerCancel;
      const slot = entry.pool.pop();
      if (!slot) continue;
      const ok = await tryCreateAppointment(entry.p.id, entry.p.specialtyId, slot, "CANCELADO");
      if (ok) {
        cancelledCreated++;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  console.log(
    `Created ${historicalCreated} historical, ${futureCreated} future, ${cancelledCreated} cancelled appointments.`
  );

  console.log("Creating demo account...");
  const demoPasswordHash = await bcrypt.hash("DemoPaciente2026!", 12);
  const demoUser = await prisma.user.create({
    data: {
      email: "paciente@nexosalud.demo",
      passwordHash: demoPasswordHash,
      role: "PACIENTE",
      patient: {
        create: {
          firstName: "Paciente",
          lastName: "Demo",
          dni: "39999999",
          birthDate: new Date(Date.UTC(1994, 5, 15)),
          phone: "+54 11 4000-0000",
        },
      },
    },
    include: { patient: true },
  });
  const demoPatientId = demoUser.patient!.id;

  const demoProfessionals = shuffle(professionals).slice(0, 3);

  // 2 upcoming CONFIRMADO
  for (const p of demoProfessionals.slice(0, 2)) {
    const pool = shuffle(buildSlotPool(p.schedules, p.duration, futureFrom, futureTo));
    for (const slot of pool) {
      const key = slot.startUtc.toISOString();
      const used = professionalUsedSlots.get(p.id) ?? new Set<string>();
      if (used.has(key)) continue;
      const ranges = patientRanges.get(demoPatientId) ?? [];
      if (overlaps(ranges, slot.startUtc, slot.endUtc)) continue;

      await prisma.appointment.create({
        data: {
          appointmentCode: nextCode(slot.date),
          patientId: demoPatientId,
          professionalId: p.id,
          specialtyId: p.specialtyId,
          startDatetime: slot.startUtc,
          endDatetime: slot.endUtc,
          status: "CONFIRMADO",
        },
      });
      used.add(key);
      professionalUsedSlots.set(p.id, used);
      patientRanges.set(demoPatientId, [...ranges, { start: slot.startUtc, end: slot.endUtc }]);
      break;
    }
  }

  // 3 historical FINALIZADO
  for (let i = 0; i < 3; i++) {
    const p = demoProfessionals[i % demoProfessionals.length];
    const pool = shuffle(buildSlotPool(p.schedules, p.duration, historicalFrom, historicalTo));
    for (const slot of pool) {
      const key = slot.startUtc.toISOString();
      const used = professionalUsedSlots.get(p.id) ?? new Set<string>();
      if (used.has(key)) continue;
      const ranges = patientRanges.get(demoPatientId) ?? [];
      if (overlaps(ranges, slot.startUtc, slot.endUtc)) continue;

      await prisma.appointment.create({
        data: {
          appointmentCode: nextCode(slot.date),
          patientId: demoPatientId,
          professionalId: p.id,
          specialtyId: p.specialtyId,
          startDatetime: slot.startUtc,
          endDatetime: slot.endUtc,
          status: "FINALIZADO",
        },
      });
      used.add(key);
      professionalUsedSlots.set(p.id, used);
      patientRanges.set(demoPatientId, [...ranges, { start: slot.startUtc, end: slot.endUtc }]);
      break;
    }
  }

  // 1 CANCELADO
  {
    const p = demoProfessionals[0];
    const pool = shuffle(buildSlotPool(p.schedules, p.duration, historicalFrom, futureTo));
    for (const slot of pool) {
      const key = slot.startUtc.toISOString();
      const used = professionalUsedSlots.get(p.id) ?? new Set<string>();
      if (used.has(key)) continue;

      await prisma.appointment.create({
        data: {
          appointmentCode: nextCode(slot.date),
          patientId: demoPatientId,
          professionalId: p.id,
          specialtyId: p.specialtyId,
          startDatetime: slot.startUtc,
          endDatetime: slot.endUtc,
          status: "CANCELADO",
        },
      });
      used.add(key);
      professionalUsedSlots.set(p.id, used);
      break;
    }
  }

  // Persist the local code counter into the DB counter table the real app uses
  // (nextAppointmentCode in appointment-code.service.ts), otherwise the first
  // real booking would start back at seq 1 and collide with a code the seed
  // already used.
  for (const [year, lastSeq] of codeCounters) {
    await prisma.appointmentCodeCounter.upsert({
      where: { year },
      create: { year, lastSeq },
      update: { lastSeq },
    });
  }

  console.log("Seed complete.");
  console.log(`Demo login: paciente@nexosalud.demo / DemoPaciente2026!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
