"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function ProfessionalSearchFilters({
  specialties,
}: {
  specialties: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/profesionales?${params.toString()}`);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("search", search.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Input
        label="Buscar por nombre"
        data-testid="professional-search"
        placeholder="Ej: Martínez"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="specialty-filter" className="text-sm font-medium text-ink-800">
          Especialidad
        </label>
        <select
          id="specialty-filter"
          data-testid="professional-filter-specialty"
          value={searchParams.get("specialtyId") ?? ""}
          onChange={(e) => updateParam("specialtyId", e.target.value)}
          className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">Todas las especialidades</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-800">Disponibilidad</span>
        <label className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            data-testid="filter-only-available"
            checked={searchParams.get("onlyAvailable") === "true"}
            onChange={(e) => updateParam("onlyAvailable", e.target.checked ? "true" : "")}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          Solo con disponibilidad próxima
        </label>
      </div>
    </div>
  );
}
