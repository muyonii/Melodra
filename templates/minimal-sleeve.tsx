import { useEffect, useState } from 'react';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import type { PosterRenderProps, Template } from '../src/types/poster';
import { formatDurationMs } from '../src/utils/format';

function MinimalSleeveRender({
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

  const isLight = tokens.theme === 'light';
  const bg = isLight ? '#F8F8F7' : tokens.theme === 'midnight' ? '#090D16' : '#0E0E10';
  const fg = isLight ? '#121214' : '#F5F5F5';
  const muted = isLight ? '#6B6B70' : '#8E8E93';
  const border = isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)';

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: bg,
        color: fg,
        fontFamily: `'${tokens.font}', 'Outfit', sans-serif`,
        padding: '110px 110px 100px 110px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Square Artwork */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: `${tokens.radius}px`,
          overflow: 'hidden',
          border: `1px solid ${border}`,
          backgroundColor: isLight ? '#E6E6E3' : '#18181B',
        }}
      >
        {!imgError && track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={`${track.title} cover`}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: muted,
              fontSize: 32,
            }}
          >
            {track.title}
          </div>
        )}
      </div>

      {/* Swiss typographic lower block */}
      <div style={{ marginTop: 68 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              backgroundColor: tokens.accent,
            }}
          />
          <span
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: muted,
            }}
          >
            {track.artist || 'Unknown Artist'}
          </span>
        </div>

        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: fg,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {track.title || 'Untitled Track'}
        </div>

        <div
          style={{
            marginTop: 52,
            paddingTop: 32,
            borderTop: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 36,
              fontSize: 26,
              color: muted,
              minWidth: 0,
            }}
          >
            {tokens.showAlbum && (
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.album}
              </span>
            )}
            {tokens.showDuration && (
              <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {formatDurationMs(track.durationMs)}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
            {tokens.showCode && (codeUrl || onUploadCode) && (
              <ScannableCodeSlot
                codeUrl={codeUrl}
                onUploadCode={onUploadCode}
                onCodeLoadError={onCodeLoadError}
                variant={isLight ? 'light' : 'dark'}
                compact
              />
            )}

            {tokens.showHeart && (
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill={tokens.accent}
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const minimalSleeveTemplate: Template = {
  id: 'minimal-sleeve',
  name: 'Minimal Sleeve',
  description: 'Swiss typographic poster with crisp square art, accent dot, and hairline footer.',
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 16,
    font: 'Inter',
    accent: '#1DB954',
    timestamp: 72,
    showDuration: true,
    showHeart: true,
    showAlbum: true,
    showCode: true,
    theme: 'dark',
    autoTheme: true,
  },
  controls: [
    'theme',
    'font',
    'autoTheme',
    'accent',
    'radius',
    'showAlbum',
    'showHeart',
    'showDuration',
    'showCode',
  ],
  Render: MinimalSleeveRender,
};
