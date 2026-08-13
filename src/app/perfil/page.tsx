import type { Metadata } from "next";
import { requireSessionOrRedirect } from "@/lib/auth/guards";
import { getPatientByUserId } from "@/lib/services/patient.service";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = { title: "Mi Perfil — NEXO Salud" };

export default async function ProfilePage() {
  const session = await requireSessionOrRedirect("/perfil");
  const patient = await getPatientByUserId(session.sub);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Mi Perfil</h1>
      <p className="mt-2 text-ink-600">Consultá y actualizá tus datos personales.</p>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
        <ProfileForm patient={patient} />
      </div>
    </div>
  );
}
