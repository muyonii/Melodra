import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeMockupFrameGeometry,
  FRAME_STYLES,
  MAT_SIZES,
  MOCKUP_POSTER_SIZES,
  MOCKUP_SCENES,
  WALL_COLOR_PRESETS,
} from './mockupConfig';

test('mockupConfig exposes all expected scenes, frames, mats, sizes, and wall colors', () => {
  assert.deepEqual(
    MOCKUP_SCENES.map((s) => s.id),
    ['floor-lean', 'above-sofa', 'window-closeup'],
  );
  assert.deepEqual(
    FRAME_STYLES.map((f) => f.id),
    ['black', 'white', 'oak', 'none'],
  );
  assert.deepEqual(
    MAT_SIZES.map((m) => m.id),
    ['none', 'thin', 'wide'],
  );
  assert.deepEqual(
    MOCKUP_POSTER_SIZES.map((p) => p.id),
    ['a4', 'a3', 'a2'],
  );
  assert.ok(WALL_COLOR_PRESETS.length >= 5);
});

test('computeMockupFrameGeometry scales A4 < A3 < A2 and accounts for mat and frame', () => {
  const a4 = computeMockupFrameGeometry('floor-lean', 'a4', 'none', 'black');
  const a3 = computeMockupFrameGeometry('floor-lean', 'a3', 'none', 'black');
  const a2 = computeMockupFrameGeometry('floor-lean', 'a2', 'none', 'black');

  assert.ok(a4.posterH < a3.posterH && a3.posterH < a2.posterH);
  assert.ok(a4.totalW > a4.posterW);

  const noMat = computeMockupFrameGeometry('above-sofa', 'a3', 'none', 'oak');
  const thinMat = computeMockupFrameGeometry('above-sofa', 'a3', 'thin', 'oak');
  const wideMat = computeMockupFrameGeometry('above-sofa', 'a3', 'wide', 'oak');

  assert.equal(noMat.matPadX, 0);
  assert.ok(thinMat.matPadX > 0);
  assert.ok(wideMat.matPadX > thinMat.matPadX);

  const frameless = computeMockupFrameGeometry('window-closeup', 'a4', 'none', 'none');
  assert.equal(frameless.frameBorderPx, 0);
  assert.equal(frameless.totalW, frameless.posterW);
});
