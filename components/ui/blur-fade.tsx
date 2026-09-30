import type { CSSProperties } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  blur?: string;
}

// Pure CSS so the fade starts on first paint instead of waiting for JS hydration
// (a framer-motion version server-rendered everything at opacity:0 until hydrated).
export function BlurFade({
  children,
  className,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  blur = "6px",
}: BlurFadeProps) {
  const style = {
    "--blur-fade-y": `${yOffset}px`,
    "--blur-fade-blur": blur,
    animationDuration: `${duration}s`,
    animationDelay: `${0.04 + delay}s`,
  } as CSSProperties;
  return (
    <div className={`animate-blur-fade ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
