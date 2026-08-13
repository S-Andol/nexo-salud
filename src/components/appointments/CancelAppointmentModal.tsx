"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDateTimeDisplay } from "@/lib/time/timezone";
import type { AppointmentWithRelations } from "@/lib/services/appointment.service";

export function CancelAppointmentModal({
  appointment,
  submitting,
  onConfirm,
  onClose,
}: {
  appointment: AppointmentWithRelations | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const open = appointment !== null;
  const { date, time } = appointment ? formatDateTimeDisplay(new Date(appointment.startDatetime)) : { date: "", time: "" };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="¿Seguro que querés cancelar este turno?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting} data-testid="appointment-cancel-dismiss">
            Volver
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={submitting} data-testid="appointment-cancel-confirm">
            Sí, cancelar turno
          </Button>
        </>
      }
    >
      {appointment && (
        <div className="flex flex-col gap-1.5">
          <p>
            <span className="text-ink-500">Profesional: </span>
            <span className="font-medium text-ink-900">
              {appointment.professional.firstName} {appointment.professional.lastName}
            </span>
          </p>
          <p>
            <span className="text-ink-500">Especialidad: </span>
            <span className="font-medium text-ink-900">{appointment.specialty.name}</span>
          </p>
          <p>
            <span className="text-ink-500">Fecha: </span>
            <span className="font-medium text-ink-900">
              {date} · {time}
            </span>
          </p>
        </div>
      )}
    </Modal>
  );
}
