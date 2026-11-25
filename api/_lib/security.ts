import dns from 'node:dns/promises';
import net from 'node:net';

export const IMAGE_PROXY_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const IMAGE_PROXY_TIMEOUT_MS = 8000;
export const IMAGE_PROXY_MAX_REDIRECTS = 3;

const EXACT_ALLOWED_IMAGE_HOSTS = new Set([
  'i.scdn.co',
  'scannables.scdn.co',
  'mosaic.scdn.co',
]);

const MZSTATIC_HOST_REGEX = /^is[a-z0-9-]*\.mzstatic\.com$/;

export class ProxyHttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ProxyHttpError';
    this.statusCode = statusCode;
  }
}

export function isAllowlistedImageHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized || normalized.endsWith('.')) {
    return false;
  }
  return EXACT_ALLOWED_IMAGE_HOSTS.has(normalized) || MZSTATIC_HOST_REGEX.test(normalized);
}

function parseIpv4Octets(ip: string): [number, number, number, number] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    nums.push(n);
  }
  return [nums[0], nums[1], nums[2], nums[3]];
}

function isBlockedIpv4(ip: string): boolean {
  const octets = parseIpv4Octets(ip);
  if (!octets) return true;
  const [a, b, c] = octets;

  if (a === 0) return true; // 0.0.0.0/8 ("this network")
  if (a === 10) return true; // 10.0.0.0/8 (RFC1918)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true; // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local + cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (RFC1918)
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && c === 2) return true; // TEST-NET-1
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 (RFC1918)
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 (benchmarking)
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // Multicast (224/4) & reserved/broadcast (240/4)

  return false;
}

function parseIpv6Hextets(ip: string): number[] | null {
  const zoneIdx = ip.indexOf('%');
  const clean = zoneIdx >= 0 ? ip.slice(0, zoneIdx) : ip;

  // Handle trailing dotted IPv4 embedded in IPv6 (e.g. ::ffff:127.0.0.1)
  const lastColon = clean.lastIndexOf(':');
  let working = clean;
  if (lastColon !== -1 && clean.slice(lastColon + 1).includes('.')) {
    const embeddedV4 = parseIpv4Octets(clean.slice(lastColon + 1));
    if (!embeddedV4) return null;
    const high = ((embeddedV4[0] << 8) | embeddedV4[1]).toString(16);
    const low = ((embeddedV4[2] << 8) | embeddedV4[3]).toString(16);
    working = `${clean.slice(0, lastColon)}:${high}:${low}`;
  }

  const halves = working.split('::');
  if (halves.length > 2) return null;

  const parsePart = (part: string): number[] | null => {
    if (!part) return [];
    const tokens = part.split(':');
    const out: number[] = [];
    for (const token of tokens) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(token)) return null;
      out.push(Number.parseInt(token, 16));
    }
    return out;
  };

  if (halves.length === 1) {
    const full = parsePart(halves[0]);
    return full && full.length === 8 ? full : null;
  }

  const left = parsePart(halves[0]);
  const right = parsePart(halves[1]);
  if (!left || !right) return null;
  const missing = 8 - (left.length + right.length);
  if (missing < 1) return null;

  return [...left, ...new Array<number>(missing).fill(0), ...right];
}

function isBlockedIpv6(ip: string): boolean {
  const hextets = parseIpv6Hextets(ip);
  if (!hextets) return true;

  const allZero = hextets.every((h) => h === 0);
  if (allZero) return true; // :: unspecified

  const isLoopback =
    hextets.slice(0, 7).every((h) => h === 0) && hextets[7] === 1;
  if (isLoopback) return true; // ::1

  const h0 = hextets[0];
  if ((h0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((h0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((h0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (h0 === 0x0100 && hextets[1] === 0 && hextets[2] === 0 && hextets[3] === 0) {
    return true; // 100::/64 discard prefix
  }

  // ::ffff:0:0/96 IPv4-mapped IPv6
  const isV4Mapped =
    hextets[0] === 0 &&
    hextets[1] === 0 &&
    hextets[2] === 0 &&
    hextets[3] === 0 &&
    hextets[4] === 0 &&
    hextets[5] === 0xffff;
  if (isV4Mapped) {
    const v4 = `${(hextets[6] >> 8) & 0xff}.${hextets[6] & 0xff}.${(hextets[7] >> 8) & 0xff}.${hextets[7] & 0xff}`;
    return isBlockedIpv4(v4);
  }

  // ::/96 IPv4-compatible IPv6
  const isV4Compatible = hextets.slice(0, 6).every((h) => h === 0);
  if (isV4Compatible) {
    const v4 = `${(hextets[6] >> 8) & 0xff}.${hextets[6] & 0xff}.${(hextets[7] >> 8) & 0xff}.${hextets[7] & 0xff}`;
    return isBlockedIpv4(v4);
  }

  // 2002::/16 6to4 embedded IPv4
  if (h0 === 0x2002) {
    const v4 = `${(hextets[1] >> 8) & 0xff}.${hextets[1] & 0xff}.${(hextets[2] >> 8) & 0xff}.${hextets[2] & 0xff}`;
    if (isBlockedIpv4(v4)) return true;
  }

  return false;
}

export function isBlockedIp(rawIp: string): boolean {
  const trimmed = rawIp.trim().replace(/^\[|\]$/g, '');
  const version = net.isIP(trimmed.split('%')[0] ?? '');
  if (version === 4) {
    return isBlockedIpv4(trimmed);
  }
  if (version === 6) {
    return isBlockedIpv6(trimmed);
  }
  return true;
}

export function validateExternalImageUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 2048) {
    throw new ProxyHttpError('Missing or invalid image url parameter.', 400);
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ProxyHttpError('Invalid image URL.', 400);
  }

  if (parsed.protocol !== 'https:') {
    throw new ProxyHttpError('Only HTTPS image URLs are allowed.', 400);
  }

  if (parsed.username || parsed.password) {
    throw new ProxyHttpError('Credentials in image URLs are not allowed.', 400);
  }

  if (parsed.port && parsed.port !== '443') {
    throw new ProxyHttpError('Custom ports are not allowed.', 400);
  }

  const hostWithoutBrackets = parsed.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostWithoutBrackets) !== 0) {
    throw new ProxyHttpError('IP-literal image URLs are not allowed.', 400);
  }

  if (!isAllowlistedImageHost(parsed.hostname)) {
    throw new ProxyHttpError('Image host is not in the allowlist.', 400);
  }

  return parsed;
}

export type DnsLookupAllFn = (
  hostname: string,
  options: { all: true; verbatim?: boolean },
) => Promise<Array<{ address: string; family: number }>>;

export async function assertPublicDns(
  hostname: string,
  lookupFn: DnsLookupAllFn = (host, opts) => dns.lookup(host, opts),
): Promise<void> {
  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookupFn(hostname, { all: true, verbatim: true });
  } catch {
    throw new ProxyHttpError('Could not resolve upstream image host.', 400);
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new ProxyHttpError('Upstream image host resolved to no addresses.', 400);
  }

  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new ProxyHttpError('Upstream host resolves to a restricted network address.', 400);
    }
  }
}

