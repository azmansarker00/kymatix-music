'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

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

  // Queue Architecture
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
  const [recentQueries, setRecentQueries] = useState(['Trending Bangla', 'Coke Studio', 'Odd Signature', 'Habib Wahid']);

  const [lyrics, setLyrics] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); 
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [playbackContext, setPlaybackContext] = useState({ type: 'feed', sourceId: null, list: [] });

  const primaryPlayerRef = useRef(null);
  const timerRef = useRef(null);
  const keepAliveAudio = useRef(null);

  const saveState = (key, val) => {
    try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch {}
  };

  const cleanExpiredHistory = (loadedHistory, retentionPeriod) => {
    if (!retentionPeriod || retentionPeriod === 'never') return loadedHistory;
    const now = Date.now();
    const daysMap = {
      '1day': 1 * 24 * 60 * 60 * 1000,
      '7days': 7 * 24 * 60 * 60 * 1000,
      '30days': 30 * 24 * 60 * 60 * 1000,
      '365days': 365 * 24 * 60 * 60 * 1000,
    };
    const maxAge = daysMap[retentionPeriod];
    if (!maxAge) return loadedHistory;
    return loadedHistory.filter((item) => now - (item.playedAt || now) <= maxAge);
  };

  // ১. Restore Persistent Session on Initial Load
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        keepAliveAudio.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        keepAliveAudio.current.loop = true;
      }

      const savedTheme = localStorage.getItem('kymatix_theme');
      if (savedTheme) setTheme(savedTheme);

      const savedLayout = localStorage.getItem('kymatix_layout');
      if (savedLayout) setViewLayout(savedLayout);

      const savedRetention = localStorage.getItem('kymatix_history_retention');
      if (savedRetention) setHistoryRetention(savedRetention);

      const savedHistory = localStorage.getItem('kymatix_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        const cleaned = cleanExpiredHistory(parsed, savedRetention || 'never');
        setHistory(cleaned);
        saveState('kymatix_history', cleaned);
      }

      const savedLikes = localStorage.getItem('kymatix_likes');
      if (savedLikes) setLikedSongs(JSON.parse(savedLikes));

      const savedFollows = localStorage.getItem('kymatix_follows');
      if (savedFollows) setFollowedArtists(JSON.parse(savedFollows));

      const savedPlaylists = localStorage.getItem('kymatix_playlists');
      if (savedPlaylists) setPlaylists(JSON.parse(savedPlaylists));

      const savedShuffle = localStorage.getItem('kymatix_shuffle');
      if (savedShuffle !== null) setIsShuffle(savedShuffle === 'true');

      const savedRepeat = localStorage.getItem('kymatix_repeat');
      if (savedRepeat) setRepeatMode(savedRepeat);

      const savedVolume = localStorage.getItem('kymatix_volume');
      if (savedVolume !== null) setVolume(parseInt(savedVolume, 10));

      const savedQueue = localStorage.getItem('kymatix_user_queue');
      if (savedQueue) setUserQueue(JSON.parse(savedQueue));

      const savedTrack = localStorage.getItem('kymatix_last_track');
      const savedTime = localStorage.getItem('kymatix_playback_time');
      if (savedTrack) {
        const parsedTrack = JSON.parse(savedTrack);
        setCurrentTrack(parsedTrack);
        setDuration(parsedTrack.duration || 240);
        if (savedTime) {
          const parsedTime = parseFloat(savedTime);
          setCurrentTime(parsedTime);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (currentTime > 0 && currentTrack) {
      saveState('kymatix_playback_time', currentTime);
    }
  }, [currentTime, currentTrack]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (currentTrack && isPlaying) {
      document.title = `▶ ${currentTrack.title} • ${currentTrack.artist} | KYMATIX STUDIO`;
    } else if (currentTrack) {
      document.title = `❚❚ ${currentTrack.title} • ${currentTrack.artist} | KYMATIX STUDIO`;
    } else {
      document.title = 'KYMATIX STUDIO';
    }
  }, [currentTrack, isPlaying]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    saveState('kymatix_theme', newTheme);
  };

  const toggleLayout = (newLayout) => {
    setViewLayout(newLayout);
    saveState('kymatix_layout', newLayout);
  };

  const changeHistoryRetention = (period) => {
    setHistoryRetention(period);
    saveState('kymatix_history_retention', period);
    const cleaned = cleanExpiredHistory(history, period);
    setHistory(cleaned);
    saveState('kymatix_history', cleaned);
  };

  const clearHistoryNow = () => {
    setHistory([]);
    saveState('kymatix_history', []);
  };

  // 2. MediaSession API (লকস্ক্রিন কন্ট্রোল)
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'KYMATIX Track',
        artist: currentTrack.artist || 'KYMATIX Studio',
        album: currentTrack.album || 'KYMATIX Stream',
        artwork: [
          { src: currentTrack.thumbnail || currentTrack.cover || '', sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnail || currentTrack.cover || '', sizes: '512x512', type: 'image/jpeg' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    } catch {}
  }, [currentTrack, duration, currentTime]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // 3. YouTube Hidden Engine Loader
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  }, []);

  // 4. THE MAGIC: Background Mode Setup (স্ক্রিন অফ হলেও গান চলবে)
  useEffect(() => {
    const setupBackgroundMode = () => {
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
        const bgMode = window.cordova.plugins.backgroundMode;
        bgMode.enable();
        
        bgMode.setDefaults({
          title: 'KYMATIX Studio',
          text: 'Playing music in background...',
          hidden: true,
          silent: true
        });

        // ফোন লক হলে বা অ্যাপ মিনিমাইজ হলে WebView-কে পজ হতে বাধা দেবে
        bgMode.on('activate', () => {
          bgMode.disableWebViewOptimizations();
        });
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('deviceready', setupBackgroundMode, false);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('deviceready', setupBackgroundMode, false);
      }
    };
  }, []);

  const populateAutoQueue = async (seedTrack, context = {}) => {
    try {
      if (context.isPlaylist && Array.isArray(context.trackList)) {
        const currentIndex = context.trackList.findIndex((t) => t.id === seedTrack.id);
        const remaining = currentIndex !== -1 ? context.trackList.slice(currentIndex + 1) : context.trackList.filter(t => t.id !== seedTrack.id);
        setAutoQueue(remaining);
        return;
      }

      if (context.isArtistPage && Array.isArray(context.trackList)) {
        const currentIndex = context.trackList.findIndex((t) => t.id === seedTrack.id);
        const remaining = currentIndex !== -1 ? context.trackList.slice(currentIndex + 1) : context.trackList.filter(t => t.id !== seedTrack.id);
        setAutoQueue(remaining.slice(0, 15));
        return;
      }

      let combinedQueue = [];
      if (Array.isArray(context.trackList) && context.trackList.length > 1) {
        const currentIndex = context.trackList.findIndex((t) => t.id === seedTrack.id);
        if (currentIndex !== -1) {
          combinedQueue = [...context.trackList.slice(currentIndex + 1)];
        }
      }

      if (combinedQueue.length < 10) {
        const genreTerm = seedTrack.genre || 'Popular Music';
        const res = await fetch(`/api/search?q=${encodeURIComponent(genreTerm + ' radio hits')}`);
        const data = await res.json();
        const raw = data.tracks || [];
        const newTracks = raw.filter((t) => t.id !== seedTrack.id && !combinedQueue.some((q) => q.id === t.id));
        combinedQueue = [...combinedQueue, ...newTracks];
      }

      setAutoQueue(combinedQueue.slice(0, 10));
    } catch {}
  };

  const fetchMoreQueueTracks = async () => {
    if (playbackContext.type === 'playlist') return;
    try {
      const seed = currentTrack?.artist || 'Trending Music';
      const res = await fetch(`/api/search?q=${encodeURIComponent(seed + ' recommendations')}`);
      const data = await res.json();
      const newItems = (data.tracks || []).filter(
        (t) => t.id !== currentTrack?.id && !autoQueue.some((q) => q.id === t.id)
      );
      setAutoQueue((prev) => [...prev, ...newItems.slice(0, 10)]);
    } catch {}
  };

  const playTrack = (track, context = {}) => {
    if (!track?.videoId) return;

    // সাইলেন্ট অডিও চালিয়ে সিস্টেমকে জাগ্রত রাখা
    if (keepAliveAudio.current) {
      keepAliveAudio.current.play().catch(() => {});
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(track.duration || 240);
    saveState('kymatix_last_track', track);
    saveState('kymatix_playback_time', 0);

    setPlaybackContext({
      type: context.isPlaylist ? 'playlist' : context.isArtistPage ? 'artist' : 'feed',
      sourceId: context.playlistId || null,
      list: context.trackList || []
    });

    const trackWithTime = { ...track, playedAt: Date.now() };
    setHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [trackWithTime, ...filtered].slice(0, 100);
      const cleaned = cleanExpiredHistory(updated, historyRetention);
      saveState('kymatix_history', cleaned);
      return cleaned;
    });

    populateAutoQueue(track, context);

    setLyrics('');
    fetch(`/api/lyrics?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}&videoId=${track.videoId}`)
      .then((res) => res.json())
      .then((data) => setLyrics(data.lyrics || 'No synchronized lyrics available.'))
      .catch(() => setLyrics(''));

    const targetQuality = is2GMode ? 'small' : 'medium';

    if (!primaryPlayerRef.current && window.YT && window.YT.Player) {
      primaryPlayerRef.current = new window.YT.Player('kymatix-primary-engine', {
        height: '100',
        width: '100',
        videoId: track.videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0 },
        events: {
          onReady: (e) => {
            e.target.setPlaybackQuality?.(targetQuality);
            e.target.setVolume(isMuted ? 0 : volume);
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              const realDur = e.target.getDuration();
              if (realDur) setDuration(Math.round(realDur));
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              handleNext();
            }
          },
        },
      });
    } else if (primaryPlayerRef.current?.loadVideoById) {
      primaryPlayerRef.current.loadVideoById({
        videoId: track.videoId,
        suggestedQuality: targetQuality
      });
      primaryPlayerRef.current.setVolume(isMuted ? 0 : volume);
      primaryPlayerRef.current.playVideo();
    }
  };

  const handleNext = () => {
    if (repeatMode === 'one') {
      seek(0);
      return;
    }
    if (userQueue.length > 0) {
      const nextIndex = isShuffle ? Math.floor(Math.random() * userQueue.length) : 0;
      const next = userQueue[nextIndex];
      const updatedQueue = userQueue.filter((_, i) => i !== nextIndex);
      setUserQueue(updatedQueue);
      saveState('kymatix_user_queue', updatedQueue);
      playTrack(next, { isPlaylist: playbackContext.type === 'playlist', trackList: playbackContext.list });
      return;
    }
    if (autoQueue.length > 0) {
      const nextIndex = isShuffle ? Math.floor(Math.random() * autoQueue.length) : 0;
      const next = autoQueue[nextIndex];
      setAutoQueue((prev) => prev.filter((_, i) => i !== nextIndex));
      playTrack(next, { isPlaylist: playbackContext.type === 'playlist', trackList: playbackContext.list });
    }
  };

  const handlePrevious = () => {
    if (currentTime > 4) {
      seek(0);
    } else if (history.length > 1) {
      playTrack(history[1]);
    } else {
      seek(0);
    }
  };

  const togglePlay = () => {
    if (!primaryPlayerRef.current) {
      if (currentTrack) {
        playTrack(currentTrack);
      }
      return;
    }
    if (isPlaying) {
      if (keepAliveAudio.current) keepAliveAudio.current.pause();
      primaryPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      if (keepAliveAudio.current) keepAliveAudio.current.play().catch(() => {});
      primaryPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const seek = (time) => {
    if (!primaryPlayerRef.current?.seekTo) return;
    primaryPlayerRef.current.seekTo(time, true);
    setCurrentTime(time);
    saveState('kymatix_playback_time', time);
  };

  const changeVolume = (val) => {
    const v = parseInt(val, 10);
    setVolume(v);
    setIsMuted(v === 0);
    saveState('kymatix_volume', v);
    if (primaryPlayerRef.current?.setVolume) {
      primaryPlayerRef.current.setVolume(v);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      changeVolume(volume || 50);
    } else {
      setIsMuted(true);
      if (primaryPlayerRef.current) primaryPlayerRef.current.setVolume(0);
    }
  };

  const handleShuffleToggle = (val) => {
    const newVal = typeof val === 'boolean' ? val : !isShuffle;
    setIsShuffle(newVal);
    saveState('kymatix_shuffle', newVal);
  };

  const handleRepeatModeChange = (mode) => {
    setRepeatMode(mode);
    saveState('kymatix_repeat', mode);
  };

  const addToQueue = (track) => {
    const updated = [...userQueue, track];
    setUserQueue(updated);
    saveState('kymatix_user_queue', updated);
  };

  const removeFromUserQueue = (index) => {
    const updated = userQueue.filter((_, idx) => idx !== index);
    setUserQueue(updated);
    saveState('kymatix_user_queue', updated);
  };

  const clearUserQueue = () => {
    setUserQueue([]);
    saveState('kymatix_user_queue', []);
  };

  const toggleLike = (track) => {
    setLikedSongs((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      const updated = exists ? prev.filter((t) => t.id !== track.id) : [track, ...prev];
      saveState('kymatix_likes', updated);
      return updated;
    });
  };

  const toggleFollowArtist = (artistName) => {
    setFollowedArtists((prev) => {
      const exists = prev.includes(artistName);
      const updated = exists ? prev.filter((a) => a !== artistName) : [...prev, artistName];
      saveState('kymatix_follows', updated);
      return updated;
    });
  };

  const createPlaylist = (name) => {
    if (!name.trim()) return;
    const newPl = { id: `pl-${Date.now()}`, name: name.trim(), tracks: [] };
    const updated = [...playlists, newPl];
    setPlaylists(updated);
    saveState('kymatix_playlists', updated);
  };

  const addToPlaylist = (playlistId, track) => {
    const updated = playlists.map((pl) => {
      if (pl.id === playlistId && !pl.tracks.some((t) => t.id === track.id)) {
        return { ...pl, tracks: [...pl.tracks, track] };
      }
      return pl;
    });
    setPlaylists(updated);
    saveState('kymatix_playlists', updated);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        if (primaryPlayerRef.current?.getCurrentTime) {
          const t = primaryPlayerRef.current.getCurrentTime();
          if (t >= 0) setCurrentTime(t);
        }
      }, 250);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        is2GMode,
        theme,
        viewLayout,
        isSettingsOpen,
        userQueue,
        autoQueue,
        playbackContext,
        history,
        historyRetention,
        likedSongs,
        followedArtists,
        playlists,
        recentQueries,
        lyrics,
        isModalOpen,
        isQueueOpen,
        isInfoSidebarOpen,
        activeTab,
        selectedArtist,
        toggleTheme,
        toggleLayout,
        setIsSettingsOpen,
        setIs2GMode,
        setActiveTab,
        setSelectedArtist,
        setIsModalOpen,
        setIsQueueOpen,
        setIsInfoSidebarOpen,
        setIsShuffle: handleShuffleToggle,
        toggleShuffle: handleShuffleToggle,
        setRepeatMode: handleRepeatModeChange,
        toggleRepeat: () => {
          if (repeatMode === 'off') handleRepeatModeChange('all');
          else if (repeatMode === 'all') handleRepeatModeChange('one');
          else handleRepeatModeChange('off');
        },
        setRecentQueries,
        playTrack,
        fetchMoreQueueTracks,
        handleNext,
        handlePrevious,
        handlePrev: handlePrevious,
        togglePlay,
        seek,
        seekTo: seek,
        changeVolume,
        toggleMute,
        addToQueue,
        removeFromUserQueue,
        clearUserQueue,
        changeHistoryRetention,
        clearHistoryNow,
        toggleLike,
        toggleFollowArtist,
        createPlaylist,
        addToPlaylist,
      }}
    >
      <div className="fixed -bottom-[500px] -right-[500px] pointer-events-none opacity-0">
        <div id="kymatix-primary-engine" />
      </div>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
