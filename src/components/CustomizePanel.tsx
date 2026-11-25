import { RotateCcw, Trash2, Upload, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type {
  PlaylistMeta,
  PosterFont,
  PosterTheme,
  Template,
  Tokens,
  Track,
} from '../types/poster';
import { formatDurationMs, formatSeconds } from '../utils/format';
import { TracksManager } from './TracksManager';

export type CustomizeTab = 'style' | 'tracks';

interface CustomizePanelProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  tokens: Tokens;
  track: Track;
  tracks: Track[];
  playlistMeta: PlaylistMeta;
  activeTab: CustomizeTab;
  onChangeTab: (tab: CustomizeTab) => void;
  hasCustomCode: boolean;
  onChangeToken: <K extends keyof Tokens>(
    key: K,
    value: Tokens[K],
    options?: { coalesceKey?: keyof Tokens },
  ) => void;
  onChangePlaylistMeta: (patch: Partial<PlaylistMeta>) => void;
  onReorderTracks: (fromIndex: number, toIndex: number) => void;
  onRemoveTrack: (index: number) => void;
  onApplyBulkTracks: (tracks: Track[], mode: 'replace' | 'append') => void;
  onOpenAddCustomSong: () => void;
  onNotify: (message: string, tone?: 'info' | 'error') => void;
  onToggleAutoTheme: (enabled: boolean) => void;
  onSelectManualAccent: (hex: string) => void;
  onUploadCode: (dataUrl: string) => void;
  onClearCustomCode: () => void;
  onReset: () => void;
}

const FONT_OPTIONS: { value: PosterFont; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Space Mono', label: 'Space Mono' },
];

