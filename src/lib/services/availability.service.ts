import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { MAX_LEAD_TIME_DAYS, MIN_LEAD_TIME_HOURS } from "@/lib/constants";
import {
  addDaysToDateStr,
  addMinutesToTimeStr,
  baToUtc,
  compareTimeStr,
  dayOfWeekForDateStr,
  endOfDayUtc,
  nowUtc,
  startOfDayUtc,
  todayBA,
} from "@/lib/time/timezone";

export type Slot = { date: string; time: string; startUtc: Date; endUtc: Date };
export type DayAvailability = "available" | "unavailable" | "past" | "out-of-range";

function generateCandidateTimes(startTime: string, endTime: string, durationMin: number): string[] {
  const times: string[] = [];
  let cursor = startTime;
  while (compareTimeStr(addMinutesToTimeStr(cursor, durationMin), endTime) <= 0) {
    times.push(cursor);
    cursor = addMinutesToTimeStr(cursor, durationMin);
  }
  return times;
}

async function loadProfessionalWithSchedule(professionalId: string) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { specialty: true, schedules: true },
  });
  if (!professional || !professional.active) {
    throw new AppError("NOT_FOUND", "No encontramos ese profesional.");
  }
  return professional;
}

/** Single source of truth for real, bookable slots on a given BA calendar date. */
export async function getAvailableSlots(params: {
  professionalId: string;
  date: string; // "YYYY-MM-DD"
}): Promise<Slot[]> {
  const professional = await loadProfessionalWithSchedule(params.professionalId);
  const duration = professional.specialty.appointmentDuration;
  const dayOfWeek = dayOfWeekForDateStr(params.date);

  const ranges = professional.schedules.filter((s) => s.dayOfWeek === dayOfWeek);
  if (ranges.length === 0) return [];

  const now = nowUtc();
  const minStart = new Date(now.getTime() + MIN_LEAD_TIME_HOURS * 60 * 60 * 1000);
  const maxStart = new Date(now.getTime() + MAX_LEAD_TIME_DAYS * 24 * 60 * 60 * 1000);

  const candidates: Slot[] = [];
  for (const range of ranges) {
    for (const time of generateCandidateTimes(range.startTime, range.endTime, duration)) {
      const startUtc = baToUtc(params.date, time);
      if (startUtc < minStart || startUtc > maxStart) continue;
      const endUtc = new Date(startUtc.getTime() + duration * 60 * 1000);
      candidates.push({ date: params.date, time, startUtc, endUtc });
    }
  }
  if (candidates.length === 0) return [];

  const existing = await prisma.appointment.findMany({
    where: {
      professionalId: params.professionalId,
      status: "CONFIRMADO",
      startDatetime: { gte: startOfDayUtc(params.date), lt: endOfDayUtc(params.date) },
    },
    select: { startDatetime: true, endDatetime: true },
  });

  return candidates
    .filter((c) => !existing.some((e) => c.startUtc < e.endDatetime && c.endUtc > e.startDatetime))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Day-by-day status for a calendar month view (step 3 of the wizard). */
export async function getMonthAvailability(params: {
  professionalId: string;
  year: number;
  month: number; // 1-12
}): Promise<Record<string, DayAvailability>> {
  const professional = await loadProfessionalWithSchedule(params.professionalId);
  const scheduledDays = new Set(professional.schedules.map((s) => s.dayOfWeek));

  const today = todayBA();
  const maxDate = addDaysToDateStr(today, MAX_LEAD_TIME_DAYS);
  const daysInMonth = new Date(Date.UTC(params.year, params.month, 0)).getUTCDate();

  const result: Record<string, DayAvailability> = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${params.year}-${String(params.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (dateStr < today) {
      result[dateStr] = "past";
      continue;
    }
    if (dateStr > maxDate) {
      result[dateStr] = "out-of-range";
      continue;
    }
    const dayOfWeek = dayOfWeekForDateStr(dateStr);
    if (!scheduledDays.has(dayOfWeek)) {
      result[dateStr] = "unavailable";
      continue;
    }
    const slots = await getAvailableSlots({ professionalId: params.professionalId, date: dateStr });
    result[dateStr] = slots.length > 0 ? "available" : "unavailable";
  }
  return result;
}

/** Scans forward from today (bounded by the 90-day window) for the professional's card. */
export async function getNextAvailableSlot(professionalId: string): Promise<Slot | null> {
  let date = todayBA();
  const maxDate = addDaysToDateStr(date, MAX_LEAD_TIME_DAYS);
  while (date <= maxDate) {
    const slots = await getAvailableSlots({ professionalId, date });
    if (slots.length > 0) return slots[0];
    date = addDaysToDateStr(date, 1);
  }
  return null;
}
