import { Badge } from "@/components/ui/Badge";
import type { AppointmentStatus } from "@prisma/client";

const CONFIG: Record<AppointmentStatus, { label: string; tone: "brand" | "danger" | "neutral" }> = {
  CONFIRMADO: { label: "Confirmado", tone: "brand" },
  CANCELADO: { label: "Cancelado", tone: "danger" },
  FINALIZADO: { label: "Finalizado", tone: "neutral" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = CONFIG[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
