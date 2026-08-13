import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/constants";

export type SessionPayload = {
  sub: string; // user id
  patientId: string;
  role: Role;
  email: string;
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.sub === "string" &&
      typeof payload.patientId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        sub: payload.sub,
        patientId: payload.patientId as string,
        role: payload.role as Role,
        email: payload.email as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}
