import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDateTimeDisplay } from "@/lib/time/timezone";

export type ProfessionalCardData = {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialty: { name: string };
  nextAvailableSlot?: { startUtc: Date | string } | null;
};

export function ProfessionalCard({ professional }: { professional: ProfessionalCardData }) {
  const next = professional.nextAvailableSlot
    ? formatDateTimeDisplay(new Date(professional.nextAvailableSlot.startUtc))
    : null;

  return (
    <Link
      href={`/turnos/nuevo?professionalId=${professional.id}`}
      data-testid={`professional-card-${professional.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft transition-all duration-150 hover:-translate-y-0.5 hover:shadow-soft-lg"
    >
      <div className="flex items-center gap-3.5">
        <Avatar firstName={professional.firstName} lastName={professional.lastName} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">
            {professional.firstName} {professional.lastName}
          </p>
          <p className="text-sm text-ink-500">{professional.specialty.name}</p>
          <p className="text-xs text-ink-400">Mat. {professional.licenseNumber}</p>
        </div>
      </div>

      <div className="mt-auto">
        {next ? (
          <Badge tone="success">
            Próx. disponibilidad: {next.date} · {next.time}
          </Badge>
        ) : (
          <Badge tone="neutral">Sin disponibilidad próxima</Badge>
        )}
      </div>
    </Link>
  );
}
