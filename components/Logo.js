'use client';

import React from 'react';

export default function Logo({ size = 36, className = '' }) {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl bg-[#08090C] border border-white/15 p-1.5 shadow-[0_0_25px_rgba(0,242,254,0.25)] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Main Gradient */}
          <linearGradient id="kymatixWaveGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00F2FE" />
            <stop offset="50%" stopColor="#571BC1" />
            <stop offset="100%" stopColor="#E056FD" />
          </linearGradient>

          {/* Neon Glow Filter */}
          <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Backlight Glow */}
        <path
          d="M 12 50 H 22 Q 28 50 32 36 L 36 28 Q 40 12 44 28 L 48 76 Q 52 92 56 68 L 60 40 Q 64 24 68 44 L 72 64 Q 76 72 80 50 H 88"
          stroke="url(#kymatixWaveGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-40 filter blur-[4px]"
        />

        {/* Core Sharp Waveform Line */}
        <path
          d="M 12 50 H 22 Q 28 50 32 36 L 36 28 Q 40 12 44 28 L 48 76 Q 52 92 56 68 L 60 40 Q 64 24 68 44 L 72 64 Q 76 72 80 50 H 88"
          stroke="url(#kymatixWaveGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#waveGlow)"
        />
      </svg>
    </div>
  );
}