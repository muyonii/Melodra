import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  GripVertical,
  ListPlus,
  Loader2,
  Plus,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MAX_PLAYLIST_TRACKS, MIN_PLAYLIST_TRACKS } from '../data/tracks';
import type { PlaylistMeta, Track } from '../types/poster';
import { formatDurationMs } from '../utils/format';
import { proxifyImageUrl } from '../utils/imageProxy';
import {
  parseTrackListLine,
  resolveBulkTrackLines,
  type BulkLineResult,
} from '../utils/musicSearch';

interface TracksManagerProps {
  tracks: Track[];
  meta: PlaylistMeta;
  onChangeMeta: (patch: Partial<PlaylistMeta>) => void;
  onReorderTracks: (fromIndex: number, toIndex: number) => void;
  onRemoveTrack: (index: number) => void;
  onApplyBulkTracks: (tracks: Track[], mode: 'replace' | 'append') => void;
  onOpenAddCustomSong: () => void;
  onNotify: (message: string, tone?: 'info' | 'error') => void;
}

export function TracksManager({
  tracks,
  meta,
  onChangeMeta,
  onReorderTracks,
  onRemoveTrack,
  onApplyBulkTracks,
  onOpenAddCustomSong,
  onNotify,
}: TracksManagerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'replace' | 'append'>('replace');
  const [isResolving, setIsResolving] = useState(false);
  const [lineResults, setLineResults] = useState<BulkLineResult[]>([]);
  const [retryDrafts, setRetryDrafts] = useState<Record<number, string>>({});
  const [retryingLines, setRetryingLines] = useState<Record<number, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const canRemove = tracks.length > MIN_PLAYLIST_TRACKS;
  const canAdd = tracks.length < MAX_PLAYLIST_TRACKS;

  const handleResolveList = async () => {
    const rawLines = bulkText.split(/\r?\n/);
    const parsed = rawLines
      .map((line, i) => parseTrackListLine(line, i + 1))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, MAX_PLAYLIST_TRACKS);

    if (parsed.length === 0) {
      onNotify('Paste at least one "Title - Artist" line to resolve.', 'error');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsResolving(true);
    setLineResults(
      parsed.map((item) => ({
        lineNumber: item.lineNumber,
        raw: item.raw,
        status: 'pending',
      })),
    );
    setRetryDrafts({});

    try {
      await resolveBulkTrackLines(
        parsed,
        (update) => {
          setLineResults((prev) =>
            prev.map((row) => (row.lineNumber === update.lineNumber ? update : row)),
          );
          if (update.status === 'not-found' || update.status === 'error') {
            setRetryDrafts((prev) =>
              prev[update.lineNumber] !== undefined
                ? prev
                : { ...prev, [update.lineNumber]: update.raw },
            );
          }
        },
        controller.signal,
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsResolving(false);
      }
    }
  };

  const handleRetryLine = async (lineNumber: number) => {
    const text = (retryDrafts[lineNumber] ?? '').trim();
    const parsed = parseTrackListLine(text, lineNumber);
    if (!parsed) return;

    setRetryingLines((prev) => ({ ...prev, [lineNumber]: true }));
    try {
      const [result] = await resolveBulkTrackLines([parsed], (update) => {
        setLineResults((prev) =>
          prev.map((row) => (row.lineNumber === lineNumber ? update : row)),
        );
      });
      if (result && (result.status === 'not-found' || result.status === 'error')) {
        setRetryDrafts((prev) => ({ ...prev, [lineNumber]: parsed.raw }));
      }
    } finally {
      setRetryingLines((prev) => ({ ...prev, [lineNumber]: false }));
    }
  };

  const matchedTracks = lineResults
    .filter((row): row is BulkLineResult & { track: Track } => row.status === 'found' && Boolean(row.track))
    .map((row) => row.track);

  const unresolvedRows = lineResults.filter(
    (row) => row.status === 'not-found' || row.status === 'error',
  );

  const handleApplyMatched = () => {
    if (matchedTracks.length === 0) return;
    if (bulkMode === 'replace' && matchedTracks.length < MIN_PLAYLIST_TRACKS) {
      onNotify(
        `Playlist needs at least ${MIN_PLAYLIST_TRACKS} matched tracks to replace.`,
        'error',
      );
      return;
    }
    onApplyBulkTracks(matchedTracks, bulkMode);
    setBulkOpen(false);
    setLineResults([]);
    setBulkText('');
  };

  return (
    <div className="space-y-5">
      {/* Playlist Header Details */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
          Playlist Details
        </h3>
        <div className="space-y-2.5">
          <div>
            <label
              htmlFor="playlist-meta-title"
              className="block text-xs font-medium text-[#F5F5F5] mb-1"
            >
              Playlist Title
            </label>
            <input
              id="playlist-meta-title"
              type="text"
              value={meta.title}
              maxLength={60}
              onChange={(e) => onChangeMeta({ title: e.target.value })}
              placeholder="Late Night Pressings"
              className="w-full h-9 px-3 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-xs text-[#F5F5F5] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1DB954] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="playlist-meta-subtitle"
              className="block text-xs font-medium text-[#F5F5F5] mb-1"
            >
              Subtitle
            </label>
            <input
              id="playlist-meta-subtitle"
              type="text"
              value={meta.subtitle}
              maxLength={90}
              onChange={(e) => onChangeMeta({ subtitle: e.target.value })}
              placeholder="Curated analog & ambient cuts"
              className="w-full h-9 px-3 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-xs text-[#F5F5F5] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1DB954] transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Tracks Header + Paste a List + Add Custom */}
      <section className="space-y-3 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
              Tracks
            </h3>
            <span
              data-testid="playlist-track-count"
              className="text-[11px] font-semibold text-[#F5F5F5] tabular-nums px-1.5 py-0.5 rounded-md bg-white/[0.08]"
            >
              {tracks.length}/{MAX_PLAYLIST_TRACKS}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBulkOpen((v) => !v)}
              aria-expanded={bulkOpen}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                bulkOpen
                  ? 'bg-[#1DB954]/15 border-[#1DB954]/70 text-[#F5F5F5]'
                  : 'bg-[#0B0B0C] border-white/[0.08] text-[#F5F5F5] hover:border-white/[0.2]'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5 text-[#1DB954]" aria-hidden="true" />
              <span>Paste a list</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddCustomSong}
              disabled={!canAdd}
              title={canAdd ? 'Add curated or custom song' : `Maximum ${MAX_PLAYLIST_TRACKS} tracks`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0B0B0C] border border-white/[0.08] hover:border-white/[0.2] disabled:opacity-40 disabled:pointer-events-none text-[11px] font-medium text-[#F5F5F5] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#8E8E93]" aria-hidden="true" />
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* Paste a list Bulk Importer */}
        {bulkOpen && (
          <div
            data-testid="paste-list-drawer"
            className="rounded-xl bg-[#0B0B0C] border border-white/[0.1] p-3 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[#F5F5F5]">
                One song per line (Title - Artist)
              </span>
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                aria-label="Close paste a list"
                className="p-1 rounded-md text-[#8E8E93] hover:text-[#F5F5F5] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <textarea
              aria-label="Paste track list"
              rows={5}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'Midnight City - M83\nRedbone - Childish Gambino\nNights - Frank Ocean'}
              className="w-full rounded-xl bg-[#151517] border border-white/[0.08] p-2.5 text-xs text-[#F5F5F5] placeholder:text-[#8E8E93]/70 focus:outline-none focus:border-[#1DB954] resize-y font-mono"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-[#151517] border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setBulkMode('replace')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    bulkMode === 'replace'
                      ? 'bg-white/[0.12] text-[#F5F5F5]'
                      : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                  }`}
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode('append')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    bulkMode === 'append'
                      ? 'bg-white/[0.12] text-[#F5F5F5]'
                      : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                  }`}
                >
                  Append
                </button>
              </div>

              <button
                type="button"
                disabled={isResolving || !bulkText.trim()}
                onClick={() => void handleResolveList()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 text-[#07110B] text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {isResolving && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                <span>{isResolving ? 'Resolving…' : 'Resolve list'}</span>
              </button>
            </div>

            {/* Per-line lookup status & inline editing for not-found lines */}
            {lineResults.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/[0.08] max-h-56 overflow-y-auto studio-scrollbar">
                {lineResults.map((row) => {
                  const isMissing = row.status === 'not-found' || row.status === 'error';
                  const isRetrying = Boolean(retryingLines[row.lineNumber]);
                  return (
                    <div
                      key={row.lineNumber}
                      data-testid="bulk-line-status"
                      className={`rounded-lg px-2.5 py-2 text-[11px] border ${
                        isMissing
                          ? 'bg-amber-500/10 border-amber-400/30'
                          : row.status === 'found'
                            ? 'bg-[#1DB954]/8 border-[#1DB954]/25'
                            : 'bg-[#151517] border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium text-[#F5F5F5]">
                          {row.status === 'found' && row.track
                            ? `${row.track.title} · ${row.track.artist}`
                            : row.raw}
                        </span>
                        {row.status === 'searching' && (
                          <Loader2
                            className="w-3 h-3 text-[#1DB954] animate-spin shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {row.status === 'found' && (
                          <Check
                            className="w-3.5 h-3.5 text-[#1DB954] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {isMissing && (
                          <span className="inline-flex items-center gap-1 text-amber-300 shrink-0">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                            <span>Not found</span>
                          </span>
                        )}
                      </div>

                      {isMissing && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <input
                            type="text"
                            value={retryDrafts[row.lineNumber] ?? row.raw}
                            onChange={(e) =>
                              setRetryDrafts((prev) => ({
                                ...prev,
                                [row.lineNumber]: e.target.value,
                              }))
                            }
                            aria-label={`Edit unresolved track line ${row.lineNumber}`}
                            className="flex-1 min-w-0 h-7 px-2 rounded-md bg-[#0B0B0C] border border-white/[0.12] text-[11px] text-[#F5F5F5] focus:outline-none focus:border-[#1DB954]"
                          />
                          <button
                            type="button"
                            disabled={isRetrying}
                            onClick={() => void handleRetryLine(row.lineNumber)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.1] hover:bg-white/[0.18] text-[10px] font-medium text-[#F5F5F5] cursor-pointer shrink-0"
                          >
                            {isRetrying ? (
                              <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                            ) : (
                              <RotateCw className="w-3 h-3" aria-hidden="true" />
                            )}
                            <span>Retry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isResolving && matchedTracks.length > 0 && (
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#8E8E93]">
                      {matchedTracks.length} matched
                      {unresolvedRows.length > 0 ? `, ${unresolvedRows.length} unresolved` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyMatched}
                      className="px-3 py-1.5 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] text-[#07110B] text-[11px] font-semibold cursor-pointer"
                    >
                      Apply {matchedTracks.length} {matchedTracks.length === 1 ? 'track' : 'tracks'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reorderable Playlist Track List */}
        <p className="text-[11px] text-[#8E8E93]">
          Drag rows to reorder. Use the top search bar to append more songs (2–{MAX_PLAYLIST_TRACKS}).
        </p>

        <div className="space-y-1.5" role="list" aria-label="Playlist tracks">
          {tracks.map((item, idx) => {
            const isDragging = dragIndex === idx;
            const isDropTarget = dragOverIndex === idx && dragIndex !== idx;
            return (
              <div
                key={`${item.title}-${item.artist}-${idx}`}
                role="listitem"
                data-testid="playlist-track-row"
                draggable
                onDragStart={() => {
                  setDragIndex(idx);
                  setDragOverIndex(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverIndex !== idx) {
                    setDragOverIndex(idx);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== idx) {
                    onReorderTracks(dragIndex, idx);
                  }
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={`group flex items-center gap-2 p-2 rounded-xl border transition-all duration-150 ${
                  isDragging
                    ? 'opacity-45 bg-[#0B0B0C] border-white/[0.16]'
                    : isDropTarget
                      ? 'bg-[#1DB954]/10 border-[#1DB954]/70'
                      : 'bg-[#0B0B0C] border-white/[0.08] hover:border-white/[0.16]'
                }`}
              >
                <span
                  className="text-[#8E8E93] cursor-grab active:cursor-grabbing shrink-0"
                  aria-hidden="true"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </span>

                <span className="text-[11px] text-[#8E8E93] tabular-nums w-4 text-right shrink-0">
                  {idx + 1}
                </span>

                <img
                  src={proxifyImageUrl(item.coverUrl)}
                  alt=""
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-md object-cover shrink-0 bg-[#151517]"
                />

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-[#F5F5F5] truncate leading-tight">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[#8E8E93] truncate leading-tight">
                    {item.artist} · {formatDurationMs(item.durationMs)}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onReorderTracks(idx, idx - 1)}
                    aria-label={`Move ${item.title} up`}
                    className="p-1 rounded-md text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowUp className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tracks.length - 1}
                    onClick={() => onReorderTracks(idx, idx + 1)}
                    aria-label={`Move ${item.title} down`}
                    className="p-1 rounded-md text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={!canRemove}
                    onClick={() => onRemoveTrack(idx)}
                    aria-label={`Remove ${item.title}`}
                    title={
                      canRemove
                        ? 'Remove track'
                        : `At least ${MIN_PLAYLIST_TRACKS} tracks required`
                    }
                    className="p-1 rounded-md text-[#8E8E93] hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
