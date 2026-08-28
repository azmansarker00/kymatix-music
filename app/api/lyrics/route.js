import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawTitle = searchParams.get('title') || '';
  const rawArtist = searchParams.get('artist') || '';

  const cleanTitle = rawTitle.replace(/\[.*?\]|\(.*?\)|official|audio|video|lyrics/gi, '').trim();
  const cleanArtist = rawArtist.replace(/- Topic|VEVO/gi, '').trim();

  if (!cleanTitle) {
    return NextResponse.json({ lyrics: 'Track title is missing.' }, { status: 400 });
  }

  try {
    // 1. Fetch from lrclib.net via Server Side (No CORS issue)
    const lrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const lrcRes = await fetch(lrcUrl, {
      headers: { 'User-Agent': 'KymatixStudio/2.0' }
    });

    if (lrcRes.ok) {
      const data = await lrcRes.json();
      if (data.syncedLyrics || data.plainLyrics) {
        return NextResponse.json({
          synced: data.syncedLyrics || null,
          lyrics: data.plainLyrics || data.syncedLyrics
        });
      }
    }

    // 2. Fallback Search Query
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'KymatixStudio/2.0' }
    });

    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        const match = results[0];
        if (match.syncedLyrics || match.plainLyrics) {
          return NextResponse.json({
            synced: match.syncedLyrics || null,
            lyrics: match.plainLyrics || match.syncedLyrics
          });
        }
      }
    }

    return NextResponse.json({ lyrics: 'Instrumental Track / Lyrics not found.' });
  } catch (error) {
    console.error('Server Lyrics Fetch Error:', error);
    return NextResponse.json({ lyrics: 'Local network restriction or lyrics unavailable.' }, { status: 500 });
  }
}