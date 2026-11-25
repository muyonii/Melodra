import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { proxifyImageUrl } from './imageProxy';
import {
  buildExportFilename,
  getExportPreset,
  POSTER_BASE_HEIGHT,
  POSTER_BASE_WIDTH,
  type ExportFormat,
  type ExportPresetId,
} from './exportPresets';

export interface ExportOptions {
  title: string;
  artist: string;
  templateId: string;
  presetId: ExportPresetId;
  format: ExportFormat;
  onProgress?: (label: string, percent: number) => void;
}

export interface ImageResolution {
  width: number;
  height: number;
}

export async function measureCoverResolution(url: string): Promise<ImageResolution | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => resolve(null);
    img.src = proxifyImageUrl(url);
  });
}

export async function measureLowestCoverResolution(
  urls: string[],
): Promise<ImageResolution | null> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  if (uniqueUrls.length === 0) return null;

  const measured = await Promise.all(uniqueUrls.map((url) => measureCoverResolution(url)));
  const valid = measured.filter((res): res is ImageResolution => res !== null);
  if (valid.length === 0) return null;

  let lowest = valid[0];
  for (const res of valid) {
    if (Math.min(res.width, res.height) < Math.min(lowest.width, lowest.height)) {
      lowest = res;
    }
  }
  return lowest;
}

async function waitForImagesInNode(
  node: HTMLElement,
  onProgress?: (label: string, percent: number) => void,
): Promise<void> {
  const imgs = Array.from(node.querySelectorAll('img'));
  if (imgs.length === 0) return;

  const pendingCount = imgs.filter((img) => !(img.complete && img.naturalWidth > 0)).length;
  if (pendingCount > 0 && onProgress) {
    onProgress(`Loading ${pendingCount} cover ${pendingCount === 1 ? 'image' : 'images'}…`, 25);
  }

  await Promise.all(
    imgs.map(async (img) => {
      if (!(img.complete && img.naturalWidth > 0)) {
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (!settled) {
              settled = true;
              resolve();
            }
          };
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
          window.setTimeout(finish, 8000);
        });
      }
      if (typeof img.decode === 'function') {
        await img.decode().catch(() => {});
      }
    }),
  );
}

function fitCanvasToPresetDimensions(
  sourceCanvas: HTMLCanvasElement,
  targetW: number,
  targetH: number,
): HTMLCanvasElement {
  if (sourceCanvas.width === targetW && sourceCanvas.height === targetH) {
    return sourceCanvas;
  }

  const out = document.createElement('canvas');
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas context for export.');
  }

  // Sample corner color from the rendered poster so non-A-series aspect ratios pad seamlessly
  let fillStyle = '#0B0B0C';
  const srcCtx = sourceCanvas.getContext('2d');
  if (srcCtx) {
    try {
      const pixel = srcCtx.getImageData(4, 4, 1, 1).data;
      fillStyle = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    } catch {
      fillStyle = '#0B0B0C';
    }
  }

  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, targetW, targetH);

  const scale = Math.min(targetW / sourceCanvas.width, targetH / sourceCanvas.height);
  const drawW = Math.round(sourceCanvas.width * scale);
  const drawH = Math.round(sourceCanvas.height * scale);
  const offsetX = Math.round((targetW - drawW) / 2);
  const offsetY = Math.round((targetH - drawH) / 2);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, offsetX, offsetY, drawW, drawH);

  return out;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportPoster(node: HTMLElement, options: ExportOptions): Promise<void> {
  const preset = getExportPreset(options.presetId);
  const filename = buildExportFilename(options, preset.id, options.format);

  options.onProgress?.('Preparing fonts & artwork…', 15);
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await waitForImagesInNode(node, options.onProgress);

  options.onProgress?.(`Rendering ${preset.label} at ~${preset.approxDpi} DPI…`, 45);
  const rawCanvas = await toCanvas(node, {
    width: POSTER_BASE_WIDTH,
    height: POSTER_BASE_HEIGHT,
    pixelRatio: preset.pixelRatio,
    cacheBust: false,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  });

  options.onProgress?.('Formatting print dimensions…', 72);
  const finalCanvas = fitCanvasToPresetDimensions(
    rawCanvas,
    preset.outputWidthPx,
    preset.outputHeightPx,
  );

  if (options.format === 'png') {
    options.onProgress?.('Encoding PNG file…', 90);
    const blob = await new Promise<Blob>((resolve, reject) => {
      finalCanvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('PNG encoding failed.'));
        },
        'image/png',
        1,
      );
    });
    triggerBlobDownload(blob, filename);
    options.onProgress?.('Complete', 100);
    return;
  }

  options.onProgress?.('Generating PDF document…', 90);
  const dataUrl = finalCanvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [preset.widthIn, preset.heightIn],
    compress: true,
  });
  pdf.addImage(dataUrl, 'PNG', 0, 0, preset.widthIn, preset.heightIn, undefined, 'FAST');
  pdf.save(filename);
  options.onProgress?.('Complete', 100);
}

const THUMBNAIL_PIXEL_RATIO = 0.22;

export async function capturePosterThumbnail(node: HTMLElement): Promise<string> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await waitForImagesInNode(node);

  const canvas = await toCanvas(node, {
    width: POSTER_BASE_WIDTH,
    height: POSTER_BASE_HEIGHT,
    pixelRatio: THUMBNAIL_PIXEL_RATIO,
    cacheBust: false,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  });

  return canvas.toDataURL('image/jpeg', 0.78);
}

export async function exportMockupPng(
  node: HTMLElement,
  options: { title: string; artist: string; sceneId: string },
): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await waitForImagesInNode(node);

  const canvas = await toCanvas(node, {
    width: 1280,
    height: 900,
    pixelRatio: 2,
    cacheBust: false,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Mockup PNG encoding failed.'));
      },
      'image/png',
      1,
    );
  });

  const cleanPart = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'poster';

  const filename = `melodra-mockup-${cleanPart(options.title)}-${cleanPart(options.artist)}-${cleanPart(options.sceneId)}.png`;
  triggerBlobDownload(blob, filename);
}


