import {
  CoverArtImage,
  InlineEditableText,
} from '../src/components/PlaylistPosterHelpers';
import { ScannableCodeSlot } from '../src/components/ScannableCodeSlot';
import { DEFAULT_PLAYLIST_META, DEFAULT_PLAYLIST_TRACKS } from '../src/data/tracks';
import type { PosterRenderProps, Template, Track } from '../src/types/poster';
import { formatDurationMs } from '../src/utils/format';

function CassetteGraphic({
  title,
  accent,
  isLight,
  editable,
  onChangeTitle,
}: {
  title: string;
  accent: string;
  isLight: boolean;
  editable: boolean;
  onChangeTitle?: (next: string) => void;
}) {
  const shellFill = isLight ? '#1E1E22' : '#232328';
  const shellBevel = isLight ? '#121215' : '#141418';
  const labelPaper = '#F6F1E4';
  const labelInk = '#161618';

  return (
    <div
      style={{
        position: 'relative',
        width: 980,
        height: 616,
        margin: '0 auto',
        flexShrink: 0,
      }}
    >
      <svg
        width="980"
        height="616"
        viewBox="0 0 980 616"
        fill="none"
        aria-hidden="true"
        style={{
          display: 'block',
          filter: isLight
            ? 'drop-shadow(0 28px 46px rgba(20, 18, 12, 0.24))'
            : 'drop-shadow(0 32px 58px rgba(0, 0, 0, 0.72))',
        }}
      >
        {/* Cassette Outer Shell */}
        <rect
          x="4"
          y="4"
          width="972"
          height="608"
          rx="28"
          fill={shellFill}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="3"
        />
        <rect
          x="20"
          y="20"
          width="940"
          height="576"
          rx="20"
          fill={shellBevel}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="2"
        />

        {/* Corner Screws */}
        {[
          [34, 34],
          [946, 34],
          [34, 582],
          [946, 582],
        ].map(([cx, cy], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r="11" fill="#323238" stroke="#101012" strokeWidth="2" />
            <line
              x1={cx - 5}
              y1={cy - 5}
              x2={cx + 5}
              y2={cy + 5}
              stroke="#141416"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* Paper Cassette Label */}
        <rect
          x="64"
          y="58"
          width="852"
          height="364"
          rx="16"
          fill={labelPaper}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="2"
        />

        {/* Accent Color Stripe */}
        <rect x="64" y="196" width="852" height="22" fill={accent} />
        <rect x="64" y="218" width="852" height="8" fill="#18181A" opacity="0.12" />

        {/* Label Ruled Lines & Side A Badge */}
        <line x1="96" y1="158" x2="884" y2="158" stroke="rgba(22,22,24,0.16)" strokeWidth="2" />
        <text
          x="96"
          y="96"
          fill="#5E5B53"
          fontSize="20"
          fontWeight="700"
          fontFamily="'Space Mono', monospace"
          letterSpacing="3"
        >
          SIDE A · C-90 HIGH BIAS
        </text>
        <text
          x="884"
          y="96"
          textAnchor="end"
          fill="#5E5B53"
          fontSize="20"
          fontWeight="700"
          fontFamily="'Space Mono', monospace"
          letterSpacing="2"
        >
          TYPE II · CrO2
        </text>

        {/* Central Translucent Tape Window */}
        <rect
          x="196"
          y="252"
          width="588"
          height="134"
          rx="14"
          fill="#151518"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="3"
        />

        {/* Left & Right Tape Reels */}
        {[316, 664].map((cx, idx) => (
          <g key={idx}>
            {/* Wound magnetic tape */}
            <circle
              cx={cx}
              cy="319"
              r={idx === 0 ? 54 : 44}
              fill="#2B211B"
              stroke="#1A130F"
              strokeWidth="2"
            />
            {/* White spool hub */}
            <circle cx={cx} cy="319" r="28" fill="#EDEAE2" />
            <circle cx={cx} cy="319" r="14" fill="#151518" />
            {/* Hub teeth */}
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = cx + Math.cos(rad) * 14;
              const y1 = 319 + Math.sin(rad) * 14;
              const x2 = cx + Math.cos(rad) * 20;
              const y2 = 319 + Math.sin(rad) * 20;
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#EDEAE2"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        ))}

        {/* Window Ruler Marks */}
        {[420, 455, 490, 525, 560].map((x) => (
          <line key={x} x1={x} y1="306" x2={x} y2="332" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
        ))}

        {/* Bottom Trapezoidal Tape Gate */}
        <path
          d="M 218 612 L 260 472 L 720 472 L 762 612 Z"
          fill="#19191D"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2"
        />
        <circle cx="310" cy="542" r="15" fill="#0B0B0D" stroke="#3A3A42" strokeWidth="3" />
        <circle cx="670" cy="542" r="15" fill="#0B0B0D" stroke="#3A3A42" strokeWidth="3" />
        <rect x="442" y="514" width="96" height="44" rx="6" fill="#0D0D0F" />
      </svg>

      {/* Handwritten-Style Editable Playlist Title on Cassette Paper Label */}
      <div
        style={{
          position: 'absolute',
          top: 98,
          left: 96,
          right: 96,
          height: 62,
          display: 'flex',
          alignItems: 'center',
          color: labelInk,
          fontFamily: "'Playfair Display', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 44,
          letterSpacing: '-0.01em',
        }}
      >
        <InlineEditableText
          value={title}
          placeholder="Summer Mix '26"
          ariaLabel="Cassette label playlist title"
          editable={editable}
          onChange={onChangeTitle}
          style={{
            color: labelInk,
          }}
        />
      </div>
    </div>
  );
}

function MixtapeRender({
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
  const bg = isLight ? '#F2EDE2' : '#111114';
  const cardBg = isLight ? '#FBF8F1' : '#17171B';
  const fg = isLight ? '#171719' : '#F3F2EE';
  const muted = isLight ? '#656157' : '#8E8E93';
  const rule = isLight ? 'rgba(23, 23, 25, 0.16)' : 'rgba(255, 255, 255, 0.12)';
  const accent = tokens.accent || '#E05A36';
  const placeholderBg = isLight ? '#E5DFD2' : '#222227';

  const count = list.length;
  const totalDurationMs = list.reduce((sum, t) => sum + (t.durationMs || 0), 0);
  const showNumbers = tokens.showNumbers !== false;
  const showDurations = tokens.showDurations !== false;
  const showCovers = tokens.showCovers !== false;
  const editable = Boolean(onChangeMeta);

  // Split into Side A / Side B columns when > 8 tracks so up to 16 tracks fit cleanly on J-card
  const useTwoColumns = count > 8;
  const splitIdx = useTwoColumns ? Math.ceil(count / 2) : count;
  const sideA = list.slice(0, splitIdx);
  const sideB = useTwoColumns ? list.slice(splitIdx) : [];

  const renderTrackRow = (item: Track, globalIdx: number) => (
    <div
      key={`${item.title}-${item.artist}-${globalIdx}`}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 14,
        padding: `${useTwoColumns ? 11 : Math.max(11, Math.round((tokens.gap ?? 20) * 0.68))}px 0`,
        borderBottom: `1px dashed ${rule}`,
        fontSize: useTwoColumns ? 20 : count <= 5 ? 25 : 22,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          minWidth: 0,
          flex: 1,
        }}
      >
        {showNumbers && (
          <span style={{ color: accent, fontWeight: 700, flexShrink: 0 }}>
            {String(globalIdx + 1).padStart(2, '0')}.
          </span>
        )}
        <span
          style={{
            fontWeight: 700,
            color: fg,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            color: muted,
            fontSize: useTwoColumns ? 17 : 19,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 1,
          }}
        >
          — {item.artist}
        </span>
      </div>

      {showDurations && (
        <span style={{ color: muted, fontSize: useTwoColumns ? 17 : 20, flexShrink: 0 }}>
          {formatDurationMs(item.durationMs)}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        backgroundColor: bg,
        color: fg,
        fontFamily: `'${tokens.font}', 'Space Mono', monospace`,
        padding: '86px 96px 80px 96px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top Cassette Graphic */}
      <CassetteGraphic
        title={playlistMeta.title}
        accent={accent}
        isLight={isLight}
        editable={editable}
        onChangeTitle={(next) => onChangeMeta?.({ title: next })}
      />

      {/* Bottom J-Card Foldout Tracklist */}
      <div
        style={{
          marginTop: 54,
          flex: 1,
          minHeight: 0,
          backgroundColor: cardBg,
          border: `1px solid ${rule}`,
          borderRadius: `${Math.min(tokens.radius, 20)}px`,
          padding: '44px 52px 38px 52px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: isLight
            ? '0 20px 44px rgba(20,18,12,0.08)'
            : '0 24px 52px rgba(0,0,0,0.45)',
        }}
      >
        {/* J-Card Header + Mini Cover Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            paddingBottom: 22,
            borderBottom: `2px solid ${rule}`,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              CASSETTE J-CARD · {count} TRACKS
            </div>
            <InlineEditableText
              value={playlistMeta.subtitle}
              placeholder="Recorded notes…"
              ariaLabel="Playlist subtitle"
              editable={editable}
              onChange={(next) => onChangeMeta?.({ subtitle: next })}
              style={{
                marginTop: 8,
                fontSize: 23,
                color: fg,
                fontWeight: 700,
              }}
            />
          </div>

          {showCovers && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {list.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: `1px solid ${rule}`,
                    backgroundColor: placeholderBg,
                  }}
                >
                  <CoverArtImage
                    src={item.coverUrl}
                    alt=""
                    placeholderBg={placeholderBg}
                    mutedColor={muted}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monospace Tracklist Rows */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            paddingTop: 18,
            paddingBottom: 18,
            display: 'grid',
            gridTemplateColumns: useTwoColumns ? '1fr 1fr' : '1fr',
            columnGap: 42,
            alignContent: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: muted,
                marginBottom: 8,
              }}
            >
              SIDE A
            </div>
            {sideA.map((item, idx) => renderTrackRow(item, idx))}
          </div>

          {useTwoColumns && (
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: muted,
                  marginBottom: 8,
                }}
              >
                SIDE B
              </div>
              {sideB.map((item, idx) => renderTrackRow(item, splitIdx + idx))}
            </div>
          )}
        </div>

        {/* J-Card Footer */}
        <div
          style={{
            paddingTop: 20,
            borderTop: `2px solid ${rule}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            minHeight: 54,
          }}
        >
          <span
            style={{
              fontSize: 18,
              letterSpacing: '0.1em',
              color: muted,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            TOTAL · {formatDurationMs(totalDurationMs)} · DOLBY NR
          </span>

          {tokens.showCode && (codeUrl || onUploadCode) && (
            <div style={{ transform: 'scale(0.76)', transformOrigin: 'right center' }}>
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
    </div>
  );
}

export const mixtapeTemplate: Template = {
  id: 'mixtape',
  name: 'Mixtape',
  description: 'Retro cassette shell with handwritten label title and monospace Side A/B J-card tracklist.',
  multiTrack: true,
  size: { w: 1240, h: 1754 },
  defaults: {
    blur: 0,
    brightness: 1,
    glassOpacity: 0,
    radius: 10,
    font: 'Space Mono',
    accent: '#E05A36',
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
    gap: 20,
    titleSize: 64,
  },
  controls: [
    'theme',
    'font',
    'autoTheme',
    'accent',
    'gap',
    'radius',
    'showCovers',
    'showNumbers',
    'showDurations',
    'showCode',
  ],
  Render: MixtapeRender,
};
