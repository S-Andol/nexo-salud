import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { bookingSchema } from "@/lib/validation/booking.schema";
import { createAppointment, listAppointmentsForPatient } from "@/lib/services/appointment.service";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function GET() {
  try {
    const session = await requireAuth();
    requireRole(session, ["PACIENTE"]);
    const appointments = await listAppointmentsForPatient(session.patientId);
    return jsonOk({ appointments });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ["PACIENTE"]);

    const body = await req.json().catch(() => null);
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Seleccioná especialidad, profesional, fecha y horario.");
    }

    const appointment = await createAppointment(session.patientId, parsed.data);
    return jsonOk({ appointment }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
