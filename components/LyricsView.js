'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { X, Radio, Loader2, Sparkles } from 'lucide-react';

function cleanTrackTitle(title) {
  if (!title) return '';
  return title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/official\s*(music\s*)?(video|audio|lyric\s*video|track)?/gi, '')
    .replace(/feat\.?.*$/gi, '')
    .replace(/ft\.?.*$/gi, '')
    .replace(/\|.*$/g, '')
    .replace(/-.*$/g, '')
    .replace(/4k|hd|audio|video|lyrics/gi, '')
    .trim();
}

export default function LyricsView() {
  const { isModalOpen, setIsModalOpen, currentTrack, currentTime = 0, seek } = usePlayer() || {};
  
  const [fetchedLyrics, setFetchedLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const activeLineRef = useRef(null);

  // গান পরিবর্তন বা মডাল ওপেন হলে স্বয়ংক্রিয়ভাবে ব্যাকএন্ড API থেকে লিরিক্স ফেচ করা
  useEffect(() => {
    if (!isModalOpen || !currentTrack) return;

    const loadLyrics = async () => {
      try {
        setLoading(true);
        setFetchedLyrics('');

        const cleanTitle = cleanTrackTitle(currentTrack.title);
        const cleanArtist = (currentTrack.artist || '').replace(/- Topic/gi, '').trim();

        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}`);
        const data = await res.json();

        // সিঙ্কড লیرিক্স বা প্লেইন লিরিক্স যাই পাক না কেন সেট করবে
        if (data.synced) {
          setFetchedLyrics(data.synced);
        } else if (data.lyrics) {
          setFetchedLyrics(data.lyrics);
        } else {
          setFetchedLyrics('Lyrics not found for this track.');
        }
      } catch (err) {
        setFetchedLyrics('Unable to connect to lyrics network.');
      } finally {
        setLoading(false);
      }
    };

    loadLyrics();
  }, [currentTrack, isModalOpen]);

  // LRC টাইমস্ট্যাম্প পার্সার
  const parsedLyrics = useMemo(() => {
    if (!fetchedLyrics) return [];
    const lines = fetchedLyrics.split('\n');
    const result = [];
    const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

    for (let line of lines) {
      const match = timeExp.exec(line);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = match[3] ? parseFloat('0.' + match[3]) : 0;
        const time = min * 60 + sec + ms;
        const text = line.replace(timeExp, '').trim();
        if (text) result.push({ time, text });
      } else if (line.trim() && !line.startsWith('[')) {
        result.push({ time: null, text: line.trim() });
      }
    }
    return result;
  }, [fetchedLyrics]);

  // রিয়েল-টাইম কারাওকে অ্যাক্টিভ লাইন ট্র্যাকিং
  const activeIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].time !== null && currentTime >= parsedLyrics[i].time) {
        index = i;
      }
    }
    return index;
  }, [currentTime, parsedLyrics]);

  // অটো-স্মুথ স্ক্রোল
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  if (!isModalOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#08090C]/90 backdrop-blur-[50px] saturate-[200%] flex flex-col items-center justify-between p-6 sm:p-12 animate-in fade-in zoom-in-95 duration-300 select-none overflow-hidden">
      
      {/* ব্যাকগ্রাউন্ড ডায়নামিক ব্লার গ্লো */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-[90px] pointer-events-none scale-125"
        style={{ backgroundImage: `url(${currentTrack.thumbnail || currentTrack.cover})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/60 via-transparent to-[#08090C]/80 pointer-events-none" />

      {/* Top Glass Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 border-b border-white/10 pb-5">
        <div className="flex items-center space-x-4">
          <img
            src={currentTrack.thumbnail || currentTrack.cover}
            alt={currentTrack.title}
            className="w-14 h-14 rounded-2xl object-cover border border-white/15 shadow-2xl"
          />
          <div className="truncate max-w-md">
            <h2 className="text-base font-bold text-white tracking-tight truncate">{currentTrack.title}</h2>
            <p className="text-xs font-medium text-[#FFB3B6] opacity-90 truncate mt-0.5">{currentTrack.artist}</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(false)}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 border border-white/10 shadow-lg cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Synced Karaoke Glass Body */}
      <div 
        className="w-full max-w-2xl h-[65vh] overflow-y-scroll overflow-x-hidden my-auto flex flex-col items-center space-y-7 py-24 text-center z-10 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {loading ? (
          <div className="m-auto flex flex-col items-center gap-4 text-white/50">
            <Loader2 size={32} className="animate-spin text-[#00F2FE]" />
            <span className="text-xs font-mono uppercase tracking-widest">Syncing Lyrics...</span>
          </div>
        ) : parsedLyrics.length === 0 ? (
          <p className="text-white/50 font-mono text-sm uppercase m-auto tracking-wider">
            {fetchedLyrics || 'Lyrics not found for this track.'}
          </p>
        ) : (
          parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => line.time !== null && typeof seek === 'function' && seek(line.time)}
                className={`transition-all duration-300 cursor-pointer font-bold select-none text-center ${
                  isActive
                    ? 'text-white text-2xl sm:text-3xl scale-105 opacity-100 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]'
                    : 'text-white/40 text-lg sm:text-xl opacity-35 hover:opacity-75'
                }`}
              >
                {line.text}
              </p>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase z-10 flex items-center gap-2 border-t border-white/10 w-full max-w-4xl pt-4">
        <Sparkles size={13} className="text-[#00F2FE] animate-pulse" />
        <span>Kymatix Liquid Glass Synchronized Lyrics</span>
      </div>
    </div>
  );
}