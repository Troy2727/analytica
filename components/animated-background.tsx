// Decorative page background: slow aurora glows plus drifting glass-like waves.
// Each wave path spans two identical periods so translating it by -50% loops seamlessly.
const WAVE_A =
  "M0 200 C300 80 300 80 600 200 S900 320 1200 200 S1500 80 1800 200 S2100 320 2400 200";
const WAVE_B =
  "M0 200 C300 320 300 320 600 200 S900 80 1200 200 S1500 320 1800 200 S2100 80 2400 200";

function WaveLayer({
  id,
  path,
  opacity,
  className = "",
}: {
  id: string;
  path: string;
  opacity: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 2400 400"
      preserveAspectRatio="none"
      className={`absolute left-0 h-full w-[200%] ${className}`}
    >
      <defs>
        {/* Repeats every half so the loop has no visible seam */}
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="0.25" stopColor="#34d399" />
          <stop offset="0.5" stopColor="#60a5fa" />
          <stop offset="0.75" stopColor="#34d399" />
          <stop offset="1" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <path d={`${path} V400 H0 Z`} fill={`url(#${id})`} fillOpacity={opacity * 0.15} />
      <path
        d={path}
        fill="none"
        stroke={`url(#${id})`}
        strokeOpacity={opacity}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// A soft glow drawn as a radial gradient that follows the falloff of a circle blurred
// by 140px. A real `filter: blur(140px)` looks the same but is very slow on iPhones.
function Glow({ rgb, alpha }: { rgb: string; alpha: number }) {
  const stops = [
    [0.95, 0], [0.85, 20], [0.51, 40], [0.32, 50], [0.16, 60], [0.07, 70], [0.02, 85], [0, 100],
  ]
    .map(([k, at]) => `rgba(${rgb},${+(k * alpha).toFixed(3)}) ${at}%`)
    .join(", ");
  return (
    <div
      className="absolute -inset-[26.25rem]"
      style={{ background: `radial-gradient(closest-side, ${stops})` }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950"
    >
      <div className="absolute -top-48 left-[10%] h-[40rem] w-[40rem] md:motion-safe:animate-aurora-1">
        <Glow rgb="37,99,235" alpha={0.2} />
      </div>
      <div className="absolute top-[20%] -right-40 h-[36rem] w-[36rem] md:motion-safe:animate-aurora-2">
        <Glow rgb="16,185,129" alpha={0.15} />
      </div>
      <div className="absolute -bottom-40 left-[30%] h-[32rem] w-[32rem] md:motion-safe:animate-aurora-3">
        <Glow rgb="79,70,229" alpha={0.15} />
      </div>
      <div className="absolute inset-x-0 top-[38%] h-[46vh] opacity-70">
        <WaveLayer id="wave-a" path={WAVE_A} opacity={0.35} className="md:motion-safe:animate-wave" />
        <WaveLayer id="wave-b" path={WAVE_B} opacity={0.2} className="top-6 md:motion-safe:animate-wave-slow" />
      </div>
    </div>
  );
}
