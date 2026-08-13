import Link from "next/link";
import { SpecialtyIcon } from "@/components/landing/SpecialtyIcon";
import type { Specialty } from "@prisma/client";

export function FeaturedSpecialties({ specialties }: { specialties: Specialty[] }) {
  return (
    <section id="especialidades" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Especialidades destacadas</h2>
        <p className="mt-3 text-ink-600">Encontrá al profesional adecuado para cada necesidad.</p>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {specialties.map((s) => (
          <Link
            key={s.id}
            href={`/profesionales?specialtyId=${s.id}`}
            data-testid={`specialty-card-${s.id}`}
            className="group flex flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-soft-lg"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
              <SpecialtyIcon name={s.name} className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-ink-800">{s.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
