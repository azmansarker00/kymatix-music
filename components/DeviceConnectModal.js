'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { 
  X, 
  Laptop, 
  Smartphone, 
  Cast, 
  Volume2, 
  Play, 
  Pause, 
  SkipForward, 
  Wifi, 
  CheckCircle2, 
  RefreshCw,
  Radio,
  Cpu
} from 'lucide-react';

// রাউটারের মতো ডিভাইসের সঠিক নাম এবং মডেল ডিটেক্ট করার ইঞ্জিন
function getPreciseDeviceIdentity() {
  if (typeof window === 'undefined' || !navigator) {
    return { name: 'Unknown Device', type: 'desktop', os: 'Web' };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  // 1. iPhone / iPad Detection
  if (/iPhone/i.test(ua)) {
    return { name: 'Apple iPhone (iOS)', type: 'mobile', os: 'iOS' };
  }
  if (/iPad/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return { name: 'Apple iPad (iPadOS)', type: 'mobile', os: 'iPadOS' };
  }

  // 2. Android Specific Model Detection (e.g. Pixel, Samsung, Xiaomi)
  if (/Android/i.test(ua)) {
    const androidMatch = ua.match(/Android\s+([0-9\.]+);?\s+([^;]+)\s+Build/i);
    let modelName = 'Android Device';
    if (androidMatch && androidMatch[2]) {
      modelName = androidMatch[2].trim();
      // clean generic build codes
      if (/Pixel/i.test(modelName)) modelName = 'Google Pixel';
      else if (/SM-/i.test(modelName)) modelName = 'Samsung Galaxy';
      else if (/Redmi|POCO|Mi/i.test(modelName)) modelName = 'Xiaomi / Redmi';
    }
    return { name: modelName, type: 'mobile', os: 'Android' };
  }

  // 3. Apple Mac Mini / MacBook Detection
  if (/Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua)) {
    return { name: 'Apple Mac (macOS Desktop)', type: 'desktop', os: 'macOS' };
  }

  // 4. Windows PC
  if (/Windows NT/i.test(ua)) {
    return { name: 'Windows PC (Desktop Engine)', type: 'desktop', os: 'Windows' };
  }

  // 5. Linux
  if (/Linux/i.test(platform)) {
    return { name: 'Linux Workstation', type: 'desktop', os: 'Linux' };
  }

  return { name: 'Web Connected Device', type: 'desktop', os: 'Browser' };
}

