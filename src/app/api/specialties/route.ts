import { listSpecialties } from "@/lib/services/specialty.service";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function GET() {
  try {
    const specialties = await listSpecialties();
    return jsonOk({ specialties });
  } catch (err) {
    return errorResponse(err);
  }
}
