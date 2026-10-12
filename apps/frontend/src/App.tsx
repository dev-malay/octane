import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { TradingProvider } from "./context/TradingContext";
import { AuthModal } from "./components/AuthModal";
import { LandingPage } from "./pages/LandingPage";
import { AboutPage } from "./pages/AboutPage";
import { TradeApp } from "./pages/TradeApp";

type AuthMode = "signin" | "signup";

function AppRoutes() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage onOpenAuth={openAuth} />} />
        <Route path="/about" element={<AboutPage onOpenAuth={openAuth} />} />
        <Route path="/trade" element={<TradeApp onOpenAuth={openAuth} />} />
        <Route path="/simulator" element={<TradeApp onOpenAuth={openAuth} />} />
        <Route path="*" element={<LandingPage onOpenAuth={openAuth} />} />
      </Routes>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}

export default function App() {
  return (
    <TradingProvider>
      <AppRoutes />
    </TradingProvider>
  );
}
