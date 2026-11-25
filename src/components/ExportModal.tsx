import { AlertTriangle, Download, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PlaylistMeta, Template, Track } from '../types/poster';
import {
  measureCoverResolution,
  measureLowestCoverResolution,
  type ImageResolution,
} from '../utils/exportPoster';
import {
  EXPORT_PRESETS,
  getExportPreset,
  isLowResCover,
  type ExportFormat,
  type ExportPresetId,
} from '../utils/exportPresets';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  template: Template;
  isExporting: boolean;
  progressLabel: string;
  progressPercent: number;
  exportError: string | null;
  onConfirmExport: (presetId: ExportPresetId, format: ExportFormat) => void;
  onClearError: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  track,
  tracks,
  meta,
  template,
  isExporting,
  progressLabel,
  progressPercent,
  exportError,
  onConfirmExport,
  onClearError,
}: ExportModalProps) {
  const [presetId, setPresetId] = useState<ExportPresetId>('a4');
  const [format, setFormat] = useState<ExportFormat>('png');
  const [resolution, setResolution] = useState<ImageResolution | null>(null);
  const [checkingRes, setCheckingRes] = useState(false);

  const isMulti = Boolean(template.multiTrack);
  const coverUrlsKey = isMulti && tracks ? tracks.map((t) => t.coverUrl).join('|') : track.coverUrl;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setCheckingRes(true);
    const checkPromise =
      isMulti && tracks && tracks.length > 0
        ? measureLowestCoverResolution(tracks.map((t) => t.coverUrl))
        : measureCoverResolution(track.coverUrl);

    checkPromise
      .then((res) => {
        if (!cancelled) {
          setResolution(res);
          setCheckingRes(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolution(null);
          setCheckingRes(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isMulti, track.coverUrl, coverUrlsKey, tracks]);

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

  if (!isOpen) {
    return null;
  }

  const preset = getExportPreset(presetId);
  const lowRes = resolution ? isLowResCover(resolution.width, resolution.height) : false;

  const handleSelectPreset = (nextId: ExportPresetId) => {
    onClearError();
    setPresetId(nextId);
  };

  const handleSelectFormat = (nextFormat: ExportFormat) => {
    onClearError();
    setFormat(nextFormat);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-[#151517] border border-white/[0.1] shadow-[0_32px_90px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="min-w-0">
            <h2 id="export-modal-title" className="text-sm font-semibold text-[#F5F5F5]">
              Export Print File
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5 truncate">
              {isMulti ? meta?.title || 'Untitled Playlist' : track.title} · {template.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            aria-label="Close export modal"
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto studio-scrollbar">
          {/* Print Size Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[#F5F5F5] block">Print Size</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Print size presets">
              {EXPORT_PRESETS.map((item) => {
                const active = item.id === presetId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isExporting}
                    onClick={() => handleSelectPreset(item.id)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] ${
                      active
                        ? 'bg-[#1DB954]/12 border-[#1DB954] text-[#F5F5F5]'
                        : 'bg-[#0B0B0C] border-white/[0.08] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#F5F5F5] whitespace-nowrap">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-[#8E8E93] mt-0.5 tabular-nums whitespace-nowrap">
                      {item.dimensionsIn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Picker */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[#F5F5F5] block">File Format</span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleSelectFormat('png')}
                aria-pressed={format === 'png'}
                className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  format === 'png'
                    ? 'bg-white/[0.12] text-[#F5F5F5]'
                    : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>PNG Image</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleSelectFormat('pdf')}
                aria-pressed={format === 'pdf'}
                className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap ${
                  format === 'pdf'
                    ? 'bg-white/[0.12] text-[#F5F5F5]'
                    : 'text-[#8E8E93] hover:text-[#F5F5F5]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>

          {/* Live Pixel Dimension Readout */}
          <div
            data-testid="export-dimension-readout"
            className="rounded-xl bg-[#0B0B0C] border border-white/[0.08] px-4 py-3 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-[11px] text-[#8E8E93]">Output Resolution</div>
              <div className="text-sm font-semibold text-[#F5F5F5] tabular-nums mt-0.5 font-mono">
                {preset.outputWidthPx} × {preset.outputHeightPx} px
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#8E8E93]">Target Density</div>
              <div className="text-xs font-medium text-[#F5F5F5] tabular-nums mt-0.5">
                ~{preset.approxDpi} DPI · {preset.pixelRatio}× scale
              </div>
            </div>
          </div>

          {/* Low-Resolution Warning (< 1000px) */}
          {!checkingRes && lowRes && resolution && (
            <div
              role="alert"
              data-testid="low-res-warning"
              className="rounded-xl bg-amber-500/10 border border-amber-400/30 px-3.5 py-3 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-amber-100 leading-relaxed">
                <span className="font-semibold">Low-resolution cover artwork:</span>{' '}
                Current image is{' '}
                <span className="font-mono tabular-nums">
                  {resolution.width} × {resolution.height} px
                </span>{' '}
                (under 1000 px). Larger prints like A3 or A2 may appear soft.
              </div>
            </div>
          )}

          {/* Export Error State with "try smaller size" suggestion */}
          {exportError && (
            <div
              role="alert"
              className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-3 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-rose-100 leading-relaxed">
                <div className="font-semibold">{exportError}</div>
                <div className="text-rose-200/80 mt-0.5">
                  Try choosing a smaller size preset (such as A4) or using a local cover image.
                </div>
              </div>
            </div>
          )}

          {/* Export Progress State */}
          {isExporting && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F5F5F5] font-medium">{progressLabel}</span>
                <span className="text-[#8E8E93] tabular-nums">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-[#1DB954] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(8, progressPercent)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.08] flex items-center justify-between gap-3 bg-[#121214]">
          <span className="text-[11px] text-[#8E8E93] truncate">
            {preset.recommendedFrame}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-[#8E8E93] hover:text-[#F5F5F5] hover:border-white/[0.18] disabled:opacity-40 transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => onConfirmExport(presetId, format)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-[#07110B] text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>
                {isExporting
                  ? 'Exporting…'
                  : `Export ${preset.label} ${format.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
