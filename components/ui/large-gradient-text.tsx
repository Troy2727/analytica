"use client";
import React from 'react';

interface LargeGradientTextProps {
  text: string;
  className?: string;
}

export function LargeGradientText({ text, className = '' }: LargeGradientTextProps) {
  return (
    <div className={`${className} text-center`}>
      <h1 
        className="text-6xl md:text-8xl font-bold tracking-tighter"
        style={{
          background: 'linear-gradient(90deg, #60a5fa, #34d399)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          display: 'inline-block'
        }}
      >
        {text}
      </h1>
    </div>
  );
}
