import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta — NEXO Salud" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Registrate para reservar y gestionar tus turnos médicos."
      footer={
        <>
          ¿Ya tenés una cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
