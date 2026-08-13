const STEPS = [
  { title: "Elegí una especialidad", description: "Seleccioná el área médica que necesitás." },
  { title: "Seleccioná un profesional", description: "Mirá disponibilidad, matrícula y especialidad." },
  { title: "Elegí fecha y horario", description: "Solo vas a ver turnos realmente disponibles." },
  { title: "Confirmá tu turno", description: "Recibí un código único al instante." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Cómo funciona</h2>
        <p className="mt-3 text-ink-600">Reservar tu turno lleva menos de dos minutos.</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <p className="mt-4 font-semibold text-ink-900">{step.title}</p>
            <p className="mt-1.5 text-sm text-ink-500">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
