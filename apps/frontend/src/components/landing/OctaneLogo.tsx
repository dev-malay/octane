export function OctaneLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="octane-sphere"
          cx="35%"
          cy="30%"
          r="80%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="38%" stopColor="#34d399" />
          <stop offset="75%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#octane-sphere)" />
      <ellipse
        cx="9"
        cy="8"
        rx="4"
        ry="2.6"
        fill="#ffffff"
        fillOpacity="0.35"
        transform="rotate(-25 9 8)"
      />
    </svg>
  );
}
