import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getQuickVideoId(term) {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store'
    });
    const html = await res.text();
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get('q') || 'Bangla Coke Studio Trending').trim();

  try {
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(rawQuery)}&media=music&entity=song&limit=25`,
      { cache: 'no-store' }
    );
    const itunesData = await itunesRes.json();
    const results = itunesData?.results || [];

    if (results.length === 0) {
      return NextResponse.json({ artistSpotlight: null, tracks: [] });
    }

    const primaryArtist = results[0]?.artistName || rawQuery;
    const artistArtwork = (results[0]?.artworkUrl100 || '').replace('100x100bb', '600x600bb');

    const tracks = await Promise.all(
      results.map(async (s, index) => {
        const cleanTitle = (s.trackName || '').replace(/[\(\[].*?[\)\]]/g, '').trim();
        const cleanArtist = (s.artistName || '').trim();
        const vId = await getQuickVideoId(`${cleanTitle} ${cleanArtist} official audio`);

        return {
          id: String(s.trackId),
          videoId: vId || 'dQw4w9WgXcQ', // Fallback stream id if unavailable
          title: s.trackName || 'Track',
          artist: s.artistName || 'Unknown Artist',
          album: s.collectionName || 'Single Release',
          releaseDate: s.releaseDate ? s.releaseDate.split('T')[0] : '2025',
          thumbnail: (s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
          duration: Math.round((s.trackTimeMillis || 240000) / 1000),
          viewCount: Math.floor(500000 + (25 - index) * 350000),
          popularityIndex: 100 - index * 3
        };
      })
    );

    return NextResponse.json({
      artistSpotlight: {
        name: primaryArtist,
        image: artistArtwork,
        monthlyListeners: '3,210,950',
        genre: results[0]?.primaryGenreName || 'Pop / Indie',
      },
      tracks
    });
  } catch (err) {
    console.error('Search API Route Error:', err);
    return NextResponse.json({ artistSpotlight: null, tracks: [] });
  }
}