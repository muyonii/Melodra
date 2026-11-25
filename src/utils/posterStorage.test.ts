import assert from 'node:assert/strict';
import test from 'node:test';
import { templates } from '../../templates';
import type { SavedPoster, Track } from '../types/poster';
import {
  createLocalStoragePosterStorage,
  defaultPosterName,
  filterPosters,
  PosterStorageQuotaError,
  sortPosters,
} from './posterStorage';

function createMemoryStorage(options?: { throwQuota?: boolean }): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      if (options?.throwQuota) {
        const err = new Error('QuotaExceededError') as Error & { name: string; code: number };
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
      map.set(key, value);
    },
  };
}

const SAMPLE_TRACK: Track = {
  title: 'Lily of the Valley',
  artist: 'DANIEL',
  album: 'Flower',
  coverUrl: '/src/assets/images/cover_lily_valley_1795531760152.jpg',
  durationMs: 208000,
};

test('defaultPosterName formats "{title} - {artist}"', () => {
  assert.equal(defaultPosterName(SAMPLE_TRACK), 'Lily of the Valley - DANIEL');
});

test('savePoster creates and updates existing poster on re-save', async () => {
  const storage = createLocalStoragePosterStorage(createMemoryStorage());
  const tpl = templates[0];

  const first = await storage.savePoster({
    track: SAMPLE_TRACK,
    templateId: tpl.id,
    tokens: tpl.defaults,
    thumbnail: 'data:image/jpeg;base64,thumb1',
  });
  assert.equal(first.updatedExisting, false);
  assert.equal(first.poster.name, 'Lily of the Valley - DANIEL');

  // Rename first, then save again with same id -> preserves renamed title & updates tokens
  await storage.renamePoster(first.poster.id, 'Living Room Print');
  const second = await storage.savePoster({
    id: first.poster.id,
    track: SAMPLE_TRACK,
    templateId: tpl.id,
    tokens: { ...tpl.defaults, blur: 80 },
    thumbnail: 'data:image/jpeg;base64,thumb2',
  });
  assert.equal(second.updatedExisting, true);
  assert.equal(second.poster.id, first.poster.id);
  assert.equal(second.poster.name, 'Living Room Print');
  assert.equal(second.poster.tokens.blur, 80);

  const list = await storage.listPosters();
  assert.equal(list.length, 1);
});

test('duplicate, delete, and restorePoster keep library consistent', async () => {
  const storage = createLocalStoragePosterStorage(createMemoryStorage());
  const tpl = templates[0];

  const saved = await storage.savePoster({
    track: SAMPLE_TRACK,
    templateId: tpl.id,
    tokens: tpl.defaults,
    thumbnail: 'data:image/jpeg;base64,thumb1',
  });

  const copy = await storage.duplicatePoster(saved.poster.id);
  assert.ok(copy);
  assert.equal(copy.name, 'Lily of the Valley - DANIEL (Copy)');
  assert.notEqual(copy.id, saved.poster.id);

  const deleted = await storage.deletePoster(saved.poster.id);
  assert.ok(deleted);
  assert.equal((await storage.listPosters()).length, 1);

  await storage.restorePoster(deleted.deleted, deleted.previousIndex);
  const restoredList = await storage.listPosters();
  assert.equal(restoredList.length, 2);
  assert.ok(restoredList.some((p) => p.id === saved.poster.id));
});

