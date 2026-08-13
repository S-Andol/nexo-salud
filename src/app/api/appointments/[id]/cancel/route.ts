import { requireAuth, requireRole } from "@/lib/auth/guards";
import { cancelAppointment } from "@/lib/services/appointment.service";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    requireRole(session, ["PACIENTE"]);
    const { id } = await params;
    const appointment = await cancelAppointment(session.patientId, id);
    return jsonOk({ appointment });
  } catch (err) {
    return errorResponse(err);
  }
}
