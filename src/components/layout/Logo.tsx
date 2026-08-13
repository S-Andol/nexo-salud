import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 shrink-0", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4 6 4c2.4 0 3.9 1.3 6 3.6C14.1 5.3 15.6 4 18 4c4 0 5.6 4 4 7.7C19.5 16.4 12 21 12 21Z" strokeLinejoin="round" />
          <path d="M8.5 12h2l1.2-2.4L13 14l1-2h1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink-900">NEXO Salud</span>
    </Link>
  );
}
