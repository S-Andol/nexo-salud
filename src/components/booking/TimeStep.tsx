"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type Slot = { date: string; time: string; startUtc: string };

export function TimeStep({
  professionalId,
  date,
  selected,
  onSelect,
}: {
  professionalId: string;
  date: string;
  selected: string | null;
  onSelect: (time: string) => void;
}) {
  const [slots, setSlots] = useState<Slot[] | null>(null);

  useEffect(() => {
    // Parent remounts this component (key={date}) on change, so local state
    // already starts at null — no need to reset it synchronously here.
    fetch(`/api/professionals/${professionalId}/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots));
  }, [professionalId, date]);

  if (!slots) {
    return (
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        No quedan horarios disponibles para esta fecha. Volvé al paso anterior y elegí otro día.
      </p>
    );
  }

  return (
    <div data-testid="appointment-time" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = selected === slot.time;
        return (
          <button
            key={slot.time}
            type="button"
            data-testid={`appointment-time-${slot.time}`}
            onClick={() => onSelect(slot.time)}
            aria-pressed={isSelected}
            className={cn(
              "rounded-xl border py-2.5 text-sm font-medium transition-colors duration-150",
              isSelected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50"
            )}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
