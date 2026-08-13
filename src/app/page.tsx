import { Hero } from "@/components/landing/Hero";
import { FeaturedSpecialties } from "@/components/landing/FeaturedSpecialties";
import { ProfessionalsSection } from "@/components/landing/ProfessionalsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { listSpecialties } from "@/lib/services/specialty.service";
import { listProfessionalsWithAvailability } from "@/lib/services/professional.service";

// Availability shown on this page depends on "now", so it must never be
// statically prerendered/cached — always compute it fresh per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [specialties, professionals] = await Promise.all([
    listSpecialties(),
    listProfessionalsWithAvailability(),
  ]);

  return (
    <>
      <Hero />
      <FeaturedSpecialties specialties={specialties} />
      <ProfessionalsSection professionals={professionals.slice(0, 6)} />
      <HowItWorks />
    </>
  );
}
