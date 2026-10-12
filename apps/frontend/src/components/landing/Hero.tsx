import { Link } from "react-router-dom";
import { hero } from "../../data/landingContent";
import { OrderbookPreview } from "./OrderbookPreview";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1100px] px-6 pb-8 pt-16 md:pt-24">
      <div className="max-w-[720px]">
        <span className="oct-fade-up inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] font-medium text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-green" />
          {hero.eyebrow}
        </span>

        <h1
          className="oct-fade-up oct-fade-up-1 mt-5 max-w-[20ch] text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[56px]"
          style={{ textWrap: "balance" }}
        >
          {hero.headline}
        </h1>

        <p className="oct-fade-up oct-fade-up-2 mt-5 max-w-[60ch] text-[17px] leading-relaxed text-text-muted md:text-[18px]">
          {hero.subhead}
        </p>

        <div className="oct-fade-up oct-fade-up-3 mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={hero.primaryCta.to}
            className="rounded-lg bg-text px-5 py-2.5 text-[14px] font-medium text-bg transition-opacity hover:opacity-90"
          >
            {hero.primaryCta.label}
          </Link>
          <Link
            to={hero.secondaryCta.to}
            className="rounded-lg border border-border px-5 py-2.5 text-[14px] font-medium text-text transition-colors hover:bg-surface"
          >
            {hero.secondaryCta.label}
          </Link>
        </div>
      </div>

      <div className="oct-fade-up oct-fade-up-4 mt-12 rounded-xl border border-border bg-panel p-2 shadow-[0_28px_70px_rgba(0,0,0,0.25)]">
        <OrderbookPreview />
      </div>
    </section>
  );
}
