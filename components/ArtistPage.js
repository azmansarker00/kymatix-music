'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Play, Heart, Plus, ArrowLeft, Check, Sparkles } from 'lucide-react';

function formatDuration(sec) {
  if (!sec) return '3:45';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ArtistPage({ artistName, onBack }) {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    followedArtists,
    toggleFollowArtist,
    likedSongs,
    toggleLike,
    addToQueue
  } = usePlayer();

  const [artistData, setArtistData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popular');

  const isFollowed = followedArtists.includes(artistName);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(artistName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setArtistData(data.artistSpotlight || {
          name: artistName,
          image: data.tracks?.[0]?.thumbnail || '',
          monthlyListeners: '3,450,210',
          genre: 'Alternative / Rock / Pop'
        });
        setTracks(data.tracks || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [artistName]);

  const sortedTracks = useMemo(() => {
    let list = [...tracks];
    if (sortBy === 'popular') list.sort((a, b) => (b.popularityIndex || 0) - (a.popularityIndex || 0));
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.releaseDate || '2020') - new Date(a.releaseDate || '2020'));
    else if (sortBy === 'oldest') list.sort((a, b) => new Date(a.releaseDate || '2020') - new Date(b.releaseDate || '2020'));
    else if (sortBy === 'duration') list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    return list;
  }, [tracks, sortBy]);

  const handlePlayArtistTrack = (track) => {
    // Passes context indicating this is strictly from Artist Page
    playTrack(track, {
      isArtistPage: true,
      trackList: sortedTracks,
      artist: artistName
    });
  };

  return (
    <div className="min-h-full pb-36 animate-in fade-in duration-300">
      
      <button
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft size={14} />
        <span>Back to Explore</span>
      </button>

      {/* Artist Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-[#13151f] border border-white/10 p-8 sm:p-10 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <img
            src={artistData?.image || tracks[0]?.thumbnail}
            alt={artistName}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border border-white/10 shadow-2xl"
          />
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
                <Sparkles size={10} /> Verified Artist
              </span>
              <span className="text-xs text-neutral-500">{artistData?.genre}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-neutral-100">{artistName}</h1>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              {artistData?.monthlyListeners || '2,890,110'} Monthly Listeners
            </p>

            <div className="flex items-center justify-center md:justify-start gap-3 mt-5">
              <button
                onClick={() => sortedTracks[0] && handlePlayArtistTrack(sortedTracks[0])}
                className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center font-bold hover:bg-white hover:scale-105 active:scale-95 transition shadow-lg"
              >
                <Play size={18} className="translate-x-0.5 fill-current" />
              </button>

              <button
                onClick={() => toggleFollowArtist(artistName)}
                className={`px-5 py-2 rounded-full font-semibold text-xs tracking-wider flex items-center gap-1.5 transition ${
                  isFollowed
                    ? 'bg-white/10 text-neutral-200 border border-white/10'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isFollowed ? <><Check size={13} /> Following</> : '+ Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discography Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <h2 className="text-xs font-semibold tracking-widest text-neutral-300 uppercase">
          Discography ({sortedTracks.length})
        </h2>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[#141620] text-xs text-neutral-300 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest Releases</option>
          <option value="oldest">Oldest Releases</option>
          <option value="duration">Track Duration</option>
        </select>
      </div>

      {/* Track List */}
      {loading ? (
        <div className="space-y-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sortedTracks.length === 0 ? (
        <p className="text-neutral-500 text-xs font-mono py-12 text-center">NO TRACKS AVAILABLE.</p>
      ) : (
        <div className="space-y-1.5">
          {sortedTracks.map((track, idx) => {
            const active = currentTrack?.id === track.id;
            const isLiked = likedSongs.some((t) => t.id === track.id);

            return (
              <div
                key={track.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition ${
                  active
                    ? 'bg-white/[0.08] border-white/20'
                    : 'bg-[#11131a]/60 border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className="flex items-center space-x-3.5 flex-1 cursor-pointer truncate"
                  onClick={() => (active ? togglePlay() : handlePlayArtistTrack(track))}
                >
                  <span className="w-5 text-center text-xs font-mono text-neutral-500">
                    {active && isPlaying ? <Play size={12} className="text-indigo-400 inline fill-current" /> : idx + 1}
                  </span>
                  <img src={track.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="truncate">
                    <h4 className={`text-xs font-medium truncate ${active ? 'text-indigo-300 font-semibold' : 'text-neutral-200'}`}>
                      {track.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 truncate">{track.album || 'Single'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-neutral-400 font-mono">
                  <button
                    onClick={() => toggleLike(track)}
                    className="text-neutral-500 hover:text-rose-500 transition"
                  >
                    <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                  <button
                    onClick={() => addToQueue(track)}
                    className="text-neutral-500 hover:text-indigo-400 transition"
                    title="Add to Queue"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-[11px]">{formatDuration(track.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}