import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";
import { getNextAvailableSlot } from "@/lib/services/availability.service";

export type ProfessionalFilters = {
  specialtyId?: string;
  search?: string; // matches name, case-insensitive, trimmed, partial
};

export async function listProfessionals(filters: ProfessionalFilters = {}) {
  const search = filters.search?.trim();

  const professionals = await prisma.professional.findMany({
    where: {
      active: true,
      ...(filters.specialtyId ? { specialtyId: filters.specialtyId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { specialty: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return professionals;
}

/** Same list as above, but each card also carries its computed next-available slot. */
export async function listProfessionalsWithAvailability(filters: ProfessionalFilters = {}) {
  const professionals = await listProfessionals(filters);
  return Promise.all(
    professionals.map(async (p) => ({
      ...p,
      nextAvailableSlot: await getNextAvailableSlot(p.id),
    }))
  );
}

export async function getProfessionalById(id: string) {
  const professional = await prisma.professional.findUnique({
    where: { id },
    include: { specialty: true, schedules: true },
  });
  if (!professional || !professional.active) {
    throw new AppError("NOT_FOUND", "No encontramos ese profesional.");
  }
  return professional;
}
