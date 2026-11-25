import {
  applyCorsHeaders,
  getQueryParam,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/http';
import { searchItunesNormalized } from './_lib/itunes';
import { applyRateLimit } from './_lib/rateLimit';

const SHORT_CACHE_HEADER = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

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

  if (!applyRateLimit(req, res, { route: 'search', limit: 60, windowMs: 60_000 })) {
    return;
  }

  const query = getQueryParam(req, 'q').trim();
  if (!query || query.length > 200) {
    sendJson(res, 400, { error: 'Please provide a search query between 1 and 200 characters.' });
    return;
  }

  try {
    const items = await searchItunesNormalized(query, AbortSignal.timeout(8000));
    sendJson(
      res,
      200,
      {
        items,
        tracks: items.map((item) => item.track),
      },
      {
        'Cache-Control': SHORT_CACHE_HEADER,
      },
    );
  } catch (err) {
    const isTimeout = (err as Error)?.name === 'AbortError' || (err as Error)?.name === 'TimeoutError';
    sendJson(res, isTimeout ? 504 : 502, {
      error: isTimeout
        ? 'Music catalog search timed out. Please try again.'
        : 'Music catalog search is temporarily unavailable.',
    });
  }
}
