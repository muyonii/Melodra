import { useEffect, useState } from 'react';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import type { PosterRenderProps, Template } from '../src/types/poster';
import {
  calculateProgressRatio,
  clampTimestamp,
  formatDurationMs,
  formatSeconds,
} from '../src/utils/format';

function GlassPlayerRender({
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
  const formattedTime = formatSeconds(clampedTime);
  const formattedDuration = formatDurationMs(track.durationMs);
  const cardRadius = Math.min(84, tokens.radius + 20);

  const hasVisibleCodeSlot =
    tokens.showCode && Boolean(codeUrl || onUploadCode);

  const glassRgb =
    tokens.autoTheme !== false && tokens.glassTint ? tokens.glassTint : '255, 255, 255';
  const glassBorder =
    tokens.autoTheme !== false && tokens.glassTint
      ? `rgba(${tokens.glassTint}, 0.24)`
      : 'rgba(255, 255, 255, 0.12)';

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0A0A0B',
        fontFamily: `'${tokens.font}', 'Inter', sans-serif`,
        color: '#FFFFFF',
        userSelect: 'none',
      }}
    >
      {/* 1. Blurred, scaled album cover background */}
      {!imgError && track.coverUrl ? (
        <img
          src={track.coverUrl}
          alt=""
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.4)',
            transformOrigin: 'center center',
            filter: `blur(${tokens.blur}px) brightness(${tokens.brightness}) saturate(1.2)`,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 35% 25%, #233329 0%, #111315 55%, #070708 100%)',
          }}
        />
      )}

      {/* Subtle atmospheric vignette + bottom dark gradient for contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8,8,10,0.12) 0%, rgba(8,8,10,0.22) 48%, rgba(6,6,8,0.80) 80%, rgba(5,5,7,0.96) 100%)',
        }}
      />

      {/* Foreground composition */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          padding: '124px 130px 92px 130px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
        }}
      >
        {/* 2. Frosted glass rounded card */}
        <div
          style={{
            width: '100%',
            backgroundColor: `rgba(${glassRgb}, ${tokens.glassOpacity})`,
            border: `1px solid ${glassBorder}`,
            borderRadius: `${cardRadius}px`,
            padding: hasVisibleCodeSlot ? '44px 44px 36px 44px' : '44px',
            backdropFilter: 'blur(36px)',
            WebkitBackdropFilter: 'blur(36px)',
            boxShadow:
              '0 32px 84px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
            boxSizing: 'border-box',
          }}
        >
          {/* 3. Crisp square album art */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: `${tokens.radius}px`,
              overflow: 'hidden',
              boxShadow: '0 24px 56px rgba(0, 0, 0, 0.48)',
              backgroundColor: '#17171A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!imgError && track.coverUrl ? (
              <img
                src={track.coverUrl}
                alt={`${track.title} album cover`}
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  color: 'rgba(255,255,255,0.5)',
                  gap: 20,
                }}
              >
                <svg
                  width="110"
                  height="110"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
                <span style={{ fontSize: 28, fontWeight: 500 }}>{track.title}</span>
              </div>
            )}
          </div>

          {/* 4. Real Spotify scannable code or upload drop zone */}
          {hasVisibleCodeSlot && (
            <div style={{ marginTop: 30 }}>
              <ScannableCodeSlot
                codeUrl={codeUrl}
                onUploadCode={onUploadCode}
                onCodeLoadError={onCodeLoadError}
                variant="dark"
              />
            </div>
          )}
        </div>

        {/* Bottom Player Block */}
        <div style={{ width: '100%', marginTop: 'auto' }}>
          {/* 5. Title, subtitle & outline heart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 36,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 54,
                  fontWeight: 700,
                  lineHeight: 1.14,
                  letterSpacing: '-0.025em',
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.title || 'Untitled Track'}
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 400,
                  lineHeight: 1.3,
                  color: 'rgba(255, 255, 255, 0.68)',
                  marginTop: 10,
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
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.88)"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
                aria-hidden="true"
              >
                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
              </svg>
            )}
          </div>

          {/* 6. Scrubber bar + timestamp / infinity */}
          <div style={{ marginTop: 46 }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progress * 100}%`,
                  borderRadius: 999,
                  backgroundColor: tokens.accent,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${progress * 100}%`,
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: tokens.accent,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.48)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 18,
                fontSize: 23,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                color: 'rgba(255, 255, 255, 0.65)',
              }}
            >
              <span>{formattedTime}</span>
              <span
                style={{
                  fontSize: tokens.showDuration ? 23 : 32,
                  lineHeight: 1,
                }}
              >
                {tokens.showDuration ? formattedDuration : '∞'}
              </span>
            </div>
          </div>

          {/* 7. Playback controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 42,
              paddingLeft: 6,
              paddingRight: 6,
            }}
          >
            {/* Shuffle */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>

            {/* Previous */}
            <svg width="54" height="54" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
              <rect x="4" y="5" width="2.6" height="14" rx="1.2" />
              <path d="M19 5.8a1 1 0 0 0-1.56-.83l-9.2 6.2a1 1 0 0 0 0 1.66l9.2 6.2A1 1 0 0 0 19 18.2V5.8z" />
            </svg>

            {/* Large circular Play button */}
            <div
              style={{
                width: 118,
                height: 118,
                borderRadius: 999,
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 36px rgba(0, 0, 0, 0.42)',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="#0B0B0C"
                style={{ marginLeft: 5 }}
                aria-hidden="true"
              >
                <path d="M7.5 4.8a1.2 1.2 0 0 1 1.82-1.03l11.2 6.8a1.2 1.2 0 0 1 0 2.06l-11.2 6.8A1.2 1.2 0 0 1 7.5 18.4V4.8z" />
              </svg>
            </div>

            {/* Next */}
            <svg width="54" height="54" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true">
              <rect x="17.4" y="5" width="2.6" height="14" rx="1.2" />
              <path d="M5 5.8a1 1 0 0 1 1.56-.83l9.2 6.2a1 1 0 0 1 0 1.66l-9.2 6.2A1 1 0 0 1 5 18.2V5.8z" />
            </svg>

            {/* Repeat */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export const glassPlayerTemplate: Template = {
  id: 'glass-player',
  name: 'Glass Player',
  description: 'Frosted glass card over blurred cover art with live scrubber and playback controls.',
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 55,
    brightness: 0.55,
    glassOpacity: 0.08,
    radius: 24,
    font: 'Inter',
    accent: '#FFFFFF',
    timestamp: 72,
    showDuration: false,
    showHeart: true,
    showAlbum: true,
    showCode: true,
    theme: 'dark',
    autoTheme: true,
  },
  controls: [
    'blur',
    'brightness',
    'glassOpacity',
    'radius',
    'font',
    'autoTheme',
    'accent',
    'timestamp',
    'showAlbum',
    'showHeart',
    'showCode',
    'showDuration',
  ],
  Render: GlassPlayerRender,
};
