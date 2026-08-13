import { NextRequest } from "next/server";
import { listProfessionalsWithAvailability } from "@/lib/services/professional.service";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialtyId = searchParams.get("specialtyId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const professionals = await listProfessionalsWithAvailability({ specialtyId, search });
    return jsonOk({ professionals });
  } catch (err) {
    return errorResponse(err);
  }
}
