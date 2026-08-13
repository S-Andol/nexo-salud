import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Reservar turno — NEXO Salud" };

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Reservar turno</h1>
      <p className="mt-2 text-ink-600">Completá los siguientes pasos para confirmar tu turno.</p>

      <div className="mt-8">
        <Suspense>
          <BookingWizard />
        </Suspense>
      </div>
    </div>
  );
}
