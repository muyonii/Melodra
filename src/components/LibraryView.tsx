import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { getTemplateById } from '../../templates';
import type { SavedPoster } from '../types/poster';
import {
  filterPosters,
  sortPosters,
  type PosterSortOption,
} from '../utils/posterStorage';

interface LibraryViewProps {
  posters: SavedPoster[];
  activePosterId: string | null;
  onOpenPoster: (poster: SavedPoster) => void;
  onDuplicatePoster: (id: string) => void;
  onRenamePoster: (id: string, name: string) => void;
  onDeletePoster: (id: string) => void;
  onGoToEditor: () => void;
}

const FALLBACK_PREVIEW_W = 168;
const FALLBACK_PREVIEW_H = Math.round((1754 / 1240) * FALLBACK_PREVIEW_W);
const FALLBACK_PREVIEW_SCALE = FALLBACK_PREVIEW_W / 1240;

function formatSavedDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
}

export function LibraryView({
  posters,
  activePosterId,
  onOpenPoster,
  onDuplicatePoster,
  onRenamePoster,
  onDeletePoster,
  onGoToEditor,
}: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<PosterSortOption>('newest');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const cancelRenameRef = useRef(false);

  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  const visiblePosters = useMemo(() => {
    const filtered = filterPosters(posters, searchQuery);
    return sortPosters(filtered, sortBy);
  }, [posters, searchQuery, sortBy]);

  const startRename = (poster: SavedPoster) => {
    cancelRenameRef.current = false;
    setEditingId(poster.id);
    setDraftName(poster.name);
  };

  const commitRename = (posterId: string) => {
    if (cancelRenameRef.current) {
      cancelRenameRef.current = false;
      setEditingId(null);
      return;
    }
    const trimmed = draftName.trim();
    if (trimmed) {
      onRenamePoster(posterId, trimmed);
    }
    setEditingId(null);
  };

  const cancelRename = () => {
    cancelRenameRef.current = true;
    setEditingId(null);
  };

  const handleRenameSubmit = (e: FormEvent, posterId: string) => {
    e.preventDefault();
    commitRename(posterId);
  };

  return (
    <main className="flex-1 overflow-y-auto studio-scrollbar bg-[#0B0B0C] px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header & Search/Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">My Posters</h1>
            <p className="text-sm text-[#8E8E93] mt-1.5 tabular-nums">
              {posters.length === 0
                ? 'Save poster designs locally in your browser to revisit or export later.'
                : `${posters.length} saved ${posters.length === 1 ? 'poster' : 'posters'} · Stored locally in this browser`}
            </p>
          </div>

          {posters.length > 0 && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Search Filter */}
              <div className="relative flex-1 sm:w-64 min-w-[200px]">
                <Search
                  className="w-3.5 h-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved posters…"
                  aria-label="Search saved posters"
                  className="w-full h-9 pl-8 pr-8 rounded-xl bg-[#151517] border border-white/[0.08] text-xs text-[#F5F5F5] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1DB954]/80 focus:ring-1 focus:ring-[#1DB954]/40 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear poster search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Sort Segmented Control */}
              <div
                role="group"
                aria-label="Sort saved posters"
                className="inline-flex items-center p-1 rounded-xl bg-[#151517] border border-white/[0.08] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setSortBy('newest')}
                  aria-pressed={sortBy === 'newest'}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                    sortBy === 'newest'
                      ? 'bg-white/[0.12] text-[#F5F5F5]'
                      : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                  }`}
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('name')}
                  aria-pressed={sortBy === 'name'}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                    sortBy === 'name'
                      ? 'bg-white/[0.12] text-[#F5F5F5]'
                      : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                  }`}
                >
                  Name
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty Library State */}
        {posters.length === 0 && (
          <div
            data-testid="library-empty-state"
            className="max-w-md mx-auto mt-10 rounded-2xl bg-[#151517] border border-white/[0.08] px-6 py-10 text-center flex flex-col items-center"
          >
            <div className="w-14 h-16 rounded-xl bg-[#0B0B0C] border border-white/[0.08] flex flex-col items-center justify-center mb-5 shadow-inner">
              <div className="w-8 h-8 rounded-md bg-white/[0.05] border border-white/[0.06] flex items-center justify-center mb-1.5">
                <Bookmark className="w-4 h-4 text-[#1DB954]" aria-hidden="true" />
              </div>
              <div className="w-7 h-1 rounded-full bg-white/[0.12]" />
            </div>
            <h2 className="text-base font-semibold text-[#F5F5F5]">No saved posters yet</h2>
            <p className="text-xs sm:text-sm text-[#8E8E93] mt-2 leading-relaxed max-w-xs">
              Customize any track in the studio and click Save in the top bar to keep your print-ready designs here.
            </p>
            <button
              type="button"
              onClick={onGoToEditor}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] text-[#07110B] text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151517]"
            >
              <span>Create a Poster</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Filtered Empty State */}
        {posters.length > 0 && visiblePosters.length === 0 && (
          <div className="max-w-md mx-auto mt-10 rounded-2xl bg-[#151517] border border-white/[0.08] px-6 py-8 text-center">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">
              No posters match “{searchQuery}”
            </h2>
            <p className="text-xs text-[#8E8E93] mt-1.5">
              Try searching by poster name, track title, artist, or template.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-[#F5F5F5] transition-colors cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Responsive Saved Posters Grid */}
        {visiblePosters.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visiblePosters.map((poster) => {
              const tpl = getTemplateById(poster.templateId);
              const FallbackRender = tpl.Render;
              const isEditing = editingId === poster.id;
              const isCurrentActive = activePosterId === poster.id;
              const showLiveFallback = !poster.thumbnail || failedThumbIds[poster.id];

              return (
                <article
                  key={poster.id}
                  data-testid="saved-poster-card"
                  className={`rounded-2xl bg-[#151517] border p-4 flex flex-col transition-colors duration-200 ${
                    isCurrentActive
                      ? 'border-[#1DB954]/60'
                      : 'border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  {/* Thumbnail Preview */}
                  <button
                    type="button"
                    onClick={() => onOpenPoster(poster)}
                    aria-label={`Open ${poster.name} in editor`}
                    className="group/thumb w-full flex items-center justify-center py-4 bg-[#0B0B0C] rounded-xl border border-white/[0.06] mb-3.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
                  >
                    <div
                      className="rounded-[4px] overflow-hidden shadow-2xl border border-white/[0.08] bg-[#0B0B0C] transition-transform duration-200 group-hover/thumb:scale-[1.02]"
                      style={{ width: FALLBACK_PREVIEW_W, height: FALLBACK_PREVIEW_H }}
                    >
                      {!showLiveFallback ? (
                        <img
                          src={poster.thumbnail}
                          alt={poster.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedThumbIds((prev) => ({ ...prev, [poster.id]: true }))
                          }
                          className="w-full h-full object-cover block"
                        />
                      ) : (
                        <div
                          style={{
                            width: tpl.size.w,
                            height: tpl.size.h,
                            transform: `scale(${FALLBACK_PREVIEW_SCALE})`,
                            transformOrigin: 'top left',
                            pointerEvents: 'none',
                          }}
                        >
                          <FallbackRender
                            track={poster.track}
                            tracks={poster.tracks}
                            meta={poster.meta}
                            tokens={poster.tokens}
                            codeUrl={poster.codeImageDataUrl}
                          />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Title / Inline Rename */}
                  <div className="min-w-0">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleRenameSubmit(e, poster.id)}
                        className="flex items-center gap-1"
                      >
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onBlur={() => commitRename(poster.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelRename();
                            }
                          }}
                          aria-label="Poster name"
                          className="flex-1 min-w-0 h-7 px-2 rounded-lg bg-[#0B0B0C] border border-[#1DB954]/80 text-xs font-semibold text-[#F5F5F5] focus:outline-none"
                        />
                        <button
                          type="submit"
                          onMouseDown={(e) => e.preventDefault()}
                          aria-label="Save name"
                          className="p-1.5 rounded-lg bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            cancelRename();
                          }}
                          aria-label="Cancel rename"
                          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    ) : (
                      <h2
                        onDoubleClick={() => startRename(poster)}
                        title={poster.name}
                        className="text-sm font-semibold text-[#F5F5F5] truncate leading-snug"
                      >
                        {poster.name}
                      </h2>
                    )}

                    {/* Clean Unboxed Metadata */}
                    <div className="flex items-center gap-1.5 text-xs text-[#8E8E93] mt-1 truncate">
                      <span className="truncate">{tpl.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0 tabular-nums">
                        {formatSavedDate(poster.updatedAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8E8E93]/80 mt-0.5 truncate">
                      {tpl.multiTrack && poster.tracks?.length
                        ? `${poster.tracks.length} tracks · ${poster.meta?.subtitle || poster.track.artist}`
                        : `${poster.track.title} · ${poster.track.artist}`}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenPoster(poster)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-[#1DB954] text-[#F5F5F5] hover:text-[#07110B] text-xs font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
                    >
                      Open in editor
                    </button>
                    <button
                      type="button"
                      onClick={() => startRename(poster)}
                      aria-label={`Rename ${poster.name}`}
                      title="Rename"
                      className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-[#8E8E93] hover:text-[#F5F5F5] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicatePoster(poster.id)}
                      aria-label={`Duplicate ${poster.name}`}
                      title="Duplicate"
                      className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-[#8E8E93] hover:text-[#F5F5F5] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePoster(poster.id)}
                      aria-label={`Delete ${poster.name}`}
                      title="Delete"
                      className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-rose-500/15 text-[#8E8E93] hover:text-rose-300 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
