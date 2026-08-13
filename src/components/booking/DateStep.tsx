"use client";

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { dayOfWeekForDateStr, todayBA } from "@/lib/time/timezone";
import type { DayAvailability } from "@/lib/services/availability.service";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DOW_INDEX: Record<string, number> = {
  MONDAY: 0, TUESDAY: 1, WEDNESDAY: 2, THURSDAY: 3, FRIDAY: 4, SATURDAY: 5, SUNDAY: 6,
};

export function DateStep({
  professionalId,
  selected,
  onSelect,
}: {
  professionalId: string;
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const today = useMemo(() => todayBA(), []);
  const [todayY, todayM] = today.split("-").map(Number);
  const [year, setYear] = useState(todayY);
  const [month, setMonth] = useState(todayM);
  const [days, setDays] = useState<Record<string, DayAvailability> | null>(null);

  // Adjust state during render (React's documented alternative to an effect
  // that resets state) whenever the requested month/professional changes, so
  // stale data never flashes while the new month is loading.
  const requestKey = `${professionalId}|${year}|${month}`;
  const [loadedKey, setLoadedKey] = useState(requestKey);
  if (requestKey !== loadedKey) {
    setLoadedKey(requestKey);
    setDays(null);
  }

  useEffect(() => {
    fetch(`/api/professionals/${professionalId}/availability?year=${year}&month=${month}`)
      .then((res) => res.json())
      .then((data) => setDays(data.days));
  }, [professionalId, year, month]);

  function goPrevMonth() {
    if (year === todayY && month === todayM) return;
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDateStr = `${year}-${String(month).padStart(2, "0")}-01`;
  const leadingBlanks = DOW_INDEX[dayOfWeekForDateStr(firstDateStr)];

  const cells: (string | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  const isPrevDisabled = year === todayY && month === todayM;

  return (
    <div data-testid="appointment-date">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={isPrevDisabled}
          aria-label="Mes anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-ink-900">
          {MONTH_LABELS[month - 1]} {year}
        </p>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Mes siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i} className="text-xs font-medium text-ink-400">
            {d}
          </span>
        ))}

        {days === null
          ? cells.map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
          : cells.map((dateStr, i) => {
              if (!dateStr) return <span key={i} />;
              const status = days[dateStr];
              const isSelected = selected === dateStr;
              const isDisabled = status === "past" || status === "out-of-range" || status === "unavailable";
              const day = Number(dateStr.slice(-2));

              return (
                <button
                  key={dateStr}
                  type="button"
                  data-testid={`appointment-date-${dateStr}`}
                  disabled={isDisabled}
                  onClick={() => onSelect(dateStr)}
                  aria-pressed={isSelected}
                  aria-label={dateStr}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150",
                    isSelected && "bg-brand-600 text-white",
                    !isSelected && status === "available" && "bg-brand-50 text-brand-700 hover:bg-brand-100",
                    !isSelected && isDisabled && "text-ink-300 cursor-not-allowed"
                  )}
                >
                  {day}
                </button>
              );
            })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-500">
        <LegendItem className="bg-brand-50" label="Disponible" />
        <LegendItem className="bg-brand-600" label="Seleccionada" />
        <LegendItem className="bg-ink-100" label="No disponible / pasada" />
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-3 w-3 rounded", className)} />
      {label}
    </span>
  );
}
