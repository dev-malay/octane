import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { OctaneLogo } from "./OctaneLogo";
import { landingNavLinks } from "../../data/landingContent";
import { useTrading } from "../../context/TradingContext";
import { useTheme } from "../../hooks/useTheme";

interface LandingHeaderProps {
  onOpenAuth: (mode: "signin" | "signup") => void;
}

export function LandingHeader({ onOpenAuth }: LandingHeaderProps) {
  const { isAuthenticated, user, logout } = useTrading();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border-soft bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <OctaneLogo size={22} />
          <span className="text-[15px] font-medium text-text">Octane</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {landingNavLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-text transition-colors hover:bg-surface"
            >
              Log out {user?.username ? `(${user.username})` : ""}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenAuth("signin")}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-text"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth("signup")}
                className="whitespace-nowrap rounded-lg bg-text px-3 py-1.5 text-[13px] font-medium text-bg transition-opacity hover:opacity-90"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
