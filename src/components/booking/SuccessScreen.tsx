import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export function SuccessScreen({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center animate-scale-in">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <div>
        <h2 className="text-2xl font-semibold text-ink-900">¡Turno reservado correctamente!</h2>
        <p className="mt-2 text-ink-600">Guardá este código, te va a servir como comprobante.</p>
      </div>
      <p
        data-testid="appointment-code"
        className="rounded-xl border border-brand-200 bg-brand-50 px-5 py-2.5 font-mono text-lg font-semibold tracking-wide text-brand-700"
      >
        {code}
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link href="/turnos" className={buttonVariants("primary", "md")}>
          Ver mis turnos
        </Link>
        <Link href="/" className={buttonVariants("secondary", "md")}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
