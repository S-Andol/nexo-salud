import { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { profileUpdateSchema } from "@/lib/validation/auth.schema";
import { updatePatientProfile } from "@/lib/services/patient.service";
import { AppError } from "@/lib/errors/app-error";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    requireRole(session, ["PACIENTE"]);

    const body = await req.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
      }
      throw new AppError("VALIDATION_ERROR", "Revisá los datos ingresados.", { fields });
    }

    const patient = await updatePatientProfile(session.patientId, parsed.data);
    return jsonOk({ patient });
  } catch (err) {
    return errorResponse(err);
  }
}
