import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id') || searchParams.get('videoId');
    const directUrl = searchParams.get('url');

    if (directUrl) {
      return NextResponse.redirect(directUrl, { status: 307 });
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }

    // পিউর অডিও স্ট্রিম ফেচ করার জন্য নির্ভরযোগ্য Piped ক্লাস্টার
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.privacydev.net',
      'https://piped-api.lunar.icu',
      'https://api.piped.projectsegfau.lt'
    ];

    let audioStreamUrl = null;
    let quality = '128 kbps';

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

        // ডাটা সাশ্রয়ী সেরা অডিও (m4a / 128kbps / 64kbps) বাছাই
        const bestAudio = audioStreams.find((s) => s.itag === 140 || s.quality === '128 kbps')
                       || audioStreams.find((s) => s.mimeType?.includes('audio/mp4') || s.mimeType?.includes('audio/webm'))
                       || audioStreams[0];

        if (bestAudio?.url) {
          audioStreamUrl = bestAudio.url;
          quality = bestAudio.quality || '128 kbps';
          break;
        }
      } catch (err) {
        continue;
      }
    }

    // ফলব্যাক সরাসরি অডিও
    if (!audioStreamUrl) {
      audioStreamUrl = `https://invidious.snopyta.org/latest_version?id=${videoId}&itag=140`;
    }

    return NextResponse.json({
      success: true,
      streamUrl: audioStreamUrl,
      quality: quality,
      format: 'audio-only',
      id: videoId
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve audio stream' }, { status: 500 });
  }
}