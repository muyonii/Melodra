import type { ComponentType } from 'react';

export interface Track {
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  durationMs: number;
  spotifyId?: string;
}

export interface PlaylistMeta {
  title: string;
  subtitle: string;
}

export type PosterFont =
  | 'Inter'
  | 'Plus Jakarta Sans'
  | 'Outfit'
  | 'Playfair Display'
  | 'Space Mono';

export type PosterTheme = 'dark' | 'light' | 'midnight';

export interface Tokens {
  blur: number;
  brightness: number;
  glassOpacity: number;
  radius: number;
  font: PosterFont;
  accent: string;
  /** Current scrubber position in seconds (e.g. 72 -> 01:12) */
  timestamp: number;
  showDuration: boolean;
  showHeart: boolean;
  showAlbum: boolean;
  showCode: boolean;
  theme: PosterTheme;
  autoTheme?: boolean;
  /** Comma-separated RGB triplet derived from cover artwork (e.g. "62, 118, 84") */
  glassTint?: string;
  /** Multi-track optional layout tokens */
  columns?: 2 | 3 | 4;
  showNumbers?: boolean;
  showDurations?: boolean;
  showCovers?: boolean;
  gap?: number;
  titleSize?: number;
}

export interface PosterRenderProps {
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  tokens: Tokens;
  codeUrl?: string;
  onUploadCode?: (dataUrl: string) => void;
  onCodeLoadError?: () => void;
  onChangeMeta?: (patch: Partial<PlaylistMeta>) => void;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  multiTrack?: boolean;
  size: { w: number; h: number };
  defaults: Tokens;
  controls: (keyof Tokens)[];
  Render: ComponentType<PosterRenderProps>;
}

export interface SavedPoster {
  id: string;
  name: string;
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  templateId: string;
  tokens: Tokens;
  codeImageDataUrl?: string;
  createdAt: number;
  updatedAt: number;
  thumbnail: string;
}

export interface PosterDraft {
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  templateId: string;
  tokensByTemplate: Record<string, Tokens>;
  customCodeUrl?: string | null;
  activePosterId?: string | null;
  updatedAt: number;
}
