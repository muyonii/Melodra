/**
 * Routes external http(s) artwork & scannable code URLs through `/api/image-proxy`
 * so cross-origin images carry `Access-Control-Allow-Origin: *` and never taint
 * `<canvas>` exports, color extraction, or pixel post-processing.
 *
 * Local bundled assets (`/src/assets/...`), `data:`, and `blob:` URLs pass through unchanged.
 */
export function proxifyImageUrl(url?: string | null): string {
  if (!url) {
    return '';
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/image-proxy') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}
