import { cn } from "@/lib/cn";

const STEPS = ["Especialidad", "Profesional", "Fecha", "Horario", "Confirmación"];

export function WizardProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const state = step < current ? "done" : step === current ? "active" : "upcoming";
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  state === "done" && "bg-brand-600 text-white",
                  state === "active" && "bg-brand-600 text-white ring-4 ring-brand-100",
                  state === "upcoming" && "bg-ink-100 text-ink-400"
                )}
              >
                {state === "done" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  state === "upcoming" ? "text-ink-400" : "text-ink-800"
                )}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length && <span className="h-px flex-1 bg-ink-100" />}
          </li>
        );
      })}
    </ol>
  );
}
