'use client';

import React, { useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import LyricsView from './LyricsView';
import QueueDrawer from './QueueDrawer';
import SettingsModal from './SettingsModal';
import WaveformScrubber from './WaveformScrubber';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Volume2, 
  VolumeX, 
  ListMusic, 
  Mic2,
  Cast
} from 'lucide-react';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    handleNext,
    handlePrevious,
    currentTime,
    duration,
    volume,
    changeVolume,
    isMuted,
    toggleMute,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode,
    likedSongs = [],
    toggleLike,
    setIsModalOpen,
    setIsQueueOpen,
    setSelectedArtist
  } = usePlayer() || {};

  // Keyboard Shortcuts Handler (Space, Right Arrow, Left Arrow)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // যদি ইউজার ইনপুট ফিল্ড বা টেক্সটবক্সে টাইপ করেন তবে শর্টকাট কাজ করবে না
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (togglePlay) togglePlay();
      } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (handleNext) handleNext();
      } else if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (handlePrevious) handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNext, handlePrevious]);

  if (!currentTrack) return null;

  const isLiked = likedSongs.some(t => t.id === currentTrack.id);

  const cycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  return (
    <>
      {/* শুধুমাত্র ডেস্কটপের জন্য দৃশ্যমান থাকবে (hidden lg:block) */}
      <div className="hidden lg:block fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-320px)] ml-32 max-w-5xl z-40 pointer-events-none select-none">
        <div className="bg-[#1F1F23]/90 backdrop-blur-[40px] border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 px-6 flex items-center justify-between gap-6 pointer-events-auto relative overflow-hidden">
          
          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20 pointer-events-none" />

          {/* 1. Left: Track Info */}
          <div className="flex items-center gap-3.5 w-1/4 min-w-[180px]">
            <img
              src={currentTrack.thumbnail || currentTrack.cover}
              alt={currentTrack.title}
              className="w-12 h-12 rounded-xl object-cover shadow-md border border-white/10 shrink-0"
            />
            <div className="flex flex-col truncate">
              <h4 className="text-sm font-semibold text-white truncate cursor-default">
                {currentTrack.title}
              </h4>
              <p
                onClick={() => setSelectedArtist && setSelectedArtist(currentTrack.artist)}
                className="text-xs text-white/50 truncate hover:text-[#00F2FE] cursor-pointer transition mt-0.5"
              >
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => toggleLike && toggleLike(currentTrack)}
              className="ml-2 text-white/60 hover:text-[#FF007F] transition-colors shrink-0 p-1"
            >
              <Heart size={18} className={isLiked ? 'fill-[#FF007F] text-[#FF007F]' : ''} />
            </button>
          </div>

          {/* 2. Center: Controls & Scrubber */}
          <div className="flex-1 flex flex-col items-center max-w-xl mx-auto">
            <div className="flex items-center gap-6 mb-1">
              <button
                onClick={() => setIsShuffle && setIsShuffle(!isShuffle)}
                className={`transition hover:scale-110 p-1 ${isShuffle ? 'text-[#00F2FE]' : 'text-white/60 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle size={14} />
              </button>

              <button
                onClick={handlePrevious}
                className="text-white/80 hover:text-white transition active:scale-95 p-1"
                title="Previous Track (Ctrl + Left Arrow)"
              >
                <SkipBack size={18} className="fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                title="Play / Pause (Spacebar)"
              >
                {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="translate-x-0.5 fill-current" />}
              </button>

              <button
                onClick={handleNext}
                className="text-white/80 hover:text-white transition active:scale-95 p-1"
                title="Next Track (Ctrl + Right Arrow)"
              >
                <SkipForward size={18} className="fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                className={`transition hover:scale-110 relative p-1 ${repeatMode !== 'off' ? 'text-[#00F2FE]' : 'text-white/60 hover:text-white'}`}
                title="Repeat Mode"
              >
                {repeatMode === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />}
              </button>
            </div>

            <div className="w-full flex items-center gap-3 text-xs text-white/50 font-mono">
              <span className="w-8 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1">
                <WaveformScrubber />
              </div>
              <span className="w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* 3. Right: Actions */}
          <div className="w-1/4 flex items-center justify-end gap-3.5 text-white/70">
            <button
              onClick={() => setIsModalOpen && setIsModalOpen(true)}
              className="hover:text-white transition p-1"
              title="Lyrics"
            >
              <Mic2 size={16} />
            </button>

            <button
              onClick={() => setIsQueueOpen && setIsQueueOpen(true)}
              className="hover:text-white transition p-1"
              title="Queue"
            >
              <ListMusic size={16} />
            </button>

            <button
              className="hover:text-white transition p-1"
              title="Cast"
            >
              <Cast size={16} />
            </button>

            <div className="hidden lg:flex items-center gap-2 w-24">
              <button onClick={toggleMute} className="text-white/50 hover:text-white transition">
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => changeVolume && changeVolume(e.target.value)}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Overlays */}
      <LyricsView />
      <QueueDrawer />
      <SettingsModal />
    </>
  );
}