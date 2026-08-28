import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id') || searchParams.get('videoId');
  const directUrl = searchParams.get('url');

  if (directUrl) {
    return NextResponse.redirect(directUrl, { status: 307 });
  }

  if (!videoId) {
    return new NextResponse('Missing video ID or URL', { status: 400 });
  }

  // Audio stream resolver endpoint redirecting directly to audio source
  const fallbackAudio = `https://www.youtube.com/watch?v=${videoId}`;
  return NextResponse.json({ streamUrl: fallbackAudio, id: videoId });
}