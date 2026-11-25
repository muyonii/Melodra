import { ChevronDown, Frame, Redo2, SlidersHorizontal, Undo2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { templates } from '../../templates';
import { MAX_PLAYLIST_TRACKS } from '../data/tracks';
import type { PlaylistMeta, Template, Tokens, Track } from '../types/poster';
import type { TokensByTemplate } from '../utils/tokenHistory';
import { SearchBar } from './SearchBar';

interface PosterStageProps {
  track: Track;
  tracks: Track[];
  playlistMeta: PlaylistMeta;
  template: Template;
  tokens: Tokens;
  tokensByTemplate: TokensByTemplate;
  codeUrl?: string;
  customizeOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onUndo: () => void;
  onRedo: () => void;
  onToggleCustomize: () => void;
  onOpenTracksManager: () => void;
  onOpenMockup: () => void;
  onSelectTemplate: (templateId: string) => void;
  onSelectTrack: (track: Track, source: 'search' | 'spotify') => void;
  onOpenSongPicker: () => void;
  onChangePlaylistMeta: (patch: Partial<PlaylistMeta>) => void;
  onUploadCode: (dataUrl: string) => void;
  onCodeLoadError: () => void;
  onNotify: (message: string, tone?: 'info' | 'error') => void;
  exportRef: RefObject<HTMLDivElement | null>;
}

const THUMB_W = 36;
const THUMB_H = Math.round((1754 / 1240) * THUMB_W);
const THUMB_SCALE = THUMB_W / 1240;

export function PosterStage({
  track,
  tracks,
  playlistMeta,
  template,
  tokens,
  tokensByTemplate,
  codeUrl,
  customizeOpen,
  canUndo,
  canRedo,
  searchInputRef,
  onUndo,
  onRedo,
  onToggleCustomize,
  onOpenTracksManager,
  onOpenMockup,
  onSelectTemplate,
  onSelectTrack,
  onOpenSongPicker,
  onChangePlaylistMeta,
  onUploadCode,
  onCodeLoadError,
  onNotify,
  exportRef,
}: PosterStageProps) {
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.36);

  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;

    const computeScale = () => {
      const rect = el.getBoundingClientRect();
      const padX = 48;
      const padY = 76;
      const availW = Math.max(180, rect.width - padX);
      const availH = Math.max(220, rect.height - padY);
      const nextScale = Math.min(availW / template.size.w, availH / template.size.h, 0.50);
      setScale(Math.max(0.14, Number(nextScale.toFixed(4))));
    };

    computeScale();
    const observer = new ResizeObserver(computeScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [template.size.w, template.size.h]);

  const isMulti = Boolean(template.multiTrack);
  const previewW = Math.round(template.size.w * scale);
  const previewH = Math.round(template.size.h * scale);
  const ActiveRender = template.Render;
  const trackKey = isMulti
    ? `multi-${tracks.length}-${tracks[0]?.title ?? ''}-${tracks[0]?.coverUrl ?? ''}`
    : `${track.title}-${track.artist}-${track.coverUrl}-${track.spotifyId ?? ''}`;

  return (
    <main className="flex-1 min-w-0 flex flex-col studio-dotted-canvas relative overflow-hidden">
      {/* Search & Controls Bar: top on desktop, bottom thumb-reachable bar on mobile */}
      <div className="order-3 lg:order-1 shrink-0 px-3 sm:px-6 py-2.5 lg:pt-3 lg:pb-2.5 border-t lg:border-t-0 lg:border-b border-white/[0.06] bg-[#0B0B0C]/90 backdrop-blur-md z-20">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 sm:gap-3">
          {/* Active Track or Playlist Summary Trigger */}
          <button
            type="button"
            onClick={isMulti ? onOpenTracksManager : onOpenSongPicker}
            aria-label={
              isMulti
                ? `Manage playlist tracks (${playlistMeta.title}, ${tracks.length} of ${MAX_PLAYLIST_TRACKS} tracks)`
                : `Edit track manually (${track.title} by ${track.artist})`
            }
            className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-[#151517] border border-white/[0.08] hover:border-white/[0.18] transition-all duration-200 max-w-[175px] sm:max-w-[220px] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
          >
            <img
              src={track.coverUrl}
              alt=""
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg object-cover shrink-0 bg-[#0B0B0C]"
            />
            <div className="min-w-0 text-left">
              <div className="text-xs font-medium text-[#F5F5F5] truncate leading-tight">
                {isMulti ? playlistMeta.title || 'Untitled Playlist' : track.title}
              </div>
              <div className="text-[11px] text-[#8E8E93] truncate leading-tight tabular-nums">
                {isMulti ? `${tracks.length}/${MAX_PLAYLIST_TRACKS} tracks` : track.artist}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8E8E93] shrink-0 ml-0.5" aria-hidden="true" />
          </button>

          {/* Unified Song Search & Spotify Link Input */}
          <div className="order-first lg:order-none w-full lg:flex-1 flex justify-center">
            <SearchBar
              onSelectTrack={onSelectTrack}
              onNotify={onNotify}
              externalInputRef={searchInputRef}
              isMultiTrack={isMulti}
              isAtTrackLimit={tracks.length >= MAX_PLAYLIST_TRACKS}
            />
          </div>

          {/* Undo/Redo + Customize Panel Toggle */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto lg:ml-0">
            <div className="inline-flex items-center rounded-xl bg-[#151517] border border-white/[0.08] p-0.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo edit"
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded-lg text-[#F5F5F5] hover:bg-white/[0.08] disabled:text-[#8E8E93]/40 disabled:pointer-events-none transition-colors duration-200 cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo edit"
                title="Redo (Ctrl+Shift+Z)"
                className="p-1.5 rounded-lg text-[#F5F5F5] hover:bg-white/[0.08] disabled:text-[#8E8E93]/40 disabled:pointer-events-none transition-colors duration-200 cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleCustomize}
              aria-expanded={customizeOpen}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                customizeOpen
                  ? 'bg-white/[0.12] border-white/[0.2] text-[#F5F5F5]'
                  : 'bg-[#151517] border-white/[0.08] text-[#F5F5F5] hover:border-white/[0.2]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#1DB954]" aria-hidden="true" />
              <span>Customize</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template Switcher Strip: above preview on desktop, horizontally scrolling below preview on mobile */}
      <div className="order-2 shrink-0 px-3 sm:px-6 py-2 bg-[#0B0B0C]/80 border-t lg:border-t-0 lg:border-b border-white/[0.06] z-10">
        <div className="flex justify-start lg:justify-center">
          <div
            role="radiogroup"
            aria-label="Poster templates"
            className="flex items-center gap-2 overflow-x-auto studio-scrollbar py-0.5 max-w-full"
          >
            {templates.map((tpl) => {
              const isSelected = tpl.id === template.id;
              const ThumbRender = tpl.Render;
              const thumbTokens = tokensByTemplate[tpl.id] ?? tpl.defaults;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectTemplate(tpl.id)}
                  className={`group flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                    isSelected
                      ? 'bg-[#151517] border-[#1DB954]/80 text-[#F5F5F5] shadow-sm'
                      : 'bg-[#151517]/60 border-white/[0.08] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18]'
                  }`}
                >
                  <div
                    className="rounded-[4px] overflow-hidden border border-white/[0.12] bg-[#0B0B0C] shrink-0 relative"
                    style={{ width: THUMB_W, height: THUMB_H }}
                    aria-hidden="true"
                  >
                    <div
                      style={{
                        width: tpl.size.w,
                        height: tpl.size.h,
                        transform: `scale(${THUMB_SCALE})`,
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                      }}
                    >
                      <ThumbRender
                        track={track}
                        tracks={tracks}
                        meta={playlistMeta}
                        tokens={thumbTokens}
                        codeUrl={codeUrl}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium">{tpl.name}</span>
                  {tpl.multiTrack && (
                    <span className="text-[10px] font-medium text-[#1DB954]/90 bg-[#1DB954]/10 px-1.5 py-0.5 rounded-md">
                      Playlist
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Scaled Poster Preview Canvas: sits on top on mobile, center stage on desktop */}
      <div
        ref={stageContainerRef}
        className="order-1 lg:order-3 flex-1 min-h-0 flex flex-col items-center justify-center relative px-4 pt-4 pb-3 overflow-hidden"
      >
        {/* Poster Preview */}
        <div className="relative z-10 flex flex-col items-center">
          <div
            data-testid="poster-preview-frame"
            style={{ width: previewW, height: previewH }}
            className="relative overflow-hidden rounded-[4px] border border-white/[0.09] shadow-[0_38px_90px_-20px_rgba(0,0,0,0.85),0_14px_34px_rgba(0,0,0,0.55)] transition-[width,height] duration-200 ease-out"
          >
            <motion.div
              key={`${template.id}-${trackKey}`}
              initial={{ opacity: 0.35, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: previewW, height: previewH, transformOrigin: 'center center' }}
            >
              <div
                style={{
                  width: template.size.w,
                  height: template.size.h,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <ActiveRender
                  track={track}
                  tracks={tracks}
                  meta={playlistMeta}
                  tokens={tokens}
                  codeUrl={codeUrl}
                  onUploadCode={onUploadCode}
                  onCodeLoadError={onCodeLoadError}
                  onChangeMeta={isMulti ? onChangePlaylistMeta : undefined}
                />
              </div>
            </motion.div>
          </div>

          {/* Soft floor shadow ellipse */}
          <div
            aria-hidden="true"
            style={{ width: Math.round(previewW * 0.86) }}
            className="h-4 rounded-full pointer-events-none shrink-0 mt-2.5 bg-black/70 blur-xl"
          />
        </div>

        {/* Mockup Studio Trigger Button under Preview */}
        <div className="relative z-10 mt-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMockup}
            aria-label="Open Mockup Studio"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#151517]/90 border border-white/[0.08] text-xs font-medium text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18] transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
          >
            <Frame className="w-3.5 h-3.5 text-[#1DB954]" aria-hidden="true" />
            <span>Mockup</span>
          </button>
        </div>
      </div>

      {/* Off-screen natural 1240x1754 DOM surface for clean PNG/PDF export */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -20000,
          top: 0,
          width: template.size.w,
          height: template.size.h,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div ref={exportRef} style={{ width: template.size.w, height: template.size.h }}>
          <ActiveRender
            track={track}
            tracks={tracks}
            meta={playlistMeta}
            tokens={tokens}
            codeUrl={codeUrl}
          />
        </div>
      </div>
    </main>
  );
}
