import { getTemplateById } from '../../templates';
import type { PlaylistMeta, PosterDraft, SavedPoster, Tokens, Track } from '../types/poster';

export const LIBRARY_STORAGE_KEY = 'melodra.library.v1';
export const DRAFT_STORAGE_KEY = 'melodra.draft.v1';

export type PosterSortOption = 'newest' | 'name';

export interface SavePosterInput {
  id?: string | null;
  name?: string;
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  templateId: string;
  tokens: Tokens;
  codeImageDataUrl?: string;
  thumbnail: string;
}

export interface SavePosterResult {
  poster: SavedPoster;
  updatedExisting: boolean;
}

export interface DeletePosterResult {
  deleted: SavedPoster;
  previousIndex: number;
}

export class PosterStorageQuotaError extends Error {
  constructor(
    message = 'Browser storage is full. Delete unused posters from My Posters to free space.',
  ) {
    super(message);
    this.name = 'PosterStorageQuotaError';
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof PosterStorageQuotaError) return true;
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    );
  }
  if (error && typeof error === 'object') {
    const record = error as { name?: unknown; code?: unknown; message?: unknown };
    if (
      record.name === 'QuotaExceededError' ||
      record.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      record.code === 22 ||
      record.code === 1014
    ) {
      return true;
    }
    if (typeof record.message === 'string' && /quota/i.test(record.message)) {
      return true;
    }
  }
  return false;
}

export interface PosterStorageAdapter {
  listPosters(): Promise<SavedPoster[]>;
  getPoster(id: string): Promise<SavedPoster | null>;
  savePoster(input: SavePosterInput): Promise<SavePosterResult>;
  renamePoster(id: string, name: string): Promise<SavedPoster | null>;
  duplicatePoster(id: string): Promise<SavedPoster | null>;
  deletePoster(id: string): Promise<DeletePosterResult | null>;
  restorePoster(poster: SavedPoster, index?: number): Promise<void>;
  loadDraft(): Promise<PosterDraft | null>;
  loadDraftSync?(): PosterDraft | null;
  listPostersSync?(): SavedPoster[];
  saveDraft(draft: PosterDraft): Promise<void>;
  clearDraft(): Promise<void>;
}

export function defaultPosterName(track: Pick<Track, 'title' | 'artist'>): string {
  const title = track.title.trim() || 'Untitled';
  const artist = track.artist.trim() || 'Unknown Artist';
  return `${title} - ${artist}`;
}

