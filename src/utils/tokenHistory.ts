import { getTemplateById, templates } from '../../templates';
import type { Tokens } from '../types/poster';
import { clampTimestamp } from './format';

export type TokensByTemplate = Record<string, Tokens>;

export interface EditorTokenState {
  activeTemplateId: string;
  tokensByTemplate: TokensByTemplate;
}

export interface TokenHistoryState {
  past: EditorTokenState[];
  present: EditorTokenState;
  future: EditorTokenState[];
  lastEditMeta?: {
    templateId: string;
    key: keyof Tokens;
    timestampMs: number;
  };
}

const MAX_HISTORY = 60;
const COALESCE_WINDOW_MS = 250;

export function createInitialTokensByTemplate(): TokensByTemplate {
  const map: TokensByTemplate = {};
  for (const tpl of templates) {
    map[tpl.id] = { ...tpl.defaults };
  }
  return map;
}

export function createInitialHistoryState(): TokenHistoryState {
  return {
    past: [],
    present: {
      activeTemplateId: templates[0].id,
      tokensByTemplate: createInitialTokensByTemplate(),
    },
    future: [],
  };
}

export function getActiveTokens(state: EditorTokenState): Tokens {
  const tpl = getTemplateById(state.activeTemplateId);
  return state.tokensByTemplate[tpl.id] ?? { ...tpl.defaults };
}

export function applyTokenChange(
  history: TokenHistoryState,
  templateId: string,
  updater: (prev: Tokens) => Tokens,
  options?: { coalesceKey?: keyof Tokens; nowMs?: number },
): TokenHistoryState {
  const tpl = getTemplateById(templateId);
  const currentTokens = history.present.tokensByTemplate[tpl.id] ?? { ...tpl.defaults };
  const nextTokens = updater(currentTokens);

  const nextPresent: EditorTokenState = {
    ...history.present,
    tokensByTemplate: {
      ...history.present.tokensByTemplate,
      [tpl.id]: nextTokens,
    },
  };

  const nowMs = options?.nowMs ?? Date.now();
  const canCoalesce =
    Boolean(options?.coalesceKey) &&
    history.past.length > 0 &&
    history.lastEditMeta?.templateId === tpl.id &&
    history.lastEditMeta?.key === options?.coalesceKey &&
    nowMs - history.lastEditMeta.timestampMs <= COALESCE_WINDOW_MS;

  if (canCoalesce) {
    return {
      past: history.past,
      present: nextPresent,
      future: [],
      lastEditMeta: {
        templateId: tpl.id,
        key: options!.coalesceKey!,
        timestampMs: nowMs,
      },
    };
  }

  const nextPast = [...history.past, history.present].slice(-MAX_HISTORY);
  return {
    past: nextPast,
    present: nextPresent,
    future: [],
    lastEditMeta: options?.coalesceKey
      ? { templateId: tpl.id, key: options.coalesceKey, timestampMs: nowMs }
      : undefined,
  };
}

export function switchActiveTemplate(
  history: TokenHistoryState,
  nextTemplateId: string,
  durationMs: number,
): TokenHistoryState {
  const tpl = getTemplateById(nextTemplateId);
  if (history.present.activeTemplateId === tpl.id) {
    return history;
  }
  const existing = history.present.tokensByTemplate[tpl.id] ?? { ...tpl.defaults };
  const clamped: Tokens = {
    ...existing,
    timestamp: clampTimestamp(existing.timestamp, durationMs),
  };

  return {
    ...history,
    present: {
      activeTemplateId: tpl.id,
      tokensByTemplate: {
        ...history.present.tokensByTemplate,
        [tpl.id]: clamped,
      },
    },
    lastEditMeta: undefined,
  };
}

export function undoTokenHistory(history: TokenHistoryState): TokenHistoryState {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, -1);
  return {
    past: nextPast,
    present: previous,
    future: [history.present, ...history.future].slice(0, MAX_HISTORY),
    lastEditMeta: undefined,
  };
}

export function redoTokenHistory(history: TokenHistoryState): TokenHistoryState {
  if (history.future.length === 0) {
    return history;
  }
  const next = history.future[0];
  const nextFuture = history.future.slice(1);
  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: next,
    future: nextFuture,
    lastEditMeta: undefined,
  };
}

export function applyAutoThemeToState(
  history: TokenHistoryState,
  extracted: { accent: string; glassTint: string },
): TokenHistoryState {
  const mapEntry = (state: EditorTokenState): EditorTokenState => {
    const nextByTemplate: TokensByTemplate = {};
    for (const [id, tokens] of Object.entries(state.tokensByTemplate)) {
      const tpl = getTemplateById(id);
      const supportsAccent = tpl.controls.includes('accent') || tpl.controls.includes('autoTheme');
      if (supportsAccent && tokens.autoTheme !== false) {
        nextByTemplate[id] = {
          ...tokens,
          accent: extracted.accent,
          glassTint: extracted.glassTint,
        };
      } else {
        nextByTemplate[id] = tokens;
      }
    }
    return {
      ...state,
      tokensByTemplate: nextByTemplate,
    };
  };

  return {
    ...history,
    present: mapEntry(history.present),
  };
}

export function clampAllTemplatesTimestamp(
  history: TokenHistoryState,
  durationMs: number,
): TokenHistoryState {
  const nextByTemplate: TokensByTemplate = {};
  for (const [id, tokens] of Object.entries(history.present.tokensByTemplate)) {
    nextByTemplate[id] = {
      ...tokens,
      timestamp: clampTimestamp(tokens.timestamp, durationMs),
    };
  }
  return {
    ...history,
    present: {
      ...history.present,
      tokensByTemplate: nextByTemplate,
    },
  };
}

export function hydrateTokenHistory(
  templateId: string,
  savedTokensByTemplate: TokensByTemplate | undefined,
  durationMs: number,
): TokenHistoryState {
  const base = createInitialTokensByTemplate();
  const merged: TokensByTemplate = {};
  for (const tpl of templates) {
    const raw = savedTokensByTemplate?.[tpl.id];
    const combined = raw ? { ...base[tpl.id], ...raw } : base[tpl.id];
    merged[tpl.id] = {
      ...combined,
      timestamp: clampTimestamp(combined.timestamp, durationMs),
    };
  }
  const active = getTemplateById(templateId);
  return {
    past: [],
    present: {
      activeTemplateId: active.id,
      tokensByTemplate: merged,
    },
    future: [],
  };
}

export function openSavedPosterInHistory(
  history: TokenHistoryState,
  templateId: string,
  tokens: Tokens,
  durationMs: number,
): TokenHistoryState {
  const tpl = getTemplateById(templateId);
  const mergedTokens: Tokens = {
    ...tpl.defaults,
    ...tokens,
    timestamp: clampTimestamp(tokens.timestamp, durationMs),
  };

  return {
    past: [],
    present: {
      activeTemplateId: tpl.id,
      tokensByTemplate: {
        ...history.present.tokensByTemplate,
        [tpl.id]: mergedTokens,
      },
    },
    future: [],
  };
}


