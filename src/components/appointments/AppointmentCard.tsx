import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/appointments/StatusBadge";
import { formatDateTimeDisplay } from "@/lib/time/timezone";
import type { AppointmentWithRelations } from "@/lib/services/appointment.service";

export function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: AppointmentWithRelations;
  onCancel?: (appointment: AppointmentWithRelations) => void;
}) {
  const { date, time } = formatDateTimeDisplay(new Date(appointment.startDatetime));

  return (
    <div
      data-testid={`appointment-card-${appointment.id}`}
      className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3.5">
        <Avatar firstName={appointment.professional.firstName} lastName={appointment.professional.lastName} />
        <div>
          <p className="font-semibold text-ink-900">
            {appointment.professional.firstName} {appointment.professional.lastName}
          </p>
          <p className="text-sm text-ink-500">{appointment.specialty.name}</p>
          <p className="mt-1 font-mono text-xs text-ink-400">{appointment.appointmentCode}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:flex-col sm:items-end sm:gap-1.5">
        <div className="text-sm text-ink-700">
          <span className="font-medium">{date}</span> · {time} ({appointment.specialty.appointmentDuration} min)
        </div>
        <StatusBadge status={appointment.status} />
        {onCancel && appointment.status === "CONFIRMADO" && (
          <Button
            variant="secondary"
            size="sm"
            data-testid="appointment-cancel"
            onClick={() => onCancel(appointment)}
          >
            Cancelar turno
          </Button>
        )}
      </div>
    </div>
  );
}
