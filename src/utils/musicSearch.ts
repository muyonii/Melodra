import type { Track } from '../types/poster';

export interface ItunesSearchItem {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
}

export interface SearchResultItem {
  id: string;
  track: Track;
  thumbUrl: string;
}

export interface SpotifyOEmbedResponse {
  title?: string;
  thumbnail_url?: string;
}

const SPOTIFY_TRACK_REGEX = /track\/([a-zA-Z0-9]{22})/;

export function extractSpotifyTrackId(input: string): string | null {
  const match = SPOTIFY_TRACK_REGEX.exec(input.trim());
  return match ? match[1] : null;
}

export function buildSpotifyOEmbedUrl(trackId: string): string {
  const canonicalTrackUrl = `https://open.spotify.com/track/${trackId}`;
  return `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalTrackUrl)}`;
}

export function buildSpotifyScannableUrl(spotifyId: string): string {
  return `https://scannables.scdn.co/uri/plain/png/000000/white/640/spotify:track:${spotifyId}`;
}

export function upgradeItunesArtworkUrl(artworkUrl100?: string): string {
  if (!artworkUrl100) {
    return '';
  }
  return artworkUrl100.replace('100x100bb', '3000x3000bb');
}

export function mapItunesItemToSearchResult(
  item: ItunesSearchItem,
  spotifyId?: string,
): SearchResultItem {
  const thumbUrl = item.artworkUrl100 || '';
  const coverUrl = upgradeItunesArtworkUrl(item.artworkUrl100);
  const title = item.trackName?.trim() || 'Untitled Track';
  const artist = item.artistName?.trim() || 'Unknown Artist';
  const album = item.collectionName?.trim() || '';
  const durationMs =
    typeof item.trackTimeMillis === 'number' && item.trackTimeMillis > 0
      ? item.trackTimeMillis
      : 210000;

  return {
    id: String(item.trackId ?? `${title}-${artist}-${durationMs}`),
    thumbUrl,
    track: {
      title,
      artist,
      album,
      coverUrl,
      durationMs,
      ...(spotifyId ? { spotifyId } : {}),
    },
  };
}

export class ApiLookupError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiLookupError';
    this.status = status;
  }
}

async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body?.error && typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Ignore non-JSON error bodies
  }
  return fallback;
}

export async function searchItunesSongs(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const endpoint = `/api/search?q=${encodeURIComponent(trimmed)}`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    const msg = await readApiErrorMessage(
      response,
      `Music search failed (${response.status})`,
    );
    throw new ApiLookupError(msg, response.status);
  }

  const data = (await response.json()) as {
    items?: SearchResultItem[];
    tracks?: Track[];
  };

  if (Array.isArray(data.items)) {
    return data.items.slice(0, 6);
  }

  if (Array.isArray(data.tracks)) {
    return data.tracks.slice(0, 6).map((track, idx) => ({
      id: `${track.title}-${track.artist}-${idx}`,
      thumbUrl: track.coverUrl,
      track,
    }));
  }

  return [];
}

export async function resolveSpotifyTrackLink(
  trackId: string,
  signal?: AbortSignal,
): Promise<Track> {
  const canonicalTrackUrl = `https://open.spotify.com/track/${trackId}`;
  const endpoint = `/api/resolve-link?url=${encodeURIComponent(canonicalTrackUrl)}`;

  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    const msg = await readApiErrorMessage(
      response,
      `Spotify link resolution unavailable (${response.status})`,
    );
    throw new ApiLookupError(msg, response.status);
  }

  const data = (await response.json()) as { track?: Track };
  if (!data?.track?.title) {
    throw new ApiLookupError('Resolved Spotify track metadata was incomplete.', 502);
  }

  return data.track;
}

export interface ParsedTrackLine {
  lineNumber: number;
  raw: string;
  title: string;
  artist: string;
  query: string;
}

export type BulkLineStatus = 'pending' | 'searching' | 'found' | 'not-found' | 'error';

export interface BulkLineResult {
  lineNumber: number;
  raw: string;
  status: BulkLineStatus;
  track?: Track;
  reason?: string;
}

export function parseTrackListLine(rawLine: string, lineNumber: number): ParsedTrackLine | null {
  const cleaned = rawLine
    .trim()
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^[-•*]\s+/, '')
    .trim();
  if (!cleaned) {
    return null;
  }

  const dashMatch = /^(.+?)\s+[-–—]\s+(.+)$/.exec(cleaned);
  if (dashMatch) {
    const title = dashMatch[1].trim();
    const artist = dashMatch[2].trim();
    return {
      lineNumber,
      raw: cleaned,
      title,
      artist,
      query: `${title} ${artist}`.trim(),
    };
  }

  return {
    lineNumber,
    raw: cleaned,
    title: cleaned,
    artist: '',
    query: cleaned,
  };
}

export async function resolveBulkTrackLines(
  parsedLines: ParsedTrackLine[],
  onProgress: (result: BulkLineResult) => void,
  signal?: AbortSignal,
): Promise<BulkLineResult[]> {
  const results: BulkLineResult[] = new Array(parsedLines.length);

  await Promise.all(
    parsedLines.map(async (item, index) => {
      if (signal?.aborted) {
        const aborted: BulkLineResult = {
          lineNumber: item.lineNumber,
          raw: item.raw,
          status: 'error',
          reason: 'Cancelled',
        };
        results[index] = aborted;
        return;
      }

      onProgress({
        lineNumber: item.lineNumber,
        raw: item.raw,
        status: 'searching',
      });

      try {
        const spotifyId = extractSpotifyTrackId(item.raw);
        if (spotifyId) {
          const track = await resolveSpotifyTrackLink(spotifyId, signal);
          const found: BulkLineResult = {
            lineNumber: item.lineNumber,
            raw: item.raw,
            status: 'found',
            track,
          };
          results[index] = found;
          onProgress(found);
          return;
        }

        const matches = await searchItunesSongs(item.query, signal);
        if (matches.length === 0) {
          const missing: BulkLineResult = {
            lineNumber: item.lineNumber,
            raw: item.raw,
            status: 'not-found',
            reason: 'No matching song found',
          };
          results[index] = missing;
          onProgress(missing);
          return;
        }

        const artistLower = item.artist.toLowerCase();
        const titleLower = item.title.toLowerCase();
        const exact =
          matches.find(
            (m) =>
              m.track.title.toLowerCase() === titleLower &&
              (!artistLower || m.track.artist.toLowerCase().includes(artistLower)),
          ) ??
          matches.find(
            (m) => artistLower && m.track.artist.toLowerCase().includes(artistLower),
          ) ??
          matches[0];

        const found: BulkLineResult = {
          lineNumber: item.lineNumber,
          raw: item.raw,
          status: 'found',
          track: exact.track,
        };
        results[index] = found;
        onProgress(found);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        const errored: BulkLineResult = {
          lineNumber: item.lineNumber,
          raw: item.raw,
          status: 'error',
          reason: 'Lookup failed',
        };
        results[index] = errored;
        onProgress(errored);
      }
    }),
  );

  return results;
}

