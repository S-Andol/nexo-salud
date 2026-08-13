import type { Metadata } from "next";
import { Suspense } from "react";
import { listSpecialties } from "@/lib/services/specialty.service";
import { listProfessionalsWithAvailability } from "@/lib/services/professional.service";
import { ProfessionalSearchFilters } from "@/components/professionals/ProfessionalSearchFilters";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profesionales — NEXO Salud" };

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ specialtyId?: string; search?: string; onlyAvailable?: string }>;
}) {
  const params = await searchParams;
  const [specialties, professionals] = await Promise.all([
    listSpecialties(),
    listProfessionalsWithAvailability({ specialtyId: params.specialtyId, search: params.search }),
  ]);

  const filtered =
    params.onlyAvailable === "true"
      ? professionals.filter((p) => p.nextAvailableSlot !== null)
      : professionals;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Profesionales</h1>
        <p className="mt-2 text-ink-600">Buscá por especialidad, nombre o disponibilidad.</p>
      </div>

      <div className="mt-8">
        <Suspense>
          <ProfessionalSearchFilters specialties={specialties} />
        </Suspense>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-ink-500">No encontramos profesionales con esos filtros.</p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProfessionalCard key={p.id} professional={p} />
          ))}
        </div>
      )}
    </div>
  );
}
