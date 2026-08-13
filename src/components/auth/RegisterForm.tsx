"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { registerSchema } from "@/lib/validation/auth.schema";

type FormState = {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  dni: "",
  birthDate: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return; // RN-10-style guard against double submit

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.error?.fields) {
          setErrors(data.error.fields);
        }
        toast({
          variant: "error",
          title: "No pudimos crear tu cuenta",
          description: data?.error?.message ?? "Intentá nuevamente.",
        });
        return;
      }

      toast({ variant: "success", title: "¡Cuenta creada!", description: "Bienvenido/a a NEXO Salud." });
      router.push("/turnos");
      router.refresh();
    } catch {
      toast({ variant: "error", title: "No pudimos completar la operación. Intentá nuevamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          data-testid="register-firstname"
          value={form.firstName}
          onChange={(e) => setField("firstName", e.target.value)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <Input
          label="Apellido"
          data-testid="register-lastname"
          value={form.lastName}
          onChange={(e) => setField("lastName", e.target.value)}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="DNI"
          data-testid="register-dni"
          inputMode="numeric"
          value={form.dni}
          onChange={(e) => setField("dni", e.target.value)}
          error={errors.dni}
          hint="Entre 7 y 8 dígitos, sin puntos."
        />
        <Input
          label="Fecha de nacimiento"
          data-testid="register-birthdate"
          type="date"
          value={form.birthDate}
          onChange={(e) => setField("birthDate", e.target.value)}
          error={errors.birthDate}
        />
      </div>

      <Input
        label="Email"
        data-testid="register-email"
        type="email"
        value={form.email}
        onChange={(e) => setField("email", e.target.value)}
        error={errors.email}
        autoComplete="email"
      />

      <Input
        label="Teléfono"
        data-testid="register-phone"
        type="tel"
        value={form.phone}
        onChange={(e) => setField("phone", e.target.value)}
        error={errors.phone}
        hint="Podés incluir el código de área."
        autoComplete="tel"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordInput
          label="Contraseña"
          data-testid="register-password"
          toggleTestId="register-password-toggle"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          error={errors.password}
          hint="Mín. 8 caracteres, con mayúscula, minúscula, número y símbolo."
          autoComplete="new-password"
        />
        <PasswordInput
          label="Repetir contraseña"
          data-testid="register-confirm-password"
          toggleTestId="register-confirm-password-toggle"
          value={form.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" size="lg" loading={submitting} data-testid="register-submit" className="mt-2">
        Crear cuenta
      </Button>
    </form>
  );
}
