'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import PlayerBar from '@/components/PlayerBar';
import TrackInfoSidebar from '@/components/TrackInfoSidebar';
import ArtistPage from '@/components/ArtistPage';
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
  LibraryBig
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

function formatDuration(sec) {
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
    clearHistoryNow
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlName, setNewPlName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [trendingSort, setTrendingSort] = useState('daily_viral');
  const [pinnedIds, setPinnedIds] = useState(['loved-pin', 'fav-1']);
  const [isDataSaver, setIsDataSaver] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      if (isFullScreen) {
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
  }, [isFullScreen]);

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
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h);
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
    <div className={`relative min-h-screen flex font-sans selection:bg-[#E11D48] selection:text-white pb-32 transition-colors duration-300 ${
      isDark ? 'bg-[#08090C] text-[#E3E2E6]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      
      {/* Background WebGL Shader */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-70">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      <div className={`fixed inset-0 pointer-events-none z-0 ${isDark ? 'bg-[#08090C]/40' : 'bg-white/40'}`} />

      {/* 1. DESKTOP FROSTED GLASS SIDEBAR */}
      <aside className={`w-64 border-r p-6 flex flex-col justify-between hidden lg:flex z-40 fixed left-0 top-0 bottom-0 backdrop-blur-[32px] saturate-[190%] transition-colors ${
        isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-slate-200/80 shadow-sm'
      }`}>
        <div>
          {/* Logo */}
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

          {/* Navigation Items */}
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

          {/* New Playlist Box (Following-এর ঠিক নিচে) */}
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

        {/* Sidebar Footer Controls */}
        <div className={`border-t pt-4 flex flex-col gap-2.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          
          {/* 1. Dark/Light Theme Button */}
          <button
            onClick={() => toggleTheme && toggleTheme()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold transition hover:bg-white/10 text-white"
            title="Toggle Theme"
          >
            {isDark ? (
              <><Moon size={15} className="text-[#FFB3B6]" /> <span>Dark Theme</span></>
            ) : (
              <><Sun size={15} className="text-amber-500" /> <span>Light Theme</span></>
            )}
          </button>

          {/* 2. Separate Layout Switcher Button */}
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

          {/* 3. 2G Data Saver Switch */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex flex-col">
              <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>2G Data Saver</span>
              <span className="text-[10px] text-white/50">64kbps Low MB</span>
            </div>
            <button 
              onClick={() => {
                const next = !isDataSaver;
                setIsDataSaver(next);
                try { localStorage.setItem('kymatix_data_saver', next.toString()); } catch {}
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${isDataSaver ? 'bg-[#00F2FE]' : 'bg-white/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${isDataSaver ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* 4. Settings Button (Center-aligned) */}
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

      {/* 2. MAIN VIEWPORT & FLOATING GLASS SEARCH HEADER */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 z-10">
        
        {/* Top Header Floating Search Bar (Brand Name Removed) */}
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 lg:px-0 lg:w-[calc(100%-256px)] lg:ml-32 pointer-events-none">
          <div className="bg-white/5 backdrop-blur-[40px] saturate-[220%] rounded-full mx-auto max-w-2xl border border-white/15 flex items-center justify-between px-6 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] pointer-events-auto transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
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
              <button className="text-white/60 hover:text-[#FFB3B6] transition-colors">
                <Bell size={20} />
              </button>
              <button className="text-white/60 hover:text-[#FFB3B6] transition-colors">
                <User size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body Canvas */}
        <main className="flex-1 px-4 lg:px-12 pt-32 pb-24 overflow-y-auto no-scrollbar max-w-7xl w-full mx-auto">
          
          {selectedArtist ? (
            <ArtistPage artistName={selectedArtist} onBack={() => setSelectedArtist(null)} />
          ) : activeTab === 'home' ? (
            <div className="space-y-12">
              
              {/* Featured Release Hero Card */}
              <section className="relative w-full rounded-[32px] overflow-hidden glass-panel group transition-transform duration-500 hover:scale-[1.01] border border-white/10 bg-white/5 backdrop-blur-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#E11D48]/20 to-[#571BC1]/20 mix-blend-overlay" />
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700 blur-[2px] group-hover:blur-0 scale-105 group-hover:scale-100"
                  style={{ backgroundImage: `url(${sortedTracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop'})` }}
                />
                <div className="relative z-10 p-8 md:p-14 flex flex-col justify-end min-h-[360px] bg-gradient-to-t from-[#08090C] via-[#08090C]/50 to-transparent">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold w-max mb-4 uppercase tracking-widest">
                    Featured Spotlight
                  </span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-2xl truncate">
                    {sortedTracks[0]?.title || 'Echoes of Silica'}
                  </h2>
                  <p className="text-base text-white/80 mt-2 max-w-xl font-light">
                    {sortedTracks[0]?.artist || 'Void Walker'} • Spatial audio stream with liquid glass fidelity.
                  </p>
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => sortedTracks[0] && playTrack(sortedTracks[0], { isPlaylist: false, trackList: sortedTracks })}
                      className="bg-gradient-to-r from-[#E11D48] to-[#571BC1] text-white px-8 py-3 rounded-full text-xs font-semibold flex items-center gap-2 shadow-[0_0_30px_rgba(225,29,72,0.4)] hover:shadow-[0_0_40px_rgba(225,29,72,0.6)] transition-all relative overflow-hidden"
                    >
                      <Play size={16} className="fill-white" />
                      <span>Play Now</span>
                    </button>
                    {sortedTracks[0] && (
                      <button 
                        onClick={() => toggleLike(sortedTracks[0])}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full text-xs font-semibold flex items-center gap-2 transition-colors"
                      >
                        <Heart size={16} className={likedSongs.some(t => t.id === sortedTracks[0].id) ? 'text-[#FF007F] fill-[#FF007F]' : ''} />
                        <span>Add to Library</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

              {/* Bento Grid: Curated For You */}
              <div>
                <div className="mb-6 flex items-end justify-between">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Curated for You</h3>
                  <button onClick={() => fetchSongs('Trending Global')} className="text-[#FFB3B6] text-xs font-semibold hover:underline">
                    See All
                  </button>
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

              {/* Jump Back In: 6 Playlists (3 on top row, 3 on bottom row) */}
              <section className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-white tracking-tight">Jump Back In</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedPlaylists.map((pl) => {
                    const isLoved = pl.isLoved;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          if (isLoved) {
                            setActiveTab('liked');
                          } else {
                            setSelectedPlaylist(pl);
                            setActiveTab('playlists');
                          }
                        }}
                        className="bg-white/5 backdrop-blur-[32px] border border-white/10 rounded-2xl p-3.5 flex items-center gap-3.5 hover:bg-white/10 transition-colors group text-left w-full"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-md ${
                          isLoved ? 'bg-gradient-to-tr from-[#E11D48] to-[#FF007F]' : 'bg-gradient-to-tr from-[#571BC1] to-[#00F2FE]'
                        }`}>
                          {isLoved ? <Heart size={18} className="fill-white" /> : <Music2 size={18} />}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                          <span className="text-xs font-semibold text-white truncate group-hover:text-[#FFB3B6] transition-colors">{pl.name}</span>
                          <span className="text-[10px] text-white/50 truncate mt-0.5">{pl.count} tracks</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
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
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-white/40">{pl.tracks.length} tracks</p>
                          <button
                            onClick={() => togglePin(pl.id)}
                            className={`p-1 text-xs rounded transition ${pinnedIds.includes(pl.id) ? 'text-[#00F2FE]' : 'text-white/40 hover:text-white'}`}
                            title="Pin to Quick Access"
                          >
                            <Pin size={12} className={pinnedIds.includes(pl.id) ? 'fill-[#00F2FE]' : ''} />
                          </button>
                        </div>
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
                        <h4 className="font-semibold text-xs text-white hover:text-[#FFB3B6]">{art}</h4>
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

      {/* 3. MOBILE BOTTOM NAVIGATION DOCK */}
      <nav className="fixed bottom-0 w-full z-40 flex lg:hidden justify-around items-center px-4 pb-[env(safe-area-inset-bottom,20px)] h-16 bg-[#1F1F23]/80 backdrop-blur-[32px] border-t border-white/10 shadow-[0_-10px_32px_rgba(0,0,0,0.2)]">
        <button 
          onClick={() => { setActiveTab('home'); setSelectedArtist(null); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-transform group ${activeTab === 'home' ? 'text-[#FFB3B6]' : 'text-white/40 hover:text-white'}`}
        >
          <HomeIcon size={22} className={activeTab === 'home' ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Home</span>
        </button>

        <button 
          onClick={() => { setActiveTab('liked'); setSelectedArtist(null); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-transform group ${activeTab === 'liked' ? 'text-[#FFB3B6]' : 'text-white/40 hover:text-white'}`}
        >
          <Heart size={22} className={activeTab === 'liked' ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Liked</span>
        </button>

        <button 
          onClick={() => { setActiveTab('playlists'); setSelectedArtist(null); setSelectedPlaylist(null); }}
          className={`flex flex-col items-center justify-center w-full h-full transition-transform group ${activeTab === 'playlists' ? 'text-[#FFB3B6]' : 'text-white/40 hover:text-white'}`}
        >
          <LibraryBig size={22} className={activeTab === 'playlists' ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-semibold">Library</span>
        </button>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-white/40 hover:text-white transition-transform group"
        >
          <Settings size={22} />
          <span className="text-[10px] mt-1 font-semibold">Settings</span>
        </button>
      </nav>

      {/* Global Player Components */}
      <TrackInfoSidebar />
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
                className={`group flex items-center justify-between p-3 rounded-2xl border backdrop-blur-[32px] transition-all duration-300 ${
                  active
                    ? 'bg-[#571BC1]/30 border-[#571BC1]/50 shadow-md'
                    : isDark ? 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div
                  className="flex items-center space-x-3.5 flex-1 cursor-pointer truncate"
                  onClick={() => (active ? togglePlay && togglePlay() : playTrack(track, playContext))}
                >
                  <span className="w-5 text-center text-xs font-mono text-white/40">
                    {active && isPlaying ? <Play size={12} className="text-[#00F2FE] inline fill-current" /> : idx + 1}
                  </span>
                  <img src={track.thumbnail} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
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
                  <button
                    onClick={() => toggleLike(track)}
                    className="hover:text-rose-500 transition"
                  >
                    <Heart size={15} className={isLiked ? 'fill-[#FF007F] text-[#FF007F]' : ''} />
                  </button>
                  <button
                    onClick={() => addToQueue(track)}
                    className="hover:text-[#00F2FE] transition"
                  >
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
              className={`relative group rounded-[20px] overflow-hidden aspect-square border border-white/10 bg-white/5 backdrop-blur-[32px] transition-all duration-300 ${
                active ? 'ring-2 ring-[#00F2FE]' : ''
              }`}
            >
              <img 
                src={track.thumbnail} 
                alt={track.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-100 group-hover:scale-105 transition-transform ease-out" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(track);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-[#FF007F] transition"
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

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <button 
                  onClick={() => (active ? togglePlay && togglePlay() : playTrack(track, playContext))}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/40 shadow-lg hover:scale-110 transition-transform pointer-events-auto"
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