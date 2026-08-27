'use client';

import React from 'react';
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
  Zap,
  Settings
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
    is2GMode,
    setIs2GMode,
    theme,
    likedSongs,
    toggleLike,
    setIsModalOpen,
    setIsQueueOpen,
    setIsSettingsOpen,
    setSelectedArtist
  } = usePlayer();

  if (!currentTrack) return null;

  const isLiked = likedSongs.some(t => t.id === currentTrack.id);
  const isDark = theme === 'dark';

  const cycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  return (
    <>
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl backdrop-blur-2xl border rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl z-40 transition-all duration-300 ${
        isDark 
          ? 'bg-[#101118]/90 border-white/10 text-white' 
          : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-neutral-300/40'
      }`}>
        
        {/* Left: Track Info */}
        <div className="flex items-center space-x-3 w-1/4 min-w-[150px]">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm"
          />
          <div className="truncate">
            <h4 className={`text-xs font-semibold truncate cursor-default ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
              {currentTrack.title}
            </h4>
            <p
              onClick={() => setSelectedArtist(currentTrack.artist)}
              className="text-[10px] text-neutral-400 truncate hover:text-indigo-500 cursor-pointer transition"
            >
              {currentTrack.artist}
            </p>
          </div>
          <button
            onClick={() => toggleLike(currentTrack)}
            className="p-1 transition text-neutral-400 hover:text-rose-500 active:scale-90"
          >
            <Heart size={15} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        </div>

        {/* Center: Minimal Scrubber */}
        <div className="flex flex-col items-center w-2/4 px-3">
          <div className="flex items-center space-x-4 mb-0.5">
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition hover:scale-110 ${isShuffle ? 'text-indigo-500 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
              title="Shuffle"
            >
              <Shuffle size={13} />
            </button>

            <button
              onClick={handlePrevious}
              className="text-neutral-400 hover:text-white transition active:scale-95"
              title="Previous"
            >
              <SkipBack size={15} />
            </button>

            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md hover:bg-indigo-500 hover:scale-105 active:scale-95 transition"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-0.5 fill-white" />}
            </button>

            <button
              onClick={handleNext}
              className="text-neutral-400 hover:text-white transition active:scale-95"
              title="Next"
            >
              <SkipForward size={15} />
            </button>

            <button
              onClick={cycleRepeat}
              className={`transition hover:scale-110 relative ${repeatMode !== 'off' ? 'text-indigo-500 font-bold' : 'text-neutral-400 hover:text-neutral-200'}`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={13} /> : <Repeat size={13} />}
            </button>
          </div>

          <div className="w-full flex items-center space-x-2">
            <span className="text-[9px] font-mono text-neutral-400 w-7 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1">
              <WaveformScrubber />
            </div>
            <span className="text-[9px] font-mono text-neutral-400 w-7">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-1.5 w-1/4">
          <button
            onClick={() => setIs2GMode(!is2GMode)}
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-medium border flex items-center gap-0.5 transition ${
              is2GMode
                ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                : 'border-white/10 text-neutral-400'
            }`}
            title="Toggle 2G Mode"
          >
            <Zap size={10} className={is2GMode ? 'animate-pulse' : ''} />
            <span>2G</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-indigo-500 transition"
            title="Lyrics"
          >
            <Mic2 size={14} />
          </button>

          <button
            onClick={() => setIsQueueOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-indigo-500 transition"
            title="Queue"
          >
            <ListMusic size={14} />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-indigo-500 transition"
            title="Settings"
          >
            <Settings size={14} />
          </button>

          <div className="hidden lg:flex items-center space-x-1.5 pl-1">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-indigo-500 transition">
              {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => changeVolume(e.target.value)}
              className="w-12 h-1 bg-neutral-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      <LyricsView />
      <QueueDrawer />
      <SettingsModal />
    </>
  );
}