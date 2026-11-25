export type ExportPresetId = 'a4' | 'a3' | 'a2' | '12x18' | 'square-12';
export type ExportFormat = 'png' | 'pdf';

export interface ExportPreset {
  id: ExportPresetId;
  label: string;
  dimensionsIn: string;
  widthIn: number;
  heightIn: number;
  recommendedFrame: string;
  /** Target output pixel dimensions (~300 DPI) */
  outputWidthPx: number;
  outputHeightPx: number;
  /** pixelRatio passed to html-to-image against 1240x1754 base poster */
  pixelRatio: number;
  approxDpi: number;
}

export const POSTER_BASE_WIDTH = 1240;
export const POSTER_BASE_HEIGHT = 1754;

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'a4',
    label: 'A4',
    dimensionsIn: '8.3 × 11.7 in',
    widthIn: 8.27,
    heightIn: 11.69,
    recommendedFrame: 'A4 frame or 11 × 14 in matted',
    outputWidthPx: 2480,
    outputHeightPx: 3508,
    pixelRatio: 2,
    approxDpi: 300,
  },
  {
    id: 'a3',
    label: 'A3',
    dimensionsIn: '11.7 × 16.5 in',
    widthIn: 11.69,
    heightIn: 16.54,
    recommendedFrame: 'A3 frame or 16 × 20 in matted',
    outputWidthPx: 3508,
    outputHeightPx: 4962,
    pixelRatio: Number((3508 / POSTER_BASE_WIDTH).toFixed(4)),
    approxDpi: 300,
  },
  {
    id: 'a2',
    label: 'A2',
    dimensionsIn: '16.5 × 23.4 in',
    widthIn: 16.54,
    heightIn: 23.39,
    recommendedFrame: 'A2 gallery frame (42 × 59.4 cm)',
    outputWidthPx: 4960,
    outputHeightPx: 7016,
    pixelRatio: 4,
    approxDpi: 300,
  },
  {
    id: '12x18',
    label: '12×18 in',
    dimensionsIn: '12 × 18 in',
    widthIn: 12,
    heightIn: 18,
    recommendedFrame: '12 × 18 in or 16 × 24 in matted',
    outputWidthPx: 3600,
    outputHeightPx: 5400,
    pixelRatio: Number((3600 / POSTER_BASE_WIDTH).toFixed(4)),
    approxDpi: 300,
  },
  {
    id: 'square-12',
    label: 'Square 12×12',
    dimensionsIn: '12 × 12 in',
    widthIn: 12,
    heightIn: 12,
    recommendedFrame: '12 × 12 in LP record frame',
    outputWidthPx: 3600,
    outputHeightPx: 3600,
    pixelRatio: Number((3600 / POSTER_BASE_HEIGHT).toFixed(4)),
    approxDpi: 300,
  },
];

export function getExportPreset(id: ExportPresetId): ExportPreset {
  return EXPORT_PRESETS.find((preset) => preset.id === id) ?? EXPORT_PRESETS[0];
}

export function isLowResCover(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }
  return Math.min(width, height) < 1000;
}

export function buildExportFilename(
  meta: { title: string; artist: string; templateId: string },
  presetId: ExportPresetId,
  format: ExportFormat,
): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'untitled';
  return `melodra-${clean(meta.title)}-${clean(meta.artist)}-${clean(meta.templateId)}-${presetId}.${format}`;
}
