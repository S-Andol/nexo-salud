"use client";

import { useMemo, useState } from "react";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { CancelAppointmentModal } from "@/components/appointments/CancelAppointmentModal";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/cn";
import type { AppointmentWithRelations } from "@/lib/services/appointment.service";

type TabKey = "proximos" | "historial" | "cancelados";

export function AppointmentsView({ initialAppointments }: { initialAppointments: AppointmentWithRelations[] }) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [tab, setTab] = useState<TabKey>("proximos");
  const [cancelTarget, setCancelTarget] = useState<AppointmentWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const groups = useMemo(
    () => ({
      proximos: appointments.filter((a) => a.status === "CONFIRMADO"),
      historial: appointments.filter((a) => a.status === "FINALIZADO"),
      cancelados: appointments.filter((a) => a.status === "CANCELADO"),
    }),
    [appointments]
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "proximos", label: `Próximos (${groups.proximos.length})` },
    { key: "historial", label: `Historial (${groups.historial.length})` },
    { key: "cancelados", label: `Cancelados (${groups.cancelados.length})` },
  ];

  async function confirmCancel() {
    if (!cancelTarget || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/appointments/${cancelTarget.id}/cancel`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast({ variant: "error", title: "No pudimos cancelar el turno", description: data?.error?.message });
        return;
      }

      setAppointments((prev) => prev.map((a) => (a.id === data.appointment.id ? data.appointment : a)));
      setCancelTarget(null);
      toast({ variant: "success", title: "Turno cancelado correctamente." });
    } catch {
      toast({ variant: "error", title: "No pudimos completar la operación. Intentá nuevamente." });
    } finally {
      setSubmitting(false);
    }
  }

  const current = groups[tab];

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-ink-100 p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            data-testid={`turnos-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-ink-900 shadow-soft" : "text-ink-500 hover:text-ink-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {current.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-500">No hay turnos en esta sección.</p>
        ) : (
          current.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onCancel={tab === "proximos" ? setCancelTarget : undefined} />
          ))
        )}
      </div>

      <CancelAppointmentModal
        appointment={cancelTarget}
        submitting={submitting}
        onConfirm={confirmCancel}
        onClose={() => (submitting ? null : setCancelTarget(null))}
      />
    </div>
  );
}
