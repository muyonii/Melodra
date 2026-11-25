export interface NormalizedTrack {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  durationMs: number;
  spotifyId?: string;
}

export interface NormalizedSearchResultItem {
  id: string;
  track: NormalizedTrack;
  thumbUrl: string;
}

interface RawItunesItem {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
}

interface RawSpotifyOEmbed {
  title?: string;
  thumbnail_url?: string;
}

const SPOTIFY_TRACK_REGEX = /track\/([a-zA-Z0-9]{22})/;

export function parseSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = SPOTIFY_TRACK_REGEX.exec(trimmed);
  return match ? match[1] : null;
}

export function upgradeItunesArtworkUrl(artworkUrl100?: string): string {
  if (!artworkUrl100) return '';
  return artworkUrl100.replace('100x100bb', '3000x3000bb');
}

export function normalizeItunesItem(
  item: RawItunesItem,
  spotifyId?: string,
): NormalizedSearchResultItem {
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

export async function searchItunesNormalized(
  query: string,
  signal?: AbortSignal,
  fetchFn: typeof fetch = fetch,
): Promise<NormalizedSearchResultItem[]> {
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query.trim(),
  )}&entity=song&limit=6`;

  const response = await fetchFn(endpoint, {
    signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Melodra/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`iTunes search failed (${response.status})`);
  }

  const data = (await response.json()) as { results?: RawItunesItem[] };
  const results = Array.isArray(data.results) ? data.results : [];
  return results.slice(0, 6).map((item) => normalizeItunesItem(item));
}

export async function resolveSpotifyTrackServer(
  spotifyId: string,
  signal?: AbortSignal,
  fetchFn: typeof fetch = fetch,
): Promise<NormalizedTrack> {
  // Always construct canonical open.spotify.com URL instead of forwarding arbitrary user URLs
  const canonicalTrackUrl = `https://open.spotify.com/track/${spotifyId}`;
  const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalTrackUrl)}`;

  const oembedRes = await fetchFn(oembedUrl, {
    signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Melodra/1.0',
    },
  });

  if (!oembedRes.ok) {
    throw new Error(`Spotify oEmbed failed (${oembedRes.status})`);
  }

  const oembed = (await oembedRes.json()) as RawSpotifyOEmbed;
  const title = oembed.title?.trim();
  if (!title) {
    throw new Error('Spotify track title missing');
  }

  try {
    const matches = await searchItunesNormalized(title, signal, fetchFn);
    if (matches.length > 0) {
      const exact =
        matches.find((m) => m.track.title.toLowerCase() === title.toLowerCase()) ??
        matches[0];
      return {
        ...exact.track,
        spotifyId,
      };
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    // Fall back to oEmbed metadata while preserving spotifyId
  }

  return {
    title,
    artist: 'Spotify Track',
    album: '',
    coverUrl: oembed.thumbnail_url || '',
    durationMs: 210000,
    spotifyId,
  };
}
