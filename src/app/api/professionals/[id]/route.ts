import { getProfessionalById } from "@/lib/services/professional.service";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const professional = await getProfessionalById(id);
    return jsonOk({ professional });
  } catch (err) {
    return errorResponse(err);
  }
}
