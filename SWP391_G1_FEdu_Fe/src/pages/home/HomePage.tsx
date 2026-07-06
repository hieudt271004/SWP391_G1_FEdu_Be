import { HeroSection } from "./components/HeroSection";
import { AboutSection } from "./components/AboutSection";
import { StatsSection } from "./components/StatsSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { CTASection } from "./components/CTASection";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection />
      <AboutSection />
      <StatsSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}