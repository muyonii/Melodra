import test from 'node:test';
import assert from 'node:assert/strict';
import { stripBlackBackgroundToAlpha } from './scannableCode';

test('stripBlackBackgroundToAlpha converts black to alpha 0 and preserves white', () => {
  const pixels = new Uint8ClampedArray([
    0, 0, 0, 255,       // pure black -> transparent
    10, 10, 10, 255,    // near black -> transparent
    255, 255, 255, 255, // pure white -> opaque white
  ]);

  stripBlackBackgroundToAlpha(pixels);

  assert.equal(pixels[3], 0);
  assert.equal(pixels[7], 0);
  assert.deepEqual([pixels[8], pixels[9], pixels[10], pixels[11]], [255, 255, 255, 255]);
});
