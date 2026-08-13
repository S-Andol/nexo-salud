import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "brand" | "success" | "danger" | "neutral" | "warning";

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  neutral: "bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone]
      )}
    >
      {children}
    </span>
  );
}
