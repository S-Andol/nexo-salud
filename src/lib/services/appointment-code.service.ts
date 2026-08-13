import type { Prisma } from "@prisma/client";

/** Atomically increments and returns the next sequence number for the given year. */
export async function nextAppointmentCode(tx: Prisma.TransactionClient, year: number): Promise<string> {
  const counter = await tx.appointmentCodeCounter.upsert({
    where: { year },
    create: { year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  const seq = String(counter.lastSeq).padStart(6, "0");
  return `NX-${year}-${seq}`;
}
