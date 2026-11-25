import { Loader2, Music2, Search, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { Track } from '../types/poster';
import { formatDurationMs } from '../utils/format';
import {
  extractSpotifyTrackId,
  resolveSpotifyTrackLink,
  searchItunesSongs,
  type SearchResultItem,
} from '../utils/musicSearch';

interface SearchBarProps {
  onSelectTrack: (track: Track, source: 'search' | 'spotify') => void;
  onNotify: (message: string, tone?: 'info' | 'error') => void;
  externalInputRef?: React.RefObject<HTMLInputElement | null>;
  isMultiTrack?: boolean;
  isAtTrackLimit?: boolean;
}

export function SearchBar({
  onSelectTrack,
  onNotify,
  externalInputRef,
  isMultiTrack = false,
  isAtTrackLimit = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingSpotify, setResolvingSpotify] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listboxId = useId();

  const setMergedInputRef = (el: HTMLInputElement | null) => {
    inputRef.current = el;
    if (externalInputRef) {
      externalInputRef.current = el;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Debounced search or immediate Spotify link resolution
  useEffect(() => {
    const trimmed = query.trim();

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setResolvingSpotify(false);
      setHasSearched(false);
      setActiveIndex(-1);
      setIsOpen(false);
      return;
    }

    const spotifyId = extractSpotifyTrackId(trimmed);
    const controller = new AbortController();
    abortRef.current = controller;

    if (spotifyId) {
      setResolvingSpotify(true);
      setIsLoading(true);
      setIsOpen(true);
      setResults([]);
      setHasSearched(false);

      resolveSpotifyTrackLink(spotifyId, controller.signal)
        .then((resolvedTrack) => {
          if (controller.signal.aborted) return;
          setIsLoading(false);
          setResolvingSpotify(false);
          setIsOpen(false);
          setQuery('');
          onSelectTrack(resolvedTrack, 'spotify');
        })
        .catch((err) => {
          if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return;
          setIsLoading(false);
          setResolvingSpotify(false);
          setIsOpen(false);
          onNotify(
            "Couldn't load that Spotify link. Try searching by song name instead.",
            'error',
          );
        });

      return () => controller.abort();
    }

    // Standard song search with 300ms debounce
    setResolvingSpotify(false);
    setIsLoading(true);
    setIsOpen(true);
    setHasSearched(false);

    const timer = window.setTimeout(() => {
      searchItunesSongs(trimmed, controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          setResults(items);
          setIsLoading(false);
          setHasSearched(true);
          setActiveIndex(items.length > 0 ? 0 : -1);
        })
        .catch((err) => {
          if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return;
          setIsLoading(false);
          setHasSearched(true);
          setResults([]);
          onNotify('Search is temporarily unavailable. Please try again.', 'error');
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, onSelectTrack, onNotify]);

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery('');
    onSelectTrack(item.track, 'search');
  };

  const handleClear = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setQuery('');
    setResults([]);
    setIsLoading(false);
    setResolvingSpotify(false);
    setHasSearched(false);
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!isOpen || results.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) {
        handleSelectItem(target);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center">
        <Search
          className="w-4 h-4 text-[#8E8E93] absolute left-3.5 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={setMergedInputRef}
          type="text"
          role="combobox"
          aria-label={
            isMultiTrack
              ? 'Add a song or paste a Spotify link'
              : 'Search song or paste Spotify link'
          }
          aria-keyshortcuts="/"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 && results[activeIndex]
              ? `${listboxId}-opt-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && (results.length > 0 || hasSearched || isLoading)) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            isMultiTrack
              ? isAtTrackLimit
                ? 'Playlist full (16/16) — remove a track to add more'
                : 'Add a song or paste a Spotify link… ( / )'
              : 'Search a song or paste a Spotify link… ( / )'
          }
          className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#151517] border border-white/[0.08] text-sm text-[#F5F5F5] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1DB954] transition-colors duration-200"
        />

        {isLoading && (
          <Loader2
            className="w-4 h-4 text-[#1DB954] animate-spin absolute right-9 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 p-1 rounded-lg text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Results / Loading / Empty Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Song search results"
          className="absolute left-0 right-0 bottom-full mb-2 lg:bottom-auto lg:mb-0 lg:top-full lg:mt-2 rounded-xl bg-[#151517] border border-white/[0.10] shadow-[0_24px_60px_rgba(0,0,0,0.75)] overflow-hidden z-40"
        >
          {isLoading ? (
            <div className="p-2 space-y-1" aria-busy="true" aria-label="Loading search results">
              {resolvingSpotify && (
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#1DB954]">
                  Resolving Spotify track…
                </div>
              )}
              {Array.from({ length: resolvingSpotify ? 1 : 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-2.5 py-2 rounded-lg animate-pulse"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.07] shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="h-3.5 w-2/3 rounded bg-white/[0.08]" />
                    <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
                  </div>
                  <div className="h-3 w-9 rounded bg-white/[0.06] shrink-0" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="p-1.5 max-h-80 overflow-y-auto studio-scrollbar">
              {results.map((item, idx) => {
                const isHighlighted = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    id={`${listboxId}-opt-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors duration-150 cursor-pointer ${
                      isHighlighted ? 'bg-white/[0.09]' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    {item.thumbUrl ? (
                      <img
                        src={item.thumbUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-[#0B0B0C]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#0B0B0C] flex items-center justify-center shrink-0">
                        <Music2 className="w-4 h-4 text-[#8E8E93]" aria-hidden="true" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#F5F5F5] truncate">
                        {item.track.title}
                      </div>
                      <div className="text-xs text-[#8E8E93] truncate">
                        {item.track.album
                          ? `${item.track.artist} · ${item.track.album}`
                          : item.track.artist}
                      </div>
                    </div>

                    <span className="text-xs text-[#8E8E93] tabular-nums shrink-0">
                      {formatDurationMs(item.track.durationMs)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : hasSearched ? (
            <div className="py-8 px-4 text-center">
              <Music2 className="w-5 h-5 text-[#8E8E93] mx-auto mb-2 opacity-60" aria-hidden="true" />
              <p className="text-xs font-medium text-[#F5F5F5]">No results found</p>
              <p className="text-[11px] text-[#8E8E93] mt-1">
                Try a different song title or paste a Spotify track link.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
