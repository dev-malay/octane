import { useEffect } from "react";
import { LandingHeader } from "../components/landing/LandingHeader";
import { Hero } from "../components/landing/Hero";
import { TechnicalSection } from "../components/landing/TechnicalSection";
import { LandingFooter } from "../components/landing/LandingFooter";

interface LandingPageProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
}

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  useEffect(() => {
    document.title = "Octane - Perpetual Futures Exchange";
  }, []);

  return (
    <div className="oct-landing min-h-screen bg-bg text-text">
      <LandingHeader onOpenAuth={onOpenAuth} />
      <Hero />
      <TechnicalSection />
      <LandingFooter />
    </div>
  );
}
