"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { profileUpdateSchema } from "@/lib/validation/auth.schema";
import { formatDateDisplay } from "@/lib/time/timezone";
import type { PatientSummary } from "@/lib/services/patient.service";

export function ProfileForm({ patient }: { patient: PatientSummary }) {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [phone, setPhone] = useState(patient.phone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const parsed = profileUpdateSchema.safeParse({ firstName, lastName, phone });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.error?.fields) setErrors(data.error.fields);
        toast({ variant: "error", title: "No pudimos guardar tus datos", description: data?.error?.message });
        return;
      }

      toast({ variant: "success", title: "Perfil actualizado correctamente." });
      router.refresh();
    } catch {
      toast({ variant: "error", title: "No pudimos completar la operación. Intentá nuevamente." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="DNI" value={patient.dni} disabled hint="No se puede modificar." />
        <Input label="Fecha de nacimiento" value={formatDateDisplay(patient.birthDate)} disabled />
      </div>

      <Input label="Email" value={patient.email} disabled hint="No se puede modificar." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          data-testid="profile-firstname"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          error={errors.firstName}
        />
        <Input
          label="Apellido"
          data-testid="profile-lastname"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          error={errors.lastName}
        />
      </div>

      <Input
        label="Teléfono"
        data-testid="profile-phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
      />

      <Button type="submit" size="lg" loading={submitting} data-testid="profile-save" className="mt-2 self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
