import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span 
      className={className}
      style={{
        background: 'linear-gradient(90deg, #00ffff, #2d8fff, #9333ff, #ff00ff)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        display: 'inline-block'
      }}
    >
      {children}
    </span>
  );
}
