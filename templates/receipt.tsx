import { useEffect, useState } from 'react';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import type { PosterRenderProps, Template } from '../src/types/poster';
import { clampTimestamp, formatDurationMs, formatSeconds } from '../src/utils/format';
import { proxifyImageUrl } from '../src/utils/imageProxy';

function deriveReceiptMeta(title: string, artist: string) {
  const seedStr = `${title}-${artist}`;
  let hash = 5381;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash = (hash * 33) ^ seedStr.charCodeAt(i);
  }
  const orderNum = String(1000 + (Math.abs(hash) % 8999));
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[Math.abs(hash >> 3) % 12];
  const day = String(1 + (Math.abs(hash >> 7) % 28)).padStart(2, '0');
  const hour = String(10 + (Math.abs(hash >> 11) % 12)).padStart(2, '0');
  const min = String(Math.abs(hash >> 15) % 60).padStart(2, '0');
  return {
    orderNum,
    dateStr: `${month} ${day}, 2026  ·  ${hour}:${min} PM`,
  };
}

function buildTornEdgePath(width: number, height: number, teeth = 44): string {
  const step = width / teeth;
  let d = `M 0 0 L ${width} 0 L ${width} ${height - 14} `;
  for (let i = teeth; i > 0; i -= 1) {
    const xMid = (i - 0.5) * step;
    const xLeft = (i - 1) * step;
    const jitter = ((i * 17) % 7) - 3;
    d += `L ${xMid.toFixed(1)} ${height + jitter} L ${xLeft.toFixed(1)} ${height - 16 + (i % 3)} `;
  }
  d += 'Z';
  return d;
}

