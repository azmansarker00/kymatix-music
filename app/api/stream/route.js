import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id') || searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }

    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.privacydev.net',
      'https://piped-api.lunar.icu',
      'https://api.piped.projectsegfau.lt'
    ];

    let audioStreamUrl = null;

    for (const instance of pipedInstances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${instance}/streams/${videoId}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store'
        });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const data = await res.json();
        const audioStreams = data.audioStreams || [];
        const bestAudio = audioStreams.find((s) => s.itag === 140 || s.quality === '128 kbps')
                       || audioStreams.find((s) => s.mimeType?.includes('audio'))
                       || audioStreams[0];

        if (bestAudio?.url) {
          audioStreamUrl = bestAudio.url;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!audioStreamUrl) {
      audioStreamUrl = `https://invidious.snopyta.org/latest_version?id=${videoId}&itag=140`;
    }

    return NextResponse.json({ success: true, streamUrl: audioStreamUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve stream' }, { status: 500 });
  }
}