import { z } from "zod";

// Shared building blocks so register/profile validations can't drift apart.
const nameField = z
  .string()
  .trim()
  .min(2, "Debe tener al menos 2 caracteres.")
  .max(50, "Debe tener como máximo 50 caracteres.");

const dniField = z
  .string()
  .trim()
  .regex(/^\d{7,8}$/, "El DNI debe tener entre 7 y 8 dígitos numéricos.");

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().email("Ingresá un email válido."));

const phoneField = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-()]{6,20}$/, "Ingresá un teléfono válido.")
  .refine((v) => v.replace(/\D/g, "").length >= 6, "Ingresá un teléfono válido.");

const passwordField = z
  .string()
  .min(8, "Debe tener al menos 8 caracteres.")
  .regex(/^\S+$/, "No puede contener espacios.")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula.")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula.")
  .regex(/\d/, "Debe incluir al menos un número.")
  .regex(/[^A-Za-z0-9]/, "Debe incluir al menos un carácter especial.");

export const registerSchema = z
  .object({
    firstName: nameField,
    lastName: nameField,
    dni: dniField,
    birthDate: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Ingresá una fecha válida.")
      .refine((v) => new Date(v).getTime() <= Date.now(), "La fecha de nacimiento no puede ser futura."),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  phone: phoneField,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
