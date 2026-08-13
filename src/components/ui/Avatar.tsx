import { cn } from "@/lib/cn";

// Deterministic, offline-safe "photo": a colored initials avatar derived from the
// person's name. Avoids depending on an external image service for something as
// core as professional cards, which would be flaky to test and to deploy.
const PALETTE = [
  "bg-brand-100 text-brand-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function Avatar({
  firstName,
  lastName,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  const palette = PALETTE[hashString(`${firstName} ${lastName}`) % PALETTE.length];
  const sizeClasses = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-xl",
  }[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClasses,
        palette,
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
