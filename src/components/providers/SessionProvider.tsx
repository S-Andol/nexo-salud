"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { PatientSummary } from "@/lib/services/patient.service";

type SessionContextValue = {
  patient: PatientSummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}

export function SessionProvider({
  children,
  initialPatient = null,
}: {
  children: ReactNode;
  initialPatient?: PatientSummary | null;
}) {
  // initialPatient comes from the root layout Server Component, which reads the
  // session cookie authoritatively on every request — so it's never "unknown",
  // even when null (meaning: genuinely not logged in). No fetch-on-mount needed;
  // auth actions call router.refresh() to re-run the server layout instead.
  const [patient, setPatient] = useState<PatientSummary | null>(initialPatient);
  const [loading, setLoading] = useState(false);

  // React-docs "adjusting state during rendering" pattern instead of an effect:
  // re-sync local state to the server-provided prop whenever it changes (e.g.
  // after router.refresh() re-runs the root layout post-login/logout), while
  // still allowing optimistic local updates (logout) in between syncs.
  const [syncedPatient, setSyncedPatient] = useState(initialPatient);
  if (initialPatient !== syncedPatient) {
    setSyncedPatient(initialPatient);
    setPatient(initialPatient);
  }

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setPatient(data.patient ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setPatient(null);
  }, []);

  return (
    <SessionContext.Provider value={{ patient, loading, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
