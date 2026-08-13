import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors/app-error";
import { getSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";

/** Throws UNAUTHENTICATED if there is no valid session. Used inside API routes. */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new AppError("UNAUTHENTICATED", "Necesitás iniciar sesión para continuar.");
  }
  return session;
}

/**
 * For Server Component pages (not API routes): middleware already guards
 * /turnos and /perfil, but this is a defense-in-depth check that redirects
 * instead of throwing, so an edge case (e.g. cookie expiring mid-session)
 * lands the user back on /login instead of a generic error page.
 */
export async function requireSessionOrRedirect(currentPath: string): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }
  return session;
}

/**
 * Single chokepoint for role checks. V1 only ever calls this with ['PACIENTE'],
 * but V2 (PROFESIONAL/RECEPCIONISTA/ADMIN routes) reuses this same function
 * instead of each route inventing its own role logic.
 */
export function requireRole(session: SessionPayload, roles: Role[]): void {
  if (!roles.includes(session.role)) {
    throw new AppError("FORBIDDEN", "No tenés permisos para realizar esta acción.");
  }
}
