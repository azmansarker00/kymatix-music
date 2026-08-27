'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { X, Moon, Sun, LayoutGrid, List, Zap, Sliders } from 'lucide-react';

export default function SettingsModal() {
  const {
    theme,
    toggleTheme,
    viewLayout,
    toggleLayout,
    is2GMode,
    setIs2GMode,
    isSettingsOpen,
    setIsSettingsOpen,
  } = usePlayer();

  if (!isSettingsOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all ${
        isDark ? 'bg-[#12141c] border-white/10 text-white' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-indigo-500" />
            <h3 className="font-bold text-sm tracking-wide">Studio Settings</h3>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className={`p-1.5 rounded-full transition ${isDark ? 'hover:bg-white/10 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-600'}`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Appearance Theme */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 block">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleTheme('dark')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-xs font-semibold transition ${
                  theme === 'dark'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : isDark ? 'bg-white/5 border-white/10 text-neutral-400 hover:text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                <Moon size={15} />
                <span>Matte Dark</span>
              </button>

              <button
                onClick={() => toggleTheme('light')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : isDark ? 'bg-white/5 border-white/10 text-neutral-400 hover:text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                <Sun size={15} />
                <span>Clean Light</span>
              </button>
            </div>
          </div>

          {/* Song Card Layout */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 block">
              Default Display Layout
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => toggleLayout('grid')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-xs font-semibold transition ${
                  viewLayout === 'grid'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : isDark ? 'bg-white/5 border-white/10 text-neutral-400 hover:text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                <LayoutGrid size={15} />
                <span>Box (Grid)</span>
              </button>

              <button
                onClick={() => toggleLayout('list')}
                className={`flex items-center justify-center space-x-2 py-3 rounded-2xl border text-xs font-semibold transition ${
                  viewLayout === 'list'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : isDark ? 'bg-white/5 border-white/10 text-neutral-400 hover:text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                <List size={15} />
                <span>List Rows</span>
              </button>
            </div>
          </div>

          {/* Bandwidth / 2G Toggle */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold">2G Ultra Saver Streaming</h4>
                <p className="text-[10px] text-neutral-400">Reduce buffering on slow or weak networks</p>
              </div>
            </div>
            <button
              onClick={() => setIs2GMode(!is2GMode)}
              className={`w-11 h-6 rounded-full transition relative p-0.5 ${is2GMode ? 'bg-emerald-500' : 'bg-neutral-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${is2GMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}