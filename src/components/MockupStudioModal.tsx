import { ArrowLeft, Check, Download, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PlaylistMeta, Template, Tokens, Track } from '../types/poster';
import { exportMockupPng } from '../utils/exportPoster';
import {
  FRAME_STYLES,
  MAT_SIZES,
  MOCKUP_POSTER_SIZES,
  MOCKUP_SCENES,
  MOCKUP_SCENE_HEIGHT,
  MOCKUP_SCENE_WIDTH,
  WALL_COLOR_PRESETS,
  type FrameStyle,
  type MatSize,
  type MockupPosterSize,
  type MockupSceneId,
} from '../utils/mockupConfig';
import { MockupSceneCanvas } from './MockupSceneCanvas';

interface MockupStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  template: Template;
  tokens: Tokens;
  codeUrl?: string;
  onNotify: (message: string, tone?: 'info' | 'error') => void;
}

const THUMB_W = 112;
const THUMB_H = Math.round(THUMB_W * (MOCKUP_SCENE_HEIGHT / MOCKUP_SCENE_WIDTH));
const THUMB_SCALE = THUMB_W / MOCKUP_SCENE_WIDTH;

export function MockupStudioModal({
  isOpen,
  onClose,
  track,
  tracks,
  meta,
  template,
  tokens,
  codeUrl,
  onNotify,
}: MockupStudioModalProps) {
  const [sceneId, setSceneId] = useState<MockupSceneId>('floor-lean');
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('black');
  const [matSize, setMatSize] = useState<MatSize>('thin');
  const [wallColor, setWallColor] = useState<string>(WALL_COLOR_PRESETS[0].hex);
  const [posterSize, setPosterSize] = useState<MockupPosterSize>('a3');
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(0.58);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isExporting, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const el = stageRef.current;
    if (!el) return;

    const computeScale = () => {
      const rect = el.getBoundingClientRect();
      const padX = rect.width < 640 ? 24 : 48;
      const padY = rect.width < 640 ? 20 : 32;
      const availW = Math.max(220, rect.width - padX);
      const availH = Math.max(160, rect.height - padY);
      const next = Math.min(availW / MOCKUP_SCENE_WIDTH, availH / MOCKUP_SCENE_HEIGHT, 0.85);
      setScale(Math.max(0.18, Number(next.toFixed(4))));
    };

    computeScale();
    const observer = new ResizeObserver(computeScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const previewW = Math.round(MOCKUP_SCENE_WIDTH * scale);
  const previewH = Math.round(MOCKUP_SCENE_HEIGHT * scale);

  const isMulti = Boolean(template.multiTrack);
  const displayTitle = isMulti ? meta?.title || 'Untitled Playlist' : track.title;
  const displayArtist = isMulti ? `${tracks?.length ?? 0}-tracks` : track.artist;

  const handleDownloadMockup = async () => {
    if (!captureRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportMockupPng(captureRef.current, {
        title: displayTitle,
        artist: displayArtist,
        sceneId,
      });
      const activeScene = MOCKUP_SCENES.find((s) => s.id === sceneId);
      onNotify(`Exported ${activeScene?.label ?? 'Room'} mockup PNG (2560 × 1800 px)`);
    } catch {
      onNotify('Could not export mockup PNG. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mockup-studio-title"
      data-testid="mockup-studio-modal"
      className="fixed inset-0 z-50 bg-[#0B0B0C] flex flex-col overflow-hidden"
    >
      {/* Top Studio Header */}
      <header className="h-14 shrink-0 px-3 sm:px-6 border-b border-white/[0.08] bg-[#0B0B0C]/95 backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#151517] border border-white/[0.08] hover:border-white/[0.2] text-xs font-medium text-[#F5F5F5] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#8E8E93]" aria-hidden="true" />
            <span className="hidden sm:inline">Back to Editor</span>
          </button>

          <div className="min-w-0">
            <h2
              id="mockup-studio-title"
              className="text-sm font-semibold text-[#F5F5F5] truncate leading-tight"
            >
              Mockup Studio
            </h2>
            <p className="text-[11px] text-[#8E8E93] truncate leading-tight">
              {displayTitle} · {template.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleDownloadMockup()}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-[#07110B] text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{isExporting ? 'Exporting…' : 'Download mockup'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close Mockup Studio"
            className="p-2 rounded-xl text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Area: Stage + Scene Strip Left, Controls Sidebar Right */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left/Center Room Preview & Scene Thumbnails */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#09090B]">
          {/* Room Stage */}
          <div
            ref={stageRef}
            className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          >
            <div
              data-testid="mockup-scene-viewport"
              style={{ width: previewW, height: previewH }}
              className="rounded-xl overflow-hidden border border-white/[0.1] shadow-[0_32px_90px_rgba(0,0,0,0.85)] shrink-0"
            >
              <div
                style={{
                  width: MOCKUP_SCENE_WIDTH,
                  height: MOCKUP_SCENE_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <MockupSceneCanvas
                  sceneId={sceneId}
                  frameStyle={frameStyle}
                  matSize={matSize}
                  wallColor={wallColor}
                  posterSize={posterSize}
                  track={track}
                  tracks={tracks}
                  meta={meta}
                  template={template}
                  tokens={tokens}
                  codeUrl={codeUrl}
                />
              </div>
            </div>
          </div>

          {/* Switchable Room Scene Thumbnails */}
          <div className="shrink-0 px-3 sm:px-6 py-2.5 border-t border-white/[0.06] bg-[#0B0B0C]/90">
            <div className="flex justify-start sm:justify-center">
              <div
                role="radiogroup"
                aria-label="Room scenes"
                className="flex items-center gap-2.5 overflow-x-auto studio-scrollbar py-0.5 max-w-full"
              >
                {MOCKUP_SCENES.map((scene) => {
                  const active = scene.id === sceneId;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSceneId(scene.id)}
                      className={`group flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                        active
                          ? 'bg-[#151517] border-[#1DB954]/80 text-[#F5F5F5]'
                          : 'bg-[#151517]/60 border-white/[0.08] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18]'
                      }`}
                    >
                      <div
                        className="rounded-lg overflow-hidden border border-white/[0.1] shrink-0"
                        style={{ width: THUMB_W, height: THUMB_H }}
                        aria-hidden="true"
                      >
                        <div
                          style={{
                            width: MOCKUP_SCENE_WIDTH,
                            height: MOCKUP_SCENE_HEIGHT,
                            transform: `scale(${THUMB_SCALE})`,
                            transformOrigin: 'top left',
                            pointerEvents: 'none',
                          }}
                        >
                          <MockupSceneCanvas
                            sceneId={scene.id}
                            frameStyle={frameStyle}
                            matSize={matSize}
                            wallColor={wallColor}
                            posterSize={posterSize}
                            track={track}
                            tracks={tracks}
                            meta={meta}
                            template={template}
                            tokens={tokens}
                            codeUrl={codeUrl}
                            thumbnailPreview
                          />
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-medium text-[#F5F5F5]">{scene.label}</div>
                        <div className="text-[10px] text-[#8E8E93] mt-0.5">{scene.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Mockup Controls Panel */}
        <aside
          aria-label="Mockup settings"
          className="w-full lg:w-[320px] max-h-[38vh] lg:max-h-none shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#151517] overflow-y-auto studio-scrollbar p-4 sm:p-5 space-y-5"
        >
          {/* Frame Style */}
          <section className="space-y-2.5">
            <span className="text-xs font-semibold text-[#F5F5F5] block">Frame Style</span>
            <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Frame style">
              {FRAME_STYLES.map((item) => {
                const active = frameStyle === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFrameStyle(item.id)}
                    className={`flex flex-col items-center gap-1.5 py-2 px-1.5 rounded-xl border text-[11px] font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                      active
                        ? 'bg-[#1DB954]/12 border-[#1DB954] text-[#F5F5F5]'
                        : 'bg-[#0B0B0C] border-white/[0.08] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-5 h-5 rounded-md border border-white/20 block"
                      style={{
                        background:
                          item.id === 'black'
                            ? '#18181B'
                            : item.id === 'white'
                              ? '#F3F2EE'
                              : item.id === 'oak'
                                ? 'linear-gradient(135deg, #D5B084, #B08253)'
                                : 'transparent',
                        borderStyle: item.id === 'none' ? 'dashed' : 'solid',
                      }}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Mat / Border */}
          <section className="space-y-2.5 pt-4 border-t border-white/[0.08]">
            <span className="text-xs font-semibold text-[#F5F5F5] block">Mat / Border</span>
            <div
              className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]"
              role="radiogroup"
              aria-label="Mat border size"
            >
              {MAT_SIZES.map((item) => {
                const active = matSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMatSize(item.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer ${
                      active
                        ? 'bg-white/[0.12] text-[#F5F5F5]'
                        : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Wall Color */}
          <section className="space-y-2.5 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F5F5F5]">Wall Color</span>
              <span className="text-[#8E8E93] font-mono text-[11px] uppercase tabular-nums">
                {wallColor}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {WALL_COLOR_PRESETS.map((preset) => {
                const active = wallColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    aria-label={`Select wall color ${preset.label}`}
                    title={preset.label}
                    onClick={() => setWallColor(preset.hex)}
                    className={`w-7 h-7 rounded-full border flex items-center justify-center transition-transform duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                      active
                        ? 'scale-110 ring-2 ring-[#1DB954] ring-offset-2 ring-offset-[#151517] border-white/60'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {active && (
                      <Check
                        className="w-3.5 h-3.5"
                        style={{
                          color:
                            preset.hex === '#26282C' || preset.hex === '#64707A'
                              ? '#FFFFFF'
                              : '#151517',
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}

              <label
                aria-label="Custom wall color"
                title="Custom wall color"
                className="w-7 h-7 rounded-full border border-white/20 overflow-hidden cursor-pointer relative ml-auto shrink-0"
              >
                <input
                  type="color"
                  value={wallColor}
                  onChange={(e) => setWallColor(e.target.value)}
                  className="absolute inset-0 w-10 h-10 -left-1.5 -top-1.5 cursor-pointer opacity-0"
                />
                <span
                  className="block w-full h-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, #EAE4DA, #B9C1B4, #64707A, #26282C, #D6D2CA, #EAE4DA)',
                  }}
                />
              </label>
            </div>
          </section>

          {/* Poster Size Relative to Scene */}
          <section className="space-y-2.5 pt-4 border-t border-white/[0.08]">
            <span className="text-xs font-semibold text-[#F5F5F5] block">Poster Size</span>
            <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Poster size in scene">
              {MOCKUP_POSTER_SIZES.map((item) => {
                const active = posterSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPosterSize(item.id)}
                    className={`py-2 px-2 rounded-xl border text-center transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                      active
                        ? 'bg-[#1DB954]/12 border-[#1DB954] text-[#F5F5F5]'
                        : 'bg-[#0B0B0C] border-white/[0.08] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#F5F5F5]">{item.label}</div>
                    <div className="text-[10px] text-[#8E8E93] mt-0.5 tabular-nums">
                      {item.dimensionsLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {/* Unscaled 1280x900 Offscreen DOM Surface for Clean PNG Mockup Export */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: -24000,
          top: 0,
          width: MOCKUP_SCENE_WIDTH,
          height: MOCKUP_SCENE_HEIGHT,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div ref={captureRef} style={{ width: MOCKUP_SCENE_WIDTH, height: MOCKUP_SCENE_HEIGHT }}>
          <MockupSceneCanvas
            sceneId={sceneId}
            frameStyle={frameStyle}
            matSize={matSize}
            wallColor={wallColor}
            posterSize={posterSize}
            track={track}
            tracks={tracks}
            meta={meta}
            template={template}
            tokens={tokens}
            codeUrl={codeUrl}
          />
        </div>
      </div>
    </div>
  );
}
