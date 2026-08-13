import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { AppError } from "@/lib/errors/app-error";
import type { RegisterInput, ProfileUpdateInput } from "@/lib/validation/auth.schema";

export type PatientSummary = {
  userId: string;
  patientId: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  phone: string;
};

function toSummary(user: { id: string; email: string }, patient: {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: Date;
  phone: string;
}): PatientSummary {
  return {
    userId: user.id,
    patientId: patient.id,
    email: user.email,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dni: patient.dni,
    birthDate: patient.birthDate.toISOString().slice(0, 10),
    phone: patient.phone,
  };
}

export async function registerPatient(input: RegisterInput): Promise<PatientSummary> {
  const [existingEmail, existingDni] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.patient.findUnique({ where: { dni: input.dni } }),
  ]);

  if (existingEmail) {
    throw new AppError("EMAIL_ALREADY_REGISTERED", "Ese email ya está registrado.", {
      fields: { email: "Ese email ya está registrado." },
    });
  }
  if (existingDni) {
    throw new AppError("DNI_ALREADY_REGISTERED", "Ese DNI ya está registrado.", {
      fields: { dni: "Ese DNI ya está registrado." },
    });
  }

  const passwordHash = await hashPassword(input.password);

  const { user, patient } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, passwordHash },
    });
    const patient = await tx.patient.create({
      data: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        dni: input.dni,
        birthDate: new Date(input.birthDate),
        phone: input.phone,
      },
    });
    return { user, patient };
  });

  return toSummary(user, patient);
}

export async function authenticatePatient(
  email: string,
  password: string
): Promise<PatientSummary> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { patient: true },
  });

  // Same generic error whether the email doesn't exist or the password is wrong,
  // to avoid leaking which emails are registered.
  const genericError = () =>
    new AppError("INVALID_CREDENTIALS", "Email o contraseña incorrectos.");

  if (!user || !user.patient || user.status !== "ACTIVE") {
    throw genericError();
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw genericError();
  }

  return toSummary(user, user.patient);
}

export async function getPatientByUserId(userId: string): Promise<PatientSummary> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { patient: true } });
  if (!user || !user.patient) {
    throw new AppError("NOT_FOUND", "No encontramos tu perfil.");
  }
  return toSummary(user, user.patient);
}

export async function updatePatientProfile(
  patientId: string,
  input: ProfileUpdateInput
): Promise<PatientSummary> {
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    },
    include: { user: true },
  });
  return toSummary(patient.user, patient);
}
