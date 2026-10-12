import { Link } from "react-router-dom";
import { OctaneLogo } from "./OctaneLogo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Trade", to: "/trade" },
      { label: "About", to: "/about" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", to: "/about" },
      { label: "Start trading", to: "/trade" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1100px] px-6 pb-8 pt-4">
      <div className="grid grid-cols-1 gap-10 border-t border-border-soft py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <OctaneLogo size={18} />
            <span className="text-[13px] font-medium text-text">Octane</span>
          </div>
          <p className="mt-3 max-w-[32ch] text-[13px] leading-relaxed text-text-muted">
            A perpetual futures exchange - go long or short on price with
            leverage, matched by a real order book.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[12px] font-medium tracking-wide text-text-dim">
              {col.title}
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[13px] text-text-muted transition-colors hover:text-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-between gap-2 border-t border-border-soft py-6 sm:flex-row">
        <span className="text-[12px] text-text-dim">
          © 2026 Octane
        </span>
        <span className="text-center text-[12px] text-text-dim">
          Unreal money.
        </span>
      </div>
    </footer>
  );
}
