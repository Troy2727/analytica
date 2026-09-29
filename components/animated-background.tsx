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

export default function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-950"
    >
      <div className="absolute -top-48 left-[10%] h-[40rem] w-[40rem] rounded-full bg-blue-600/20 blur-[140px] motion-safe:animate-aurora-1" />
      <div className="absolute top-[20%] -right-40 h-[36rem] w-[36rem] rounded-full bg-emerald-500/15 blur-[140px] motion-safe:animate-aurora-2" />
      <div className="absolute -bottom-40 left-[30%] h-[32rem] w-[32rem] rounded-full bg-indigo-600/15 blur-[140px] motion-safe:animate-aurora-3" />
      <div className="absolute inset-x-0 top-[38%] h-[46vh] opacity-70">
        <WaveLayer id="wave-a" path={WAVE_A} opacity={0.35} className="motion-safe:animate-wave" />
        <WaveLayer id="wave-b" path={WAVE_B} opacity={0.2} className="top-6 motion-safe:animate-wave-slow" />
      </div>
    </div>
  );
}
