'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { X, Play, Trash2, Sparkles, ListPlus, FolderHeart, User, Loader2 } from 'lucide-react';

export default function QueueDrawer() {
  const {
    userQueue = [],
    autoQueue = [],
    playbackContext = { type: 'station', list: [] },
    isQueueOpen,
    setIsQueueOpen,
    removeFromUserQueue,
    clearUserQueue,
    playTrack,
    currentTrack
  } = usePlayer() || {};

  const [stationTracks, setStationTracks] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const scrollContainerRef = useRef(null);

  const isPlaylistMode = playbackContext?.type === 'playlist';
  const isArtistMode = playbackContext?.type === 'artist';
  const isStrictContext = isPlaylistMode || isArtistMode;

  // 1. Initial Diverse Fetch for Station Mode
  useEffect(() => {
    if (!currentTrack || !isQueueOpen || isStrictContext) return;

    const fetchDiverseStation = async () => {
      try {
        // Diversified Query: Related genre/mix instead of purely the single artist name
        const cleanTitle = (currentTrack.title || '').replace(/\(.*?\)/g, '').trim();
        const artist = currentTrack.artist || '';
        
        // Multi-keyword mix query for variety across artists
        const mixQueries = [
          `${cleanTitle} songs`,
          `${artist} bangla rock indie acoustic`,
          `Bangla band trending hits radio`,
          `Coke studio bangla hits`
        ];

        const randomQuery = mixQueries[Math.floor(Math.random() * mixQueries.length)];
        const res = await fetch(`/api/search?q=${encodeURIComponent(randomQuery)}`);
        const data = await res.json();

        if (Array.isArray(data.tracks)) {
          // Filter out current track and shuffle slightly for variety
          const filtered = data.tracks
            .filter(t => t.id !== currentTrack.id)
            .sort(() => Math.random() - 0.3); // Partial randomized shuffle
          setStationTracks(filtered);
        }
      } catch {
        setStationTracks([]);
      }
    };

    fetchDiverseStation();
    setPage(1);
  }, [currentTrack, isQueueOpen, isStrictContext]);

  if (!isQueueOpen) return null;

  let contextList = [];
  if (isStrictContext) {
    contextList = (playbackContext.list || autoQueue).filter(t => t.id !== currentTrack?.id);
  } else {
    contextList = stationTracks.length > 0 ? stationTracks : autoQueue.filter(t => t.id !== currentTrack?.id);
  }

  // 2. Real API Load More (+15 Multi-Artist Diverse Tracks)
  const handleLoadMore = async () => {
    if (isLoadingMore || isStrictContext) return;
    setIsLoadingMore(true);

    try {
      const nextPage = page + 1;
      const seedKeywords = [
        'Bangla rock band hits',
        'Top indie acoustic songs',
        'Coke Studio bangla playlist',
        'Viral bangla tracks',
        'Trending south asian indie'
      ];
      const searchSeed = seedKeywords[nextPage % seedKeywords.length];

      const res = await fetch(`/api/search?q=${encodeURIComponent(searchSeed)}`);
      const data = await res.json();

      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        const newBatch = data.tracks.slice(0, 15);
        setStationTracks(prev => {
          const combined = [...prev, ...newBatch];
          const seen = new Set();
          return combined.filter(item => {
            if (item.id === currentTrack?.id) return false;
            const isDuplicate = seen.has(item.id);
            seen.add(item.id);
            return !isDuplicate;
          });
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Queue load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-96 z-[99999] bg-[#0F1016]/95 backdrop-blur-[40px] saturate-[200%] border-l border-white/10 shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-300 select-none">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#571BC1] animate-pulse" />
          <h3 className="font-semibold text-xs tracking-wider uppercase text-white font-mono">
            {isPlaylistMode ? 'Playlist Queue' : isArtistMode ? 'Artist Discography' : 'Station Queue'}
          </h3>
        </div>
        <button
          onClick={() => setIsQueueOpen && setIsQueueOpen(false)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. Scrollable Queue Body */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll overflow-x-hidden pr-1 space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      >
        {/* NOW PLAYING */}
        {currentTrack && (
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#FFB3B6] uppercase mb-2 block font-semibold">
              Now Playing
            </span>
            <div className="flex items-center space-x-3 p-3 bg-white/10 border border-white/15 rounded-2xl shadow-md backdrop-blur-md">
              <img 
                src={currentTrack.thumbnail || currentTrack.cover} 
                alt="" 
                className="w-11 h-11 rounded-xl object-cover shadow" 
              />
              <div className="truncate flex-1">
                <h4 className="text-xs font-semibold text-white truncate">{currentTrack.title}</h4>
                <p className="text-[11px] text-white/60 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        {/* USER MANUAL QUEUE */}
        {userQueue.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono tracking-widest text-white/70 uppercase flex items-center gap-1 font-semibold">
                <ListPlus size={12} className="text-[#00F2FE]" /> User Queue ({userQueue.length})
              </span>
              <button
                onClick={() => clearUserQueue && clearUserQueue()}
                className="text-[10px] font-medium text-white/40 hover:text-rose-400 uppercase flex items-center gap-1 transition"
              >
                <Trash2 size={11} /> Clear
              </button>
            </div>

            <div className="space-y-1.5">
              {userQueue.map((track, idx) => (
                <div
                  key={`user-${idx}`}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200"
                >
                  <div
                    className="flex items-center space-x-3 truncate cursor-pointer flex-1"
                    onClick={() => {
                      if (playTrack) playTrack(track, { isPlaylist: isStrictContext, trackList: playbackContext?.list });
                      if (removeFromUserQueue) removeFromUserQueue(idx);
                    }}
                  >
                    <img src={track.thumbnail || track.cover} alt="" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
                    <div className="truncate">
                      <h5 className="text-xs font-medium text-white truncate group-hover:text-[#FFB3B6]">{track.title}</h5>
                      <p className="text-[10px] text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromUserQueue && removeFromUserQueue(idx)}
                    className="text-white/40 hover:text-rose-400 p-1.5 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEXT FROM STATION / DIVERSE ARTISTS */}
        <div>
          <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase mb-2 flex items-center gap-1.5 font-semibold">
            {isPlaylistMode ? (
              <>
                <FolderHeart size={12} className="text-[#571BC1]" /> Next In Playlist ({contextList.length})
              </>
            ) : isArtistMode ? (
              <>
                <User size={12} className="text-[#00F2FE]" /> More By Artist ({contextList.length})
              </>
            ) : (
              <>
                <Sparkles size={11} className="text-amber-400" /> Next From Station ({contextList.length})
              </>
            )}
          </span>

          <div className="space-y-1.5">
            {contextList.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-6 font-mono">
                {isStrictContext ? 'NO MORE TRACKS IN THIS CONTEXT.' : 'FETCHING STATION TRACKS...'}
              </p>
            ) : (
              contextList.map((track, idx) => (
                <div
                  key={`track-${track.id || idx}`}
                  className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200"
                >
                  <div
                    className="flex items-center space-x-3 truncate cursor-pointer flex-1"
                    onClick={() => playTrack && playTrack(track, { isPlaylist: isStrictContext, trackList: isStrictContext ? playbackContext?.list : contextList })}
                  >
                    <span className="w-5 text-center text-[11px] font-mono text-white/40 group-hover:hidden">
                      {idx + 1}
                    </span>
                    <Play size={12} className="w-5 text-center text-[#00F2FE] hidden group-hover:inline fill-current" />
                    
                    <img src={track.thumbnail || track.cover} alt="" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
                    <div className="truncate">
                      <h5 className="text-xs font-medium text-white/90 truncate group-hover:text-[#FFB3B6]">{track.title}</h5>
                      <p className="text-[10px] text-white/40 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <div
                    onClick={() => playTrack && playTrack(track, { isPlaylist: isStrictContext, trackList: isStrictContext ? playbackContext?.list : contextList })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-white cursor-pointer transition"
                  >
                    <Play size={13} className="fill-current" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button for Station Mode */}
          {!isStrictContext && (
            <div className="pt-4 pb-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95"
              >
                {isLoadingMore ? (
                  <><Loader2 size={14} className="animate-spin text-[#00F2FE]" /> <span>Loading +15 Tracks...</span></>
                ) : (
                  <span>Load More Tracks (+15)</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <div className="text-[10px] font-mono text-white/40 text-center uppercase pt-3 border-t border-white/10">
        {isPlaylistMode 
          ? 'Sequential playlist playback' 
          : isArtistMode 
          ? 'Playing selected artist discography' 
          : 'Infinite AI station recommendations'}
      </div>
    </aside>
  );
}