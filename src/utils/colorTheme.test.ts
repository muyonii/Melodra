import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureReadableAccent,
  rgbRelativeLuminance,
  rgbToHex,
  selectAutoThemeFromPalette,
} from './colorTheme';

test('ensureReadableAccent lifts very dark colors so they stay visible on dark backgrounds', () => {
  const dark = { r: 14, g: 24, b: 18 };
  const lifted = ensureReadableAccent(dark);
  assert.ok(rgbRelativeLuminance(lifted) >= 0.22);
  assert.ok(lifted.g > lifted.r && lifted.g >= lifted.b);
});

test('selectAutoThemeFromPalette prefers saturated swatch and builds RGB glass tint', () => {
  const result = selectAutoThemeFromPalette([
    { r: 18, g: 22, b: 20 },
    { r: 29, g: 185, b: 84 },
    { r: 210, g: 215, b: 212 },
  ]);

  assert.equal(result.accent, rgbToHex({ r: 29, g: 185, b: 84 }));
  assert.equal(result.glassTint, '29, 185, 84');
});

test('selectAutoThemeFromPalette falls back cleanly on empty palette', () => {
  assert.deepEqual(selectAutoThemeFromPalette([]), {
    accent: '#FFFFFF',
    glassTint: '255, 255, 255',
  });
});
