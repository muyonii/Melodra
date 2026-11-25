# Melodra

Melodra turns any song or playlist into a print-ready poster (`1240×1754` logical canvas exported up to ~300 DPI PNG or PDF) with live room mockups and a local poster library.

## Local Development

### Option 1: Single-command Vite dev (default)
```bash
npm install
npm run dev
```
Vite runs on port `3000` and executes the TypeScript handlers in `/api/*.ts` directly via in-process SSR middleware when `VERCEL_DEV_URL` is unset.

### Option 2: Alongside `vercel dev`
Run Vercel's local serverless runtime on port `3001` and proxy `/api/*` from Vite on port `3000`:
```bash
vercel dev --listen 3001
VERCEL_DEV_URL=http://127.0.0.1:3001 npm run dev
```
`vercel.json` rewrites client-side SPA routes (`/templates`, `/library`, `/about`) to `/index.html` while keeping `/api/*` routed to Vercel serverless functions.

## Serverless API Routes (`/api`)

| Route | Method | Purpose | Cache Control |
| --- | --- | --- | --- |
| `/api/image-proxy?url=...` | `GET`, `HEAD` | Fetches allowlisted external cover art & Spotify scannable codes server-side with `Access-Control-Allow-Origin: *` so `<canvas>` exports and color extraction are never tainted. | `public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800` |
| `/api/search?q=...` | `GET` | Queries the iTunes Search API (`limit=6`) server-side and returns normalized `Track` objects and thumbnails. | `public, max-age=60, s-maxage=300, stale-while-revalidate=600` |
| `/api/resolve-link?url=...` | `GET` | Extracts a Spotify 22-character track ID, resolves metadata via Spotify oEmbed + iTunes enrichment, and returns a normalized `Track` with `spotifyId`. | `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` |

## Security & Reliability Decisions

- **Strict host allowlist & HTTPS enforcement**: `/api/image-proxy` only allows `https:` URLs to `is*.mzstatic.com`, `i.scdn.co`, `scannables.scdn.co`, and `mosaic.scdn.co`. All other hosts, non-HTTPS protocols, credentials, custom ports, and IP-literal URLs are rejected with `400`.
- **Private-network / SSRF protection**: DNS records are resolved before fetching and verified against private, loopback, link-local, metadata (`169.254.0.0/16`), CGNAT, and reserved IPv4/IPv6 ranges.
- **Manual redirect validation**: Upstream requests use `redirect: 'manual'` (up to 3 hops) and re-validate every `Location` target against the allowlist and IP rules before following.
- **Content-type, size cap & timeouts**: Upstream responses must declare an `image/*` MIME type, are capped at `10 MB` (checked via both `Content-Length` and streaming byte count), and time out after `8000 ms`.
- **Per-IP rate limiting**: All three routes share an in-memory per-IP rate limiter (`api/_lib/rateLimit.ts`) returning `429` with `Retry-After`. Note that this limiter is **per-instance and a placeholder**; use a shared store if global cross-instance enforcement is needed at scale.
- **Graceful client fallback**: If `/api/*` routes are unreachable or rate-limited, Melodra shows a toast and remains usable with local curated tracks, custom track creation, saved posters, and live poster customization.