function ReceiptRender({
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

  const isLightBackdrop = tokens.theme === 'light';
  const backdropBg = isLightBackdrop ? '#E4E0D6' : '#111113';
  const paperBg = '#F7F4EB';
  const ink = '#18181A';
  const mutedInk = '#5E5B53';
  const dashedBorder = 'rgba(24, 24, 26, 0.28)';

  const { orderNum, dateStr } = deriveReceiptMeta(track.title, track.artist);
  const clampedTime = clampTimestamp(tokens.timestamp, track.durationMs);
  const durationLabel = tokens.showDuration ? formatDurationMs(track.durationMs) : '∞';
  const subtotal = '$1.29';
  const tax = '$0.11';
  const total = '$1.40';

  const paperWidth = 1000;
  const tornToothHeight = 24;

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: backdropBg,
        padding: '84px 120px 84px 120px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `'${tokens.font}', 'Space Mono', monospace`,
        userSelect: 'none',
      }}
    >
      {/* Receipt Sheet + Torn Bottom Edge Wrapper */}
      <div
        style={{
          width: paperWidth,
          display: 'flex',
          flexDirection: 'column',
          filter: isLightBackdrop
            ? 'drop-shadow(0 28px 50px rgba(20, 18, 12, 0.16))'
            : 'drop-shadow(0 36px 68px rgba(0, 0, 0, 0.65))',
        }}
      >
        {/* Main Thermal Paper Body */}
        <div
          style={{
            backgroundColor: paperBg,
            color: ink,
            padding: '74px 74px 48px 74px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Store & Order # Header */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: ink,
              }}
            >
              MELODRA PRESS
            </div>
            <div
              style={{
                fontSize: 22,
                color: mutedInk,
                marginTop: 12,
                letterSpacing: '0.08em',
              }}
            >
              HI-FI THERMAL ARCHIVE
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: ink,
              }}
            >
              ORDER #{orderNum}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 20,
                color: mutedInk,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {dateStr}
            </div>
          </div>

          <div
            style={{
              margin: '38px 0',
              borderTop: `2px dashed ${dashedBorder}`,
            }}
          />

          {/* Compact Album Artwork + Line Item Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              marginBottom: 34,
            }}
          >
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: `${Math.min(tokens.radius, 18)}px`,
                overflow: 'hidden',
                backgroundColor: '#E5E1D6',
                border: '1px solid rgba(24,24,26,0.16)',
                flexShrink: 0,
              }}
            >
              {!imgError && track.coverUrl ? (
                <img
                  src={proxifyImageUrl(track.coverUrl)}
                  alt={`${track.title} cover`}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: 'grayscale(18%) contrast(1.06)',
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
                    fontSize: 18,
                    color: mutedInk,
                  }}
                >
                  COVER
                </div>
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 19,
                  color: mutedInk,
                  letterSpacing: '0.08em',
                }}
              >
                QTY 01 · DIGITAL SINGLE
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 36,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: ink,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.title || 'Untitled Track'}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 23,
                  color: mutedInk,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.artist || 'Unknown Artist'}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 19,
              fontWeight: 700,
              color: mutedInk,
              letterSpacing: '0.08em',
              paddingBottom: 14,
              borderBottom: `1px solid ${dashedBorder}`,
            }}
          >
            <span>ITEM / METADATA</span>
            <span>VALUE</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              padding: '24px 0',
              fontSize: 22,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
              <span
                style={{
                  color: mutedInk,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                01 {track.title}
              </span>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>{subtotal}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
              <span style={{ color: mutedInk }}>ARTIST</span>
              <span
                style={{
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {track.artist || 'Unknown Artist'}
              </span>
            </div>

            {tokens.showAlbum && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                <span style={{ color: mutedInk }}>ALBUM</span>
                <span
                  style={{
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {track.album || 'Single'}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
              <span style={{ color: mutedInk }}>DURATION</span>
              <span>{durationLabel}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
              <span style={{ color: mutedInk }}>CUE MARK</span>
              <span>{formatSeconds(clampedTime)}</span>
            </div>
          </div>

          <div
            style={{
              margin: '12px 0 28px 0',
              borderTop: `2px dashed ${dashedBorder}`,
            }}
          />

          {/* Subtotal / Tax / Total */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 22,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: mutedInk }}>
              <span>SUBTOTAL</span>
              <span>{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: mutedInk }}>
              <span>PRESSING TAX</span>
              <span>{tax}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 30,
                fontWeight: 700,
                color: ink,
                marginTop: 8,
              }}
            >
              <span>TOTAL</span>
              <span>{total}</span>
            </div>
          </div>

          <div
            style={{
              margin: '36px 0 34px 0',
              borderTop: `2px dashed ${dashedBorder}`,
            }}
          />

          {/* Spotify Scannable Barcode at Bottom */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              minHeight: 96,
            }}
          >
            {tokens.showCode && (codeUrl || onUploadCode) && (
              <ScannableCodeSlot
                codeUrl={codeUrl}
                onUploadCode={onUploadCode}
                onCodeLoadError={onCodeLoadError}
                variant="light"
              />
            )}
            <div
              style={{
                fontSize: 19,
                letterSpacing: '0.14em',
                color: mutedInk,
                textAlign: 'center',
              }}
            >
              THANK YOU FOR LISTENING · KEEP FOR YOUR RECORDS
            </div>
          </div>
        </div>

        {/* Subtle Torn Paper Bottom Edge */}
        <svg
          width={paperWidth}
          height={tornToothHeight}
          viewBox={`0 0 ${paperWidth} ${tornToothHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ display: 'block', marginTop: -1 }}
        >
          <path d={buildTornEdgePath(paperWidth, tornToothHeight, 44)} fill={paperBg} />
        </svg>
      </div>
    </div>
  );
}

export const receiptTemplate: Template = {
  id: 'receipt',
  name: 'Receipt',
  description: 'Monospace thermal-receipt print with order metadata, totals, torn edge, and bottom barcode.',
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 0,
    font: 'Space Mono',
    accent: '#18181A',
    timestamp: 72,
    showDuration: true,
    showHeart: false,
    showAlbum: true,
    showCode: true,
    theme: 'light',
    autoTheme: false,
  },
  controls: ['font', 'radius', 'theme', 'timestamp', 'showDuration', 'showAlbum', 'showCode'],
  Render: ReceiptRender,
};
