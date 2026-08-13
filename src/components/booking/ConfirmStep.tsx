import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDateDisplay } from "@/lib/time/timezone";
import type { WizardSelection } from "@/components/booking/types";

export function ConfirmStep({
  selection,
  submitting,
  errorMessage,
  onConfirm,
}: {
  selection: WizardSelection;
  submitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
}) {
  if (!selection.specialty || !selection.professional || !selection.date || !selection.time) return null;

  const rows: [string, string][] = [
    ["Especialidad", selection.specialty.name],
    ["Profesional", `${selection.professional.firstName} ${selection.professional.lastName}`],
    ["Fecha", formatDateDisplay(selection.date)],
    ["Horario", selection.time],
    ["Duración", `${selection.specialty.appointmentDuration} minutos`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-2xl border border-ink-100">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={cn(
              "flex items-center justify-between px-4 py-3.5 text-sm",
              i % 2 === 0 ? "bg-white" : "bg-ink-50/60"
            )}
          >
            <span className="text-ink-500">{label}</span>
            <span className="font-medium text-ink-900">{value}</span>
          </div>
        ))}
      </div>

      {errorMessage && (
        <p role="alert" data-testid="booking-error" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <Button
        size="lg"
        loading={submitting}
        onClick={onConfirm}
        data-testid="appointment-confirm"
        className="w-full"
      >
        Confirmar turno
      </Button>
    </div>
  );
}
