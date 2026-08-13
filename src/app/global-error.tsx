"use client";

import { useEffect } from "react";

// Only used if the root layout itself throws (very rare — normal route errors
// are caught by error.tsx, which renders inside the working layout/header/footer).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <p style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.875rem" }}>Error 500</p>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.75rem", fontWeight: 600, color: "#0f172a" }}>
            Ocurrió un error inesperado
          </h1>
          <p style={{ marginTop: "0.75rem", maxWidth: "24rem", color: "#475569" }}>
            No pudimos completar la operación. Intentá nuevamente en unos instantes.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: "2rem", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", background: "#0f8272", color: "#fff", fontWeight: 500, border: "none", cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
