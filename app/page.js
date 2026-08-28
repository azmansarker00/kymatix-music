'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import PlayerBar from '@/components/PlayerBar';
import QueueDrawer from '@/components/QueueDrawer';
import LyricsView from '@/components/LyricsView';
import TrackInfoSidebar from '@/components/TrackInfoSidebar';
import ArtistPage from '@/components/ArtistPage';
import WaveformScrubber from '@/components/WaveformScrubber';
import { 
  Heart, 
  Clock, 
  FolderPlus, 
  Users, 
  Search, 
  Play, 
  Pause, 
  Plus, 
  Flame, 
  LayoutGrid, 
  List, 
  Sliders, 
  Pin, 
  Music2, 
  Settings, 
  Bell, 
  User, 
  Home as HomeIcon,
  Sun,
  Moon,
  Trash2,
  LibraryBig,
  SkipForward,
  SkipBack,
  ChevronDown,
  MoreHorizontal,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  ListMusic,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

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

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function Home() {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    addToQueue,
    likedSongs = [],
    toggleLike,
    history = [],
    playlists = [],
    createPlaylist,
    addToPlaylist,
    followedArtists = [],
    toggleFollowArtist,
    activeTab,
    setActiveTab,
    selectedArtist,
    setSelectedArtist,
    setRecentQueries,
    theme = 'dark',
    toggleTheme,
    viewLayout = 'grid',
    toggleLayout,
    setIsSettingsOpen,
    setIsQueueOpen,
    clearHistoryNow,
    currentTime = 0,
    duration = 0,
    seekTo,
    handleNext,
    handlePrevious,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode
  } = usePlayer() || {};

  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlName, setNewPlName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [trendingSort, setTrendingSort] = useState('daily_viral');
  const [pinnedIds, setPinnedIds] = useState(['loved-pin', 'fav-1']);
  const [isDataSaver, setIsDataSaver] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Mobile Dedicated Fullscreen Glass Lyrics State & Ref
  const [isMobileLyricsOpen, setIsMobileLyricsOpen] = useState(false);
  const [mobileLyrics, setMobileLyrics] = useState([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const activeLineRef = useRef(null);

  const canvasRef = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('kymatix_pinned_playlists');
      if (savedPins) setPinnedIds(JSON.parse(savedPins));
      const savedSaver = localStorage.getItem('kymatix_data_saver');
      if (savedSaver !== null) setIsDataSaver(savedSaver === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    const handleBackButton = async () => {
      if (isMobileLyricsOpen) {
        setIsMobileLyricsOpen(false);
      } else if (isFullScreen) {
        setIsFullScreen(false);
      } else {
        CapApp.exitApp();
      }
    };

    let backListener = null;
    try {
      CapApp.addListener('backButton', handleBackButton).then(l => {
        backListener = l;
      });
    } catch (e) {}

    return () => {
      if (backListener && backListener.remove) backListener.remove();
    };
  }, [isFullScreen, isMobileLyricsOpen]);

  // Cycle Repeat Mode matching PlayerBar logic
  const cycleRepeat = () => {
    if (setRepeatMode) {
      if (repeatMode === 'off') setRepeatMode('all');
      else if (repeatMode === 'all') setRepeatMode('one');
      else setRepeatMode('off');
    }
  };

  // Fetch Synchronized Lyrics for Mobile Fullscreen Page
  useEffect(() => {
    if (!currentTrack) return;
    
    let isMounted = true;
    const fetchSyncedLyrics = async () => {
      setLyricsLoading(true);
      try {
        const cleanTitle = cleanTrackTitle(currentTrack.title);
        const cleanArtist = (currentTrack.artist || '').replace(/- Topic/gi, '').trim();

        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(cleanArtist)}`);
        const data = await res.json();

        if (isMounted) {
          if (data && data.synced) {
            const lrcLines = typeof data.synced === 'string' ? data.synced.split('\n') : data.synced;
            if (Array.isArray(lrcLines) && typeof lrcLines[0] === 'string') {
              const parsed = [];
              const timeExp = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
              for (let line of lrcLines) {
                const match = timeExp.exec(line);
                if (match) {
                  const min = parseInt(match[1], 10);
                  const sec = parseInt(match[2], 10);
                  const ms = match[3] ? parseFloat('0.' + match[3]) : 0;
                  const time = min * 60 + sec + ms;
                  const text = line.replace(timeExp, '').trim();
                  if (text) parsed.push({ time, text });
                }
              }
              setMobileLyrics(parsed.length > 0 ? parsed : [{ time: null, text: data.synced }]);
            } else {
              setMobileLyrics(data.synced);
            }
          } else if (data && data.lyrics) {
            setMobileLyrics(data.lyrics.split('\n').map(l => ({ time: null, text: l })));
          } else {
            setMobileLyrics([]);
          }
        }
      } catch {
        if (isMounted) setMobileLyrics([]);
      } finally {
        if (isMounted) setLyricsLoading(false);
      }
    };

    fetchSyncedLyrics();
    return () => { isMounted = false; };
  }, [currentTrack]);

  // Auto-scroll lyrics smoothly
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentTime]);

  const activeIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < mobileLyrics.length; i++) {
      if (mobileLyrics[i].time !== null && currentTime >= mobileLyrics[i].time) {
        index = i;
      }
    }
    return index;
  }, [currentTime, mobileLyrics]);

  const savePins = (ids) => {
    setPinnedIds(ids);
    try { localStorage.setItem('kymatix_pinned_playlists', JSON.stringify(ids)); } catch {}
  };

  const togglePin = (id) => {
    if (pinnedIds.includes(id)) {
      savePins(pinnedIds.filter(item => item !== id));
    } else {
      if (pinnedIds.length >= 6) {
        alert('You can pin up to 6 playlists.');
        return;
      }
      savePins([...pinnedIds, id]);
    }
  };

  const fetchSongs = async (searchTerm) => {
    const q = (searchTerm || 'Bangla Coke Studio Trending').trim();
    try {
      setLoading(true);
      if (setRecentQueries) {
        setRecentQueries(prev => [q, ...prev.filter(item => item.toLowerCase() !== q.toLowerCase())].slice(0, 8));
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setTracks(Array.isArray(data.tracks) ? data.tracks : []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs('Bangla Coke Studio Trending');
  }, []);

  // WebGL Shader Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position; varying vec2 v_texCoord; void main() { v_texCoord = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;
    const fs = `
      precision highp float;
      uniform float u_time;
      varying vec2 v_texCoord;
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 a0 = x - floor(x + 0.5);
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      void main() {
        vec2 uv = v_texCoord;
        vec3 obsidian = vec3(0.031, 0.035, 0.047);
        vec3 crimson = vec3(0.88, 0.11, 0.28);
        vec3 violet = vec3(0.5, 0.0, 1.0);
        vec3 turquoise = vec3(0.0, 0.95, 1.0);
        float n1 = snoise(uv * 1.5 + u_time * 0.15);
        float n2 = snoise(uv * 2.0 - u_time * 0.1);
        float n3 = snoise(uv * 0.8 + u_time * 0.05);
        vec3 color = obsidian;
        color = mix(color, crimson, smoothstep(0.1, 0.8, n1) * 0.2);
        color = mix(color, violet, smoothstep(0.2, 0.9, n2) * 0.15);
        color = mix(color, turquoise, smoothstep(0.3, 1.0, n3) * 0.1);
        float dist = distance(uv, vec2(0.5));
        color *= smoothstep(1.2, 0.2, dist);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const createShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    let animationFrameId;

    const render = (t) => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const sortedTracks = useMemo(() => {
    let list = [...tracks];
    if (trendingSort === 'daily_viral') {
      list.sort((a, b) => (b.popularityIndex || 0) - (a.popularityIndex || 0));
    } else if (trendingSort === 'most_streamed') {
      list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (trendingSort === 'new_trending') {
      list.sort((a, b) => new Date(b.releaseDate || '2025') - new Date(a.releaseDate || '2025'));
    }
    return list;
  }, [tracks, trendingSort]);

  const allAvailablePlaylists = useMemo(() => {
    return [
      { id: 'loved-pin', name: 'Liked Songs', count: likedSongs.length, isLoved: true, tracks: likedSongs },
      ...playlists.map(pl => ({ ...pl, count: pl.tracks.length, isLoved: false }))
    ];
  }, [likedSongs, playlists]);

  const pinnedPlaylists = useMemo(() => {
    return allAvailablePlaylists.filter(pl => pinnedIds.includes(pl.id)).slice(0, 6);
  }, [allAvailablePlaylists, pinnedIds]);

  return (
    <div className={`relative min-h-screen flex font-sans selection:bg-[#E11D48] selection:text-white pb-36 lg:pb-32 transition-colors duration-300 ${
      isDark ? 'bg-[#08090C] text-[#E3E2E6]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      
      {/* Background WebGL Shader */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-70">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      <div className={`fixed inset-0 pointer-events-none z-0 ${isDark ? 'bg-[#08090C]/40' : 'bg-white/40'}`} />

      {/* 1. DESKTOP SIDEBAR */}
      <aside className={`w-64 border-r p-6 flex flex-col justify-between hidden lg:flex z-40 fixed left-0 top-0 bottom-0 backdrop-blur-[32px] saturate-[190%] transition-colors ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-slate-200/80 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-3 mb-8 px-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB3B6] to-[#D0BCFF] flex items-center justify-center p-0.5 border border-white/20 shadow-md">
              <div className="w-full h-full bg-[#08090C] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white tracking-wider">KY</span>
              </div>
            </div>
            <div>
              <span className={`font-bold tracking-tight text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>KYMATIX</span>
              <p className="text-[10px] text-[#FFB3B6] font-mono tracking-widest uppercase">Studio Glass</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-medium">
            {[
              { id: 'home', label: 'Trending Feed', icon: <Flame size={18} /> },
              { id: 'liked', label: `Liked Songs (${likedSongs.length})`, icon: <Heart size={18} /> },
              { id: 'history', label: `History (${history.length})`, icon: <Clock size={18} /> },
              { id: 'playlists', label: `Playlists (${playlists.length})`, icon: <FolderPlus size={18} /> },
              { id: 'artists', label: `Following (${followedArtists.length})`, icon: <Users size={18} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedArtist(null);
                  setSelectedPlaylist(null);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-full transition-all duration-300 ${
                  activeTab === item.id && !selectedArtist
                    ? isDark 
                      ? 'bg-[#571BC1]/40 text-[#C4ABFF] border border-[#571BC1]/60 shadow-[0_0_20px_rgba(87,27,193,0.3)] font-semibold' 
                      : 'bg-indigo-100/80 text-indigo-700 font-semibold'
                    : isDark 
                      ? 'text-white/70 hover:text-white hover:bg-white/10' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/10">
            <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block px-1 mb-2">New Playlist</span>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Name..."
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none transition ${
                  isDark ? 'bg-white/5 border-white/10 text-white focus:border-[#00F2FE]' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
              <button
                onClick={() => {
                  if (newPlName.trim()) {
                    createPlaylist(newPlName);
                    setNewPlName('');
                  }
                }}
                className="px-3 bg-gradient-to-r from-[#E11D48] to-[#571BC1] text-white rounded-xl text-xs font-semibold shadow-md hover:opacity-90 transition"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className={`border-t pt-4 flex flex-col gap-2.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <button
            onClick={() => toggleTheme && toggleTheme()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold transition hover:bg-white/10 text-white"
          >
            {isDark ? (
              <><Moon size={15} className="text-[#FFB3B6]" /> <span>Dark Theme</span></>
            ) : (
              <><Sun size={15} className="text-amber-500" /> <span>Light Theme</span></>
            )}
          </button>

          <div className="w-full flex items-center justify-between p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => toggleLayout && toggleLayout('grid')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition ${
                viewLayout === 'grid' ? 'bg-[#571BC1] text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => toggleLayout && toggleLayout('list')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition ${
                viewLayout === 'list' ? 'bg-[#571BC1] text-white shadow-md' : 'text-white/40 hover:text-white'
              }`}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-semibold transition ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Sliders size={14} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 z-10 pb-28 lg:pb-0">
        
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 lg:px-0 lg:w-[calc(100%-256px)] lg:ml-32 pointer-events-none">
          <div className="bg-white/5 backdrop-blur-[40px] saturate-[220%] rounded-full mx-auto max-w-2xl border border-white/15 flex items-center justify-between px-6 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] pointer-events-auto">
            <div className="flex-1 flex items-center gap-3 text-white/60 focus-within:ring-2 ring-[#571BC1] rounded-full px-3 py-1 transition-all">
              <Search size={18} className="text-white/40" />
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedArtist(null);
                    fetchSongs(query);
                  }
                }}
                placeholder="Search Kymatix..." 
                className="bg-transparent border-none outline-none text-white text-sm focus:ring-0 w-full placeholder-white/40"
              />
            </div>
            <div className="flex items-center gap-4 ml-4">
              <button className="text-white/60 hover:text-[#FFB3B6] transition-colors"><Bell size={20} /></button>
              <button className="text-white/60 hover:text-[#FFB3B6] transition-colors"><User size={20} /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-12 pt-32 pb-24 overflow-y-auto no-scrollbar max-w-7xl w-full mx-auto">
          
          {selectedArtist ? (
            <ArtistPage artistName={selectedArtist} onBack={() => setSelectedArtist(null)} />
          ) : activeTab === 'home' ? (
            <div className="space-y-12">
              <section className="relative w-full rounded-[32px] overflow-hidden glass-panel group border border-white/10 bg-white/5 backdrop-blur-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E11D48]/20 to-[#571BC1]/20 mix-blend-overlay" />
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 blur-[2px]"
                  style={{ backgroundImage: `url(${sortedTracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'})` }}
                />
                <div className="relative z-10 p-8 md:p-14 flex flex-col justify-end min-h-[360px] bg-gradient-to-t from-[#08090C] via-[#08090C]/50 to-transparent">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold w-max mb-4 uppercase tracking-widest">
                    Featured Spotlight
                  </span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight truncate">
                    {sortedTracks[0]?.title || 'Echoes of Silica'}
                  </h2>
                  <p className="text-base text-white/80 mt-2 max-w-xl font-light">
                    {sortedTracks[0]?.artist || 'Void Walker'} • Spatial audio stream with liquid glass fidelity.
                  </p>
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => sortedTracks[0] && playTrack(sortedTracks[0], { isPlaylist: false, trackList: sortedTracks })}
                      className="bg-gradient-to-r from-[#E11D48] to-[#571BC1] text-white px-8 py-3 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg"
                    >
                      <Play size={16} className="fill-white" />
                      <span>Play Now</span>
                    </button>
                  </div>
                </div>
              </section>

              <div>
                <div className="mb-6 flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Curated for You</h3>
                </div>
                {loading ? (
                  <div className={viewLayout === 'grid' ? "grid grid-cols-2 md:grid-cols-4 gap-6" : "space-y-2"}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="rounded-[20px] p-4 space-y-3 animate-pulse bg-white/5 border border-white/10 aspect-square" />
                    ))}
                  </div>
                ) : (
                  renderTracksView(sortedTracks, { isPlaylist: false, trackList: sortedTracks })
                )}
              </div>
            </div>
          ) : activeTab === 'liked' ? (
            <div>
              <h2 className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-6">Liked Songs ({likedSongs.length})</h2>
              {likedSongs.length === 0 ? (
                <p className="text-white/40 text-xs font-mono py-12 text-center">NO LIKED TRACKS SAVED.</p>
              ) : (
                renderTracksView(likedSongs, { isPlaylist: true, trackList: likedSongs, playlistId: 'liked' })
              )}
            </div>
          ) : activeTab === 'history' ? (
            <div>
              <div className="flex items-center justify-between mb-6 border-b pb-4 border-white/10">
                <h2 className="text-xs font-semibold tracking-widest text-white/60 uppercase flex items-center gap-2">
                  <Clock size={16} className="text-[#00F2FE]" />
                  Listening History ({history.length})
                </h2>
                {history.length > 0 && (
                  <button
                    onClick={() => clearHistoryNow && clearHistoryNow()}
                    className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 size={13} />
                    <span>Clear Now</span>
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-white/40 text-xs font-mono py-12 text-center">NO PREVIOUS STREAMS FOUND.</p>
              ) : (
                renderTracksView(history, { isPlaylist: false, trackList: history })
              )}
            </div>
          ) : activeTab === 'playlists' ? (
            <div>
              {!selectedPlaylist ? (
                <div>
                  <h2 className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-6">All Playlists</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="group relative border border-white/10 bg-white/5 backdrop-blur-[32px] p-5 rounded-2xl cursor-pointer hover:border-white/30 transition"
                      >
                        <div 
                          onClick={() => setSelectedPlaylist(pl)}
                          className="w-full aspect-square bg-[#571BC1]/20 border border-[#571BC1]/30 rounded-xl flex items-center justify-center text-[#C4ABFF] text-2xl mb-3"
                        >
                          <FolderPlus size={28} />
                        </div>
                        <h4 onClick={() => setSelectedPlaylist(pl)} className="font-semibold text-xs text-white">{pl.name}</h4>
                        <p className="text-[10px] text-white/40 mt-1">{pl.tracks.length} tracks</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedPlaylist(null)} className="text-xs text-[#00F2FE] mb-4 font-semibold">
                    ← Back to Playlists
                  </button>
                  <h2 className="text-sm font-semibold mb-6">{selectedPlaylist.name}</h2>
                  {renderTracksView(selectedPlaylist.tracks, { isPlaylist: true, trackList: selectedPlaylist.tracks, playlistId: selectedPlaylist.id })}
                </div>
              )}
            </div>
          ) : activeTab === 'artists' ? (
            <div>
              <h2 className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-6">Following</h2>
              {followedArtists.length === 0 ? (
                <p className="text-white/40 text-xs font-mono py-12 text-center">NO ARTISTS FOLLOWED.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {followedArtists.map((art, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedArtist(art)}
                      className="border border-white/10 bg-white/5 backdrop-blur-[32px] p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-white/30 transition"
                    >
                      <div>
                        <h4 className="font-semibold text-xs text-white">{art}</h4>
                        <span className="text-[10px] text-white/40">View Profile →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE RESPONSIVE FIX: MINI PLAYER & BOTTOM DOCK NAVIGATION */}
      {/* ========================================================================= */}
      
      {/* Mobile Floating Mini Player (Fixed cleanly at bottom-20 above nav bar) */}
      {currentTrack && (
        <div className="fixed bottom-20 left-3 right-3 z-40 lg:hidden flex justify-center pointer-events-none">
          <div 
            onClick={() => setIsFullScreen(true)}
            className="w-full bg-[#1F1F23]/95 backdrop-blur-[32px] border border-white/15 rounded-2xl p-2.5 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] pointer-events-auto cursor-pointer"
          >
            <img src={currentTrack.thumbnail || currentTrack.cover} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 shadow" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-[10px] text-white/50 truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 pr-1 text-white" onClick={(e) => e.stopPropagation()}>
              <button onClick={togglePlay} className="p-2 hover:text-[#FFB3B6]">
                {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
              </button>
              <button onClick={handleNext} className="p-2 hover:text-[#FFB3B6]">
                <SkipForward size={20} className="fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Dock (Spotify Style Routing) */}
      <nav className="fixed bottom-0 w-full z-40 flex lg:hidden justify-around items-center px-4 h-16 bg-[#1F1F23]/95 backdrop-blur-[32px] border-t border-white/10 pb-[env(safe-area-inset-bottom,12px)] shadow-2xl">
        <button 
          onClick={() => { setActiveTab('home'); setSelectedArtist(null); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'home' && !selectedArtist ? 'text-[#FFB3B6]' : 'text-white/40 hover:text-white'}`}
        >
          <HomeIcon size={20} className={activeTab === 'home' && !selectedArtist ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Home</span>
        </button>

        <button 
          onClick={() => { setActiveTab('liked'); setSelectedArtist(null); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'liked' && !selectedArtist ? 'text-[#FFB3B6]' : 'text-white/40 hover:text-white'}`}
        >
          <Heart size={20} className={activeTab === 'liked' && !selectedArtist ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Liked</span>
        </button>

        <button 
          onClick={() => { setActiveTab('playlists'); setSelectedArtist(null); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'playlists' && !selectedArtist ? 'text-[#FFB3B6]' : 'text-white/40 hover:text-white'}`}
        >
          <LibraryBig size={20} className={activeTab === 'playlists' && !selectedArtist ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Library</span>
        </button>

        <button 
          onClick={() => { setIsSettingsOpen(true); }}
          className="flex flex-col items-center justify-center w-full h-full text-white/40 hover:text-white transition-colors"
        >
          <Settings size={20} />
          <span className="text-[10px] mt-1 font-semibold">Settings</span>
        </button>
      </nav>

      {/* Mobile Fullscreen Now Playing Modal */}
      {isFullScreen && currentTrack && (
        <div className="lg:hidden fixed inset-0 z-[99999] bg-[#08090C] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 select-none">
          
          {/* Header sticky top with Queue Button */}
          <div className="sticky top-0 z-20 w-full flex justify-between items-center p-6 bg-[#08090C]/80 backdrop-blur-md">
            <button onClick={() => setIsFullScreen(false)} className="p-2 text-white/70 hover:text-white">
              <ChevronDown size={24} />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50 truncate max-w-[180px]">
              {currentTrack.artist}
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsQueueOpen && setIsQueueOpen(true)} 
                className="p-2 text-white/70 hover:text-[#00F2FE] transition"
                title="Queue"
              >
                <ListMusic size={22} />
              </button>
              <button className="p-2 text-white/70 hover:text-white">
                <MoreHorizontal size={24} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between px-6 pb-8 min-h-[calc(100vh-80px)]">
            {/* Album Cover Art */}
            <div className="w-full max-w-[320px] aspect-square rounded-[32px] overflow-hidden shadow-2xl border border-white/15 my-auto">
              <img src={currentTrack.thumbnail || currentTrack.cover} alt="" className="w-full h-full object-cover" />
            </div>

            {/* Controls Section */}
            <div className="w-full max-w-[320px] flex flex-col gap-6 mt-8">
              <div className="flex justify-between items-center">
                <div className="truncate pr-4">
                  <h2 className="text-xl font-bold text-white truncate">{currentTrack.title}</h2>
                  <p className="text-sm text-[#FFB3B6] font-medium opacity-80 truncate">{currentTrack.artist}</p>
                </div>
                <button onClick={() => toggleLike(currentTrack)}>
                  <Heart size={24} className={likedSongs.some(t => t.id === currentTrack.id) ? 'text-[#FF007F] fill-[#FF007F]' : 'text-white/60'} />
                </button>
              </div>

              {/* Desktop-matching WaveformScrubber for precise length/time control */}
              <div className="w-full flex items-center gap-3 text-xs text-white/50 font-mono">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <div className="flex-1">
                  <WaveformScrubber />
                </div>
                <span className="w-8">{formatTime(duration)}</span>
              </div>

              {/* Fully Working Player Controls matching PlayerBar.js */}
              <div className="flex justify-between items-center px-2">
                <button 
                  onClick={() => setIsShuffle && setIsShuffle(!isShuffle)}
                  className={`transition hover:scale-110 p-1 ${isShuffle ? 'text-[#00F2FE]' : 'text-white/60 hover:text-white'}`}
                  title="Shuffle"
                >
                  <Shuffle size={20} />
                </button>

                <button onClick={handlePrevious} className="text-white hover:text-[#FFB3B6] transition" title="Previous">
                  <SkipBack size={28} className="fill-current" />
                </button>

                <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                  {isPlaying ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current translate-x-0.5" />}
                </button>

                <button onClick={handleNext} className="text-white hover:text-[#FFB3B6] transition" title="Next">
                  <SkipForward size={28} className="fill-current" />
                </button>

                <button 
                  onClick={() => {
                    if (repeatMode === 'off') setRepeatMode('all');
                    else if (repeatMode === 'all') setRepeatMode('one');
                    else setRepeatMode('off');
                  }}
                  className={`transition hover:scale-110 relative p-1 ${repeatMode !== 'off' ? 'text-[#00F2FE]' : 'text-white/60 hover:text-white'}`}
                  title="Repeat"
                >
                  {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                </button>
              </div>
            </div>

            {/* Clickable Synced Lyrics Card (Opens Dedicated Glass Fullscreen Page) */}
            <div 
              onClick={() => setIsMobileLyricsOpen(true)}
              className="w-full max-w-[320px] mt-10 p-6 rounded-[28px] bg-white/5 backdrop-blur-[32px] border border-white/10 shadow-2xl cursor-pointer hover:border-white/30 transition group"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-white/80">
                  <Mic2 size={16} className="text-[#00F2FE]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Lyrics</span>
                </div>
                <span className="text-[10px] text-[#00F2FE] group-hover:underline">Fullscreen →</span>
              </div>

              <div className="space-y-3 max-h-40 overflow-hidden py-1 text-center pointer-events-none">
                {lyricsLoading ? (
                  <p className="text-xs text-white/40 animate-pulse">Loading live lyrics...</p>
                ) : mobileLyrics.length === 0 ? (
                  <p className="text-xs text-white/40">No lyrics available for this track.</p>
                ) : (
                  mobileLyrics.slice(Math.max(0, activeIndex - 1), activeIndex + 2).map((lyric, idx) => (
                    <p
                      key={idx}
                      className={`text-xs font-semibold truncate transition-all ${
                        idx === 1 ? 'text-white text-sm scale-105' : 'text-white/40'
                      }`}
                    >
                      {lyric.text || '...'}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE DEDICATED FULLSCREEN GLASS LYRICS PAGE */}
      {/* ========================================================================= */}
      {isMobileLyricsOpen && currentTrack && (
        <div className="lg:hidden fixed inset-0 z-[999999] bg-[#08090C]/95 backdrop-blur-[50px] saturate-[200%] flex flex-col items-center justify-between p-6 pt-10 animate-in fade-in zoom-in-95 duration-300 select-none overflow-hidden">
          
          {/* Background Blur Glow */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-[90px] pointer-events-none scale-125"
            style={{ backgroundImage: `url(${currentTrack.thumbnail || currentTrack.cover})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/60 via-transparent to-[#08090C]/80 pointer-events-none" />

          {/* Top Glass Bar */}
          <div className="w-full flex items-center justify-between z-10 border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3.5 truncate">
              <img
                src={currentTrack.thumbnail || currentTrack.cover}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-xl object-cover border border-white/15 shadow-xl shrink-0"
              />
              <div className="truncate">
                <h2 className="text-sm font-bold text-white truncate">{currentTrack.title}</h2>
                <p className="text-xs font-medium text-[#FFB3B6] opacity-90 truncate">{currentTrack.artist}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileLyricsOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 border border-white/10 shadow-lg shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Synced Karaoke Body */}
          <div 
            className="w-full max-w-md h-[68vh] overflow-y-scroll overflow-x-hidden my-auto flex flex-col items-center space-y-7 py-24 text-center z-10 no-scrollbar"
            style={{ scrollbarWidth: 'none' }}
          >
            {lyricsLoading ? (
              <div className="m-auto flex flex-col items-center gap-3 text-white/50">
                <Loader2 size={30} className="animate-spin text-[#00F2FE]" />
                <span className="text-xs font-mono uppercase tracking-widest">Syncing Lyrics...</span>
              </div>
            ) : mobileLyrics.length === 0 ? (
              <p className="text-white/50 font-mono text-sm uppercase m-auto tracking-wider">
                Lyrics not found for this track.
              </p>
            ) : (
              mobileLyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <p
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => line.time !== null && seekTo && seekTo(line.time)}
                    className={`transition-all duration-300 cursor-pointer font-bold select-none text-center px-4 ${
                      isActive
                        ? 'text-white text-2xl scale-105 opacity-100 drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]'
                        : 'text-white/30 text-lg opacity-35 hover:opacity-75'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase z-10 flex items-center gap-2 border-t border-white/10 w-full pt-3 justify-center">
            <Sparkles size={12} className="text-[#00F2FE] animate-pulse" />
            <span>Kymatix Liquid Glass Synchronized Lyrics</span>
          </div>
        </div>
      )}

      {/* Global Desktop Player & Overlays */}
      <TrackInfoSidebar />
      <QueueDrawer />
      <LyricsView />
      <PlayerBar />
    </div>
  );

  function renderTracksView(trackList, playContext) {
    if (viewLayout === 'list') {
      return (
        <div className="space-y-2">
          {trackList.map((track, idx) => {
            const active = currentTrack?.id === track.id;
            const isLiked = likedSongs.some((t) => t.id === track.id);

            return (
              <div
                key={track.id || idx}
                className={`group flex items-center justify-between p-3 rounded-2xl border backdrop-blur-[32px] transition-all ${
                  active ? 'bg-[#571BC1]/30 border-[#571BC1]/50' : isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className="flex items-center space-x-3.5 flex-1 cursor-pointer truncate"
                  onClick={() => (active ? togglePlay && togglePlay() : playTrack(track, playContext))}
                >
                  <span className="w-5 text-center text-xs font-mono text-white/40">
                    {active && isPlaying ? <Play size={12} className="text-[#00F2FE] inline fill-current" /> : idx + 1}
                  </span>
                  <img src={track.thumbnail || track.cover} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
                  <div className="truncate">
                    <h4 className={`text-xs font-semibold truncate ${active ? 'text-[#FFB3B6]' : 'text-white'}`}>
                      {track.title}
                    </h4>
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtist(track.artist);
                      }}
                      className="text-[10px] text-white/40 hover:text-[#00F2FE] truncate mt-0.5"
                    >
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-white/40 font-mono">
                  <button onClick={() => toggleLike(track)} className="hover:text-rose-500 transition">
                    <Heart size={15} className={isLiked ? 'fill-[#FF007F] text-[#FF007F]' : ''} />
                  </button>
                  <button onClick={() => addToQueue(track)} className="hover:text-[#00F2FE] transition">
                    <Plus size={15} />
                  </button>
                  <span className="text-[11px]">{formatDuration(track.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {trackList.map((track, idx) => {
          const active = currentTrack?.id === track.id;
          const isLiked = likedSongs.some((t) => t.id === track.id);
          const isFollowed = followedArtists.includes(track.artist);

          return (
            <div
              key={track.id || idx}
              className={`relative group rounded-[20px] overflow-hidden aspect-square border border-white/10 bg-white/5 backdrop-blur-[32px] transition-all ${
                active ? 'ring-2 ring-[#00F2FE]' : ''
              }`}
            >
              <img 
                src={track.thumbnail || track.cover} 
                alt={track.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(track);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-[#FF007F]"
              >
                <Heart size={14} className={isLiked ? 'fill-[#FF007F] text-[#FF007F]' : ''} />
              </button>

              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2.5">
                  <h4 
                    onClick={() => playTrack(track, playContext)}
                    className="font-semibold text-white truncate text-xs cursor-pointer hover:underline"
                  >
                    {track.title}
                  </h4>
                  <div className="flex items-center justify-between mt-0.5">
                    <p 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtist(track.artist);
                      }}
                      className="text-[10px] text-white/70 truncate cursor-pointer hover:text-[#00F2FE]"
                    >
                      {track.artist}
                    </p>
                    <button
                      onClick={() => toggleFollowArtist(track.artist)}
                      className={`text-[8px] px-1.5 py-0.5 rounded-full border transition ${
                        isFollowed ? 'border-[#00F2FE] text-[#00F2FE] bg-[#00F2FE]/10' : 'border-white/20 text-white/60'
                      }`}
                    >
                      {isFollowed ? 'Following' : '+ Follow'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button 
                  onClick={() => (active ? togglePlay && togglePlay() : playTrack(track, playContext))}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/40 shadow-lg pointer-events-auto"
                >
                  {active && isPlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white translate-x-0.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}