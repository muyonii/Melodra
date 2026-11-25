import { useEffect, useState } from 'react';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import type { PosterRenderProps, Template } from '../src/types/poster';

function MinimalCoverRender({
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
  const bg = isLight ? '#F6F4EF' : '#0E0E10';
  const fg = isLight ? '#151517' : '#F5F5F5';
  const muted = isLight ? '#6B6860' : '#8E8E93';
  const frameBorder = isLight ? 'rgba(21, 21, 23, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const placeholderBg = isLight ? '#EAE6DD' : '#18181B';

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: bg,
        color: fg,
        fontFamily: `'${tokens.font}', 'Inter', sans-serif`,
        padding: '180px 160px 110px 160px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Centered Artwork + Title & Artist */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Large centered square cover */}
        <div
          style={{
            width: 920,
            height: 920,
            borderRadius: `${tokens.radius}px`,
            overflow: 'hidden',
            backgroundColor: placeholderBg,
            border: `1px solid ${frameBorder}`,
            boxShadow: isLight
              ? '0 30px 72px rgba(20, 18, 12, 0.14)'
              : '0 32px 84px rgba(0, 0, 0, 0.55)',
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

        {/* Small elegant title & artist with generous whitespace */}
        <div style={{ marginTop: 84, maxWidth: 860 }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
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
              marginTop: 14,
              fontSize: 25,
              fontWeight: 400,
              letterSpacing: '0.02em',
              color: muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tokens.showAlbum && track.album
              ? `${track.artist || 'Unknown Artist'} · ${track.album}`
              : track.artist || 'Unknown Artist'}
          </div>

          <div
            style={{
              width: 44,
              height: 3,
              borderRadius: 999,
              backgroundColor: tokens.accent,
              margin: '28px auto 0 auto',
              opacity: 0.9,
            }}
          />
        </div>
      </div>

      {/* Optional tiny scannable code at the bottom */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          minHeight: 60,
        }}
      >
        {tokens.showCode && (codeUrl || onUploadCode) && (
          <div style={{ transform: 'scale(0.84)', transformOrigin: 'center bottom' }}>
            <ScannableCodeSlot
              codeUrl={codeUrl}
              onUploadCode={onUploadCode}
              onCodeLoadError={onCodeLoadError}
              variant={isLight ? 'light' : 'dark'}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const minimalCoverTemplate: Template = {
  id: 'minimal-cover',
  name: 'Minimal Cover',
  description: 'Centered square sleeve with refined typography, generous whitespace, and optional bottom code.',
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 12,
    font: 'Playfair Display',
    accent: '#1DB954',
    timestamp: 72,
    showDuration: false,
    showHeart: false,
    showAlbum: true,
    showCode: true,
    theme: 'light',
    autoTheme: true,
  },
  controls: ['font', 'radius', 'accent', 'theme', 'autoTheme', 'showAlbum', 'showCode'],
  Render: MinimalCoverRender,
};
