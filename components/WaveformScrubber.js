'use client';

import React, { useState, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';

function formatTooltipTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function WaveformScrubber() {
  const { currentTrack, currentTime, duration, seek, isPlaying, theme } = usePlayer();
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const trackRef = useRef(null);
  const isDark = theme === 'dark';

  if (!currentTrack) return null;

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleMouseMove = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = x / rect.width;
    setHoverPosition(x);
    setHoverTime(percent * (duration || 240));
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const handleClick = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = Math.max(0, Math.min(1, clickX / rect.width));
    seek(clickPercent * (duration || 240));
  };

  return (
    <div
      ref={trackRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative w-full h-5 flex items-center cursor-pointer group py-1 select-none"
    >
      {/* Tooltip on Hover */}
      {hoverTime !== null && (
        <div
          style={{ left: `${hoverPosition}px` }}
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[#1a1c26] border border-white/10 text-white text-[10px] font-mono font-bold shadow-2xl pointer-events-none transition-transform"
        >
          {formatTooltipTime(hoverTime)}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1a1c26]" />
        </div>
      )}

      {/* Spotify Minimal Precision Track Bar */}
      <div className={`w-full h-1 group-hover:h-1.5 rounded-full overflow-hidden transition-all duration-150 relative ${
        isDark ? 'bg-white/15' : 'bg-neutral-300'
      }`}>
        <div
          style={{ width: `${currentPercent}%` }}
          className="h-full bg-indigo-500 rounded-full relative transition-all duration-100 ease-linear"
        />
      </div>

      {/* Scrubber Thumb */}
      <div
        style={{ left: `${currentPercent}%` }}
        className="absolute -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-opacity pointer-events-none"
      />
    </div>
  );
}