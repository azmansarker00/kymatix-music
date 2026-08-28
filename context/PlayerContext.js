'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

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
  const keepAliveAudio = useRef(null); // ব্যাকগ্রাউন্ড প্রসেস বাঁচিয়ে রাখার সাইলেন্ট অডিও অ্যাঙ্কর

  const saveState = (key, val) => {
    try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch {}
  };

  // ১. নেটিভ অডিও ইঞ্জিন এবং ব্যাকগ্রাউন্ড কিপ-অ্যালাইভ ইনিশিয়ালাইজেশন
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

      // ব্যাকগ্রাউন্ডে অ্যান্ড্রয়েড যাতে প্রসেস কিল না করে তার জন্য সাইলেন্ট অডিও লুপ সেটআপ
      keepAliveAudio.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      keepAliveAudio.current.loop = true;

      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

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

  // ২. অ্যান্ড্রয়েড লকস্ক্রিন এবং নোটিফিকেশন বার কন্ট্রোল (MediaSession API)
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'KYMATIX Track',
        artist: currentTrack.artist || 'KYMATIX Studio',
        album: 'KYMATIX Studio Stream',
        artwork: [
          { src: currentTrack.thumbnail || '', sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || '', sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    } catch (e) {
      console.error("MediaSession error:", e);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // ৩. লোকাল এপিআই রাউট থেকে স্ট্রিম ফেচ করার সঠিক ফাংশন
  const fetchAudioDirectUrl = async (videoId) => {
    try {
      const res = await fetch(`/api/stream?videoId=${videoId}`);
      const data = await res.json();
      if (data.success && data.streamUrl) {
        return data.streamUrl;
      }
    } catch (e) {
      console.error("Local API Stream fetch error:", e);
    }
    return `https://invidious.snopyta.org/latest_version?id=${videoId}&itag=140`;
  };

  const playTrack = async (track, context = {}) => {
    if (!track?.videoId) return;

    // ব্যাকগ্রাউন্ড প্রসেস ফোরগ্রাউন্ডে রাখার জন্য সাইলেন্ট অডিও প্লে করা
    if (keepAliveAudio.current) {
      keepAliveAudio.current.play().catch(() => {});
    }

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
      console.error("Failed to load audio stream:", e);
    }
  };

  const handleNext = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
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
      if (keepAliveAudio.current) keepAliveAudio.current.pause();
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (keepAliveAudio.current) keepAliveAudio.current.play().catch(() => {});
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

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