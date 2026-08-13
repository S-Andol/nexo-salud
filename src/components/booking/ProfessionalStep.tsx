"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatDateDisplay } from "@/lib/time/timezone";
import type { WizardProfessional } from "@/components/booking/types";

export function ProfessionalStep({
  specialtyId,
  selected,
  onSelect,
}: {
  specialtyId: string;
  selected: WizardProfessional | null;
  onSelect: (professional: WizardProfessional) => void;
}) {
  const [professionals, setProfessionals] = useState<WizardProfessional[] | null>(null);

  useEffect(() => {
    // Parent remounts this component (key={specialtyId}) on change, so local
    // state already starts at null — no need to reset it synchronously here.
    fetch(`/api/professionals?specialtyId=${specialtyId}`)
      .then((res) => res.json())
      .then((data) => setProfessionals(data.professionals));
  }, [specialtyId]);

  if (!professionals) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (professionals.length === 0) {
    return <p className="text-sm text-ink-500">No hay profesionales disponibles para esta especialidad.</p>;
  }

  return (
    <div data-testid="professional-select" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {professionals.map((p) => {
        const isSelected = selected?.id === p.id;
        return (
          <button
            key={p.id}
            type="button"
            data-testid={`professional-option-${p.id}`}
            onClick={() => onSelect(p)}
            aria-pressed={isSelected}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-150",
              isSelected
                ? "border-brand-500 bg-brand-50 shadow-soft ring-2 ring-brand-500/20"
                : "border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50/40"
            )}
          >
            <Avatar firstName={p.firstName} lastName={p.lastName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">
                {p.firstName} {p.lastName}
              </p>
              <p className="text-xs text-ink-500">
                {p.specialty.name} · Mat. {p.licenseNumber}
              </p>
              <div className="mt-1.5">
                {p.nextAvailableSlot ? (
                  <Badge tone="success">
                    {formatDateDisplay(p.nextAvailableSlot.date)} · {p.nextAvailableSlot.time}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Sin disponibilidad próxima</Badge>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
