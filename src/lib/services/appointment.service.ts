import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { MAX_ACTIVE_FUTURE_APPOINTMENTS, MAX_LEAD_TIME_DAYS, MIN_LEAD_TIME_HOURS } from "@/lib/constants";
import { nextAppointmentCode } from "@/lib/services/appointment-code.service";
import {
  addMinutesToTimeStr,
  baToUtc,
  compareDateStr,
  compareTimeStr,
  dayOfWeekForDateStr,
  nowUtc,
  todayBA,
} from "@/lib/time/timezone";
import type { BookingInput } from "@/lib/validation/booking.schema";

const appointmentInclude = {
  professional: { include: { specialty: true } },
  specialty: true,
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

function isWriteConflict(err: unknown): boolean {
  // Prisma's dedicated code for a transaction losing a write-conflict/deadlock
  // race under Serializable isolation (RN-08 count-check / code-counter safety).
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
}

function isSlotExclusionViolation(err: unknown): boolean {
  // Prisma has no dedicated code for a hand-added EXCLUDE constraint (it only
  // knows about constraints it generated), so the real DB-level double-booking
  // guard surfaces as an unrecognized error whose message carries the original
  // Postgres text (constraint name / SQLSTATE 23P01). This is the actual race
  // loser path for RN-03/RN-04 under true concurrency.
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    const message = err.message ?? "";
    return (
      message.includes("no_overlap_per_professional") ||
      message.includes("no_overlap_per_patient") ||
      message.includes("23P01")
    );
  }
  return false;
}

