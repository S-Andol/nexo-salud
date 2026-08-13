import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">Error 404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">Página no encontrada</h1>
      <p className="mt-3 max-w-sm text-ink-600">
        La página que buscás no existe o fue movida. Verificá la dirección e intentá nuevamente.
      </p>
      <Link href="/" className={buttonVariants("primary", "lg", "mt-8")}>
        Volver al inicio
      </Link>
    </div>
  );
}
