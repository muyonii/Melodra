import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAutoThemeToState,
  applyTokenChange,
  createInitialHistoryState,
  getActiveTokens,
  redoTokenHistory,
  switchActiveTemplate,
  undoTokenHistory,
} from './tokenHistory';

test('token changes persist per template across template switching', () => {
  let state = createInitialHistoryState();
  state = applyTokenChange(state, 'glass-player', (t) => ({ ...t, blur: 80 }));

  state = switchActiveTemplate(state, 'receipt', 208000);
  assert.equal(state.present.activeTemplateId, 'receipt');
  assert.equal(getActiveTokens(state.present).font, 'Space Mono');

  state = applyTokenChange(state, 'receipt', (t) => ({ ...t, showAlbum: false }));

  // Switch back to glass-player and verify blur=80 survived
  state = switchActiveTemplate(state, 'glass-player', 208000);
  assert.equal(getActiveTokens(state.present).blur, 80);

  // Switch back to receipt and verify showAlbum=false survived
  state = switchActiveTemplate(state, 'receipt', 208000);
  assert.equal(getActiveTokens(state.present).showAlbum, false);
});

test('undo and redo restore token changes cleanly', () => {
  let state = createInitialHistoryState();
  const initialBlur = getActiveTokens(state.present).blur;

  state = applyTokenChange(state, 'glass-player', (t) => ({ ...t, blur: 90 }), { nowMs: 1000 });
  state = applyTokenChange(state, 'glass-player', (t) => ({ ...t, font: 'Space Mono' }), {
    nowMs: 1500,
  });

  assert.equal(getActiveTokens(state.present).blur, 90);
  assert.equal(getActiveTokens(state.present).font, 'Space Mono');

  state = undoTokenHistory(state);
  assert.equal(getActiveTokens(state.present).blur, 90);
  assert.notEqual(getActiveTokens(state.present).font, 'Space Mono');

  state = undoTokenHistory(state);
  assert.equal(getActiveTokens(state.present).blur, initialBlur);

  state = redoTokenHistory(state);
  assert.equal(getActiveTokens(state.present).blur, 90);
});

test('rapid changes to same coalesced slider key group into one undo step', () => {
  let state = createInitialHistoryState();
  state = applyTokenChange(state, 'glass-player', (t) => ({ ...t, blur: 60 }), {
    coalesceKey: 'blur',
    nowMs: 1000,
  });
  state = applyTokenChange(state, 'glass-player', (t) => ({ ...t, blur: 70 }), {
    coalesceKey: 'blur',
    nowMs: 1100,
  });

  assert.equal(state.past.length, 1);
  assert.equal(getActiveTokens(state.present).blur, 70);

  state = undoTokenHistory(state);
  assert.equal(getActiveTokens(state.present).blur, 55);
});

test('applyAutoThemeToState updates enabled templates without pushing undo history', () => {
  let state = createInitialHistoryState();
  state = applyAutoThemeToState(state, { accent: '#E11D48', glassTint: '225, 29, 72' });

  assert.equal(state.past.length, 0);
  assert.equal(state.present.tokensByTemplate['glass-player'].accent, '#E11D48');
  assert.equal(state.present.tokensByTemplate['vinyl'].accent, '#E11D48');
  // Receipt has autoTheme: false so it stays untouched
  assert.equal(state.present.tokensByTemplate['receipt'].accent, '#18181A');
});
