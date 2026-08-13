import { z } from "zod";

export const bookingSchema = z.object({
  specialtyId: z.string().min(1, "Seleccioná una especialidad."),
  professionalId: z.string().min(1, "Seleccioná un profesional."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Seleccioná una fecha."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Seleccioná un horario."),
});

export type BookingInput = z.infer<typeof bookingSchema>;
