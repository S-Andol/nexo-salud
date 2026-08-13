import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-soft">
            Centro médico digital
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
            Tu salud, organizada en un solo lugar.
          </h1>
          <p className="mt-5 text-lg text-ink-600">
            Reservá turnos con profesionales de distintas especialidades de manera rápida, sencilla y
            segura.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/turnos/nuevo" data-testid="hero-book-appointment" className={buttonVariants("primary", "lg")}>
              Reservar turno
            </Link>
            <Link href="/profesionales" className={buttonVariants("secondary", "lg")}>
              Ver profesionales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
