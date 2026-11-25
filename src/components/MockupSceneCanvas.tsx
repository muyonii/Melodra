import type { CSSProperties } from 'react';
import type { PlaylistMeta, Template, Tokens, Track } from '../types/poster';
import {
  computeMockupFrameGeometry,
  MOCKUP_SCENE_HEIGHT,
  MOCKUP_SCENE_WIDTH,
  POSTER_LOGICAL_HEIGHT,
  POSTER_LOGICAL_WIDTH,
  type FrameStyle,
  type MatSize,
  type MockupPosterSize,
  type MockupSceneId,
} from '../utils/mockupConfig';

interface MockupSceneCanvasProps {
  sceneId: MockupSceneId;
  frameStyle: FrameStyle;
  matSize: MatSize;
  wallColor: string;
  posterSize: MockupPosterSize;
  track: Track;
  tracks?: Track[];
  meta?: PlaylistMeta;
  template: Template;
  tokens: Tokens;
  codeUrl?: string;
  thumbnailPreview?: boolean;
}

function getFrameContainerStyle(
  frameStyle: FrameStyle,
  borderPx: number,
): CSSProperties {
  if (frameStyle === 'none') {
    return {
      padding: 0,
      backgroundColor: '#121214',
      borderRadius: '1px',
    };
  }

  if (frameStyle === 'black') {
    return {
      padding: `${borderPx}px`,
      background: 'linear-gradient(145deg, #242428 0%, #141416 55%, #0D0D0F 100%)',
      borderRadius: '2px',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.06)',
    };
  }

  if (frameStyle === 'white') {
    return {
      padding: `${borderPx}px`,
      background: 'linear-gradient(145deg, #F8F7F4 0%, #ECEAE4 65%, #E0DDD5 100%)',
      borderRadius: '2px',
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(0,0,0,0.08)',
    };
  }

  // Natural oak wood frame with pure CSS wood grain striations
  return {
    padding: `${borderPx}px`,
    backgroundColor: '#C59C6D',
    backgroundImage: [
      'repeating-linear-gradient(90deg, rgba(96,58,24,0.08) 0px, rgba(96,58,24,0.08) 2px, transparent 2px, transparent 9px, rgba(255,232,198,0.09) 9px, rgba(255,232,198,0.09) 13px, transparent 13px, transparent 21px)',
      'linear-gradient(145deg, #D5B084 0%, #C39869 52%, #AD8152 100%)',
    ].join(', '),
    borderRadius: '2px',
    boxShadow:
      'inset 0 1px 0 rgba(255,244,224,0.45), inset 0 -1px 0 rgba(68,40,14,0.35), inset 0 0 0 1px rgba(84,52,22,0.22)',
  };
}

