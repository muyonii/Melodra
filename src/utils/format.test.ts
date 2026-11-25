import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProgressRatio,
  clampTimestamp,
  formatDurationMs,
  formatSeconds,
  generateCodeBarHeights,
  parseDurationInput,
  sanitizeFilename,
} from './format';

test('formatSeconds formats standard, zero, and invalid durations', () => {
  assert.equal(formatSeconds(72), '01:12');
  assert.equal(formatSeconds(208), '03:28');
  assert.equal(formatSeconds(0), '00:00');
  assert.equal(formatSeconds(-5), '00:00');
});

test('formatDurationMs converts milliseconds to mm:ss', () => {
  assert.equal(formatDurationMs(208000), '03:28');
  assert.equal(formatDurationMs(0), '00:00');
});

test('parseDurationInput validates mm:ss strings', () => {
  assert.equal(parseDurationInput('3:28'), 208000);
  assert.equal(parseDurationInput('01:05'), 65000);
  assert.equal(parseDurationInput('00:00'), null);
  assert.equal(parseDurationInput('3:99'), null);
  assert.equal(parseDurationInput('abc'), null);
});

test('clampTimestamp and calculateProgressRatio stay bounded', () => {
  assert.equal(clampTimestamp(72, 208000), 72);
  assert.equal(clampTimestamp(999, 208000), 208);
  assert.equal(clampTimestamp(-10, 208000), 0);

  const ratio = calculateProgressRatio(104, 208000);
  assert.equal(ratio, 0.5);
  assert.equal(calculateProgressRatio(500, 208000), 1);
  assert.equal(calculateProgressRatio(50, 0), 0);
});

test('generateCodeBarHeights is deterministic and within range', () => {
  const a = generateCodeBarHeights('Lily of the Valley', 23);
  const b = generateCodeBarHeights('Lily of the Valley', 23);
  const c = generateCodeBarHeights('Concrete Rain', 23);

  assert.equal(a.length, 23);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.ok(a.every((h) => h >= 0.18 && h <= 1));
});

test('sanitizeFilename produces clean download names', () => {
  assert.equal(
    sanitizeFilename('Lily of the Valley', 'DANIEL', 'glass-player'),
    'melodra-lily-of-the-valley-daniel-glass-player.png',
  );
});
