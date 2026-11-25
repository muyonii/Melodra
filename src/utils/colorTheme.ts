import { getColor, getPalette } from 'colorthief';
import { proxifyImageUrl } from './imageProxy';

export interface RgbTuple {
  r: number;
  g: number;
  b: number;
}

export interface AutoThemeResult {
  accent: string;
  glassTint: string; // comma-separated RGB e.g. "78, 124, 96"
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function rgbToHex({ r, g, b }: RgbTuple): string {
  const toHex = (v: number) => clampByte(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbRelativeLuminance({ r, g, b }: RgbTuple): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

export function rgbSaturation({ r, g, b }: RgbTuple): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

/**
 * Ensures an extracted accent color stays legible on dark studio/poster surfaces
 * by boosting luminance gently when the cover is very dark.
 */
export function ensureReadableAccent(rgb: RgbTuple): RgbTuple {
  let { r, g, b } = rgb;
  let lum = rgbRelativeLuminance({ r, g, b });
  let guard = 0;
  while (lum < 0.22 && guard < 12) {
    r = clampByte(r + (255 - r) * 0.22);
    g = clampByte(g + (255 - g) * 0.22);
    b = clampByte(b + (255 - b) * 0.22);
    lum = rgbRelativeLuminance({ r, g, b });
    guard += 1;
  }
  return { r, g, b };
}

/**
 * Picks a vibrant readable accent and a subtle glass-card RGB tint from a cover palette.
 */
export function selectAutoThemeFromPalette(palette: RgbTuple[]): AutoThemeResult {
  if (!palette.length) {
    return { accent: '#FFFFFF', glassTint: '255, 255, 255' };
  }

  const dominant = palette[0];

  // Prefer the most saturated non-near-black swatch for the accent
  const bestAccentCandidate = [...palette].sort((a, b) => {
    const scoreA = rgbSaturation(a) * 1.4 + Math.min(0.6, rgbRelativeLuminance(a));
    const scoreB = rgbSaturation(b) * 1.4 + Math.min(0.6, rgbRelativeLuminance(b));
    return scoreB - scoreA;
  })[0];

  const readableAccent = ensureReadableAccent(bestAccentCandidate);
  const tintCandidate =
    rgbRelativeLuminance(dominant) < 0.08 ? readableAccent : dominant;

  return {
    accent: rgbToHex(readableAccent),
    glassTint: `${clampByte(tintCandidate.r)}, ${clampByte(tintCandidate.g)}, ${clampByte(tintCandidate.b)}`,
  };
}

function loadCorsImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for color extraction'));
    img.src = url;
  });
}

export async function extractCoverAutoTheme(coverUrl: string): Promise<AutoThemeResult | null> {
  if (!coverUrl) {
    return null;
  }
  try {
    const img = await loadCorsImage(proxifyImageUrl(coverUrl));
    const palette = await getPalette(img, { colorCount: 6 });
    if (palette && palette.length > 0) {
      return selectAutoThemeFromPalette(palette.map((c) => c.rgb()));
    }
    const single = await getColor(img);
    if (single) {
      return selectAutoThemeFromPalette([single.rgb()]);
    }
    return null;
  } catch {
    return null;
  }
}
