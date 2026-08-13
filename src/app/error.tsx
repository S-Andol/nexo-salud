"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-red-600">Error 500</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">Ocurrió un error inesperado</h1>
      <p className="mt-3 max-w-sm text-ink-600">
        No pudimos completar la operación. Intentá nuevamente en unos instantes.
      </p>
      <div className="mt-8 flex gap-3">
        <Button size="lg" onClick={reset}>
          Reintentar
        </Button>
        <Link href="/" className={buttonVariants("secondary", "lg")}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
