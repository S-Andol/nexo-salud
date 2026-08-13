"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WizardProgress } from "@/components/booking/WizardProgress";
import { SpecialtyStep } from "@/components/booking/SpecialtyStep";
import { ProfessionalStep } from "@/components/booking/ProfessionalStep";
import { DateStep } from "@/components/booking/DateStep";
import { TimeStep } from "@/components/booking/TimeStep";
import { ConfirmStep } from "@/components/booking/ConfirmStep";
import { SuccessScreen } from "@/components/booking/SuccessScreen";
import { Button } from "@/components/ui/Button";
import type { WizardProfessional, WizardSelection, WizardSpecialty } from "@/components/booking/types";

const STEP_TITLES: Record<number, string> = {
  1: "Elegí una especialidad",
  2: "Elegí un profesional",
  3: "Elegí una fecha",
  4: "Elegí un horario",
  5: "Confirmá tu turno",
};

export function BookingWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState<WizardSelection>({
    specialty: null,
    professional: null,
    date: null,
    time: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const preselected = useRef(false);

  useEffect(() => {
    if (preselected.current) return;
    preselected.current = true;

    const professionalId = searchParams.get("professionalId");
    const specialtyId = searchParams.get("specialtyId");

    if (professionalId) {
      fetch(`/api/professionals/${professionalId}`)
        .then((res) => res.json())
        .then((data) => {
          const professional = data.professional as
            | (WizardProfessional & { specialty: WizardSpecialty })
            | undefined;
          if (!professional) return;
          setSelection({
            specialty: professional.specialty,
            professional: { ...professional, nextAvailableSlot: null },
            date: null,
            time: null,
          });
          setStep(3);
        });
      return;
    }

    if (specialtyId) {
      fetch("/api/specialties")
        .then((res) => res.json())
        .then((data) => {
          const specialty = (data.specialties as WizardSpecialty[]).find((s) => s.id === specialtyId);
          if (!specialty) return;
          setSelection((sel) => ({ ...sel, specialty }));
          setStep(2);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSpecialty(specialty: WizardSpecialty) {
    setSelection({ specialty, professional: null, date: null, time: null });
    setStep(2);
  }

  function selectProfessional(professional: WizardProfessional) {
    setSelection((sel) => ({ ...sel, professional, date: null, time: null }));
    setStep(3);
  }

  function selectDate(date: string) {
    setSelection((sel) => ({ ...sel, date, time: null }));
    setStep(4);
  }

  function selectTime(time: string) {
    setSelection((sel) => ({ ...sel, time }));
    setStep(5);
  }

  function goBack() {
    setErrorMessage(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleConfirm() {
    if (submitting) return; // RN-10 guard
    const { specialty, professional, date, time } = selection;
    if (!specialty || !professional || !date || !time) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialtyId: specialty.id, professionalId: professional.id, date, time }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error?.message ?? "No pudimos completar la operación. Intentá nuevamente.");
        return;
      }

      setSuccessCode(data.appointment.appointmentCode);
    } catch {
      setErrorMessage("No pudimos completar la operación. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successCode) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-10">
        <SuccessScreen code={successCode} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft sm:p-8">
      <WizardProgress current={step} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">{STEP_TITLES[step]}</h2>

        <div className="mt-5">
          {step === 1 && <SpecialtyStep selected={selection.specialty} onSelect={selectSpecialty} />}
          {step === 2 && selection.specialty && (
            <ProfessionalStep
              key={selection.specialty.id}
              specialtyId={selection.specialty.id}
              selected={selection.professional}
              onSelect={selectProfessional}
            />
          )}
          {step === 3 && selection.professional && (
            <DateStep
              key={selection.professional.id}
              professionalId={selection.professional.id}
              selected={selection.date}
              onSelect={selectDate}
            />
          )}
          {step === 4 && selection.professional && selection.date && (
            <TimeStep
              key={selection.date}
              professionalId={selection.professional.id}
              date={selection.date}
              selected={selection.time}
              onSelect={selectTime}
            />
          )}
          {step === 5 && (
            <ConfirmStep
              selection={selection}
              submitting={submitting}
              errorMessage={errorMessage}
              onConfirm={handleConfirm}
            />
          )}
        </div>

        {step > 1 && (
          <div className="mt-6 border-t border-ink-100 pt-5">
            <Button variant="ghost" size="sm" onClick={goBack} disabled={submitting}>
              ← Atrás
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
