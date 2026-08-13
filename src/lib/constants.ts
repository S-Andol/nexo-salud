// Business-rule constants (RN-06, RN-07, RN-08). Kept in one place so tests and
// service code reference the same values instead of duplicating magic numbers.
export const MIN_LEAD_TIME_HOURS = 2;
export const MAX_LEAD_TIME_DAYS = 90;
export const MAX_ACTIVE_FUTURE_APPOINTMENTS = 5;

export const SESSION_COOKIE_NAME = "nexo_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const TIMEZONE = "America/Argentina/Buenos_Aires";
export const UTC_OFFSET = "-03:00";