const ACCENT_SWATCHES = [
  { value: '#FFFFFF', label: 'Pure White' },
  { value: '#1DB954', label: 'Spotify Green' },
  { value: '#A3E635', label: 'Lime' },
  { value: '#38BDF8', label: 'Sky' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#F43F5E', label: 'Rose' },
];

const THEME_OPTIONS: { value: PosterTheme; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const COLUMN_OPTIONS: (2 | 3 | 4)[] = [2, 3, 4];

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="text-xs font-medium text-[#F5F5F5] cursor-pointer block">
          {label}
        </label>
        {hint && <span className="text-[11px] text-[#8E8E93] block mt-0.5">{hint}</span>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
          checked ? 'bg-[#1DB954]' : 'bg-white/[0.14]'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  );
}

export function CustomizePanel({
  isOpen,
  onClose,
  template,
  tokens,
  track,
  tracks,
  playlistMeta,
  activeTab,
  onChangeTab,
  hasCustomCode,
  onChangeToken,
  onChangePlaylistMeta,
  onReorderTracks,
  onRemoveTrack,
  onApplyBulkTracks,
  onOpenAddCustomSong,
  onNotify,
  onToggleAutoTheme,
  onSelectManualAccent,
  onUploadCode,
  onClearCustomCode,
  onReset,
}: CustomizePanelProps) {
  if (!isOpen) {
    return null;
  }

  const isMulti = Boolean(template.multiTrack);
  const currentTab: CustomizeTab = isMulti ? activeTab : 'style';
  const hasControl = (key: keyof Tokens) => template.controls.includes(key);
  const maxSeconds = Math.max(10, Math.floor(track.durationMs / 1000));

  const showBackgroundSection =
    hasControl('blur') || hasControl('brightness') || hasControl('glassOpacity');
  const showStyleSection =
    hasControl('font') ||
    hasControl('radius') ||
    hasControl('accent') ||
    hasControl('autoTheme') ||
    hasControl('theme');
  const showLayoutSection =
    hasControl('columns') || hasControl('titleSize') || hasControl('gap');
  const showContentSection =
    hasControl('timestamp') ||
    hasControl('showDuration') ||
    hasControl('showHeart') ||
    hasControl('showAlbum') ||
    hasControl('showCode') ||
    hasControl('showCovers') ||
    hasControl('showNumbers') ||
    hasControl('showDurations');

  const handleCodeFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadCode(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Mobile Bottom Sheet Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden"
      />

      <aside
        aria-label="Customize poster tokens"
        className="fixed inset-x-0 bottom-0 z-40 max-h-[76vh] rounded-t-2xl border-t border-white/[0.12] bg-[#151517] flex flex-col shrink-0 shadow-[0_-24px_70px_rgba(0,0,0,0.85)] lg:static lg:inset-auto lg:z-auto lg:h-full lg:max-h-none lg:w-[336px] lg:rounded-none lg:border-t-0 lg:border-l lg:border-white/[0.08] lg:shadow-none"
      >
        {/* Mobile Bottom Sheet Handle */}
        <div className="lg:hidden flex justify-center pt-2.5 pb-1 shrink-0" aria-hidden="true">
          <span className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 lg:py-4 border-b border-white/[0.08] shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Customize</h2>
            <p className="text-[11px] text-[#8E8E93] mt-0.5 truncate">{template.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customize panel"
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.06] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Multi-Track Tab Switcher (Tracks vs Style) */}
        {isMulti && (
          <div className="px-5 pt-3 pb-2 border-b border-white/[0.06] shrink-0">
            <div
              role="tablist"
              aria-label="Playlist panel tabs"
              className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={currentTab === 'tracks'}
                onClick={() => onChangeTab('tracks')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ${
                  currentTab === 'tracks'
                    ? 'bg-white/[0.12] text-[#F5F5F5]'
                    : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                }`}
              >
                Tracks ({tracks.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={currentTab === 'style'}
                onClick={() => onChangeTab('style')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ${
                  currentTab === 'style'
                    ? 'bg-white/[0.12] text-[#F5F5F5]'
                    : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                }`}
              >
                Style
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto studio-scrollbar p-5 space-y-6">
          {isMulti && currentTab === 'tracks' ? (
            <TracksManager
              tracks={tracks}
              meta={playlistMeta}
              onChangeMeta={onChangePlaylistMeta}
              onReorderTracks={onReorderTracks}
              onRemoveTrack={onRemoveTrack}
              onApplyBulkTracks={onApplyBulkTracks}
              onOpenAddCustomSong={onOpenAddCustomSong}
              onNotify={onNotify}
            />
          ) : (
            <>
              {/* 1. Background */}
              {showBackgroundSection && (
                <section className="space-y-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                    Background
                  </h3>

                  {hasControl('blur') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-blur" className="text-[#F5F5F5] font-medium">
                          Blur
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">{tokens.blur}px</span>
                      </div>
                      <input
                        id="token-blur"
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={tokens.blur}
                        onChange={(e) =>
                          onChangeToken('blur', Number(e.target.value), { coalesceKey: 'blur' })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}

                  {hasControl('brightness') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-brightness" className="text-[#F5F5F5] font-medium">
                          Brightness
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">
                          {Math.round(tokens.brightness * 100)}%
                        </span>
                      </div>
                      <input
                        id="token-brightness"
                        type="range"
                        min={0.2}
                        max={1.1}
                        step={0.05}
                        value={tokens.brightness}
                        onChange={(e) =>
                          onChangeToken('brightness', Number(e.target.value), {
                            coalesceKey: 'brightness',
                          })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}

                  {hasControl('glassOpacity') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-glass" className="text-[#F5F5F5] font-medium">
                          Glass Opacity
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">
                          {Math.round(tokens.glassOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        id="token-glass"
                        type="range"
                        min={0}
                        max={0.28}
                        step={0.01}
                        value={tokens.glassOpacity}
                        onChange={(e) =>
                          onChangeToken('glassOpacity', Number(e.target.value), {
                            coalesceKey: 'glassOpacity',
                          })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}
                </section>
              )}

              {/* 2. Style */}
              {showStyleSection && (
                <section
                  className={`space-y-4 ${
                    showBackgroundSection ? 'pt-5 border-t border-white/[0.08]' : ''
                  }`}
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                    Style
                  </h3>

                  {hasControl('font') && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[#F5F5F5] block">Font</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {FONT_OPTIONS.map((opt) => {
                          const active = tokens.font === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => onChangeToken('font', opt.value)}
                              style={{ fontFamily: `'${opt.value}', sans-serif` }}
                              className={`py-2 px-2 rounded-xl text-[11px] font-medium border transition-all duration-200 cursor-pointer truncate ${
                                active
                                  ? 'border-[#1DB954] bg-[#1DB954]/12 text-[#F5F5F5]'
                                  : 'border-white/[0.08] bg-[#0B0B0C] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.16]'
                              }`}
                            >
                              {opt.label === 'Playfair Display'
                                ? 'Playfair'
                                : opt.label === 'Space Mono'
                                  ? 'Mono'
                                  : opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasControl('radius') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-radius" className="text-[#F5F5F5] font-medium">
                          Corner Radius
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">{tokens.radius}px</span>
                      </div>
                      <input
                        id="token-radius"
                        type="range"
                        min={0}
                        max={64}
                        step={2}
                        value={tokens.radius}
                        onChange={(e) =>
                          onChangeToken('radius', Number(e.target.value), { coalesceKey: 'radius' })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}

                  {hasControl('autoTheme') && (
                    <SwitchRow
                      id="toggle-auto-theme"
                      label="Auto theme"
                      hint="Extracts accent & tint from cover"
                      checked={tokens.autoTheme !== false}
                      onChange={onToggleAutoTheme}
                    />
                  )}

                  {hasControl('accent') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#F5F5F5] font-medium">Accent Color</span>
                        <span className="text-[#8E8E93] font-mono text-[11px] uppercase">
                          {tokens.accent}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ACCENT_SWATCHES.map((swatch) => {
                          const active = tokens.accent.toLowerCase() === swatch.value.toLowerCase();
                          return (
                            <button
                              key={swatch.value}
                              type="button"
                              aria-label={`Select accent color ${swatch.label}`}
                              onClick={() => onSelectManualAccent(swatch.value)}
                              className={`w-7 h-7 rounded-full border transition-transform duration-150 cursor-pointer ${
                                active
                                  ? 'scale-110 ring-2 ring-[#1DB954] ring-offset-2 ring-offset-[#151517] border-white/60'
                                  : 'border-white/20 hover:scale-105'
                              }`}
                              style={{ backgroundColor: swatch.value }}
                            />
                          );
                        })}
                        <label
                          aria-label="Custom accent color"
                          className="w-7 h-7 rounded-full border border-white/20 overflow-hidden cursor-pointer relative ml-auto shrink-0"
                          title="Custom color"
                        >
                          <input
                            type="color"
                            value={tokens.accent}
                            onChange={(e) => onSelectManualAccent(e.target.value)}
                            className="absolute inset-0 w-10 h-10 -left-1.5 -top-1.5 cursor-pointer opacity-0"
                          />
                          <span
                            className="block w-full h-full"
                            style={{
                              background:
                                'conic-gradient(from 0deg, #f43f5e, #f59e0b, #1db954, #38bdf8, #a855f7, #f43f5e)',
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {hasControl('theme') && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[#F5F5F5] block">Theme</span>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]">
                        {THEME_OPTIONS.map((opt) => {
                          const active =
                            opt.value === 'dark'
                              ? tokens.theme !== 'light'
                              : tokens.theme === 'light';
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => onChangeToken('theme', opt.value)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ${
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
                  )}
                </section>
              )}

              {/* 3. Layout (Multi-Track) */}
              {showLayoutSection && (
                <section
                  className={`space-y-4 ${
                    showBackgroundSection || showStyleSection
                      ? 'pt-5 border-t border-white/[0.08]'
                      : ''
                  }`}
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                    Layout
                  </h3>

                  {hasControl('columns') && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-[#F5F5F5] block">Columns</span>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]">
                        {COLUMN_OPTIONS.map((cols) => {
                          const active = (tokens.columns ?? 3) === cols;
                          return (
                            <button
                              key={cols}
                              type="button"
                              onClick={() => onChangeToken('columns', cols)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-medium tabular-nums transition-colors duration-200 cursor-pointer ${
                                active
                                  ? 'bg-white/[0.12] text-[#F5F5F5]'
                                  : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                              }`}
                            >
                              {cols} cols
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasControl('titleSize') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-title-size" className="text-[#F5F5F5] font-medium">
                          Title Size
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">
                          {tokens.titleSize ?? 84}px
                        </span>
                      </div>
                      <input
                        id="token-title-size"
                        type="range"
                        min={52}
                        max={112}
                        step={2}
                        value={tokens.titleSize ?? 84}
                        onChange={(e) =>
                          onChangeToken('titleSize', Number(e.target.value), {
                            coalesceKey: 'titleSize',
                          })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}

                  {hasControl('gap') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-gap" className="text-[#F5F5F5] font-medium">
                          Spacing
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">{tokens.gap ?? 28}px</span>
                      </div>
                      <input
                        id="token-gap"
                        type="range"
                        min={12}
                        max={48}
                        step={2}
                        value={tokens.gap ?? 28}
                        onChange={(e) =>
                          onChangeToken('gap', Number(e.target.value), { coalesceKey: 'gap' })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}
                </section>
              )}

              {/* 4. Content */}
              {showContentSection && (
                <section
                  className={`space-y-3 ${
                    showBackgroundSection || showStyleSection || showLayoutSection
                      ? 'pt-5 border-t border-white/[0.08]'
                      : ''
                  }`}
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                    Content
                  </h3>

                  {hasControl('timestamp') && (
                    <div className="space-y-2 pb-1">
                      <div className="flex items-center justify-between text-xs">
                        <label htmlFor="token-timestamp" className="text-[#F5F5F5] font-medium">
                          Timestamp
                        </label>
                        <span className="text-[#8E8E93] tabular-nums">
                          {formatSeconds(Math.min(tokens.timestamp, maxSeconds))} /{' '}
                          {formatDurationMs(track.durationMs)}
                        </span>
                      </div>
                      <input
                        id="token-timestamp"
                        type="range"
                        min={0}
                        max={maxSeconds}
                        step={1}
                        value={Math.min(tokens.timestamp, maxSeconds)}
                        onChange={(e) =>
                          onChangeToken('timestamp', Number(e.target.value), {
                            coalesceKey: 'timestamp',
                          })
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  )}

                  {hasControl('showDuration') && (
                    <div className="space-y-2 pb-1">
                      <span className="text-xs font-medium text-[#F5F5F5] block">Duration</span>
                      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => onChangeToken('showDuration', false)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ${
                            !tokens.showDuration
                              ? 'bg-white/[0.12] text-[#F5F5F5]'
                              : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                          }`}
                        >
                          ∞ Infinity
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeToken('showDuration', true)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium tabular-nums transition-colors duration-200 cursor-pointer ${
                            tokens.showDuration
                              ? 'bg-white/[0.12] text-[#F5F5F5]'
                              : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                          }`}
                        >
                          {formatDurationMs(track.durationMs)}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {hasControl('showCovers') && (
                      <SwitchRow
                        id="toggle-covers"
                        label="Show Cover Strip"
                        checked={tokens.showCovers !== false}
                        onChange={(v) => onChangeToken('showCovers', v)}
                      />
                    )}

                    {hasControl('showNumbers') && (
                      <SwitchRow
                        id="toggle-numbers"
                        label="Show Track Numbers"
                        checked={tokens.showNumbers !== false}
                        onChange={(v) => onChangeToken('showNumbers', v)}
                      />
                    )}

                    {hasControl('showDurations') && (
                      <SwitchRow
                        id="toggle-durations"
                        label="Show Track Durations"
                        checked={tokens.showDurations !== false}
                        onChange={(v) => onChangeToken('showDurations', v)}
                      />
                    )}

                    {hasControl('showHeart') && (
                      <SwitchRow
                        id="toggle-heart"
                        label="Show Heart Icon"
                        checked={tokens.showHeart}
                        onChange={(v) => onChangeToken('showHeart', v)}
                      />
                    )}

                    {hasControl('showAlbum') && (
                      <SwitchRow
                        id="toggle-album"
                        label="Show Album Name"
                        checked={tokens.showAlbum}
                        onChange={(v) => onChangeToken('showAlbum', v)}
                      />
                    )}

                    {hasControl('showCode') && (
                      <>
                        <SwitchRow
                          id="toggle-code"
                          label="Show Spotify Code"
                          checked={tokens.showCode}
                          onChange={(v) => onChangeToken('showCode', v)}
                        />
                        {tokens.showCode && (
                          <div className="flex items-center gap-2 pb-2 pt-0.5">
                            <label className="inline-flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B0B0C] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-medium text-[#F5F5F5] cursor-pointer transition-colors">
                              <Upload className="w-3 h-3 text-[#8E8E93]" aria-hidden="true" />
                              <span>
                                {hasCustomCode ? 'Replace code image' : 'Upload code image'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCodeFile}
                                className="sr-only"
                              />
                            </label>
                            {hasCustomCode && (
                              <button
                                type="button"
                                onClick={onClearCustomCode}
                                aria-label="Remove uploaded code image"
                                className="p-1.5 rounded-lg bg-[#0B0B0C] border border-white/[0.08] text-[#8E8E93] hover:text-rose-400 hover:border-rose-400/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer Reset Button */}
        {currentTab === 'style' && (
          <div className="px-5 py-3.5 border-t border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={onReset}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] hover:border-white/[0.2] text-xs font-medium text-[#F5F5F5] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#8E8E93]" aria-hidden="true" />
              <span>Reset to template defaults</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

