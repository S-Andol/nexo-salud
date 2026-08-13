import { NextResponse } from "next/server";
import { toSafeError } from "@/lib/errors/app-error";

export function errorResponse(err: unknown) {
  const safe = toSafeError(err);
  if (safe.code === "INTERNAL_ERROR") {
    // Server-side log only; never sent to the client.
    console.error(err);
  }
  return NextResponse.json(
    { error: { code: safe.code, message: safe.message, fields: safe.fields } },
    { status: safe.status }
  );
}

export function jsonOk<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data, init as ResponseInit);
}
