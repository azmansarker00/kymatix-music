'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { X, Radio } from 'lucide-react';

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
      } else if (line.trim() && !line.startsWith('[')) {
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
    <div className="fixed inset-0 z-50 bg-[#090a10]/95 backdrop-blur-3xl flex flex-col items-center justify-between p-6 sm:p-10 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="w-full max-w-3xl flex items-center justify-between z-10 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-4">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-12 h-12 rounded-xl object-cover border border-white/10"
          />
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">{currentTrack.title}</h2>
            <p className="text-xs text-neutral-400">{currentTrack.artist}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Synced Lyrics Body */}
      <div className="w-full max-w-2xl h-[65vh] overflow-y-auto no-scrollbar my-auto flex flex-col items-center space-y-7 py-24 text-center z-10">
        {parsedLyrics.length === 0 ? (
          <p className="text-neutral-500 font-mono text-sm uppercase">{lyrics || 'Searching lyrics...'}</p>
        ) : (
          parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => line.time !== null && seek(line.time)}
                className={`transition-all duration-300 cursor-pointer font-bold select-none text-center ${
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

      {/* Footer Info */}
      <div className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase z-10 flex items-center gap-2">
        <Radio size={12} className="text-indigo-400 animate-pulse" />
        Synchronized Lyrics
      </div>
    </div>
  );
}