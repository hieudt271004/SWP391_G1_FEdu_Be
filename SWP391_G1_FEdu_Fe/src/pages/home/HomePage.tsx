import { HeroSection } from "./components/HeroSection";
import { StatsSection } from "./components/StatsSection";
import { CTASection } from "./components/CTASection";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <StatsSection />
      <CTASection />
    </div>
  );
}