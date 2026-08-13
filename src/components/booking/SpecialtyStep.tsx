"use client";

import { useEffect, useState } from "react";
import { SpecialtyIcon } from "@/components/landing/SpecialtyIcon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { WizardSpecialty } from "@/components/booking/types";

export function SpecialtyStep({
  selected,
  onSelect,
}: {
  selected: WizardSpecialty | null;
  onSelect: (specialty: WizardSpecialty) => void;
}) {
  const [specialties, setSpecialties] = useState<WizardSpecialty[] | null>(null);

  useEffect(() => {
    fetch("/api/specialties")
      .then((res) => res.json())
      .then((data) => setSpecialties(data.specialties));
  }, []);

  if (!specialties) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div data-testid="specialty-select" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {specialties.map((s) => {
        const isSelected = selected?.id === s.id;
        return (
          <button
            key={s.id}
            type="button"
            data-testid={`specialty-option-${s.id}`}
            onClick={() => onSelect(s)}
            aria-pressed={isSelected}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-150",
              isSelected
                ? "border-brand-500 bg-brand-50 shadow-soft ring-2 ring-brand-500/20"
                : "border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50/40"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isSelected ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600"
              )}
            >
              <SpecialtyIcon name={s.name} className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink-800">{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}
