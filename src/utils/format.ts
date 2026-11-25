export function formatSeconds(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const rounded = Math.floor(totalSeconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDurationMs(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return '00:00';
  }
  return formatSeconds(Math.round(durationMs / 1000));
}

export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim();
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const mins = Number(match[1]);
  const secs = Number(match[2]);
  const totalMs = (mins * 60 + secs) * 1000;
  return totalMs > 0 ? totalMs : null;
}

export function clampTimestamp(timestampSec: number, durationMs: number): number {
  const maxSec = Math.max(1, Math.floor(durationMs / 1000));
  if (!Number.isFinite(timestampSec)) {
    return 0;
  }
  return Math.min(Math.max(0, Math.round(timestampSec)), maxSec);
}

export function calculateProgressRatio(timestampSec: number, durationMs: number): number {
  const totalSec = durationMs / 1000;
  if (!Number.isFinite(totalSec) || totalSec <= 0) {
    return 0;
  }
  const ratio = timestampSec / totalSec;
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Generates deterministic Spotify-code-like bar heights (0.18 to 1.0)
 * seeded from track identity so each song displays a unique barcode waveform.
 */
export function generateCodeBarHeights(seed: string, barCount = 23): number[] {
  let hash = 2166136261;
  const source = seed.trim() || 'melodra-default-seed';
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const heights: number[] = [];
  for (let i = 0; i < barCount; i += 1) {
    // Symmetrical center-weighted envelope with deterministic pseudo-random variation
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    const norm = ((hash >>> 0) % 1000) / 1000;

    // Classic Spotify code anchors: outer ends shorter, rhythmic peaks inside
    if (i === 0 || i === barCount - 1) {
      heights.push(0.28);
    } else if (i === Math.floor(barCount / 2)) {
      heights.push(0.96);
    } else {
      const centerDist = Math.abs(i - (barCount - 1) / 2) / ((barCount - 1) / 2);
      const envelope = 1 - centerDist * 0.35;
      const height = Math.max(0.2, Math.min(1, (0.28 + norm * 0.72) * envelope));
      heights.push(Number(height.toFixed(3)));
    }
  }
  return heights;
}

export function sanitizeFilename(title: string, artist: string, templateId: string): string {
  const clean = (val: string) =>
    val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled';
  return `melodra-${clean(title)}-${clean(artist)}-${clean(templateId)}.png`;
}