test('sortPosters and filterPosters order and search across metadata', () => {
  const tpl = templates[0];
  const items: SavedPoster[] = [
    {
      id: '1',
      name: 'Zebra Song',
      track: { ...SAMPLE_TRACK, title: 'Zebra', artist: 'Alpha' },
      templateId: tpl.id,
      tokens: tpl.defaults,
      createdAt: 100,
      updatedAt: 200,
      thumbnail: '',
    },
    {
      id: '2',
      name: 'Amber Night',
      track: { ...SAMPLE_TRACK, title: 'Amber Groove', artist: 'Julian Vance' },
      templateId: 'vinyl',
      tokens: tpl.defaults,
      createdAt: 150,
      updatedAt: 150,
      thumbnail: '',
    },
  ];

  const byNewest = sortPosters(items, 'newest');
  assert.equal(byNewest[0].id, '1');

  const byName = sortPosters(items, 'name');
  assert.equal(byName[0].id, '2');

  assert.equal(filterPosters(items, 'julian').length, 1);
  assert.equal(filterPosters(items, 'vinyl').length, 1);
  assert.equal(filterPosters(items, 'zebra').length, 1);
  assert.equal(filterPosters(items, 'nonexistent').length, 0);
});

test('draft persistence and quota exceeded error handling', async () => {
  const okStorage = createLocalStoragePosterStorage(createMemoryStorage());
  await okStorage.saveDraft({
    track: SAMPLE_TRACK,
    templateId: 'vinyl',
    tokensByTemplate: { vinyl: templates[0].defaults },
    customCodeUrl: null,
    activePosterId: 'abc',
    updatedAt: 12345,
  });
  const loaded = await okStorage.loadDraft();
  assert.equal(loaded?.templateId, 'vinyl');
  assert.equal(loaded?.activePosterId, 'abc');

  const fullStorage = createLocalStoragePosterStorage(createMemoryStorage({ throwQuota: true }));
  await assert.rejects(
    fullStorage.savePoster({
      track: SAMPLE_TRACK,
      templateId: templates[0].id,
      tokens: templates[0].defaults,
      thumbnail: '',
    }),
    (err) => err instanceof PosterStorageQuotaError,
  );
  await assert.rejects(
    fullStorage.saveDraft({
      track: SAMPLE_TRACK,
      templateId: 'vinyl',
      tokensByTemplate: { vinyl: templates[0].defaults },
      updatedAt: 123,
    }),
    (err) => err instanceof PosterStorageQuotaError,
  );
});

test('multi-track tracks and meta persist across save, duplicate, draft, and filterPosters', async () => {
  const storage = createLocalStoragePosterStorage(createMemoryStorage());
  const tracks: Track[] = [
    SAMPLE_TRACK,
    {
      title: 'Neon Puddles',
      artist: 'Kenji Takahashi',
      album: 'After Midnight',
      coverUrl: '/src/assets/images/cover_neon_tokyo_rain_1795566347517.jpg',
      durationMs: 243000,
    },
  ];
  const meta = { title: 'Rainy Walk', subtitle: 'Tokyo 2AM' };

  const saved = await storage.savePoster({
    track: tracks[0],
    tracks,
    meta,
    templateId: 'tracklist',
    tokens: templates.find((t) => t.id === 'tracklist')!.defaults,
    thumbnail: 'data:image/jpeg;base64,thumb',
  });

  assert.equal(saved.poster.name, 'Rainy Walk');
  assert.equal(saved.poster.tracks?.length, 2);
  assert.equal(saved.poster.meta?.subtitle, 'Tokyo 2AM');

  const copy = await storage.duplicatePoster(saved.poster.id);
  assert.equal(copy?.tracks?.length, 2);
  assert.equal(copy?.meta?.title, 'Rainy Walk');

  const all = await storage.listPosters();
  assert.equal(filterPosters(all, 'Kenji').length, 2);
  assert.equal(filterPosters(all, 'Tokyo 2AM').length, 2);

  await storage.saveDraft({
    track: tracks[0],
    tracks,
    meta,
    templateId: 'mixtape',
    tokensByTemplate: { mixtape: templates.find((t) => t.id === 'mixtape')!.defaults },
    updatedAt: 456,
  });
  const loadedDraft = await storage.loadDraft();
  assert.equal(loadedDraft?.tracks?.length, 2);
  assert.equal(loadedDraft?.meta?.title, 'Rainy Walk');
});
