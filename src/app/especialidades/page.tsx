import type { Metadata } from "next";
import Link from "next/link";
import { listSpecialties } from "@/lib/services/specialty.service";
import { SpecialtyIcon } from "@/components/landing/SpecialtyIcon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Especialidades — NEXO Salud" };

export default async function SpecialtiesPage() {
  const specialties = await listSpecialties();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Especialidades</h1>
        <p className="mt-2 text-ink-600">Elegí el área médica que necesitás.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {specialties.map((s) => (
          <Link
            key={s.id}
            href={`/profesionales?specialtyId=${s.id}`}
            data-testid={`specialty-card-${s.id}`}
            className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft-lg"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
              <SpecialtyIcon name={s.name} className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-ink-900">{s.name}</p>
              {s.description && <p className="mt-1 text-sm text-ink-500">{s.description}</p>}
              <p className="mt-2 text-xs font-medium text-brand-600">
                Consulta: {s.appointmentDuration} min
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