export interface SafeFetchImageDeps {
  fetchFn?: typeof fetch;
  lookupFn?: DnsLookupAllFn;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

export interface SafeFetchedImage {
  buffer: Buffer;
  contentType: string;
}

async function readStreamWithLimit(
  response: Response,
  maxBytes: number,
  abortController: AbortController,
): Promise<Buffer> {
  if (!response.body) {
    const ab = await response.arrayBuffer();
    if (ab.byteLength > maxBytes) {
      throw new ProxyHttpError('Image exceeds maximum 10MB limit.', 413);
    }
    return Buffer.from(ab);
  }

  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maxBytes) {
      abortController.abort();
      await reader.cancel().catch(() => {});
      throw new ProxyHttpError('Image exceeds maximum 10MB limit.', 413);
    }
    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks, total);
}

export async function safeFetchAllowlistedImage(
  rawUrl: string,
  deps: SafeFetchImageDeps = {},
): Promise<SafeFetchedImage> {
  const fetchFn = deps.fetchFn ?? fetch;
  const lookupFn = deps.lookupFn;
  const maxBytes = deps.maxBytes ?? IMAGE_PROXY_MAX_BYTES;
  const timeoutMs = deps.timeoutMs ?? IMAGE_PROXY_TIMEOUT_MS;
  const maxRedirects = deps.maxRedirects ?? IMAGE_PROXY_MAX_REDIRECTS;

  let currentUrl = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const validatedUrl = validateExternalImageUrl(currentUrl);
    await assertPublicDns(validatedUrl.hostname, lookupFn);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(validatedUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'image/*',
          'User-Agent': 'Melodra-ImageProxy/1.0',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await response.body?.cancel().catch(() => {});
        if (!location) {
          throw new ProxyHttpError('Upstream redirect missing Location header.', 400);
        }
        const resolvedRedirect = new URL(location, validatedUrl).toString();
        // Enforce allowlist/HTTPS/IP rules on the redirect target immediately
        validateExternalImageUrl(resolvedRedirect);
        currentUrl = resolvedRedirect;
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new ProxyHttpError(
          'Upstream image could not be retrieved.',
          response.status >= 400 && response.status < 500 ? 404 : 502,
        );
      }

      const rawContentType = response.headers.get('content-type') || '';
      const mediaType = rawContentType.split(';')[0]?.trim().toLowerCase() || '';
      if (!mediaType.startsWith('image/')) {
        await response.body?.cancel().catch(() => {});
        throw new ProxyHttpError('Upstream resource is not an image.', 400);
      }

      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const declaredLength = Number(contentLengthHeader);
        if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
          await response.body?.cancel().catch(() => {});
          throw new ProxyHttpError('Image exceeds maximum 10MB limit.', 413);
        }
      }

      const buffer = await readStreamWithLimit(response, maxBytes, controller);
      return {
        buffer,
        contentType: mediaType,
      };
    } catch (err) {
      if (err instanceof ProxyHttpError) {
        throw err;
      }
      if ((err as Error)?.name === 'AbortError') {
        throw new ProxyHttpError('Upstream image request timed out.', 504);
      }
      throw new ProxyHttpError('Upstream image fetch failed.', 502);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new ProxyHttpError('Too many upstream redirects.', 400);
}
