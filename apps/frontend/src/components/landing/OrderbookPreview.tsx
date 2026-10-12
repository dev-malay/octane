import { useEffect, useState } from "react";

const ASKS: Array<[string, number, number]> = [
  ["63,892.68", 4, 82],
  ["63,879.92", 11, 74],
  ["63,867.15", 3, 58],
  ["63,854.39", 8, 64],
  ["63,841.63", 6, 44],
  ["63,828.87", 5, 30],
  ["63,816.11", 1, 12],
];

const BIDS: Array<[string, number, number]> = [
  ["63,803.33", 1, 10],
  ["63,790.57", 5, 26],
  ["63,777.81", 2, 34],
  ["63,765.05", 8, 48],
  ["63,752.29", 3, 62],
  ["63,739.52", 11, 78],
  ["63,726.76", 12, 92],
];

const TAPE = [
  { s: "BTC-PERP", p: "63,803.33", c: "+2.41%", up: true },
  { s: "ETH-PERP", p: "3,412.18", c: "+1.87%", up: true },
  { s: "SOL-PERP", p: "172.44", c: "-0.92%", up: false },
  { s: "DOGE-PERP", p: "0.1823", c: "+4.12%", up: true },
  { s: "ARB-PERP", p: "1.2041", c: "-1.35%", up: false },
  { s: "AVAX-PERP", p: "38.92", c: "+0.64%", up: true },
];

// {x, openY, closeY, highY, lowY, up} in a 220x120 viewBox (lower y = higher price)
const CANDLES: Array<[number, number, number, number, number, boolean]> = [
  [12, 86, 74, 90, 76, true],
  [28, 74, 64, 78, 66, true],
  [44, 64, 70, 72, 58, false],
  [60, 70, 56, 72, 54, true],
  [76, 56, 62, 64, 50, false],
  [92, 62, 48, 64, 46, true],
  [108, 48, 54, 56, 44, false],
  [124, 54, 42, 56, 40, true],
  [140, 42, 46, 50, 36, false],
  [156, 46, 34, 48, 32, true],
  [172, 34, 28, 38, 26, true],
  [188, 28, 32, 34, 24, false],
  [204, 32, 22, 34, 20, true],
];

const TREND_LINE =
  "12,74 28,64 44,70 60,56 76,62 92,48 108,54 124,42 140,46 156,34 172,28 188,32 204,22";

