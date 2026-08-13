export type WizardSpecialty = {
  id: string;
  name: string;
  description: string | null;
  appointmentDuration: number;
};

export type WizardProfessional = {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  description: string | null;
  specialty: { id: string; name: string };
  nextAvailableSlot: { date: string; time: string; startUtc: string } | null;
};

export type WizardSelection = {
  specialty: WizardSpecialty | null;
  professional: WizardProfessional | null;
  date: string | null;
  time: string | null;
};