async function runBookingTransaction(patientId: string, input: BookingInput) {
  return prisma.$transaction(
    async (tx) => {
      const professional = await tx.professional.findUnique({
        where: { id: input.professionalId },
        include: { specialty: true, schedules: true },
      });
      if (!professional || !professional.active) {
        throw new AppError("NOT_FOUND", "No encontramos ese profesional.");
      }
      if (professional.specialtyId !== input.specialtyId) {
        throw new AppError("VALIDATION_ERROR", "La especialidad no coincide con el profesional.");
      }

      const duration = professional.specialty.appointmentDuration;
      const startUtc = baToUtc(input.date, input.time);
      const endUtc = new Date(startUtc.getTime() + duration * 60 * 1000);
      const now = nowUtc();

      // RN-01: no fechas pasadas (independent check/code from RN-06).
      if (compareDateStr(input.date, todayBA()) < 0) {
        throw new AppError("PAST_DATE", "No se puede reservar un turno en una fecha pasada.");
      }

      // RN-06: al menos 2 horas de anticipación.
      const minStart = new Date(now.getTime() + MIN_LEAD_TIME_HOURS * 60 * 60 * 1000);
      if (startUtc < minStart) {
        throw new AppError(
          "LEAD_TIME_TOO_SHORT",
          "Los turnos deben reservarse con al menos 2 horas de anticipación."
        );
      }

      // RN-07: como máximo 90 días de anticipación.
      const maxStart = new Date(now.getTime() + MAX_LEAD_TIME_DAYS * 24 * 60 * 60 * 1000);
      if (startUtc > maxStart) {
        throw new AppError(
          "LEAD_TIME_TOO_LONG",
          "No se pueden reservar turnos con más de 90 días de anticipación."
        );
      }

      // RN-02: dentro de los días/horarios de atención del profesional.
      const dayOfWeek = dayOfWeekForDateStr(input.date);
      const endTime = addMinutesToTimeStr(input.time, duration);
      const inSchedule = professional.schedules.some(
        (s) =>
          s.dayOfWeek === dayOfWeek &&
          compareTimeStr(input.time, s.startTime) >= 0 &&
          compareTimeStr(endTime, s.endTime) <= 0
      );
      if (!inSchedule) {
        throw new AppError("OUTSIDE_AVAILABILITY", "El profesional no atiende en ese día u horario.");
      }

      // RN-08: máximo 5 turnos futuros activos.
      const activeCount = await tx.appointment.count({
        where: { patientId, status: "CONFIRMADO", startDatetime: { gt: now } },
      });
      if (activeCount >= MAX_ACTIVE_FUTURE_APPOINTMENTS) {
        throw new AppError(
          "MAX_ACTIVE_APPOINTMENTS_REACHED",
          "Alcanzaste el límite máximo de 5 turnos futuros."
        );
      }

      // RN-09: no permitir una reserva idéntica.
      const duplicate = await tx.appointment.findFirst({
        where: {
          patientId,
          professionalId: input.professionalId,
          startDatetime: startUtc,
          status: "CONFIRMADO",
        },
      });
      if (duplicate) {
        throw new AppError("DUPLICATE_BOOKING", "Ya tenés una reserva idéntica a esta.");
      }

      // RN-03/RN-04: pre-checks for a friendly error message. The real, structural
      // guarantee against a race is the DB exclusion constraint caught below.
      const professionalOverlap = await tx.appointment.findFirst({
        where: {
          professionalId: input.professionalId,
          status: "CONFIRMADO",
          startDatetime: { lt: endUtc },
          endDatetime: { gt: startUtc },
        },
      });
      if (professionalOverlap) {
        throw new AppError("SLOT_UNAVAILABLE", "Ese horario ya no está disponible. Elegí otro horario.");
      }

      const patientOverlap = await tx.appointment.findFirst({
        where: {
          patientId,
          status: "CONFIRMADO",
          startDatetime: { lt: endUtc },
          endDatetime: { gt: startUtc },
        },
      });
      if (patientOverlap) {
        throw new AppError(
          "PATIENT_OVERLAP",
          "Ya tenés otro turno reservado que se superpone con ese horario."
        );
      }

      const year = Number(input.date.slice(0, 4));
      const code = await nextAppointmentCode(tx, year);

      try {
        return await tx.appointment.create({
          data: {
            appointmentCode: code,
            patientId,
            professionalId: input.professionalId,
            specialtyId: input.specialtyId,
            startDatetime: startUtc,
            endDatetime: endUtc,
            status: "CONFIRMADO",
          },
          include: appointmentInclude,
        });
      } catch (err) {
        if (isSlotExclusionViolation(err)) {
          throw new AppError(
            "SLOT_UNAVAILABLE",
            "Este horario acaba de ser reservado por otra persona. Seleccioná otro horario disponible."
          );
        }
        throw err;
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function createAppointment(
  patientId: string,
  input: BookingInput
): Promise<AppointmentWithRelations> {
  try {
    return await runBookingTransaction(patientId, input);
  } catch (err) {
    if (isWriteConflict(err)) {
      // Retry exactly once: a serialization failure means Postgres detected a
      // conflicting concurrent transaction, not that the request is invalid.
      return await runBookingTransaction(patientId, input);
    }
    throw err;
  }
}

export async function listAppointmentsForPatient(patientId: string): Promise<AppointmentWithRelations[]> {
  return prisma.appointment.findMany({
    where: { patientId },
    include: appointmentInclude,
    orderBy: { startDatetime: "desc" },
  });
}

export async function cancelAppointment(
  patientId: string,
  appointmentId: string
): Promise<AppointmentWithRelations> {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.patientId !== patientId) {
    throw new AppError("NOT_FOUND", "No encontramos ese turno.");
  }
  // Only CONFIRMADO -> CANCELADO is a valid transition a patient can trigger in
  // V1. CANCELADO->FINALIZADO, FINALIZADO->CANCELADO, and interactively setting
  // FINALIZADO are all blocked here regardless of what the client sends.
  if (appointment.status !== "CONFIRMADO") {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      "Solo se pueden cancelar turnos que estén confirmados."
    );
  }

  return prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELADO" },
    include: appointmentInclude,
  });
}
