import {
  applyCorsHeaders,
  getQueryParam,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/http';
import { parseSpotifyTrackId, resolveSpotifyTrackServer } from './_lib/itunes';
import { applyRateLimit } from './_lib/rateLimit';

const SHORT_CACHE_HEADER = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  applyCorsHeaders(res, 'GET, OPTIONS');

  const method = (req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  if (!applyRateLimit(req, res, { route: 'resolve-link', limit: 60, windowMs: 60_000 })) {
    return;
  }

  const rawUrl = getQueryParam(req, 'url').trim();
  if (!rawUrl || rawUrl.length > 1024) {
    sendJson(res, 400, { error: 'Missing or invalid Spotify track URL.' });
    return;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      if (host !== 'open.spotify.com' && !host.endsWith('.spotify.com')) {
        sendJson(res, 400, { error: 'Only open.spotify.com track links are supported.' });
        return;
      }
    } catch {
      sendJson(res, 400, { error: 'Invalid Spotify track URL.' });
      return;
    }
  }

  const spotifyId = parseSpotifyTrackId(rawUrl);
  if (!spotifyId) {
    sendJson(res, 400, { error: 'Could not find a Spotify track ID in that link.' });
    return;
  }

  try {
    const track = await resolveSpotifyTrackServer(spotifyId, AbortSignal.timeout(8000));
    sendJson(
      res,
      200,
      { track },
      {
        'Cache-Control': SHORT_CACHE_HEADER,
      },
    );
  } catch (err) {
    const isTimeout = (err as Error)?.name === 'AbortError' || (err as Error)?.name === 'TimeoutError';
    sendJson(res, isTimeout ? 504 : 502, {
      error: isTimeout
        ? 'Spotify link lookup timed out. Please try searching by song title.'
        : 'Could not resolve that Spotify track link right now.',
    });
  }
}
