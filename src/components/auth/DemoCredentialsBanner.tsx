export function DemoCredentialsBanner() {
  if (process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== "true") return null;

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
      <p className="font-semibold">Cuenta demo</p>
      <p className="mt-1">
        Email: <span className="font-mono">paciente@nexosalud.demo</span>
      </p>
      <p>
        Contraseña: <span className="font-mono">DemoPaciente2026!</span>
      </p>
    </div>
  );
}
