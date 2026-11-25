export type MockupSceneId = 'floor-lean' | 'above-sofa' | 'window-closeup';
export type FrameStyle = 'black' | 'white' | 'oak' | 'none';
export type MatSize = 'none' | 'thin' | 'wide';
export type MockupPosterSize = 'a4' | 'a3' | 'a2';

export interface MockupScenePreset {
  id: MockupSceneId;
  label: string;
  subtitle: string;
}

export const MOCKUP_SCENES: MockupScenePreset[] = [
  {
    id: 'floor-lean',
    label: 'Floor Lean',
    subtitle: 'Leaning on wooden floor',
  },
  {
    id: 'above-sofa',
    label: 'Above Sofa',
    subtitle: 'Hung above minimal sofa & shelf',
  },
  {
    id: 'window-closeup',
    label: 'Window Light',
    subtitle: 'Close-up with soft daylight',
  },
];

export const FRAME_STYLES: { id: FrameStyle; label: string }[] = [
  { id: 'black', label: 'Black' },
  { id: 'white', label: 'White' },
  { id: 'oak', label: 'Oak' },
  { id: 'none', label: 'None' },
];

export const MAT_SIZES: { id: MatSize; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'thin', label: 'Thin' },
  { id: 'wide', label: 'Wide' },
];

export const MOCKUP_POSTER_SIZES: { id: MockupPosterSize; label: string; dimensionsLabel: string }[] = [
  { id: 'a4', label: 'A4', dimensionsLabel: '8.3 × 11.7"' },
  { id: 'a3', label: 'A3', dimensionsLabel: '11.7 × 16.5"' },
  { id: 'a2', label: 'A2', dimensionsLabel: '16.5 × 23.4"' },
];

export const WALL_COLOR_PRESETS: { hex: string; label: string }[] = [
  { hex: '#EAE4DA', label: 'Warm Plaster' },
  { hex: '#F3F2EE', label: 'Gallery White' },
  { hex: '#D6D2CA', label: 'Stone Greige' },
  { hex: '#B9C1B4', label: 'Sage Mist' },
  { hex: '#64707A', label: 'Slate Dusk' },
  { hex: '#26282C', label: 'Studio Charcoal' },
];

export const MOCKUP_SCENE_WIDTH = 1280;
export const MOCKUP_SCENE_HEIGHT = 900;
export const POSTER_LOGICAL_WIDTH = 1240;
export const POSTER_LOGICAL_HEIGHT = 1754;

const SCENE_POSTER_HEIGHTS: Record<MockupSceneId, Record<MockupPosterSize, number>> = {
  'floor-lean': {
    a4: 264,
    a3: 360,
    a2: 470,
  },
  'above-sofa': {
    a4: 248,
    a3: 336,
    a2: 432,
  },
  'window-closeup': {
    a4: 380,
    a3: 500,
    a2: 616,
  },
};

export interface MockupFrameGeometry {
  posterW: number;
  posterH: number;
  posterScale: number;
  matPadX: number;
  matPadY: number;
  frameBorderPx: number;
  totalW: number;
  totalH: number;
}

export function computeMockupFrameGeometry(
  sceneId: MockupSceneId,
  posterSize: MockupPosterSize,
  matSize: MatSize,
  frameStyle: FrameStyle,
): MockupFrameGeometry {
  const baseArtworkH = SCENE_POSTER_HEIGHTS[sceneId][posterSize];
  const baseArtworkW = Math.round(baseArtworkH * (POSTER_LOGICAL_WIDTH / POSTER_LOGICAL_HEIGHT));

  // When a mat is added, shrink artwork slightly inside the outer frame or pad around artwork proportionally
  const matRatio = matSize === 'wide' ? 0.14 : matSize === 'thin' ? 0.065 : 0;
  const matPadX = Math.round(baseArtworkW * matRatio);
  const matPadY = Math.round(baseArtworkW * matRatio * 1.08);

  const frameRatio = sceneId === 'window-closeup' ? 0.052 : 0.044;
  const frameBorderPx =
    frameStyle === 'none' ? 0 : Math.max(8, Math.round(baseArtworkW * frameRatio));

  return {
    posterW: baseArtworkW,
    posterH: baseArtworkH,
    posterScale: baseArtworkW / POSTER_LOGICAL_WIDTH,
    matPadX,
    matPadY,
    frameBorderPx,
    totalW: baseArtworkW + matPadX * 2 + frameBorderPx * 2,
    totalH: baseArtworkH + matPadY * 2 + frameBorderPx * 2,
  };
}
