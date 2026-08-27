'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Trash2, 
  CalendarClock, 
  AlertTriangle 
} from 'lucide-react';

function formatDuration(sec) {
  if (!sec) return '3:45';
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
    likedSongs,
    toggleLike,
    history,
    historyRetention,
    changeHistoryRetention,
    clearHistoryNow,
    playlists,
    createPlaylist,
    addToPlaylist,
    followedArtists,
    toggleFollowArtist,
    activeTab,
    setActiveTab,
    selectedArtist,
    setSelectedArtist,
    recentQueries,
    setRecentQueries,
    theme,
    viewLayout,
    toggleLayout,
    setIsSettingsOpen
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlName, setNewPlName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [trendingSort, setTrendingSort] = useState('daily_viral');
  const [pinnedIds, setPinnedIds] = useState(['loved-pin', 'fav-1']);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      const savedPins = localStorage.getItem('kymatix_pinned_playlists');
      if (savedPins) setPinnedIds(JSON.parse(savedPins));
    } catch {}
  }, []);

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
      setRecentQueries(prev => [q, ...prev.filter(item => item.toLowerCase() !== q.toLowerCase())].slice(0, 8));
      
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
    <div className={`min-h-screen flex font-sans selection:bg-indigo-500 selection:text-white pb-32 transition-colors duration-300 ${
      isDark ? 'bg-[#0b0c10] text-[#e0e2ec]' : 'bg-[#f7f8fb] text-[#1a1b24]'
    }`}>
      
      {/* Sidebar */}
      <aside className={`w-64 border-r p-5 flex flex-col justify-between hidden md:flex z-20 transition-colors ${
        isDark ? 'bg-[#0f1016] border-white/[0.08]' : 'bg-white border-neutral-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center space-x-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              K
            </div>
            <div>
              <span className={`font-bold tracking-wider text-xs uppercase ${isDark ? 'text-white' : 'text-neutral-900'}`}>KYMATIX</span>
              <p className="text-[9px] text-neutral-400 font-mono tracking-widest">ZERO-LATENCY MATRIX</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            {[
              { id: 'home', label: 'Trending Feed', icon: <Flame size={16} /> },
              { id: 'liked', label: `Liked Songs (${likedSongs.length})`, icon: <Heart size={16} /> },
              { id: 'history', label: `History (${history.length})`, icon: <Clock size={16} /> },
              { id: 'playlists', label: `Playlists (${playlists.length})`, icon: <FolderPlus size={16} /> },
              { id: 'artists', label: `Following (${followedArtists.length})`, icon: <Users size={16} /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedArtist(null);
                  setSelectedPlaylist(null);
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition ${
                  activeTab === item.id && !selectedArtist
                    ? isDark ? 'bg-white/[0.08] text-white font-semibold' : 'bg-indigo-50 text-indigo-600 font-semibold'
                    : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/[0.03]' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={`border-t pt-4 ${isDark ? 'border-white/[0.08]' : 'border-neutral-200'}`}>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl mb-3 text-xs font-semibold transition ${
              isDark ? 'bg-white/5 hover:bg-white/10 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders size={14} />
              <span>Settings</span>
            </div>
            <span className="text-[10px] uppercase font-mono text-indigo-500">{theme}</span>
          </button>

          <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider block mb-2 px-1">New Playlist</span>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Name..."
              value={newPlName}
              onChange={(e) => setNewPlName(e.target.value)}
              className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 ${
                isDark ? 'bg-[#141620] border-white/10 text-neutral-200' : 'bg-neutral-100 border-neutral-300 text-neutral-800'
              }`}
            />
            <button
              onClick={() => {
                createPlaylist(newPlName);
                setNewPlName('');
              }}
              className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
            >
              +
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Search Header */}
        <header className={`px-8 py-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 z-10 backdrop-blur-md ${
          isDark ? 'bg-[#0b0c10]/80 border-white/[0.08]' : 'bg-white/80 border-neutral-200'
        }`}>
          <div className="relative w-full sm:w-96">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
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
              placeholder="Search songs, artists, trends..."
              className={`w-full text-xs border rounded-full pl-9 pr-24 py-2.5 focus:outline-none focus:border-indigo-500 transition ${
                isDark ? 'bg-[#13151e] text-neutral-200 border-white/10' : 'bg-neutral-100 text-neutral-900 border-neutral-300'
              }`}
            />
            <button
              onClick={() => {
                setSelectedArtist(null);
                fetchSongs(query);
              }}
              className="absolute right-1 top-1 bottom-1 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-full transition"
            >
              Search
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-neutral-100 border-neutral-200'}`}>
              <button
                onClick={() => toggleLayout('grid')}
                className={`p-1.5 rounded-lg transition ${viewLayout === 'grid' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                title="Grid / Box Layout"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => toggleLayout('list')}
                className={`p-1.5 rounded-lg transition ${viewLayout === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-400'}`}
                title="List Layout"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-8 pt-6 z-10 overflow-y-auto no-scrollbar">
          
          {selectedArtist ? (
            <ArtistPage artistName={selectedArtist} onBack={() => setSelectedArtist(null)} />
          ) : activeTab === 'home' ? (
            <div>
              {/* TOP 6 PINNED QUICK ACCESS BOXES */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400 flex items-center gap-1.5 font-semibold">
                    <Pin size={12} className="text-indigo-500" /> Quick Access ({pinnedPlaylists.length}/6 Pinned)
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pinnedPlaylists.map((pl) => {
                    const isLoved = pl.isLoved;
                    return (
                      <div
                        key={pl.id}
                        onClick={() => {
                          if (isLoved) {
                            setActiveTab('liked');
                          } else {
                            setSelectedPlaylist(pl);
                            setActiveTab('playlists');
                          }
                        }}
                        className={`group relative flex items-center space-x-3 rounded-xl p-2.5 border cursor-pointer transition duration-200 overflow-hidden ${
                          isDark 
                            ? 'bg-[#13151f] hover:bg-[#181a27] border-white/5 hover:border-white/20' 
                            : 'bg-white hover:bg-neutral-50 border-neutral-200 shadow-sm'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ${
                          isLoved
                            ? 'bg-gradient-to-tr from-pink-500 to-rose-600'
                            : 'bg-gradient-to-tr from-indigo-500 to-purple-600'
                        }`}>
                          {isLoved ? <Heart size={18} className="fill-white" /> : <Music2 size={18} />}
                        </div>

                        <div className="truncate flex-1">
                          <h4 className="text-xs font-semibold truncate group-hover:text-indigo-500 transition">
                            {pl.name}
                          </h4>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{pl.count} tracks</p>
                        </div>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (pl.tracks && pl.tracks.length > 0) {
                              playTrack(pl.tracks[0], { isPlaylist: true, trackList: pl.tracks, playlistId: pl.id });
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition p-2 rounded-full bg-indigo-600 text-white shadow-md hover:scale-105"
                          title="Play Playlist"
                        >
                          <Play size={12} className="translate-x-0.5 fill-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DAILY TRENDING HEADER */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b pb-4 border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-amber-500" />
                  <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                    Daily Trending & Top Streams ({sortedTracks.length})
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">Sort Trending:</span>
                  <select
                    value={trendingSort}
                    onChange={(e) => setTrendingSort(e.target.value)}
                    className={`text-xs border rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      isDark ? 'bg-[#141620] text-neutral-200 border-white/10' : 'bg-white text-neutral-800 border-neutral-300'
                    }`}
                  >
                    <option value="daily_viral">🔥 Today's Viral Hot 50</option>
                    <option value="most_streamed">🎧 Most Listened Streams</option>
                    <option value="new_trending">🚀 New & Trending Releases</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className={viewLayout === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-2"}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={`rounded-2xl p-3.5 space-y-3 animate-pulse ${isDark ? 'bg-[#12141c] border border-white/5' : 'bg-neutral-200/60'}`}>
                      <div className="w-full aspect-square bg-white/5 rounded-xl" />
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                renderTracksView(sortedTracks, { isPlaylist: false, trackList: sortedTracks })
              )}
            </div>
          ) : activeTab === 'liked' ? (
            <div>
              <h2 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">Liked Songs ({likedSongs.length})</h2>
              {likedSongs.length === 0 ? (
                <p className="text-neutral-500 text-xs font-mono py-12">NO LIKED TRACKS SAVED.</p>
              ) : (
                renderTracksView(likedSongs, { isPlaylist: true, trackList: likedSongs, playlistId: 'liked' })
              )}
            </div>
          ) : activeTab === 'history' ? (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b pb-4 border-white/[0.08]">
                <div>
                  <h2 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    Listening History ({history.length})
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <CalendarClock size={14} className="text-neutral-400" />
                    <span className="text-[10px] font-mono uppercase text-neutral-400">Auto Clear:</span>
                    <select
                      value={historyRetention}
                      onChange={(e) => changeHistoryRetention(e.target.value)}
                      className={`text-xs border rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer ${
                        isDark ? 'bg-[#141620] text-neutral-200 border-white/10' : 'bg-white text-neutral-800 border-neutral-300'
                      }`}
                    >
                      <option value="never">Never (Keep Forever)</option>
                      <option value="1day">Everyday (After 24h)</option>
                      <option value="7days">Every 1 Week (7 Days)</option>
                      <option value="30days">Every 1 Month (30 Days)</option>
                      <option value="365days">Every 1 Year (365 Days)</option>
                    </select>
                  </div>

                  {history.length > 0 && (
                    <button
                      onClick={() => setIsConfirmClearOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Trash2 size={13} />
                      <span>Clear Now</span>
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <p className="text-neutral-500 text-xs font-mono py-12 text-center">NO PREVIOUS STREAMS FOUND.</p>
              ) : (
                renderTracksView(history, { isPlaylist: false, trackList: history })
              )}
            </div>
          ) : activeTab === 'playlists' ? (
            <div>
              {!selectedPlaylist ? (
                <div>
                  <h2 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">All Playlists</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className={`group relative border p-5 rounded-2xl cursor-pointer transition ${
                          isDark ? 'bg-[#12141c] border-white/5 hover:border-white/20' : 'bg-white border-neutral-200 hover:border-indigo-400 shadow-sm'
                        }`}
                      >
                        <div 
                          onClick={() => setSelectedPlaylist(pl)}
                          className="w-full aspect-square bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500 text-2xl mb-3"
                        >
                          <FolderPlus size={28} />
                        </div>
                        <h4 onClick={() => setSelectedPlaylist(pl)} className="font-semibold text-xs">{pl.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-neutral-400">{pl.tracks.length} tracks</p>
                          <button
                            onClick={() => togglePin(pl.id)}
                            className={`p-1 text-xs rounded transition ${pinnedIds.includes(pl.id) ? 'text-indigo-500 font-bold' : 'text-neutral-500 hover:text-white'}`}
                            title="Pin to Top Boxes"
                          >
                            <Pin size={12} className={pinnedIds.includes(pl.id) ? 'fill-indigo-500' : ''} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedPlaylist(null)} className="text-xs text-indigo-500 mb-4 font-semibold">
                    ← Back to Playlists
                  </button>
                  <h2 className="text-sm font-semibold mb-6">{selectedPlaylist.name}</h2>
                  {renderTracksView(selectedPlaylist.tracks, { isPlaylist: true, trackList: selectedPlaylist.tracks, playlistId: selectedPlaylist.id })}
                </div>
              )}
            </div>
          ) : activeTab === 'artists' ? (
            <div>
              <h2 className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">Following</h2>
              {followedArtists.length === 0 ? (
                <p className="text-neutral-500 text-xs font-mono py-12">NO ARTISTS FOLLOWED.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {followedArtists.map((art, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedArtist(art)}
                      className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition ${
                        isDark ? 'bg-[#12141c] border-white/5 hover:border-white/20' : 'bg-white border-neutral-200 hover:border-indigo-400'
                      }`}
                    >
                      <div>
                        <h4 className="font-semibold text-xs hover:text-indigo-500">{art}</h4>
                        <span className="text-[10px] text-neutral-400">View Artist Profile →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

        </main>
      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-all ${
            isDark ? 'bg-[#13151f] border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-sm font-bold text-center mb-1">Clear Listening History?</h3>
            <p className="text-xs text-neutral-400 text-center mb-6">
              Are you sure you want to delete all recently played tracks? This action cannot be undone.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsConfirmClearOpen(false)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300' : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  clearHistoryNow();
                  setIsConfirmClearOpen(false);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <TrackInfoSidebar />
      <PlayerBar />
    </div>
  );

  function renderTracksView(trackList, playContext) {
    if (viewLayout === 'list') {
      return (
        <div className="space-y-1.5">
          {trackList.map((track, idx) => {
            const active = currentTrack?.id === track.id;
            const isLiked = likedSongs.some((t) => t.id === track.id);

            return (
              <div
                key={track.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition ${
                  active
                    ? 'bg-indigo-600/15 border-indigo-500/50'
                    : isDark ? 'bg-[#11131a]/60 border-white/5 hover:border-white/15 hover:bg-white/[0.04]' : 'bg-white border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div
                  className="flex items-center space-x-3.5 flex-1 cursor-pointer truncate"
                  onClick={() => (active ? togglePlay() : playTrack(track, playContext))}
                >
                  <span className="w-5 text-center text-xs font-mono text-neutral-400">
                    {active && isPlaying ? <Play size={12} className="text-indigo-500 inline fill-current" /> : idx + 1}
                  </span>
                  <img src={track.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="truncate">
                    <h4 className={`text-xs font-medium truncate ${active ? 'text-indigo-500 font-bold' : ''}`}>
                      {track.title}
                    </h4>
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtist(track.artist);
                      }}
                      className="text-[10px] text-neutral-400 hover:text-indigo-500 truncate mt-0.5"
                    >
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-neutral-400 font-mono">
                  <button
                    onClick={() => toggleLike(track)}
                    className="text-neutral-400 hover:text-rose-500 transition"
                  >
                    <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                  <button
                    onClick={() => addToQueue(track)}
                    className="text-neutral-400 hover:text-indigo-500 transition"
                  >
                    <Plus size={14} />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {trackList.map((track) => {
          const active = currentTrack?.id === track.id;
          const isLiked = likedSongs.some((t) => t.id === track.id);
          const isFollowed = followedArtists.includes(track.artist);

          return (
            <div
              key={track.id}
              className={`group relative border rounded-2xl p-3 transition-all duration-200 flex flex-col justify-between ${
                active
                  ? 'border-indigo-500 shadow-md'
                  : isDark ? 'bg-[#11131a] border-white/[0.06] hover:border-white/20' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
              }`}
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-900">
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                
                <div
                  onClick={() => (active ? togglePlay() : playTrack(track, playContext))}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center font-bold text-sm shadow-xl hover:scale-105 transition">
                    {active && isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5 fill-current" />}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(track);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-neutral-400 hover:text-rose-500 transition"
                >
                  <Heart size={13} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                </button>
              </div>

              <div>
                <h3
                  onClick={() => playTrack(track, playContext)}
                  className="text-xs font-semibold truncate hover:text-indigo-500 cursor-pointer transition"
                >
                  {track.title}
                </h3>
                
                <div className="flex items-center justify-between mt-1">
                  <p
                    onClick={() => setSelectedArtist(track.artist)}
                    className="text-[10px] text-neutral-400 truncate max-w-[110px] hover:text-indigo-500 cursor-pointer transition"
                  >
                    {track.artist}
                  </p>
                  <button
                    onClick={() => toggleFollowArtist(track.artist)}
                    className={`text-[9px] px-2 py-0.5 rounded-full border transition ${
                      isFollowed
                        ? 'border-indigo-500/40 text-indigo-500 bg-indigo-500/10'
                        : isDark ? 'border-white/10 text-neutral-400' : 'border-neutral-300 text-neutral-600'
                    }`}
                  >
                    {isFollowed ? 'Following' : '+ Follow'}
                  </button>
                </div>

                <div className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-white/5' : 'border-neutral-100'}`}>
                  <button
                    onClick={() => addToQueue(track)}
                    className="text-neutral-400 hover:text-indigo-500 transition"
                  >
                    + Queue
                  </button>

                  {playlists.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addToPlaylist(e.target.value, track);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className={`text-[10px] focus:outline-none cursor-pointer bg-transparent text-neutral-400 hover:text-indigo-500`}
                    >
                      <option value="" disabled>+ List</option>
                      {playlists.map((pl) => (
                        <option key={pl.id} value={pl.id} className={isDark ? 'bg-[#141620] text-neutral-200' : 'bg-white text-neutral-800'}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}