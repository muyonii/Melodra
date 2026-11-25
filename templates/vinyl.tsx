import { useEffect, useState } from 'react';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import type { PosterRenderProps, Template } from '../src/types/poster';
import { formatDurationMs } from '../src/utils/format';

function VinylRender({
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
  const bg = isLight ? '#F3F0E8' : '#0E0E11';
  const fg = isLight ? '#151517' : '#F5F5F5';
  const muted = isLight ? '#65625A' : '#8E8E93';
  const rule = isLight ? 'rgba(21, 21, 23, 0.14)' : 'rgba(255, 255, 255, 0.12)';
  const labelColor = tokens.accent || '#1DB954';

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: bg,
        color: fg,
        fontFamily: `'${tokens.font}', 'Playfair Display', serif`,
        padding: '150px 92px 104px 92px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Sleeve + Vinyl Composition */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 760,
          marginTop: 60,
        }}
      >
        {/* Black Vinyl Record sliding out to the right */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 392,
            width: 680,
            height: 680,
            borderRadius: '50%',
            background:
              'repeating-radial-gradient(circle at center, #111114 0px, #111114 5px, #1C1C21 6px, #0D0D10 9px)',
            boxShadow: isLight
              ? '0 26px 64px rgba(0, 0, 0, 0.28)'
              : '0 28px 72px rgba(0, 0, 0, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Subtle diagonal groove specular sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                'conic-gradient(from 35deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.09) 34deg, rgba(255,255,255,0) 74deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.07) 215deg, rgba(255,255,255,0) 255deg)',
              pointerEvents: 'none',
            }}
          />

          {/* Outer vinyl edge bevel */}
          <div
            style={{
              position: 'absolute',
              inset: 3,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.08)',
              pointerEvents: 'none',
            }}
          />

          {/* Center Record Label using dominant/accent color */}
          <div
            style={{
              position: 'relative',
              width: 232,
              height: 232,
              borderRadius: '50%',
              backgroundColor: labelColor,
              boxShadow: 'inset 0 0 0 10px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            {/* Inner ring */}
            <div
              style={{
                position: 'absolute',
                inset: 14,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.22)',
                pointerEvents: 'none',
              }}
            />
            {/* Spindle hole */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: '#111114',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.75)',
              }}
            />
          </div>
        </div>

        {/* Album Cover Sleeve at Left */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 720,
            height: 720,
            borderRadius: `${tokens.radius}px`,
            overflow: 'hidden',
            backgroundColor: isLight ? '#E6E2D8' : '#18181B',
            boxShadow: isLight
              ? '22px 28px 64px rgba(0, 0, 0, 0.25)'
              : '24px 28px 72px rgba(0, 0, 0, 0.72)',
            border: `1px solid ${rule}`,
            zIndex: 2,
          }}
        >
          {!imgError && track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={`${track.title} album sleeve`}
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
                color: muted,
                fontSize: 32,
              }}
            >
              {track.title}
            </div>
          )}

          {/* Subtle paper sleeve edge crease */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: 14,
              background:
                'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Elegant Title & Artist Typography Below */}
      <div style={{ marginTop: 'auto' }}>
        <div
          style={{
            borderTop: `1px solid ${rule}`,
            paddingTop: 46,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 40,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: muted,
                fontFamily: "'Inter', sans-serif",
                marginBottom: 16,
              }}
            >
              33⅓ RPM · STEREO LP
            </div>

            <div
              style={{
                fontSize: 78,
                fontWeight: 700,
                lineHeight: 1.06,
                letterSpacing: '-0.025em',
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
                marginTop: 18,
                fontSize: 32,
                fontWeight: 400,
                color: muted,
                fontFamily: "'Inter', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {tokens.showAlbum && track.album
                ? `${track.artist || 'Unknown Artist'} · ${track.album}`
                : track.artist || 'Unknown Artist'}
            </div>
          </div>

          {tokens.showHeart && (
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill={labelColor}
              style={{ flexShrink: 0, marginBottom: 8 }}
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}
        </div>

        {/* Bottom Metadata & Scannable Code */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 60,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontFamily: "'Space Mono', monospace",
              fontVariantNumeric: 'tabular-nums',
              color: muted,
            }}
          >
            {tokens.showDuration ? formatDurationMs(track.durationMs) : '∞'}
          </div>

          {tokens.showCode && (codeUrl || onUploadCode) && (
            <ScannableCodeSlot
              codeUrl={codeUrl}
              onUploadCode={onUploadCode}
              onCodeLoadError={onCodeLoadError}
              variant={isLight ? 'light' : 'dark'}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const vinylTemplate: Template = {
  id: 'vinyl',
  name: 'Vinyl',
  description: 'Album sleeve at left with a grooved vinyl disc sliding out and dominant-color center label.',
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
    theme: 'dark',
    autoTheme: true,
  },
  controls: [
    'font',
    'radius',
    'accent',
    'theme',
    'autoTheme',
    'showDuration',
    'showHeart',
    'showAlbum',
    'showCode',
  ],
  Render: VinylRender,
};
