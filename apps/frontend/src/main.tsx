import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { LoadTestPanel } from "./components/LoadTestPanel.tsx";
import { ServerGate } from "./components/ServerGate.tsx";
import { TradingProvider } from "./context/TradingContext.tsx";

const isLoadTest =
  window.location.pathname === "/loadtest" ||
  window.location.search.includes("loadtest=1");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ServerGate>
        {isLoadTest ? (
          <TradingProvider>
            <LoadTestPanel />
          </TradingProvider>
        ) : (
          <App />
        )}
      </ServerGate>
    </BrowserRouter>
  </StrictMode>,
);
