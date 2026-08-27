'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';

export default function LyricsView() {
  const { isModalOpen, setIsModalOpen, currentTrack, lyrics, currentTime, seek } = usePlayer();
  const activeLineRef = useRef(null);

  const parsedLyrics = useMemo(() => {
    if (!lyrics) return [];
    const lines = lyrics.split('\n');
    const result = [];
    const timeExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (let line of lines) {
      const match = timeExp.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseFloat('0.' + match[3]);
        const time = min * 60 + sec + ms;
        const text = line.replace(timeExp, '').trim();
        if (text) result.push({ time, text });
      } else if (line.trim()) {
        result.push({ time: null, text: line.trim() });
      }
    }
    return result;
  }, [lyrics]);

  const activeIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].time !== null && currentTime >= parsedLyrics[i].time) {
        index = i;
      }
    }
    return index;
  }, [currentTime, parsedLyrics]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  if (!isModalOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-8 sm:p-12 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-14 h-14 rounded-lg object-cover grayscale contrast-125 border border-white/20"
          />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{currentTrack.title}</h2>
            <p className="text-xs text-neutral-400">{currentTrack.artist}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="w-10 h-10 rounded-full border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition"
        >
          ✕
        </button>
      </div>

      <div className="w-full max-w-2xl h-[65vh] overflow-y-auto no-scrollbar my-auto flex flex-col items-center space-y-8 py-20 text-center">
        {parsedLyrics.length === 0 ? (
          <p className="text-neutral-500 font-mono text-sm uppercase">Lyrics not found</p>
        ) : (
          parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => line.time !== null && seek(line.time)}
                className={`transition-all duration-300 cursor-pointer font-bold select-none ${
                  isActive
                    ? 'text-white text-2xl sm:text-3xl scale-105 opacity-100'
                    : 'text-neutral-600 text-lg sm:text-xl opacity-40 hover:opacity-80'
                }`}
              >
                {line.text}
              </p>
            );
          })
        )}
      </div>

      <div className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
        Live Synchronized Stream
      </div>
    </div>
  );
}