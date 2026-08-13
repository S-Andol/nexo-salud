import { clearSessionCookie } from "@/lib/auth/session";
import { errorResponse, jsonOk } from "@/lib/api/respond";

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
