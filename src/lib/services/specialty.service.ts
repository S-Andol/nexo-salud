import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors/app-error";

export async function listSpecialties() {
  return prisma.specialty.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function getSpecialtyById(id: string) {
  const specialty = await prisma.specialty.findUnique({ where: { id } });
  if (!specialty || !specialty.active) {
    throw new AppError("NOT_FOUND", "No encontramos esa especialidad.");
  }
  return specialty;
}
