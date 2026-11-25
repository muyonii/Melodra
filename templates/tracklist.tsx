import {
  CoverArtImage,
  InlineEditableText,
} from '../src/components/PlaylistPosterHelpers';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import { DEFAULT_PLAYLIST_META, DEFAULT_PLAYLIST_TRACKS } from '../src/data/tracks';
import type { PosterRenderProps, Template } from '../src/types/poster';
import { formatDurationMs } from '../src/utils/format';

function TracklistRender({
  track,
  tracks,
  meta,
  tokens,
  codeUrl,
  onUploadCode,
  onCodeLoadError,
  onChangeMeta,
}: PosterRenderProps) {
  const list =
    tracks && tracks.length > 0
      ? tracks.slice(0, 16)
      : track
        ? [track, ...DEFAULT_PLAYLIST_TRACKS.slice(1)]
        : DEFAULT_PLAYLIST_TRACKS;

  const playlistMeta = meta ?? DEFAULT_PLAYLIST_META;
  const isLight = tokens.theme === 'light';
  const bg = isLight ? '#F7F5F0' : '#0E0E10';
  const fg = isLight ? '#151517' : '#F5F5F5';
  const muted = isLight ? '#66635C' : '#8E8E93';
  const rule = isLight ? 'rgba(21, 21, 23, 0.12)' : 'rgba(255, 255, 255, 0.11)';
  const placeholderBg = isLight ? '#E8E4DA' : '#18181B';
  const accent = tokens.accent || '#1DB954';

  const count = list.length;
  const showCovers = tokens.showCovers !== false;
  const showNumbers = tokens.showNumbers !== false;
  const showDurations = tokens.showDurations !== false;
  const gapPx = tokens.gap ?? 26;

  // Adapt typography & row padding smoothly for 2..16 tracks
  const rowPadY =
    count <= 5
      ? Math.round(gapPx * 0.85)
      : count <= 9
        ? Math.round(gapPx * 0.52)
        : Math.max(8, Math.round(gapPx * 0.34));
  const titleFont = count <= 5 ? 32 : count <= 9 ? 27 : count <= 12 ? 24 : 21;
  const artistFont = count <= 5 ? 22 : count <= 9 ? 19 : 16;
  const numFont = count <= 5 ? 23 : count <= 10 ? 20 : 18;
  const rowThumbSize = count <= 6 ? 58 : count <= 10 ? 48 : 0;

  const baseTitleSize = tokens.titleSize ?? 86;
  const adaptedHeaderSize =
    count >= 13 ? Math.min(baseTitleSize, 74) : baseTitleSize;

  const totalDurationMs = list.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const collageCovers = list.slice(0, 6);
  const editable = Boolean(onChangeMeta);

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: bg,
        color: fg,
        fontFamily: `'${tokens.font}', 'Playfair Display', serif`,
        padding: '88px 96px 80px 96px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top Cover Strip / Collage */}
      {showCovers && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: count >= 13 ? 34 : 46,
            flexShrink: 0,
          }}
        >
          {collageCovers.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              style={{
                width: 112,
                height: 112,
                borderRadius: `${Math.min(tokens.radius, 18)}px`,
                overflow: 'hidden',
                border: `1px solid ${rule}`,
                backgroundColor: placeholderBg,
                boxShadow: isLight
                  ? '0 10px 24px rgba(20,18,12,0.08)'
                  : '0 12px 28px rgba(0,0,0,0.42)',
                flexShrink: 0,
              }}
            >
              <CoverArtImage
                src={item.coverUrl}
                alt={`${item.title} cover`}
                fallbackText={item.title}
                placeholderBg={placeholderBg}
                mutedColor={muted}
              />
            </div>
          ))}
        </div>
      )}

      {/* Header: Accent Rule + Editable Playlist Title & Subtitle */}
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                display: 'inline-block',
                width: 44,
                height: 4,
                borderRadius: 999,
                backgroundColor: accent,
              }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: muted,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              PLAYLIST · {count} TRACKS
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 20,
              color: muted,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatDurationMs(totalDurationMs)}
          </span>
        </div>

        <InlineEditableText
          value={playlistMeta.title}
          placeholder="Untitled Playlist"
          ariaLabel="Playlist title"
          editable={editable}
          onChange={(next) => onChangeMeta?.({ title: next })}
          style={{
            fontSize: adaptedHeaderSize,
            fontWeight: 700,
            lineHeight: 1.06,
            letterSpacing: '-0.025em',
            color: fg,
          }}
        />

        <InlineEditableText
          value={playlistMeta.subtitle}
          placeholder="Add a subtitle…"
          ariaLabel="Playlist subtitle"
          editable={editable}
          onChange={(next) => onChangeMeta?.({ subtitle: next })}
          style={{
            marginTop: 14,
            fontFamily: "'Inter', sans-serif",
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.3,
            color: muted,
          }}
        />
      </div>

      {/* Divider */}
      <div
        style={{
          marginTop: count >= 13 ? 28 : 38,
          borderTop: `2px solid ${rule}`,
          flexShrink: 0,
        }}
      />

      {/* Numbered Tracklist */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: count <= 6 ? 'flex-start' : 'space-between',
          paddingTop: count >= 13 ? 8 : 14,
          paddingBottom: count >= 13 ? 8 : 14,
        }}
      >
        {list.map((item, idx) => (
          <div
            key={`${item.title}-${item.artist}-${idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: `${rowPadY}px 0`,
              borderBottom: idx < list.length - 1 ? `1px solid ${rule}` : 'none',
            }}
          >
            {showNumbers && (
              <span
                style={{
                  width: 44,
                  flexShrink: 0,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: numFont,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: idx === 0 ? accent : muted,
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
            )}

            {showCovers && rowThumbSize > 0 && (
              <div
                style={{
                  width: rowThumbSize,
                  height: rowThumbSize,
                  borderRadius: `${Math.min(tokens.radius, 10)}px`,
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: placeholderBg,
                  border: `1px solid ${rule}`,
                }}
              >
                <CoverArtImage
                  src={item.coverUrl}
                  alt=""
                  placeholderBg={placeholderBg}
                  mutedColor={muted}
                />
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: titleFont,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: fg,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.title}
              </div>
              {count <= 12 ? (
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: artistFont,
                    fontWeight: 400,
                    color: muted,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.artist}
                </div>
              ) : null}
            </div>

            {count > 12 && (
              <div
                style={{
                  maxWidth: 320,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: artistFont,
                  color: muted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0,
                }}
              >
                {item.artist}
              </div>
            )}

            {showDurations && (
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: numFont,
                  fontVariantNumeric: 'tabular-nums',
                  color: muted,
                  flexShrink: 0,
                }}
              >
                {formatDurationMs(item.durationMs)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          borderTop: `2px solid ${rule}`,
          paddingTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 20,
            letterSpacing: '0.08em',
            color: muted,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          TOTAL RUNTIME · {formatDurationMs(totalDurationMs)}
        </div>

        {tokens.showCode && (codeUrl || onUploadCode) && (
          <div style={{ transform: 'scale(0.84)', transformOrigin: 'right center' }}>
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

export const tracklistTemplate: Template = {
  id: 'tracklist',
  name: 'Tracklist',
  description: 'Editorial numbered playlist with cover collage strip, editable header, and runtime summary.',
  multiTrack: true,
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 10,
    font: 'Playfair Display',
    accent: '#1DB954',
    timestamp: 72,
    showDuration: true,
    showHeart: false,
    showAlbum: false,
    showCode: true,
    theme: 'light',
    autoTheme: true,
    showNumbers: true,
    showDurations: true,
    showCovers: true,
    gap: 26,
    titleSize: 86,
  },
  controls: [
    'theme',
    'font',
    'autoTheme',
    'accent',
    'titleSize',
    'gap',
    'radius',
    'showCovers',
    'showNumbers',
    'showDurations',
    'showCode',
  ],
  Render: TracklistRender,
};