export function sortPosters(posters: SavedPoster[], sortBy: PosterSortOption): SavedPoster[] {
  const copy = [...posters];
  if (sortBy === 'name') {
    copy.sort((a, b) => {
      const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return b.updatedAt - a.updatedAt;
    });
    return copy;
  }
  copy.sort((a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt);
  return copy;
}

export function filterPosters(posters: SavedPoster[], query: string): SavedPoster[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return posters;
  return posters.filter((poster) => {
    const templateName = getTemplateById(poster.templateId).name.toLowerCase();
    const matchesMeta =
      poster.meta?.title.toLowerCase().includes(trimmed) ||
      poster.meta?.subtitle.toLowerCase().includes(trimmed);
    const matchesTracks = poster.tracks?.some(
      (item) =>
        item.title.toLowerCase().includes(trimmed) ||
        item.artist.toLowerCase().includes(trimmed) ||
        item.album.toLowerCase().includes(trimmed),
    );
    return (
      poster.name.toLowerCase().includes(trimmed) ||
      poster.track.title.toLowerCase().includes(trimmed) ||
      poster.track.artist.toLowerCase().includes(trimmed) ||
      poster.track.album.toLowerCase().includes(trimmed) ||
      Boolean(matchesMeta) ||
      Boolean(matchesTracks) ||
      templateName.includes(trimmed) ||
      poster.templateId.toLowerCase().includes(trimmed)
    );
  });
}

function generatePosterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `poster_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeDuplicateName(baseName: string, existing: SavedPoster[]): string {
  const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));
  const stripped = baseName.trim() || 'Untitled Poster';
  const firstCandidate = `${stripped} (Copy)`;
  if (!existingNames.has(firstCandidate.toLowerCase())) {
    return firstCandidate;
  }
  let counter = 2;
  while (existingNames.has(`${stripped} (Copy ${counter})`.toLowerCase())) {
    counter += 1;
  }
  return `${stripped} (Copy ${counter})`;
}

function isValidTrackItem(item: unknown): item is Track {
  if (!item || typeof item !== 'object') return false;
  const t = item as Partial<Track>;
  return typeof t.title === 'string' && typeof t.coverUrl === 'string';
}

function isValidSavedPoster(item: unknown): item is SavedPoster {
  if (!item || typeof item !== 'object') return false;
  const p = item as Partial<SavedPoster>;
  const tracksValid = p.tracks === undefined || (Array.isArray(p.tracks) && p.tracks.every(isValidTrackItem));
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.templateId === 'string' &&
    isValidTrackItem(p.track) &&
    tracksValid &&
    Boolean(p.tokens && typeof p.tokens === 'object') &&
    typeof p.createdAt === 'number' &&
    typeof p.updatedAt === 'number' &&
    typeof p.thumbnail === 'string'
  );
}

function isValidDraft(item: unknown): item is PosterDraft {
  if (!item || typeof item !== 'object') return false;
  const d = item as Partial<PosterDraft>;
  const tracksValid = d.tracks === undefined || (Array.isArray(d.tracks) && d.tracks.every(isValidTrackItem));
  return (
    typeof d.templateId === 'string' &&
    isValidTrackItem(d.track) &&
    tracksValid &&
    Boolean(d.tokensByTemplate && typeof d.tokensByTemplate === 'object')
  );
}

function cloneTrack(track: Track): Track {
  return { ...track };
}

function cloneTracks(tracks?: Track[]): Track[] | undefined {
  return tracks ? tracks.map(cloneTrack) : undefined;
}

function cloneMeta(meta?: PlaylistMeta): PlaylistMeta | undefined {
  return meta ? { ...meta } : undefined;
}

function cloneTokens(tokens: Tokens): Tokens {
  return { ...tokens };
}

export function createLocalStoragePosterStorage(
  backingStorage?: Storage | null,
): PosterStorageAdapter {
  const getStorage = (): Storage | null => {
    if (backingStorage !== undefined) return backingStorage;
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  };

  const readListSync = (): SavedPoster[] => {
    const store = getStorage();
    if (!store) return [];
    try {
      const raw = store.getItem(LIBRARY_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidSavedPoster);
    } catch {
      return [];
    }
  };

  const writeListSync = (posters: SavedPoster[]): void => {
    const store = getStorage();
    if (!store) return;
    try {
      store.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(posters));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new PosterStorageQuotaError();
      }
      throw error;
    }
  };

  const readDraftSync = (): PosterDraft | null => {
    const store = getStorage();
    if (!store) return null;
    try {
      const raw = store.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isValidDraft(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  return {
    listPostersSync() {
      return readListSync();
    },

    loadDraftSync() {
      return readDraftSync();
    },

    async listPosters() {
      return readListSync();
    },

    async getPoster(id: string) {
      return readListSync().find((item) => item.id === id) ?? null;
    },

    async savePoster(input: SavePosterInput) {
      const existing = readListSync();
      const now = Date.now();

      if (input.id) {
        const index = existing.findIndex((item) => item.id === input.id);
        if (index !== -1) {
          const prev = existing[index];
          const updated: SavedPoster = {
            ...prev,
            name: input.name?.trim() || prev.name,
            track: cloneTrack(input.track),
            tracks: cloneTracks(input.tracks ?? prev.tracks),
            meta: cloneMeta(input.meta ?? prev.meta),
            templateId: input.templateId,
            tokens: cloneTokens(input.tokens),
            codeImageDataUrl: input.codeImageDataUrl,
            updatedAt: now,
            thumbnail: input.thumbnail || prev.thumbnail,
          };
          const next = [...existing];
          next[index] = updated;
          writeListSync(next);
          return { poster: updated, updatedExisting: true };
        }
      }

      const created: SavedPoster = {
        id: generatePosterId(),
        name:
          input.name?.trim() ||
          input.meta?.title?.trim() ||
          defaultPosterName(input.track),
        track: cloneTrack(input.track),
        tracks: cloneTracks(input.tracks),
        meta: cloneMeta(input.meta),
        templateId: input.templateId,
        tokens: cloneTokens(input.tokens),
        codeImageDataUrl: input.codeImageDataUrl,
        createdAt: now,
        updatedAt: now,
        thumbnail: input.thumbnail,
      };
      writeListSync([created, ...existing]);
      return { poster: created, updatedExisting: false };
    },

    async renamePoster(id: string, name: string) {
      const trimmed = name.trim();
      const existing = readListSync();
      const index = existing.findIndex((item) => item.id === id);
      if (index === -1) return null;
      if (!trimmed) return existing[index];

      const updated: SavedPoster = {
        ...existing[index],
        name: trimmed,
        updatedAt: Date.now(),
      };
      const next = [...existing];
      next[index] = updated;
      writeListSync(next);
      return updated;
    },

    async duplicatePoster(id: string) {
      const existing = readListSync();
      const index = existing.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const source = existing[index];
      const now = Date.now();
      const copy: SavedPoster = {
        ...source,
        id: generatePosterId(),
        name: makeDuplicateName(source.name, existing),
        track: cloneTrack(source.track),
        tracks: cloneTracks(source.tracks),
        meta: cloneMeta(source.meta),
        tokens: cloneTokens(source.tokens),
        createdAt: now,
        updatedAt: now,
      };
      const next = [...existing];
      next.splice(index, 0, copy);
      writeListSync(next);
      return copy;
    },

    async deletePoster(id: string) {
      const existing = readListSync();
      const index = existing.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const deleted = existing[index];
      const next = existing.filter((item) => item.id !== id);
      writeListSync(next);
      return { deleted, previousIndex: index };
    },

    async restorePoster(poster: SavedPoster, index = 0) {
      const existing = readListSync();
      if (existing.some((item) => item.id === poster.id)) return;
      const next = [...existing];
      const clampedIndex = Math.max(0, Math.min(index, next.length));
      next.splice(clampedIndex, 0, poster);
      writeListSync(next);
    },

    async loadDraft() {
      return readDraftSync();
    },

    async saveDraft(draft: PosterDraft) {
      const store = getStorage();
      if (!store) return;
      try {
        store.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (error) {
        if (isQuotaExceededError(error)) {
          throw new PosterStorageQuotaError(
            'Browser storage is full, so your latest draft changes could not be autosaved.',
          );
        }
        throw error;
      }
    },

    async clearDraft() {
      const store = getStorage();
      if (!store) return;
      store.removeItem(DRAFT_STORAGE_KEY);
    },
  };
}

export const posterStorage: PosterStorageAdapter = createLocalStoragePosterStorage();
