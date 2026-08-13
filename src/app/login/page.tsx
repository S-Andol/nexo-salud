import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { DemoCredentialsBanner } from "@/components/auth/DemoCredentialsBanner";

export const metadata: Metadata = { title: "Iniciar sesión — NEXO Salud" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Bienvenido/a de nuevo"
      subtitle="Iniciá sesión para gestionar tus turnos."
      footer={
        <>
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Registrate
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <DemoCredentialsBanner />
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </AuthShell>
  );
}
