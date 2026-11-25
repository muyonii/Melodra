import { useEffect, useState } from 'react';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import type { PosterRenderProps, Template } from '../src/types/poster';
import {
  calculateProgressRatio,
  clampTimestamp,
  formatDurationMs,
  formatSeconds,
} from '../src/utils/format';

function EditorialVinylRender({
  track,
  tokens,
  codeUrl,
  onUploadCode,
  onCodeLoadError,
}: PosterRenderProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [track.coverUrl]);

  const clampedTime = clampTimestamp(tokens.timestamp, track.durationMs);
  const progress = calculateProgressRatio(clampedTime, track.durationMs);

  const palette =
    tokens.theme === 'light'
      ? {
          bg: '#F3EFE6',
          surface: '#EAE4D7',
          ink: '#151517',
          muted: '#66635B',
          rule: 'rgba(21, 21, 23, 0.14)',
        }
      : tokens.theme === 'midnight'
        ? {
            bg: '#0C121C',
            surface: '#131C2B',
            ink: '#F2F5FA',
            muted: '#8E9BB0',
            rule: 'rgba(242, 245, 250, 0.14)',
          }
        : {
            bg: '#101012',
            surface: '#18181B',
            ink: '#F5F5F5',
            muted: '#8E8E93',
            rule: 'rgba(255, 255, 255, 0.12)',
          };

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: palette.bg,
        color: palette.ink,
        fontFamily: `'${tokens.font}', 'Playfair Display', serif`,
        padding: '96px 96px 88px 96px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top editorial header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          borderBottom: `2px solid ${palette.rule}`,
          paddingBottom: 28,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: palette.muted,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          ARCHIVE EDITION · {track.artist || 'ARTIST'}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            color: palette.muted,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {tokens.showDuration ? formatDurationMs(track.durationMs) : formatSeconds(clampedTime)}
        </div>
      </div>

      {/* Center framed artwork */}
      <div
        style={{
          marginTop: 54,
          marginBottom: 54,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: `${tokens.radius}px`,
            overflow: 'hidden',
            backgroundColor: palette.surface,
            boxShadow: '0 28px 70px rgba(0,0,0,0.28)',
            border: `1px solid ${palette.rule}`,
          }}
        >
          {!imgError && track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={`${track.title} cover`}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: palette.muted,
                fontSize: 36,
              }}
            >
              {track.title}
            </div>
          )}
        </div>
      </div>

      {/* Bottom typography + progress rule */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 40,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 78,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: palette.ink,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.title || 'Untitled Track'}
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: 32,
                fontWeight: 500,
                color: palette.muted,
                fontFamily: "'Inter', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tokens.showAlbum && track.album
                ? `${track.artist} — ${track.album}`
                : track.artist}
            </div>
          </div>

          {tokens.showCode && (codeUrl || onUploadCode) && (
            <div style={{ flexShrink: 0 }}>
              <ScannableCodeSlot
                codeUrl={codeUrl}
                onUploadCode={onUploadCode}
                onCodeLoadError={onCodeLoadError}
                variant={tokens.theme === 'light' ? 'light' : 'dark'}
                compact
              />
            </div>
          )}
        </div>

        {/* Hairline accent progress */}
        <div
          style={{
            marginTop: 42,
            height: 6,
            width: '100%',
            backgroundColor: palette.rule,
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              backgroundColor: tokens.accent,
              borderRadius: 999,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export const editorialVinylTemplate: Template = {
  id: 'editorial-vinyl',
  name: 'Editorial Frame',
  description: 'Gallery print layout with archival header, paper stock theme, and hairline accent rule.',
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 8,
    font: 'Playfair Display',
    accent: '#1DB954',
    timestamp: 72,
    showDuration: true,
    showHeart: false,
    showAlbum: true,
    showCode: true,
    theme: 'light',
    autoTheme: true,
  },
  controls: [
    'theme',
    'font',
    'autoTheme',
    'accent',
    'radius',
    'timestamp',
    'showAlbum',
    'showDuration',
    'showCode',
  ],
  Render: EditorialVinylRender,
};
