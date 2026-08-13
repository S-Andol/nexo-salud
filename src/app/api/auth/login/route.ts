import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation/auth.schema";
import { authenticatePatient } from "@/lib/services/patient.service";
import { createSessionCookie } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION_ERROR", "Ingresá un email y contraseña válidos.");
    }

    const patient = await authenticatePatient(parsed.data.email, parsed.data.password);
    await createSessionCookie({
      sub: patient.userId,
      patientId: patient.patientId,
      role: "PACIENTE",
      email: patient.email,
    });

    return jsonOk({ patient });
  } catch (err) {
    return errorResponse(err);
  }
}
