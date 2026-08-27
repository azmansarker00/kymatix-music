'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';

export default function TrackInfoSidebar() {
  const { currentTrack, isInfoSidebarOpen, setIsInfoSidebarOpen, followedArtists, toggleFollowArtist } = usePlayer();

  if (!isInfoSidebarOpen || !currentTrack) return null;

  const isFollowed = followedArtists.includes(currentTrack.artist);

  return (
    <aside className="w-80 bg-[#090a12]/90 backdrop-blur-2xl border-l border-white/10 p-5 flex flex-col justify-between hidden xl:flex z-20 overflow-y-auto no-scrollbar">
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
          <h3 className="font-bold text-xs tracking-wider uppercase text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            Now Playing Info
          </h3>
          <button
            onClick={() => setIsInfoSidebarOpen(false)}
            className="text-neutral-400 hover:text-white text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* Big Album Art */}
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-2xl ring-1 ring-white/10">
          <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Song Info */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-white leading-snug">{currentTrack.title}</h2>
          <p className="text-xs text-neutral-400 font-medium mt-1">{currentTrack.artist}</p>
        </div>

        {/* Artist Profile Card */}
        <div className="bg-[#12131f] border border-white/10 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase text-pink-400 font-bold">About The Artist</span>
            <button
              onClick={() => toggleFollowArtist(currentTrack.artist)}
              className={`text-[10px] px-3 py-1 rounded-full font-bold transition ${
                isFollowed
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {isFollowed ? 'Following' : 'Follow'}
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <img src={currentTrack.thumbnail} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-500/30" />
            <div>
              <h4 className="text-xs font-bold text-white">{currentTrack.artist}</h4>
              <p className="text-[10px] text-neutral-400">Verified Music Artist</p>
            </div>
          </div>
        </div>

        {/* Release Metadata */}
        <div className="space-y-2 text-xs bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between">
            <span className="text-neutral-500">Album</span>
            <span className="text-neutral-300 font-medium truncate max-w-[140px]">{currentTrack.album || 'Single'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Release Date</span>
            <span className="text-neutral-300 font-mono">{currentTrack.releaseDate || '2024'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Genre</span>
            <span className="text-neutral-300">{currentTrack.genre || 'Indie / Pop'}</span>
          </div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-center text-neutral-500 pt-4">
        Kymatix Audio Matrix v3.0
      </div>
    </aside>
  );
}