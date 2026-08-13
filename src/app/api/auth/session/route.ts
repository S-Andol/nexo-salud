import { getSession } from "@/lib/auth/session";
import { getPatientByUserId } from "@/lib/services/patient.service";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return jsonOk({ patient: null });
    }
    const patient = await getPatientByUserId(session.sub);
    return jsonOk({ patient });
  } catch (err) {
    return errorResponse(err);
  }
}
