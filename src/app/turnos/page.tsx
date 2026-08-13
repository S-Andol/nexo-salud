import type { Metadata } from "next";
import Link from "next/link";
import { requireSessionOrRedirect } from "@/lib/auth/guards";
import { listAppointmentsForPatient } from "@/lib/services/appointment.service";
import { AppointmentsView } from "@/components/appointments/AppointmentsView";
import { buttonVariants } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Mis Turnos — NEXO Salud" };

export default async function TurnosPage() {
  const session = await requireSessionOrRedirect("/turnos");
  const appointments = await listAppointmentsForPatient(session.patientId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Mis Turnos</h1>
          <p className="mt-2 text-ink-600">Gestioná tus próximos turnos, historial y cancelaciones.</p>
        </div>
        <Link href="/turnos/nuevo" className={buttonVariants("primary", "md")}>
          Reservar turno
        </Link>
      </div>

      <div className="mt-8">
        <AppointmentsView initialAppointments={appointments} />
      </div>
    </div>
  );
}
