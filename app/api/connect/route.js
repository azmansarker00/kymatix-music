import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ইন-মেমোরি অ্যাক্টিভ ডিভাইস রেজিস্ট্রি
let activeDevices = new Map();

// ৫ সেকেন্ডের বেশি রেসপন্স না পাওয়া ডিভাইসগুলো রিমুভ করার সুইপার
function cleanStaleDevices() {
  const now = Date.now();
  for (const [id, dev] of activeDevices.entries()) {
    if (now - dev.lastSeen > 6000) {
      activeDevices.delete(id);
    }
  }
}

// 1. সক্রিয় ডিভাইসগুলোর লিস্ট ফেচ করা
export async function GET(request) {
  cleanStaleDevices();
  const list = Array.from(activeDevices.values());
  return NextResponse.json({ devices: list });
}

// 2. হার্টবিট / স্ট্যাটাস পিং ও গান সিঙ্ক পাঠানো
export async function POST(request) {
  try {
    const body = await request.json();
    const { deviceId, deviceName, deviceType, currentTrack, isPlaying } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    activeDevices.set(deviceId, {
      id: deviceId,
      name: deviceName || 'Kymatix Node',
      type: deviceType || 'desktop',
      currentTrack: currentTrack || null,
      isPlaying: Boolean(isPlaying),
      lastSeen: Date.now()
    });

    cleanStaleDevices();
    return NextResponse.json({ success: true, count: activeDevices.size });
  } catch {
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}