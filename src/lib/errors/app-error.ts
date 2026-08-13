// Every domain-level failure (validation, business-rule violation, auth) throws an
// AppError with a stable machine-readable `code`. API routes catch AppError and
// serialize { error: { code, message, fields? } } — never a stack trace, never a raw
// Prisma/Postgres error. Unknown thrown values are mapped to a generic INTERNAL_ERROR.
// The frontend must branch on `code`, never parse `message` text.

export type AppErrorCode =
  // Auth
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "EMAIL_ALREADY_REGISTERED"
  | "DNI_ALREADY_REGISTERED"
  // Generic validation
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  // Booking business rules (RN-xx), each independently distinguishable
  | "PAST_DATE" // RN-01
  | "OUTSIDE_AVAILABILITY" // RN-02
  | "SLOT_UNAVAILABLE" // RN-03 (professional overlap / DB race loser)
  | "PATIENT_OVERLAP" // RN-04
  | "LEAD_TIME_TOO_SHORT" // RN-06
  | "LEAD_TIME_TOO_LONG" // RN-07
  | "MAX_ACTIVE_APPOINTMENTS_REACHED" // RN-08
  | "DUPLICATE_BOOKING" // RN-09
  // Appointment state machine
  | "INVALID_STATUS_TRANSITION"
  // Fallback
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: AppErrorCode;
  fields?: Record<string, string>;
  status: number;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { status?: number; fields?: Record<string, string> }
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? defaultStatusFor(code);
    this.fields = options?.fields;
  }
}

function defaultStatusFor(code: AppErrorCode): number {
  switch (code) {
    case "INVALID_CREDENTIALS":
    case "VALIDATION_ERROR":
    case "PAST_DATE":
    case "OUTSIDE_AVAILABILITY":
    case "LEAD_TIME_TOO_SHORT":
    case "LEAD_TIME_TOO_LONG":
    case "INVALID_STATUS_TRANSITION":
      return 400;
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "EMAIL_ALREADY_REGISTERED":
    case "DNI_ALREADY_REGISTERED":
    case "SLOT_UNAVAILABLE":
    case "PATIENT_OVERLAP":
    case "MAX_ACTIVE_APPOINTMENTS_REACHED":
    case "DUPLICATE_BOOKING":
      return 409;
    default:
      return 500;
  }
}

export const GENERIC_ERROR_MESSAGE = "No pudimos completar la operación. Intentá nuevamente.";

/** Normalizes any thrown value into a safe, user-facing {code, message} pair. */
export function toSafeError(err: unknown): { code: AppErrorCode; message: string; status: number; fields?: Record<string, string> } {
  if (err instanceof AppError) {
    return { code: err.code, message: err.message, status: err.status, fields: err.fields };
  }
  // Never leak Prisma/Postgres internals, stack traces, or raw exception text.
  return { code: "INTERNAL_ERROR", message: GENERIC_ERROR_MESSAGE, status: 500 };
}
