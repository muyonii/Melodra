import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSpotifyOEmbedUrl,
  buildSpotifyScannableUrl,
  extractSpotifyTrackId,
  mapItunesItemToSearchResult,
  parseTrackListLine,
  resolveBulkTrackLines,
  upgradeItunesArtworkUrl,
  type BulkLineResult,
} from './musicSearch';

test('extractSpotifyTrackId parses standard, intl, and query-param Spotify URLs', () => {
  assert.equal(
    extractSpotifyTrackId('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=12345'),
    '4uLU6hMCjMI75M1A2tKUQC',
  );
  assert.equal(
    extractSpotifyTrackId('https://open.spotify.com/intl-fr/track/2TpxZ7JUBn3uw46aR7qd6V'),
    '2TpxZ7JUBn3uw46aR7qd6V',
  );
  assert.equal(extractSpotifyTrackId('https://open.spotify.com/album/2TpxZ7JUBn3uw46aR7qd6V'), null);
  assert.equal(extractSpotifyTrackId('Lily of the Valley'), null);
});

test('buildSpotifyOEmbedUrl and buildSpotifyScannableUrl construct expected URLs', () => {
  assert.equal(
    buildSpotifyOEmbedUrl('4uLU6hMCjMI75M1A2tKUQC'),
    'https://open.spotify.com/oembed?url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F4uLU6hMCjMI75M1A2tKUQC',
  );
  assert.equal(
    buildSpotifyScannableUrl('4uLU6hMCjMI75M1A2tKUQC'),
    'https://scannables.scdn.co/uri/plain/png/000000/white/640/spotify:track:4uLU6hMCjMI75M1A2tKUQC',
  );
});

test('upgradeItunesArtworkUrl replaces 100x100bb with 3000x3000bb', () => {
  const small =
    'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ce/6d/5b/ce6d5b48/0859381157694.jpg/100x100bb.jpg';
  assert.equal(
    upgradeItunesArtworkUrl(small),
    'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ce/6d/5b/ce6d5b48/0859381157694.jpg/3000x3000bb.jpg',
  );
  assert.equal(upgradeItunesArtworkUrl(undefined), '');
});

test('mapItunesItemToSearchResult maps metadata, durationMs, artwork, and optional spotifyId', () => {
  const res = mapItunesItemToSearchResult(
    {
      trackId: 1559885421,
      trackName: 'Never Gonna Give You Up',
      artistName: 'Rick Astley',
      collectionName: 'Whenever You Need Somebody',
      artworkUrl100: 'https://example.com/100x100bb.jpg',
      trackTimeMillis: 213573,
    },
    '4uLU6hMCjMI75M1A2tKUQC',
  );

  assert.equal(res.thumbUrl, 'https://example.com/100x100bb.jpg');
  assert.equal(res.track.title, 'Never Gonna Give You Up');
  assert.equal(res.track.artist, 'Rick Astley');
  assert.equal(res.track.album, 'Whenever You Need Somebody');
  assert.equal(res.track.coverUrl, 'https://example.com/3000x3000bb.jpg');
  assert.equal(res.track.durationMs, 213573);
  assert.equal(res.track.spotifyId, '4uLU6hMCjMI75M1A2tKUQC');
});

test('parseTrackListLine strips numbering/bullets and splits "Title - Artist"', () => {
  assert.equal(parseTrackListLine('   ', 1), null);
  assert.deepEqual(parseTrackListLine('1. Midnight City - M83', 1), {
    lineNumber: 1,
    raw: 'Midnight City - M83',
    title: 'Midnight City',
    artist: 'M83',
    query: 'Midnight City M83',
  });
  assert.deepEqual(parseTrackListLine('- Redbone — Childish Gambino', 2), {
    lineNumber: 2,
    raw: 'Redbone — Childish Gambino',
    title: 'Redbone',
    artist: 'Childish Gambino',
    query: 'Redbone Childish Gambino',
  });
  assert.deepEqual(parseTrackListLine('Nights', 3), {
    lineNumber: 3,
    raw: 'Nights',
    title: 'Nights',
    artist: '',
    query: 'Nights',
  });
});

test('resolveBulkTrackLines resolves matches and reports not-found lines with progress', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('Midnight')) {
      return new Response(
        JSON.stringify({
          results: [
            {
              trackId: 101,
              trackName: 'Midnight City',
              artistName: 'M83',
              collectionName: "Hurry Up, We're Dreaming",
              artworkUrl100: 'https://example.com/m83/100x100bb.jpg',
              trackTimeMillis: 243000,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const lines = [
      parseTrackListLine('1. Midnight City - M83', 1)!,
      parseTrackListLine('2. Unknown Song - Nobody', 2)!,
    ];
    const progressEvents: BulkLineResult[] = [];
    const resolved = await resolveBulkTrackLines(lines, (ev) => progressEvents.push(ev));

    assert.equal(resolved.length, 2);
    assert.equal(resolved[0].status, 'found');
    assert.equal(resolved[0].track?.title, 'Midnight City');
    assert.equal(resolved[0].track?.coverUrl, 'https://example.com/m83/3000x3000bb.jpg');
    assert.equal(resolved[1].status, 'not-found');
    assert.ok(progressEvents.some((ev) => ev.status === 'searching' && ev.lineNumber === 1));
    assert.ok(progressEvents.some((ev) => ev.status === 'found' && ev.lineNumber === 1));
    assert.ok(progressEvents.some((ev) => ev.status === 'not-found' && ev.lineNumber === 2));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
