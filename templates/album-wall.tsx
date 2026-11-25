import {
  CoverArtImage,
  InlineEditableText,
} from '../src/components/PlaylistPosterHelpers';
import { DEFAULT_PLAYLIST_META, DEFAULT_PLAYLIST_TRACKS } from '../src/data/tracks';
import type { PosterRenderProps, Template } from '../src/types/poster';
import { formatDurationMs } from '../src/utils/format';

function AlbumWallRender({
  track,
  tracks,
  meta,
  tokens,
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
  const bg = isLight ? '#F5F3EE' : '#0C0C0E';
  const fg = isLight ? '#141416' : '#F5F5F5';
  const muted = isLight ? '#66635C' : '#8E8E93';
  const rule = isLight ? 'rgba(20, 20, 22, 0.12)' : 'rgba(255, 255, 255, 0.11)';
  const placeholderBg = isLight ? '#E7E3D9' : '#18181B';
  const accent = tokens.accent || '#1DB954';

  const cols = tokens.columns ?? 3;
  const gap = tokens.gap ?? 28;
  const count = list.length;
  const rows = Math.max(1, Math.ceil(count / cols));

  // Grid space available: 1072w x 1240h so bottom playlist footer always has breathing room
  const gridMaxW = 1072;
  const gridMaxH = 1230;
  const captionHeight = count > 12 ? 48 : 58;
  const maxTileW = Math.floor((gridMaxW - gap * (cols - 1)) / cols);
  const maxTileH = Math.floor((gridMaxH - gap * (rows - 1) - rows * captionHeight) / rows);
  const tileSize = Math.max(96, Math.min(maxTileW, maxTileH, 420));

  const titleFont = tileSize >= 260 ? 22 : tileSize >= 180 ? 19 : 16;
  const artistFont = tileSize >= 260 ? 18 : tileSize >= 180 ? 16 : 14;
  const totalDurationMs = list.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const showNumbers = tokens.showNumbers === true;
  const showDurations = tokens.showDurations === true;
  const editable = Boolean(onChangeMeta);

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: bg,
        color: fg,
        fontFamily: `'${tokens.font}', 'Outfit', sans-serif`,
        padding: '84px 84px 76px 84px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Album Cover Wall Grid */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
            columnGap: gap,
            rowGap: gap,
            justifyContent: 'center',
          }}
        >
          {list.map((item, idx) => (
            <div
              key={`${item.title}-${item.artist}-${idx}`}
              style={{
                width: tileSize,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  width: tileSize,
                  height: tileSize,
                  borderRadius: `${tokens.radius}px`,
                  overflow: 'hidden',
                  backgroundColor: placeholderBg,
                  border: `1px solid ${rule}`,
                  boxShadow: isLight
                    ? '0 14px 32px rgba(20,18,12,0.12)'
                    : '0 16px 38px rgba(0,0,0,0.48)',
                }}
              >
                <CoverArtImage
                  src={item.coverUrl}
                  alt={`${item.title} album art`}
                  fallbackText={item.title}
                  placeholderBg={placeholderBg}
                  mutedColor={muted}
                />
              </div>

              <div style={{ marginTop: 10, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: titleFont,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: fg,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {showNumbers ? `${String(idx + 1).padStart(2, '0')} · ` : ''}
                    {item.title}
                  </div>
                  {showDurations && (
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: Math.max(12, artistFont - 2),
                        color: muted,
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                      }}
                    >
                      {formatDurationMs(item.durationMs)}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 2,
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Playlist Title Block */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 34,
          borderTop: `2px solid ${rule}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 36,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: accent,
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: muted,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                ALBUM WALL · {count} TRACKS
              </span>
            </div>

            <InlineEditableText
              value={playlistMeta.title}
              placeholder="Untitled Playlist"
              ariaLabel="Playlist title"
              editable={editable}
              onChange={(next) => onChangeMeta?.({ title: next })}
              style={{
                fontSize: tokens.titleSize ?? 76,
                fontWeight: 700,
                lineHeight: 1.05,
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
                marginTop: 10,
                fontFamily: "'Inter', sans-serif",
                fontSize: 24,
                fontWeight: 400,
                color: muted,
              }}
            />
          </div>

          <div
            style={{
              textAlign: 'right',
              fontFamily: "'Space Mono', monospace",
              fontSize: 21,
              color: muted,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {formatDurationMs(totalDurationMs)}
          </div>
        </div>
      </div>
    </div>
  );
}

export const albumWallTemplate: Template = {
  id: 'album-wall',
  name: 'Album Wall',
  description: 'Upscaled cover grid with configurable columns, track captions, and bold playlist footer.',
  multiTrack: true,
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 12,
    font: 'Outfit',
    accent: '#1DB954',
    timestamp: 72,
    showDuration: false,
    showHeart: false,
    showAlbum: false,
    showCode: false,
    theme: 'dark',
    autoTheme: true,
    columns: 3,
    gap: 28,
    titleSize: 76,
    showNumbers: false,
    showDurations: false,
    showCovers: true,
  },
  controls: [
    'theme',
    'font',
    'autoTheme',
    'accent',
    'columns',
    'gap',
    'radius',
    'titleSize',
    'showNumbers',
    'showDurations',
  ],
  Render: AlbumWallRender,
};
