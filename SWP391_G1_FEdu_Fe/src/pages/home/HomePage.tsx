import { HeroSection } from "./components/HeroSection";
import { StatsSection } from "./components/StatsSection";
import { CTASection } from "./components/CTASection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <CTASection />
    </>
  );
}