function useTickingPrice(start: number) {
  const [tick, setTick] = useState<{ price: number; dir: 1 | -1 }>({
    price: start,
    dir: 1,
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setTick((t) => {
        const move = (Math.random() - 0.48) * 14;
        const price = Math.max(63000, Math.min(64600, t.price + move));
        return { price, dir: price >= t.price ? 1 : -1 };
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  return tick;
}

function BookRows({
  rows,
  tone,
}: {
  rows: Array<[string, number, number]>;
  tone: "ask" | "bid";
}) {
  const priceColor = tone === "ask" ? "text-red" : "text-green";
  const barColor = tone === "ask" ? "bg-red/20" : "bg-green/20";
  return (
    <>
      {rows.map(([p, s, d], i) => (
        <div
          key={p}
          className="relative flex items-center justify-between px-2 py-[3px] font-mono text-[11px]"
        >
          <div
            className={`oct-depth-bar absolute inset-y-[2px] right-0 rounded-sm ${barColor}`}
            style={{
              width: `${d}%`,
              animationDelay: `${(i * 0.37) % 1.8}s`,
              animationDuration: `${2.6 + (i % 4) * 0.5}s`,
            }}
          />
          <span className={`relative ${priceColor}`}>{p}</span>
          <span className="relative text-text-muted">{s}</span>
        </div>
      ))}
    </>
  );
}

export function OrderbookPreview() {
  const { price, dir } = useTickingPrice(63803.33);
  const formatted = price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-panel-2/60">
      {/* ambient decor */}
      <div className="oct-orb oct-orb-green" />
      <div className="oct-orb oct-orb-red" />
      <div className="oct-stage-grid-bg pointer-events-none absolute inset-0" />

      {/* ticker tape */}
      <div className="relative overflow-hidden border-b border-border-soft py-2">
        <div className="oct-marquee-track items-center gap-10 pr-10">
          {[...TAPE, ...TAPE].map((t, i) => (
            <span
              key={`${t.s}-${i}`}
              aria-hidden={i >= TAPE.length}
              className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px]"
            >
              <span className="text-text-muted">{t.s}</span>
              <span className="text-text">{t.p}</span>
              <span className={t.up ? "text-green" : "text-red"}>{t.c}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative grid grid-cols-1 items-center justify-center gap-6 p-6 lg:grid-cols-[230px_minmax(0,auto)_230px]">
        {/* left: live mini order book */}
        <div className="hidden w-[230px] rounded-xl border border-border-soft bg-panel/80 p-3 backdrop-blur lg:block">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[12px] font-medium text-text">Book</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
              </span>
              LIVE
            </span>
          </div>
          <BookRows rows={ASKS} tone="ask" />
          <div className="my-1.5 flex items-baseline justify-between border-y border-border-soft px-2 py-1.5">
            <span
              className={`font-mono text-[15px] font-semibold ${dir === 1 ? "text-green" : "text-red"}`}
            >
              {formatted}
            </span>
            <span className="font-mono text-[10px] text-text-dim">
              Spread 0.01
            </span>
          </div>
          <BookRows rows={BIDS} tone="bid" />
        </div>

        {/* center: product screenshot + floating order tags */}
        <div className="relative mx-auto w-fit">
          <img
            src="/orderbookPreview.webp"
            alt="Octane trading interface preview"
            className="max-h-[560px] w-auto rounded-md border border-border-soft object-contain shadow-xl"
          />
          <div
            className="oct-float-chip absolute -left-6 top-16 hidden rounded-lg border border-green/30 bg-bg/90 px-3 py-2 shadow-xl backdrop-blur lg:block"
            style={{ animationDelay: "0.6s" }}
          >
            <p className="font-mono text-[10px] text-text-muted">LONG 50x</p>
            <p className="font-mono text-[13px] font-semibold text-green">
              0.42 BTC
            </p>
          </div>
          <div
            className="oct-float-chip absolute -right-8 bottom-24 hidden rounded-lg border border-border bg-bg/90 px-3 py-2 shadow-xl backdrop-blur lg:block"
            style={{ animationDelay: "2.1s" }}
          >
            <p className="font-mono text-[10px] text-text-muted">TAKE PROFIT</p>
            <p className="font-mono text-[13px] font-semibold text-text">
              +$1,240.00
            </p>
          </div>
        </div>

        {/* right: live chart + stat chips */}
        <div className="hidden w-[230px] flex-col gap-4 lg:flex">
          <div className="rounded-xl border border-border-soft bg-panel/80 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-mono text-[11px] font-medium text-text">
                BTC-PERP · 1m
              </span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
              </span>
            </div>
            <svg
              viewBox="0 0 220 120"
              className="h-[130px] w-full"
              role="img"
              aria-label="Rising price chart"
            >
              <line
                x1="0"
                x2="220"
                y1="22"
                y2="22"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="3 4"
                className="text-text-dim opacity-60"
              />
              {CANDLES.map(([x, o, c, h, l, up], i) => (
                <g key={i}>
                  <line
                    x1={x}
                    x2={x}
                    y1={h}
                    y2={l}
                    strokeWidth="1.5"
                    className={up ? "stroke-green" : "stroke-red"}
                  />
                  <rect
                    x={x - 4}
                    y={Math.min(o, c)}
                    width="8"
                    height={Math.max(2, Math.abs(o - c))}
                    rx="1"
                    className={up ? "fill-green" : "fill-red"}
                  />
                </g>
              ))}
              <polyline
                points={TREND_LINE}
                fill="none"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="oct-chart-line stroke-green"
              />
              <circle cx="204" cy="22" r="3.5" className="fill-green" />
              <circle
                cx="204"
                cy="22"
                r="3.5"
                className="fill-none stroke-green"
              >
                <animate
                  attributeName="r"
                  values="3.5;9"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>

          <div
            className="oct-float-chip rounded-xl border border-border-soft bg-panel/80 px-4 py-3 backdrop-blur"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="font-mono text-[10px] tracking-wide text-text-dim">
              24H VOLUME
            </p>
            <p className="mt-0.5 font-mono text-[16px] font-semibold text-text">
              $1.28B
            </p>
          </div>
          <div
            className="oct-float-chip flex items-center justify-between rounded-xl border border-border-soft bg-panel/80 px-4 py-3 backdrop-blur"
            style={{ animationDelay: "2.6s" }}
          >
            <div>
              <p className="font-mono text-[10px] tracking-wide text-text-dim">
                FUNDING
              </p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-green">
                +0.0100%
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-wide text-text-dim">
                MAX LEV
              </p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold text-text">
                50x
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
