import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExportFilename,
  EXPORT_PRESETS,
  getExportPreset,
  isLowResCover,
  POSTER_BASE_HEIGHT,
  POSTER_BASE_WIDTH,
} from './exportPresets';

test('all export presets compute ~300 DPI pixel ratios cleanly', () => {
  assert.equal(EXPORT_PRESETS.length, 5);

  const a4 = getExportPreset('a4');
  assert.equal(a4.pixelRatio, 2);
  assert.equal(Math.round(POSTER_BASE_WIDTH * a4.pixelRatio), 2480);
  assert.equal(Math.round(POSTER_BASE_HEIGHT * a4.pixelRatio), 3508);

  const a3 = getExportPreset('a3');
  assert.equal(Math.round(POSTER_BASE_WIDTH * a3.pixelRatio), 3508);

  const a2 = getExportPreset('a2');
  assert.equal(a2.pixelRatio, 4);
  assert.equal(a2.outputWidthPx, 4960);
  assert.equal(a2.outputHeightPx, 7016);

  const twelveEighteen = getExportPreset('12x18');
  assert.equal(twelveEighteen.outputWidthPx, 3600);
  assert.equal(twelveEighteen.outputHeightPx, 5400);

  const square = getExportPreset('square-12');
  assert.equal(square.outputWidthPx, 3600);
  assert.equal(square.outputHeightPx, 3600);
});

test('isLowResCover warns when either dimension is under 1000px', () => {
  assert.equal(isLowResCover(640, 640), true);
  assert.equal(isLowResCover(999, 1200), true);
  assert.equal(isLowResCover(1000, 1000), false);
  assert.equal(isLowResCover(3000, 3000), false);
  assert.equal(isLowResCover(0, 0), false);
});

test('buildExportFilename formats clean PNG and PDF filenames', () => {
  assert.equal(
    buildExportFilename(
      { title: 'Lily of the Valley', artist: 'DANIEL', templateId: 'glass-player' },
      'a4',
      'png',
    ),
    'melodra-lily-of-the-valley-daniel-glass-player-a4.png',
  );
  assert.equal(
    buildExportFilename(
      { title: 'Never Gonna Give You Up', artist: 'Rick Astley', templateId: 'receipt' },
      '12x18',
      'pdf',
    ),
    'melodra-never-gonna-give-you-up-rick-astley-receipt-12x18.pdf',
  );
});
