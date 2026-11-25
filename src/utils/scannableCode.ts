import { proxifyImageUrl } from './imageProxy';
import { buildSpotifyScannableUrl } from './musicSearch';

/**
 * Pure pixel-level transform: converts a white-on-black scannable code RGBA buffer
 * into crisp pure-white pixels with smooth anti-aliased alpha transparency.
 */
export function stripBlackBackgroundToAlpha(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.max(r, g, b);
    const alpha = lum <= 16 ? 0 : Math.min(255, Math.round(((lum - 16) / 239) * 255));
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = alpha;
  }
}

export function loadTransparentSpotifyCode(spotifyId: string): Promise<string> {
  const url = proxifyImageUrl(buildSpotifyScannableUrl(spotifyId));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) {
          reject(new Error('Empty scannable image'));
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        stripBlackBackgroundToAlpha(imageData.data);
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        // Fallback to raw CDN URL if canvas read fails
        resolve(url);
      }
    };
    img.onerror = () => reject(new Error('Failed to load Spotify scannable code'));
    img.src = url;
  });
}
