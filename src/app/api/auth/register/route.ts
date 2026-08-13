import { NextRequest } from "next/server";
import { registerSchema } from "@/lib/validation/auth.schema";
import { registerPatient } from "@/lib/services/patient.service";
import { createSessionCookie } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
      }
      throw new AppError("VALIDATION_ERROR", "Revisá los datos ingresados.", { fields });
    }

    const patient = await registerPatient(parsed.data);
    await createSessionCookie({
      sub: patient.userId,
      patientId: patient.patientId,
      role: "PACIENTE",
      email: patient.email,
    });

    return jsonOk({ patient }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
