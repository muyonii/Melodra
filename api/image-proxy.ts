import {
  applyCorsHeaders,
  getQueryParam,
  sendBytes,
  sendJson,
  type ApiRequest,
  type ApiResponse,
} from './_lib/http';
import { applyRateLimit } from './_lib/rateLimit';
import { ProxyHttpError, safeFetchAllowlistedImage } from './_lib/security';

const LONG_CACHE_HEADER =
  'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800';
const CDN_CACHE_HEADER =
  'public, s-maxage=2592000, stale-while-revalidate=604800';

export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
): Promise<void> {
  applyCorsHeaders(res, 'GET, HEAD, OPTIONS');

  const method = (req.method || 'GET').toUpperCase();
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  if (!applyRateLimit(req, res, { route: 'image-proxy', limit: 120, windowMs: 60_000 })) {
    return;
  }

  const targetUrl = getQueryParam(req, 'url').trim();
  if (!targetUrl) {
    sendJson(res, 400, { error: 'Missing required "url" query parameter.' });
    return;
  }

  try {
    const { buffer, contentType } = await safeFetchAllowlistedImage(targetUrl);
    sendBytes(
      res,
      200,
      buffer,
      contentType,
      {
        'Cache-Control': LONG_CACHE_HEADER,
        'CDN-Cache-Control': CDN_CACHE_HEADER,
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
      method === 'HEAD',
    );
  } catch (err) {
    if (err instanceof ProxyHttpError) {
      sendJson(res, err.statusCode, { error: err.message });
      return;
    }
    sendJson(res, 502, { error: 'Could not proxy upstream image.' });
  }
}
