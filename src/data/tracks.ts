import type { PlaylistMeta, Track } from '../types/poster';

export const MAX_PLAYLIST_TRACKS = 16;
export const MIN_PLAYLIST_TRACKS = 2;

export const SAMPLE_TRACKS: Track[] = [
  {
    title: 'Lily of the Valley',
    artist: 'DANIEL',
    album: 'Flower',
    coverUrl: '/src/assets/images/cover_lily_valley_1795531760152.jpg',
    durationMs: 208000,
  },
  {
    title: 'Concrete Rain',
    artist: 'Kaelen Voss',
    album: 'Nocturne IV',
    coverUrl: '/src/assets/images/cover_midnight_echo_1795531760896.jpg',
    durationMs: 254000,
  },
  {
    title: 'Basalt Mist',
    artist: 'Sora & The Tide',
    album: 'North Coast',
    coverUrl: '/src/assets/images/cover_velvet_horizon_1795531760756.jpg',
    durationMs: 195000,
  },
  {
    title: 'Amber Groove',
    artist: 'Julian Vance',
    album: 'Side B Sessions',
    coverUrl: '/src/assets/images/cover_amber_tape_1795531760968.jpg',
    durationMs: 282000,
  },
];

export const DEFAULT_PLAYLIST_TRACKS: Track[] = [
  ...SAMPLE_TRACKS,
  {
    title: 'Cobalt Swell',
    artist: 'Maren Lindqvist',
    album: 'Silver Horizon',
    coverUrl: '/src/assets/images/cover_cobalt_waves_1795566345743.jpg',
    durationMs: 231000,
  },
  {
    title: 'Brass at Midnight',
    artist: 'The Velvet Quartet',
    album: 'Blue Room Live',
    coverUrl: '/src/assets/images/cover_crimson_jazz_1795566346511.jpg',
    durationMs: 267000,
  },
  {
    title: 'Dune Mirage',
    artist: 'Nadia Solis',
    album: 'Silent Meridian',
    coverUrl: '/src/assets/images/cover_sand_dunes_1795566346856.jpg',
    durationMs: 214000,
  },
  {
    title: 'Neon Puddles',
    artist: 'Kenji Takahashi',
    album: 'After Midnight',
    coverUrl: '/src/assets/images/cover_neon_tokyo_rain_1795566347517.jpg',
    durationMs: 243000,
  },
];

export const DEFAULT_PLAYLIST_META: PlaylistMeta = {
  title: 'Late Night Pressings',
  subtitle: 'Curated analog & ambient cuts · Vol. 01',
};

export const DEFAULT_TRACK: Track = SAMPLE_TRACKS[0];