export function MockupSceneCanvas({
  sceneId,
  frameStyle,
  matSize,
  wallColor,
  posterSize,
  track,
  tracks,
  meta,
  template,
  tokens,
  codeUrl,
  thumbnailPreview = false,
}: MockupSceneCanvasProps) {
  const geom = computeMockupFrameGeometry(sceneId, posterSize, matSize, frameStyle);
  const Render = template.Render;

  const isLeaning = sceneId === 'floor-lean';
  const isCloseUp = sceneId === 'window-closeup';
  const frameStyleCss = getFrameContainerStyle(frameStyle, geom.frameBorderPx);

  // Outer drop shadow tuned per scene for realistic wall distance and light angle
  const outerShadow = isLeaning
    ? '0 24px 36px -8px rgba(0,0,0,0.45), 14px 12px 26px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.35)'
    : isCloseUp
      ? '16px 26px 52px -8px rgba(0,0,0,0.34), 6px 10px 20px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.16)'
      : '0 22px 44px -8px rgba(0,0,0,0.32), 8px 12px 24px -4px rgba(0,0,0,0.18), 0 3px 8px rgba(0,0,0,0.16)';

  const posterUnit = (
    <div
      className="relative"
      style={{
        width: geom.totalW,
        height: geom.totalH,
      }}
    >
      {/* Angled leaning wall shadow behind frame for Scene 1 */}
      {isLeaning && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: 10,
            bottom: 4,
            left: -14,
            right: -28,
            background:
              'linear-gradient(100deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.14) 55%, rgba(0,0,0,0) 100%)',
            transform: 'skewX(-2.2deg)',
            transformOrigin: 'bottom center',
            borderRadius: '4px',
          }}
        />
      )}

      {/* Frame Shell */}
      <div
        data-testid={thumbnailPreview ? undefined : 'mockup-framed-poster'}
        className="relative w-full h-full"
        style={{
          ...frameStyleCss,
          boxShadow: [frameStyleCss.boxShadow, outerShadow].filter(Boolean).join(', '),
          transform: isLeaning ? 'perspective(1600px) rotateX(2.4deg)' : undefined,
          transformOrigin: isLeaning ? 'center bottom' : 'center center',
        }}
      >
        {/* Archival Mat Board (or direct artwork wrapper) */}
        <div
          className="relative w-full h-full"
          style={{
            padding: `${geom.matPadY}px ${geom.matPadX}px`,
            backgroundColor: matSize !== 'none' ? '#F6F5F0' : 'transparent',
            boxShadow:
              matSize !== 'none'
                ? 'inset 0 1px 3px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.06)'
                : frameStyle !== 'none'
                  ? 'inset 0 1px 4px rgba(0,0,0,0.45)'
                  : undefined,
          }}
        >
          {/* Poster Artwork Surface */}
          <div
            className="relative overflow-hidden bg-[#0B0B0C]"
            style={{
              width: geom.posterW,
              height: geom.posterH,
              boxShadow:
                matSize !== 'none'
                  ? 'inset 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.14)'
                  : undefined,
            }}
          >
            {thumbnailPreview ? (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-2"
                style={{
                  backgroundColor: tokens.theme === 'light' ? '#F3F2EE' : '#141416',
                }}
              >
                <img
                  src={track.coverUrl}
                  alt=""
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="w-[74%] aspect-square object-cover rounded-[2px] shadow-sm"
                />
                <div
                  className="w-[56%] h-[2px] rounded-full mt-1.5 opacity-55"
                  style={{
                    backgroundColor: tokens.theme === 'light' ? '#1A1A1C' : '#F5F5F5',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: POSTER_LOGICAL_WIDTH,
                  height: POSTER_LOGICAL_HEIGHT,
                  transform: `scale(${geom.posterScale})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
              >
                <Render
                  track={track}
                  tracks={tracks}
                  meta={meta}
                  tokens={tokens}
                  codeUrl={codeUrl}
                />
              </div>
            )}
          </div>

          {/* Subtle Glass Reflection Gradient over Frame Glass */}
          {frameStyle !== 'none' && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: isCloseUp
                  ? 'linear-gradient(122deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.07) 61%, rgba(255,255,255,0) 70%)'
                  : 'linear-gradient(118deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 33%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.055) 58%, rgba(255,255,255,0) 68%)',
              }}
            />
          )}
        </div>
      </div>

      {/* Floor Contact Shadow directly under bottom rail in Scene 1 */}
      {isLeaning && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -9,
            width: Math.round(geom.totalW * 1.06),
            height: 16,
            background:
              'radial-gradient(ellipse at center, rgba(16,10,4,0.62) 0%, rgba(16,10,4,0.22) 55%, rgba(16,10,4,0) 80%)',
          }}
        />
      )}
    </div>
  );

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width: MOCKUP_SCENE_WIDTH,
        height: MOCKUP_SCENE_HEIGHT,
        backgroundColor: wallColor,
      }}
    >
      {/* SCENE 1: Leaning against wall on a wooden floor */}
      {sceneId === 'floor-lean' && (
        <>
          {/* Wall ambient light gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0"
            style={{
              height: 678,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.01) 56%, rgba(0,0,0,0.09) 100%)',
            }}
          />

          {/* Architectural Baseboard / Skirting */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0"
            style={{
              top: 636,
              height: 42,
              background: 'linear-gradient(180deg, #F3F1EC 0%, #E7E4DC 20%, #DCD8CF 100%)',
              borderTop: '1px solid rgba(255,255,255,0.75)',
              boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
            }}
          />

          {/* Wooden Floor */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0"
            style={{
              top: 678,
              backgroundColor: '#9E7854',
              backgroundImage: [
                'linear-gradient(180deg, rgba(32,18,8,0.22) 0%, rgba(32,18,8,0.04) 22%, rgba(20,10,4,0.24) 100%)',
                'repeating-linear-gradient(90deg, rgba(56,34,16,0.18) 0px, rgba(56,34,16,0.18) 2px, transparent 2px, transparent 160px)',
                'repeating-linear-gradient(90deg, rgba(255,234,204,0.05) 0px, rgba(64,38,16,0.045) 7px, transparent 15px)',
                'linear-gradient(180deg, #B58F68 0%, #9E7852 45%, #84603F 100%)',
              ].join(', '),
            }}
          />

          {/* Horizontal floorboard seam for realism */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0"
            style={{
              top: 786,
              height: 1.5,
              background: 'rgba(54,32,14,0.18)',
            }}
          />

          {/* Subtle Ceramic Vessel & Botanical Stem SVG prop beside the frame */}
          <svg
            aria-hidden="true"
            width="136"
            height="220"
            viewBox="0 0 136 220"
            fill="none"
            className="absolute pointer-events-none"
            style={{ right: 204, bottom: 186 }}
          >
            {/* Soft shadow under vase */}
            <ellipse cx="68" cy="206" rx="40" ry="8" fill="rgba(22,12,4,0.34)" />
            {/* Botanical stems */}
            <path
              d="M68 122 C66 86, 52 54, 42 22"
              stroke="#5C6B57"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M70 122 C74 84, 88 52, 98 28"
              stroke="#4D5B49"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <ellipse cx="44" cy="48" rx="9" ry="5" transform="rotate(-32 44 48)" fill="#6C7C66" />
            <ellipse cx="56" cy="70" rx="8" ry="4.5" transform="rotate(24 56 70)" fill="#5F705A" />
            <ellipse cx="89" cy="46" rx="8.5" ry="4.5" transform="rotate(28 89 46)" fill="#6B7B65" />
            <ellipse cx="78" cy="72" rx="8" ry="4" transform="rotate(-24 78 72)" fill="#566651" />
            {/* Matte stoneware ceramic vase */}
            <defs>
              <linearGradient id="ceramicGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E6E1D7" />
                <stop offset="55%" stopColor="#D6CFC2" />
                <stop offset="100%" stopColor="#B8B0A2" />
              </linearGradient>
            </defs>
            <path
              d="M54 118 L82 118 L86 134 C98 148, 102 178, 92 198 C88 205, 48 205, 44 198 C34 178, 38 148, 50 134 Z"
              fill="url(#ceramicGrad)"
            />
            <ellipse cx="68" cy="118" rx="14" ry="3.5" fill="#C2BAA9" />
          </svg>

          {/* Leaning Framed Poster resting on wooden floor */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: 196 }}
          >
            {posterUnit}
          </div>
        </>
      )}

      {/* SCENE 2: Hung on wall above minimal sofa & gallery shelf */}
      {sceneId === 'above-sofa' && (
        <>
          {/* Soft overhead gallery wall wash */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 68% 54% at 50% 24%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 55%, rgba(0,0,0,0.12) 100%)',
            }}
          />

          {/* Floor strip at bottom */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0"
            style={{
              height: 112,
              background: 'linear-gradient(180deg, #B5997A 0%, #987B5C 100%)',
              borderTop: '2px solid rgba(0,0,0,0.14)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0"
            style={{
              bottom: 112,
              height: 22,
              background: 'linear-gradient(180deg, #EEEDE8 0%, #DCDAD2 100%)',
            }}
          />

          {/* Hung Framed Poster centered cleanly above sofa */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ top: 368 }}
          >
            {posterUnit}
          </div>

          {/* Minimal Floating Oak Ledge & Curated Objects */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: 618, width: 520 }}
          >
            {/* Tiny ceramic cup & art book on the minimal shelf */}
            <div className="relative h-8 w-full">
              <div
                className="absolute left-10 bottom-0 rounded-t-[2px]"
                style={{
                  width: 66,
                  height: 12,
                  background: '#2E2E32',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.14)',
                }}
              />
              <div
                className="absolute left-12 bottom-3 rounded-t-[2px]"
                style={{
                  width: 54,
                  height: 9,
                  background: '#E8E3D9',
                }}
              />
              <div
                className="absolute right-12 bottom-0 rounded-t-[6px]"
                style={{
                  width: 24,
                  height: 28,
                  background: 'linear-gradient(90deg, #DDD7CC 0%, #BFB8AA 100%)',
                }}
              />
            </div>
            {/* Shelf plank */}
            <div
              style={{
                width: '100%',
                height: 14,
                borderRadius: '2px',
                background: 'linear-gradient(180deg, #CFA97E 0%, #B2885C 100%)',
                boxShadow:
                  '0 12px 22px rgba(0,0,0,0.22), 0 3px 6px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,244,220,0.4)',
              }}
            />
          </div>

          {/* Minimal Architectural Linen Sofa below */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: 48, width: 840, height: 196 }}
          >
            {/* Sofa floor shadow */}
            <div
              className="absolute inset-x-8 -bottom-3 h-7 rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(20,14,8,0.45) 0%, rgba(20,14,8,0) 75%)',
              }}
            />

            {/* Slender matte legs */}
            <div
              className="absolute bottom-0 left-12 w-3.5 h-8 rounded-b-sm"
              style={{ background: '#262423' }}
            />
            <div
              className="absolute bottom-0 right-12 w-3.5 h-8 rounded-b-sm"
              style={{ background: '#262423' }}
            />

            {/* Left & Right Back Cushions */}
            <div className="absolute top-0 inset-x-12 flex gap-2 h-24">
              <div
                className="flex-1 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(180deg, #E5E0D8 0%, #D4CEC4 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.45), 0 4px 10px rgba(0,0,0,0.1)',
                }}
              />
              <div
                className="flex-1 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(180deg, #E5E0D8 0%, #D4CEC4 100%)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.45), 0 4px 10px rgba(0,0,0,0.1)',
                }}
              />
            </div>

            {/* Sofa Armrests */}
            <div
              className="absolute bottom-7 left-0 w-16 h-28 rounded-t-2xl rounded-bl-lg"
              style={{
                background: 'linear-gradient(90deg, #CFC9BE 0%, #DDD8CE 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            />
            <div
              className="absolute bottom-7 right-0 w-16 h-28 rounded-t-2xl rounded-br-lg"
              style={{
                background: 'linear-gradient(90deg, #DDD8CE 0%, #CBC4B9 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            />

            {/* Seat Cushions + Base Deck */}
            <div className="absolute bottom-14 inset-x-14 flex gap-1.5 h-16">
              <div
                className="flex-1 rounded-t-xl"
                style={{
                  background: 'linear-gradient(180deg, #EBE7DF 0%, #D9D3C9 100%)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.55)',
                }}
              />
              <div
                className="flex-1 rounded-t-xl"
                style={{
                  background: 'linear-gradient(180deg, #EBE7DF 0%, #D9D3C9 100%)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.55)',
                }}
              />
            </div>
            <div
              className="absolute bottom-7 inset-x-2 h-8 rounded-b-lg"
              style={{
                background: 'linear-gradient(180deg, #CFC8BD 0%, #B8B0A4 100%)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
              }}
            />
          </div>
        </>
      )}

      {/* SCENE 3: Close-up on plain wall with soft window light */}
      {sceneId === 'window-closeup' && (
        <>
          {/* Soft Diagonal Window Light Beams across Plain Wall */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: [
                'radial-gradient(ellipse 64% 68% at 24% 20%, rgba(255,249,236,0.28) 0%, rgba(255,249,236,0.06) 52%, transparent 78%)',
                'linear-gradient(124deg, rgba(255,248,232,0.18) 0%, rgba(255,248,232,0.16) 24%, rgba(0,0,0,0.08) 29%, rgba(0,0,0,0.07) 33%, rgba(255,248,232,0.14) 38%, rgba(255,248,232,0.10) 58%, rgba(0,0,0,0.11) 78%, rgba(0,0,0,0.20) 100%)',
              ].join(', '),
            }}
          />

          {/* Close-up Framed Poster */}
          <div className="absolute inset-0 flex items-center justify-center">
            {posterUnit}
          </div>
        </>
      )}

      {/* Gentle Studio Lighting Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 84% 84% at 50% 46%, rgba(0,0,0,0) 54%, rgba(0,0,0,0.22) 100%)',
        }}
      />
    </div>
  );
}
