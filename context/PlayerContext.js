'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { MusicControls } from 'capacitor-music-controls-plugin';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');

  const [theme, setTheme] = useState('dark');
  const [viewLayout, setViewLayout] = useState('grid');
  const [is2GMode, setIs2GMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [userQueue, setUserQueue] = useState([]);
  const [autoQueue, setAutoQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyRetention, setHistoryRetention] = useState('never');
  const [likedSongs, setLikedSongs] = useState([]);
  const [followedArtists, setFollowedArtists] = useState([]);
  const [playlists, setPlaylists] = useState([
    { id: 'fav-1', name: 'Chill Vibes', tracks: [] },
    { id: 'fav-2', name: 'Daily Hot Matrix', tracks: [] }
  ]);
  const [recentQueries, setRecentQueries] = useState(['Trending Bangla', 'Coke Studio', 'Odd Signature']);

  const [playbackContext, setPlaybackContext] = useState({ type: 'feed', sourceId: null, list: [] });

  const audioRef = useRef(null);

  const saveState = (key, val) => {
    try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch {}
  };

  // ১. অডিও ইঞ্জিন সেটআপ
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audio.preload = 'auto';

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => handleNext();
      
      audioRef.current = audio;
    }
    // Storage load logics...
    try {
      const savedQueue = localStorage.getItem('kymatix_user_queue');
      if (savedQueue) setUserQueue(JSON.parse(savedQueue));
      const savedTrack = localStorage.getItem('kymatix_last_track');
      if (savedTrack) setCurrentTrack(JSON.parse(savedTrack));
    } catch {}
  }, []);

  useEffect(() => {
    if (currentTime > 0 && currentTrack) {
      saveState('kymatix_playback_time', currentTime);
    }
  }, [currentTime, currentTrack]);

  // ডাইনামিক ফাংশন রেফারেন্স (নেটিভ ইভেন্ট লিসেনারের জন্য)
  const controlsRef = useRef({ togglePlay: () => {}, handleNext: () => {}, handlePrevious: () => {} });
  
  // ২. নেটিভ ইভেন্ট লিসেনার (লকস্ক্রিন থেকে প্লে/পজ/নেক্সট রিসিভ করা)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const sub = MusicControls.addListener('controlsNotification', (info) => {
        const action = info.message;
        if (action === 'music-controls-play' || action === 'music-controls-pause' || action === 'music-controls-toggle-play-pause') {
          controlsRef.current.togglePlay();
        } else if (action === 'music-controls-next') {
          controlsRef.current.handleNext();
        } else if (action === 'music-controls-previous') {
          controlsRef.current.handlePrevious();
        }
      });
      return () => { if (sub && sub.remove) sub.remove(); };
    }
  }, []);

  // ৩. নেটিভ ফোরগ্রাউন্ড সার্ভিস ও লকস্ক্রিন নোটিফিকেশন আপডেট
  useEffect(() => {
    if (!currentTrack) return;

    if (Capacitor.isNativePlatform()) {
      MusicControls.create({
        track: currentTrack.title || 'Unknown Track',
        artist: currentTrack.artist || 'KYMATIX Studio',
        cover: currentTrack.thumbnail || '',
        isPlaying: isPlaying,
        dismissable: false, // গান চললে নোটিফিকেশন সোয়াইপ করে কাটা যাবে না
        hasPrev: true,
        hasNext: true,
        hasClose: false,
        album: 'KYMATIX App',
        ticker: `Playing: ${currentTrack.title}`
      }).catch(err => console.error('MusicControls Error:', err));
    } else if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      // ওয়েবের জন্য ফলব্যাক
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: [{ src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }]
      });
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
    }
  }, [currentTrack]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      MusicControls.updateIsPlaying({ isPlaying }).catch(() => {});
    } else if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const fetchAudioDirectUrl = async (videoId) => {
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.privacydev.net',
      'https://piped-api.lunar.icu'
    ];

    for (const base of pipedInstances) {
      try {
        const res = await fetch(`${base}/streams/${videoId}`, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        const audioStreams = data.audioStreams || [];
        const best = audioStreams.find(s => s.itag === 140 || s.quality === '128 kbps')
                  || audioStreams.find(s => s.mimeType?.includes('audio'))
                  || audioStreams[0];
        if (best?.url) return best.url;
      } catch {}
    }
    return `https://invidious.snopyta.org/latest_version?id=${videoId}&itag=140`;
  };

  const playTrack = async (track, context = {}) => {
    if (!track?.videoId) return;

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(track.duration || 240);
    saveState('kymatix_last_track', track);
    
    setPlaybackContext({ type: context.isPlaylist ? 'playlist' : 'feed', sourceId: null, list: [] });

    try {
      const streamUrl = await fetchAudioDirectUrl(track.videoId);
      if (audioRef.current && streamUrl) {
        audioRef.current.src = streamUrl;
        audioRef.current.volume = isMuted ? 0 : volume / 100;
        audioRef.current.play().catch(err => console.error("Play error:", err));
      }
    } catch (e) {
      console.error("Failed to load pure audio stream:", e);
    }
  };

  const handleNext = () => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current?.play();
      return;
    }
    if (userQueue.length > 0) {
      const nextIndex = isShuffle ? Math.floor(Math.random() * userQueue.length) : 0;
      const next = userQueue[nextIndex];
      setUserQueue(userQueue.filter((_, i) => i !== nextIndex));
      playTrack(next);
    }
  };

  const handlePrevious = () => {
    if (currentTime > 4) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // আপডেট রেফারেন্স
  useEffect(() => {
    controlsRef.current = { togglePlay, handleNext, handlePrevious };
  }, [togglePlay, handleNext, handlePrevious]);

  const seek = (time) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (val) => {
    const v = parseInt(val, 10);
    setVolume(v);
    setIsMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v / 100;
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      changeVolume(volume || 50);
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, isPlaying, currentTime, duration, volume, isMuted, isShuffle, repeatMode,
        is2GMode, theme, viewLayout, isSettingsOpen, userQueue, autoQueue, playbackContext,
        history, historyRetention, likedSongs, followedArtists, playlists, recentQueries,
        setIsSettingsOpen, setIs2GMode, setIsShuffle: (v) => setIsShuffle(v),
        toggleShuffle: () => setIsShuffle(!isShuffle),
        setRepeatMode: (m) => setRepeatMode(m),
        toggleRepeat: () => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off'),
        playTrack, handleNext, handlePrevious, handlePrev: handlePrevious, togglePlay, seek, seekTo: seek,
        changeVolume, toggleMute,
        addToQueue: (t) => setUserQueue((prev) => [...prev, t]),
        removeFromUserQueue: (idx) => setUserQueue((prev) => prev.filter((_, i) => i !== idx)),
        clearUserQueue: () => setUserQueue([]),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);