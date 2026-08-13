import Link from "next/link";
import { ProfessionalCard, type ProfessionalCardData } from "@/components/professionals/ProfessionalCard";
import { buttonVariants } from "@/components/ui/Button";

export function ProfessionalsSection({ professionals }: { professionals: ProfessionalCardData[] }) {
  return (
    <section id="profesionales" className="bg-ink-50/50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Profesionales</h2>
            <p className="mt-2 text-ink-600">Conocé a nuestro equipo médico.</p>
          </div>
          <Link href="/profesionales" className={buttonVariants("secondary")}>
            Ver todos
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((p) => (
            <ProfessionalCard key={p.id} professional={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
