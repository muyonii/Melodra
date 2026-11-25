import { Check } from 'lucide-react';
import { useState } from 'react';
import { templates } from '../../templates';
import type { PlaylistMeta, Track } from '../types/poster';
import type { TokensByTemplate } from '../utils/tokenHistory';

type TemplateFilter = 'all' | 'single' | 'playlist';

interface TemplatesGalleryProps {
  track: Track;
  tracks: Track[];
  playlistMeta: PlaylistMeta;
  activeTemplateId: string;
  tokensByTemplate: TokensByTemplate;
  codeUrl?: string;
  onSelectTemplate: (templateId: string) => void;
}

const CARD_W = 240;
const CARD_H = Math.round((1754 / 1240) * CARD_W);
const CARD_SCALE = CARD_W / 1240;

const FILTER_OPTIONS: { id: TemplateFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'single', label: 'Single' },
  { id: 'playlist', label: 'Playlist' },
];

export function TemplatesGallery({
  track,
  tracks,
  playlistMeta,
  activeTemplateId,
  tokensByTemplate,
  codeUrl,
  onSelectTemplate,
}: TemplatesGalleryProps) {
  const [filter, setFilter] = useState<TemplateFilter>('all');

  const visibleTemplates = templates.filter((tpl) => {
    if (filter === 'single') return !tpl.multiTrack;
    if (filter === 'playlist') return Boolean(tpl.multiTrack);
    return true;
  });

  return (
    <main className="flex-1 overflow-y-auto studio-scrollbar bg-[#0B0B0C] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F5F5F5]">Templates</h1>
            <p className="text-sm text-[#8E8E93] mt-1.5">
              Print-ready 1240 × 1754 single-track and playlist layouts rendered live.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter templates"
            className="inline-flex items-center p-1 rounded-xl bg-[#151517] border border-white/[0.08] shrink-0 self-start sm:self-auto"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(opt.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white/[0.12] text-[#F5F5F5]'
                      : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTemplates.map((tpl) => {
            const isActive = tpl.id === activeTemplateId;
            const Render = tpl.Render;
            const cardTokens = tokensByTemplate[tpl.id] ?? tpl.defaults;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl.id)}
                className={`group text-left rounded-2xl bg-[#151517] border p-5 flex flex-col transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                  isActive
                    ? 'border-[#1DB954]/80'
                    : 'border-white/[0.08] hover:border-white/[0.2] hover:-translate-y-0.5'
                }`}
              >
                <div className="w-full flex items-center justify-center py-4 bg-[#0B0B0C] rounded-xl border border-white/[0.06] mb-4">
                  <div
                    className="rounded-[4px] overflow-hidden shadow-2xl border border-white/[0.08] transition-transform duration-200 group-hover:scale-[1.015]"
                    style={{ width: CARD_W, height: CARD_H }}
                  >
                    <div
                      style={{
                        width: tpl.size.w,
                        height: tpl.size.h,
                        transform: `scale(${CARD_SCALE})`,
                        transformOrigin: 'top left',
                        pointerEvents: 'none',
                      }}
                    >
                      <Render
                        track={track}
                        tracks={tracks}
                        meta={playlistMeta}
                        tokens={cardTokens}
                        codeUrl={codeUrl}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold text-[#F5F5F5] truncate">{tpl.name}</h2>
                      {tpl.multiTrack && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1DB954]/12 text-[#1DB954] border border-[#1DB954]/30">
                          Playlist
                        </span>
                      )}
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-[#8E8E93] mt-1 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-[#8E8E93] tabular-nums">
                    {tpl.multiTrack ? `${tracks.length} tracks` : `${tpl.controls.length} controls`}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-[#1DB954]/15 text-[#1DB954]'
                        : 'bg-white/[0.08] group-hover:bg-white/[0.14] text-[#F5F5F5]'
                    }`}
                  >
                    {isActive && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    <span>{isActive ? 'Selected' : 'Open in Editor'}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
