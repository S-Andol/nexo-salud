import type { ReactElement } from "react";

const ICONS: Record<string, ReactElement> = {
  "Clínica Médica": (
    <path d="M12 3v18M3 12h18" strokeLinecap="round" />
  ),
  Cardiología: (
    <path
      d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4 6 4c2.4 0 3.9 1.3 6 3.6C14.1 5.3 15.6 4 18 4c4 0 5.6 4 4 7.7C19.5 16.4 12 21 12 21Z"
      strokeLinejoin="round"
    />
  ),
  Dermatología: <circle cx="12" cy="12" r="8" />,
  Traumatología: <path d="M6 18 18 6M9 6h5v5M15 18H9v-5" strokeLinecap="round" strokeLinejoin="round" />,
  Pediatría: <path d="M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" strokeLinejoin="round" />,
  Oftalmología: (
    <>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  Psicología: <path d="M9 3a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4Z" strokeLinejoin="round" />,
  Nutrición: <path d="M12 3c-4 3-6 6-6 10a6 6 0 0 0 12 0c0-4-2-7-6-10Z" strokeLinejoin="round" />,
};

const DEFAULT_ICON = <path d="M12 3v18M3 12h18" strokeLinecap="round" />;

export function SpecialtyIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      {ICONS[name] ?? DEFAULT_ICON}
    </svg>
  );
}
