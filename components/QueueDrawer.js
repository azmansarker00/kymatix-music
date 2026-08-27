'use client';

import React, { useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { X, Play, Trash2, Sparkles, ListPlus, Radio, FolderHeart } from 'lucide-react';

export default function QueueDrawer() {
  const {
    userQueue,
    autoQueue,
    playbackContext,
    isQueueOpen,
    setIsQueueOpen,
    removeFromUserQueue,
    clearUserQueue,
    playTrack,
    fetchMoreQueueTracks,
    currentTrack
  } = usePlayer();

  const scrollContainerRef = useRef(null);

  if (!isQueueOpen) return null;

  // Infinite Scroll Trigger when reaching the bottom
  const handleScroll = (e) => {
    const target = e.target;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      fetchMoreQueueTracks();
    }
  };

  const isPlaylistMode = playbackContext.type === 'playlist';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#0f1017]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl z-50 p-5 flex flex-col justify-between animate-in slide-in-from-right duration-300 select-none">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="font-semibold text-xs tracking-wider uppercase text-neutral-200">
              {isPlaylistMode ? 'Playlist Queue' : 'Station Queue'}
            </h3>
          </div>
          <button
            onClick={() => setIsQueueOpen(false)}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable Queue Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto no-scrollbar space-y-5 pr-1"
        >
          {/* 1. NOW PLAYING */}
          {currentTrack && (
            <div>
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase mb-2 block font-semibold">
                Now Playing
              </span>
              <div className="flex items-center space-x-3 p-2.5 bg-white/5 border border-white/10 rounded-xl">
                <img src={currentTrack.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="truncate flex-1">
                  <h4 className="text-xs font-semibold text-white truncate">{currentTrack.title}</h4>
                  <p className="text-[10px] text-neutral-400 truncate">{currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. USER MANUAL QUEUE (TOP PRIORITY) */}
          {userQueue.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase flex items-center gap-1 font-semibold">
                  <ListPlus size={12} className="text-indigo-400" /> Next In Queue ({userQueue.length})
                </span>
                <button
                  onClick={clearUserQueue}
                  className="text-[10px] font-medium text-neutral-500 hover:text-rose-400 uppercase flex items-center gap-1 transition"
                >
                  <Trash2 size={11} /> Clear
                </button>
              </div>

              <div className="space-y-1.5">
                {userQueue.map((track, idx) => (
                  <div
                    key={`user-${idx}`}
                    className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition"
                  >
                    <div
                      className="flex items-center space-x-3 truncate cursor-pointer flex-1"
                      onClick={() => {
                        playTrack(track, { isPlaylist: isPlaylistMode, trackList: playbackContext.list });
                        removeFromUserQueue(idx);
                      }}
                    >
                      <img src={track.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div className="truncate">
                        <h5 className="text-xs font-medium text-neutral-200 truncate group-hover:text-indigo-400">{track.title}</h5>
                        <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromUserQueue(idx)}
                      className="text-neutral-500 hover:text-rose-400 p-1.5 transition"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. AUTO QUEUE (PLAYLIST TRACKS OR INFINITE RADIO STREAMS) */}
          <div>
            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mb-2 flex items-center gap-1.5 font-semibold">
              {isPlaylistMode ? (
                <>
                  <FolderHeart size={12} className="text-indigo-400" /> Next In Playlist ({autoQueue.length})
                </>
              ) : (
                <>
                  <Sparkles size={11} className="text-amber-400" /> Next From Station ({autoQueue.length})
                </>
              )}
            </span>

            <div className="space-y-1.5">
              {autoQueue.length === 0 ? (
                <p className="text-neutral-600 text-xs text-center py-6 font-mono">
                  {isPlaylistMode ? 'END OF PLAYLIST.' : 'LOADING MORE TRACKS...'}
                </p>
              ) : (
                autoQueue.map((track, idx) => (
                  <div
                    key={`auto-${idx}`}
                    className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition"
                  >
                    <div
                      className="flex items-center space-x-3 truncate cursor-pointer flex-1"
                      onClick={() => playTrack(track, { isPlaylist: isPlaylistMode, trackList: playbackContext.list })}
                    >
                      <span className="w-4 text-center text-[10px] font-mono text-neutral-500">{idx + 1}</span>
                      <img src={track.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div className="truncate">
                        <h5 className="text-xs font-medium text-neutral-300 truncate group-hover:text-indigo-400">{track.title}</h5>
                        <p className="text-[10px] text-neutral-500 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <div
                      onClick={() => playTrack(track, { isPlaylist: isPlaylistMode, trackList: playbackContext.list })}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white cursor-pointer transition"
                    >
                      <Play size={12} className="fill-current" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-neutral-500 text-center uppercase pt-3 border-t border-white/10">
        {isPlaylistMode ? 'Playing sequential playlist tracks' : 'Scroll down to load more recommendations'}
      </div>
    </div>
  );
}