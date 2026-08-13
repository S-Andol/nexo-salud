import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { getAvailableSlots, getMonthAvailability } from "@/lib/services/availability.service";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (date) {
      const slots = await getAvailableSlots({ professionalId: id, date });
      return jsonOk({
        slots: slots.map((s) => ({ date: s.date, time: s.time, startUtc: s.startUtc.toISOString() })),
      });
    }

    if (year && month) {
      const days = await getMonthAvailability({
        professionalId: id,
        year: Number(year),
        month: Number(month),
      });
      return jsonOk({ days });
    }

    throw new AppError("VALIDATION_ERROR", "Falta el parámetro date, o year+month.");
  } catch (err) {
    return errorResponse(err);
  }
}