export default function DeviceConnectModal({ isOpen, onClose }) {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    handleNext,
    volume,
    changeVolume
  } = usePlayer() || {};

  const [deviceId, setDeviceId] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({ name: 'Detecting...', type: 'desktop', os: 'Web' });
  const [activeTarget, setActiveTarget] = useState('this-device');
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const heartbeatInterval = useRef(null);

  // ইনিশিয়ালাইজেশন এবং নিখুঁত ডিভাইস মডেল ডিটেকশন
  useEffect(() => {
    let id = localStorage.getItem('kymatix_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kymatix_device_id', id);
    }
    setDeviceId(id);

    const detected = getPreciseDeviceIdentity();
    setDeviceInfo(detected);
  }, []);

  // রিয়েল হার্টবিট পিং পাঠানো
  useEffect(() => {
    if (!deviceId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId,
            deviceName: deviceInfo.name,
            deviceType: deviceInfo.type,
            deviceOs: deviceInfo.os,
            currentTrack,
            isPlaying
          })
        });
      } catch {}
    };

    sendHeartbeat();
    heartbeatInterval.current = setInterval(sendHeartbeat, 3000);

    return () => clearInterval(heartbeatInterval.current);
  }, [deviceId, deviceInfo, currentTrack, isPlaying]);

  // অন্য কোনো সক্রিয় ডিভাইস চেক করা
  const fetchLiveDevices = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/connect', { cache: 'no-store' });
      const data = await res.json();
      const allDevs = Array.isArray(data.devices) ? data.devices : [];

      const otherActiveNodes = allDevs.filter(d => d.id && d.id !== deviceId);
      setDiscoveredDevices(otherActiveNodes);
    } catch {
      setDiscoveredDevices([]);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveDevices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#08090C]/85 backdrop-blur-[32px] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#1F1F23]/95 border border-white/15 rounded-[28px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2FE]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#571BC1]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30 flex items-center justify-center text-[#00F2FE]">
              <Cast size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Spotify Connect</h3>
              <p className="text-[10px] text-white/50 font-mono">Hardware Presence Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Playback Snapshot */}
        {currentTrack && (
          <div className="my-5 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 relative z-10">
            <img
              src={currentTrack.thumbnail || currentTrack.cover}
              alt=""
              className="w-11 h-11 rounded-xl object-cover shadow border border-white/10 shrink-0"
            />
            <div className="flex-1 truncate">
              <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-[10px] text-white/50 truncate">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-1.5 text-white shrink-0">
              <button onClick={togglePlay} className="p-2 hover:text-[#00F2FE] transition">
                {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
              </button>
              <button onClick={handleNext} className="p-2 hover:text-[#00F2FE] transition">
                <SkipForward size={16} className="fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* Device List Section */}
        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Connected Audio Devices</span>
            <button
              onClick={fetchLiveDevices}
              className="text-[10px] text-[#00F2FE] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Refresh'}</span>
            </button>
          </div>

          {/* 1. This Current Device (With Auto-Detected Hardware Name) */}
          <div
            onClick={() => setActiveTarget('this-device')}
            className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
              activeTarget === 'this-device'
                ? 'bg-[#571BC1]/30 border-[#00F2FE]/60 shadow-[0_0_20px_rgba(0,242,254,0.15)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl ${activeTarget === 'this-device' ? 'text-[#00F2FE] bg-[#00F2FE]/10' : 'text-white/60 bg-white/5'}`}>
                {deviceInfo.type === 'desktop' ? <Laptop size={20} /> : <Smartphone size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">
                    {deviceInfo.name}
                  </h4>
                  <span className="text-[9px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-mono">
                    This Device
                  </span>
                </div>
                <p className="text-[10px] text-[#00F2FE] mt-1 flex items-center gap-1.5 font-medium">
                  <Radio size={11} className="animate-pulse" />
                  <span>{isPlaying ? 'Currently Streaming' : 'Ready to Stream'}</span>
                </p>
              </div>
            </div>
            {activeTarget === 'this-device' && <CheckCircle2 size={18} className="text-[#00F2FE]" />}
          </div>

          {/* 2. Real Connected Other Devices */}
          {discoveredDevices.length === 0 ? (
            <div className="p-4 py-6 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
              <Wifi size={20} className="mx-auto text-white/30 mb-1.5" />
              <p className="text-xs text-white/60 font-medium">No other device detected on this Wi-Fi</p>
              <p className="text-[10px] text-white/40 mt-0.5">Open Kymatix on your iPhone, Android or PC to stream together.</p>
            </div>
          ) : (
            discoveredDevices.map((dev) => {
              const isSelected = activeTarget === dev.id;
              return (
                <div
                  key={dev.id}
                  onClick={() => setActiveTarget(dev.id)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#571BC1]/30 border-[#00F2FE]/60 shadow-[0_0_20px_rgba(0,242,254,0.15)]'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'text-[#00F2FE] bg-[#00F2FE]/10' : 'text-white/60 bg-white/5'}`}>
                      {dev.type === 'desktop' ? <Laptop size={20} /> : <Smartphone size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">
                          {dev.name}
                        </h4>
                        <span className="text-[9px] bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20 px-1.5 py-0.5 rounded-full font-mono">
                          Wi-Fi Active
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1.5">
                        <Wifi size={11} className="text-[#00F2FE]" />
                        <span>{dev.isPlaying ? `Playing: ${dev.currentTrack?.title || 'Track'}` : 'Idle on Network'}</span>
                      </p>
                    </div>
                  </div>

                  {isSelected && <CheckCircle2 size={18} className="text-[#00F2FE]" />}
                </div>
              );
            })
          )}
        </div>

        {/* Remote Volume Control */}
        <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="font-mono text-[10px] uppercase">Device Output Volume</span>
            <span className="font-mono text-[10px]">{volume}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Volume2 size={16} className="text-white/50" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => changeVolume && changeVolume(e.target.value)}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#00F2FE]"
            />
          </div>
        </div>

      </div>
    </div>
  );
}