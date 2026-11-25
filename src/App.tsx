import { useCallback, useEffect, useRef, useState } from 'react';
import { getTemplateById } from '../templates';
import { AboutView } from './components/AboutView';
import { CustomizePanel, type CustomizeTab } from './components/CustomizePanel';
import { ExportModal } from './components/ExportModal';
import { LibraryView } from './components/LibraryView';
import { MockupStudioModal } from './components/MockupStudioModal';
import { PosterStage } from './components/PosterStage';
import { SongPickerModal } from './components/SongPickerModal';
import { TemplatesGallery } from './components/TemplatesGallery';
import { TopBar, type NavSection } from './components/TopBar';
import {
  DEFAULT_PLAYLIST_META,
  DEFAULT_PLAYLIST_TRACKS,
  DEFAULT_TRACK,
  MAX_PLAYLIST_TRACKS,
  MIN_PLAYLIST_TRACKS,
} from './data/tracks';
import type {
  PlaylistMeta,
  PosterDraft,
  SavedPoster,
  Tokens,
  Track,
} from './types/poster';
import { extractCoverAutoTheme, type AutoThemeResult } from './utils/colorTheme';
import { capturePosterThumbnail, exportPoster } from './utils/exportPoster';
import {
  getExportPreset,
  type ExportFormat,
  type ExportPresetId,
} from './utils/exportPresets';
import { clampTimestamp } from './utils/format';
import {
  defaultPosterName,
  isQuotaExceededError,
  posterStorage,
} from './utils/posterStorage';
import { loadTransparentSpotifyCode } from './utils/scannableCode';
import {
  applyAutoThemeToState,
  applyTokenChange,
  clampAllTemplatesTimestamp,
  createInitialHistoryState,
  getActiveTokens,
  hydrateTokenHistory,
  openSavedPosterInHistory,
  redoTokenHistory,
  switchActiveTemplate,
  undoTokenHistory,
  type TokenHistoryState,
} from './utils/tokenHistory';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastState {
  message: string;
  tone: 'info' | 'error';
  action?: ToastAction;
}

const DRAFT_AUTOSAVE_DELAY_MS = 1500;

function resolveInitialTracks(draft: PosterDraft | null): Track[] {
  if (draft?.tracks && draft.tracks.length >= MIN_PLAYLIST_TRACKS) {
    return draft.tracks.slice(0, MAX_PLAYLIST_TRACKS);
  }
  if (draft?.track) {
    const rest = DEFAULT_PLAYLIST_TRACKS.slice(1).filter(
      (item) => !(item.title === draft.track.title && item.artist === draft.track.artist),
    );
    return [draft.track, ...rest].slice(0, DEFAULT_PLAYLIST_TRACKS.length);
  }
  return DEFAULT_PLAYLIST_TRACKS;
}

function sectionFromPathname(pathname: string): NavSection {
  if (pathname === '/templates' || pathname.startsWith('/templates/')) {
    return 'templates';
  }
  if (pathname === '/library' || pathname.startsWith('/library/')) {
    return 'library';
  }
  if (pathname === '/about' || pathname.startsWith('/about/')) {
    return 'about';
  }
  return 'editor';
}

function pathForSection(section: NavSection): string {
  if (section === 'templates') return '/templates';
  if (section === 'library') return '/library';
  if (section === 'about') return '/about';
  return '/';
}

export default function App() {
  const initialDraftRef = useRef<PosterDraft | null | undefined>(undefined);
  if (initialDraftRef.current === undefined) {
    initialDraftRef.current = posterStorage.loadDraftSync?.() ?? null;
  }

  const [activeSection, setActiveSection] = useState<NavSection>(() =>
    sectionFromPathname(window.location.pathname),
  );
  const [tracks, setTracks] = useState<Track[]>(() =>
    resolveInitialTracks(initialDraftRef.current ?? null),
  );
  const [playlistMeta, setPlaylistMeta] = useState<PlaylistMeta>(
    () => initialDraftRef.current?.meta ?? DEFAULT_PLAYLIST_META,
  );
  const track = tracks[0] ?? DEFAULT_TRACK;

  const [history, setHistory] = useState<TokenHistoryState>(() => {
    const draft = initialDraftRef.current;
    if (draft) {
      return hydrateTokenHistory(
        draft.templateId,
        draft.tokensByTemplate,
        draft.track.durationMs,
      );
    }
    return createInitialHistoryState();
  });
  const [savedPosters, setSavedPosters] = useState<SavedPoster[]>(
    () => posterStorage.listPostersSync?.() ?? [],
  );
  const [activeSavedPosterId, setActiveSavedPosterId] = useState<string | null>(
    () => initialDraftRef.current?.activePosterId ?? null,
  );
  const [customizeOpen, setCustomizeOpen] = useState(false); // Closed by default
  const [customizeTab, setCustomizeTab] = useState<CustomizeTab>('style');
  const [mockupOpen, setMockupOpen] = useState(false);
  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [songPickerMode, setSongPickerMode] = useState<'replace' | 'append'>('replace');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgressLabel, setExportProgressLabel] = useState('Preparing…');
  const [exportProgressPercent, setExportProgressPercent] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Scannable code state: user upload overrides spotify scannable; load error falls back to upload drop zone
  const [customCodeUrl, setCustomCodeUrl] = useState<string | null>(
    () => initialDraftRef.current?.customCodeUrl ?? null,
  );
  const [spotifyCodeDataUrl, setSpotifyCodeDataUrl] = useState<string | null>(null);
  const [spotifyCodeFailed, setSpotifyCodeFailed] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const extractedThemeRef = useRef<AutoThemeResult | null>(null);
  const hasMountedDraftRef = useRef(false);
  const draftQuotaWarnedRef = useRef(false);
  const pendingDraftRef = useRef<PosterDraft | null>(null);
  const pendingSaveAfterNavRef = useRef(false);

  const activeTemplate = getTemplateById(history.present.activeTemplateId);
  const tokens = getActiveTokens(history.present);
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const activeSavedEntry = activeSavedPosterId
    ? savedPosters.find((p) => p.id === activeSavedPosterId) ?? null
    : null;

  const navigateTo = useCallback((section: NavSection) => {
    setActiveSection(section);
    const targetPath = pathForSection(section);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActiveSection(sectionFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const notify = useCallback(
    (message: string, tone: 'info' | 'error' = 'info', action?: ToastAction) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToast({ message, tone, action });
      const durationMs = action ? 6500 : 4000;
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, durationMs);
    },
    [],
  );

  // Async fallback hydration if storage adapter has no sync bootstrap
  useEffect(() => {
    if (!posterStorage.listPostersSync) {
      posterStorage.listPosters().then(setSavedPosters).catch(() => {});
    }
    if (!posterStorage.loadDraftSync) {
      posterStorage
        .loadDraft()
        .then((draft) => {
          if (!draft) return;
          setTracks(resolveInitialTracks(draft));
          if (draft.meta) {
            setPlaylistMeta(draft.meta);
          }
          setCustomCodeUrl(draft.customCodeUrl ?? null);
          setActiveSavedPosterId(draft.activePosterId ?? null);
          setHistory(
            hydrateTokenHistory(
              draft.templateId,
              draft.tokensByTemplate,
              draft.track.durationMs,
            ),
          );
        })
        .catch(() => {});
    }
  }, []);

  // Debounced Draft autosave every 1.5s after edits, plus flush on pagehide/beforeunload
  useEffect(() => {
    const snapshot: PosterDraft = {
      track,
      tracks,
      meta: playlistMeta,
      templateId: history.present.activeTemplateId,
      tokensByTemplate: history.present.tokensByTemplate,
      customCodeUrl,
      activePosterId: activeSavedPosterId,
      updatedAt: Date.now(),
    };

    if (!hasMountedDraftRef.current) {
      hasMountedDraftRef.current = true;
      return;
    }

    pendingDraftRef.current = snapshot;
    const timer = window.setTimeout(() => {
      const toWrite = pendingDraftRef.current;
      pendingDraftRef.current = null;
      if (!toWrite) return;
      posterStorage
        .saveDraft(toWrite)
        .then(() => {
          draftQuotaWarnedRef.current = false;
        })
        .catch((err) => {
          if (isQuotaExceededError(err) && !draftQuotaWarnedRef.current) {
            draftQuotaWarnedRef.current = true;
            notify(
              'Browser storage is full. Delete unused posters in My Posters to enable autosave.',
              'error',
            );
          }
        });
    }, DRAFT_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [track, tracks, playlistMeta, history.present, customCodeUrl, activeSavedPosterId, notify]);

  useEffect(() => {
    const flushPendingDraft = () => {
      const toWrite = pendingDraftRef.current;
      if (!toWrite) return;
      pendingDraftRef.current = null;
      posterStorage.saveDraft(toWrite).catch(() => {});
    };
    window.addEventListener('pagehide', flushPendingDraft);
    window.addEventListener('beforeunload', flushPendingDraft);
    return () => {
      window.removeEventListener('pagehide', flushPendingDraft);
      window.removeEventListener('beforeunload', flushPendingDraft);
    };
  }, []);

  // Load Spotify scannable code with transparent background when spotifyId exists
  useEffect(() => {
    const id = track.spotifyId;
    if (!id) {
      setSpotifyCodeDataUrl(null);
      setSpotifyCodeFailed(false);
      return;
    }
    let cancelled = false;
    setSpotifyCodeFailed(false);
    setSpotifyCodeDataUrl(null);
    loadTransparentSpotifyCode(id)
      .then((dataUrl) => {
        if (!cancelled) {
          setSpotifyCodeDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSpotifyCodeDataUrl(null);
          setSpotifyCodeFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [track.spotifyId]);

  // Auto-theme extraction from coverUrl across templates with autoTheme enabled
  useEffect(() => {
    let cancelled = false;
    extractCoverAutoTheme(track.coverUrl).then((extracted) => {
      if (cancelled || !extracted) return;
      extractedThemeRef.current = extracted;
      setHistory((prev) => applyAutoThemeToState(prev, extracted));
    });
    return () => {
      cancelled = true;
    };
  }, [track.coverUrl]);

  const openExportModal = useCallback(() => {
    if (activeSection !== 'editor') {
      navigateTo('editor');
    }
    setExportError(null);
    setExportProgressLabel('Preparing…');
    setExportProgressPercent(0);
    setExportModalOpen(true);
  }, [activeSection, navigateTo]);

  const executeSavePoster = useCallback(async () => {
    if (!exportRef.current) return;
    setIsSaving(true);
    try {
      let thumbnail = '';
      try {
        thumbnail = await capturePosterThumbnail(exportRef.current);
      } catch {
        thumbnail = '';
      }

      const existing = activeSavedPosterId
        ? savedPosters.find((item) => item.id === activeSavedPosterId)
        : undefined;

      const defaultName = activeTemplate.multiTrack
        ? playlistMeta.title.trim() || 'Untitled Playlist'
        : defaultPosterName(track);

      const result = await posterStorage.savePoster({
        id: existing ? existing.id : null,
        name: existing ? existing.name : defaultName,
        track,
        tracks,
        meta: playlistMeta,
        templateId: activeTemplate.id,
        tokens,
        codeImageDataUrl: customCodeUrl ?? undefined,
        thumbnail,
      });

      const updatedList = await posterStorage.listPosters();
      setSavedPosters(updatedList);
      setActiveSavedPosterId(result.poster.id);
      draftQuotaWarnedRef.current = false;

      notify(
        result.updatedExisting
          ? `Updated “${result.poster.name}” in My Posters`
          : `Saved “${result.poster.name}” to My Posters`,
      );
    } catch (err) {
      if (isQuotaExceededError(err)) {
        notify(
          'Browser storage is full. Delete unused posters in My Posters to free space.',
          'error',
        );
      } else {
        notify('Could not save poster to My Posters.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    activeSavedPosterId,
    savedPosters,
    activeTemplate.id,
    activeTemplate.multiTrack,
    playlistMeta,
    track,
    tracks,
    tokens,
    customCodeUrl,
    notify,
  ]);

  const handleSavePoster = useCallback(() => {
    if (isSaving) return;
    if (activeSection !== 'editor' || !exportRef.current) {
      pendingSaveAfterNavRef.current = true;
      navigateTo('editor');
      return;
    }
    void executeSavePoster();
  }, [activeSection, executeSavePoster, isSaving, navigateTo]);

  useEffect(() => {
    if (activeSection === 'editor' && pendingSaveAfterNavRef.current) {
      pendingSaveAfterNavRef.current = false;
      const frame = window.requestAnimationFrame(() => {
        void executeSavePoster();
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [activeSection, executeSavePoster]);

  // Global keyboard shortcuts: / focuses search, Ctrl+S opens export, Ctrl+Z / Ctrl+Shift+Z undo/redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextField =
        Boolean(target) &&
        ((target!.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'range') ||
          target!.tagName === 'TEXTAREA' ||
          target!.isContentEditable);

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Ctrl+S / Cmd+S opens Export modal anywhere
      if (mod && key === 's') {
        e.preventDefault();
        openExportModal();
        return;
      }

      // "/" focuses search bar when not already typing inside an input
      if (e.key === '/' && !mod && !e.altKey && !isTextField) {
        e.preventDefault();
        if (activeSection !== 'editor') {
          navigateTo('editor');
          window.requestAnimationFrame(() => {
            searchInputRef.current?.focus();
          });
        } else {
          searchInputRef.current?.focus();
        }
        return;
      }

      if (isTextField || !mod) return;

      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        setHistory((prev) => undoTokenHistory(prev));
      } else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) {
        e.preventDefault();
        setHistory((prev) => redoTokenHistory(prev));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection, navigateTo, openExportModal]);

  const effectiveCodeUrl = customCodeUrl
    ? customCodeUrl
    : track.spotifyId && !spotifyCodeFailed && spotifyCodeDataUrl
      ? spotifyCodeDataUrl
      : undefined;

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      const nextTpl = getTemplateById(templateId);
      if (!nextTpl.multiTrack && customizeTab === 'tracks') {
        setCustomizeTab('style');
      }
      setHistory((prev) => switchActiveTemplate(prev, templateId, track.durationMs));
    },
    [customizeTab, track.durationMs],
  );

  const handleAppendTrack = useCallback(
    (nextTrack: Track) => {
      let added = false;
      setTracks((prev) => {
        if (prev.length >= MAX_PLAYLIST_TRACKS) {
          return prev;
        }
        added = true;
        return [...prev, nextTrack];
      });
      if (!added) {
        notify(`Playlist is full (${MAX_PLAYLIST_TRACKS} tracks max). Remove one first.`, 'error');
        return;
      }
      notify(`Added “${nextTrack.title}” to playlist`);
    },
    [notify],
  );

  const handleReplaceSingleTrack = useCallback(
    (nextTrack: Track, source?: 'search' | 'spotify') => {
      setTracks((prev) => [nextTrack, ...prev.slice(1)]);
      setCustomCodeUrl(null);
      setSpotifyCodeFailed(false);
      setActiveSavedPosterId(null);
      setHistory((prev) => clampAllTemplatesTimestamp(prev, nextTrack.durationMs));
      if (source === 'spotify') {
        notify(`Loaded “${nextTrack.title}” from Spotify`);
      }
    },
    [notify],
  );

  const handleSelectTrackFromSearch = useCallback(
    (nextTrack: Track, source?: 'search' | 'spotify') => {
      if (activeTemplate.multiTrack) {
        handleAppendTrack(nextTrack);
      } else {
        handleReplaceSingleTrack(nextTrack, source);
      }
    },
    [activeTemplate.multiTrack, handleAppendTrack, handleReplaceSingleTrack],
  );

  const handleReorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    setTracks((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleRemoveTrack = useCallback(
    (index: number) => {
      let removedTitle = '';
      let blocked = false;
      setTracks((prev) => {
        if (prev.length <= MIN_PLAYLIST_TRACKS) {
          blocked = true;
          return prev;
        }
        removedTitle = prev[index]?.title ?? '';
        return prev.filter((_, i) => i !== index);
      });
      if (blocked) {
        notify(`Playlists require at least ${MIN_PLAYLIST_TRACKS} tracks.`, 'error');
      } else if (removedTitle) {
        notify(`Removed “${removedTitle}”`);
      }
    },
    [notify],
  );

  const handleApplyBulkTracks = useCallback(
    (matchedTracks: Track[], mode: 'replace' | 'append') => {
      if (mode === 'replace') {
        const sliced = matchedTracks.slice(0, MAX_PLAYLIST_TRACKS);
        if (sliced.length < MIN_PLAYLIST_TRACKS) {
          notify(`Need at least ${MIN_PLAYLIST_TRACKS} matched tracks to replace.`, 'error');
          return;
        }
        setTracks(sliced);
        notify(`Loaded ${sliced.length} tracks into playlist`);
        return;
      }

      setTracks((prev) => {
        const available = Math.max(0, MAX_PLAYLIST_TRACKS - prev.length);
        const toAdd = matchedTracks.slice(0, available);
        if (toAdd.length === 0) {
          notify(`Playlist is already at ${MAX_PLAYLIST_TRACKS} tracks.`, 'error');
          return prev;
        }
        notify(`Added ${toAdd.length} ${toAdd.length === 1 ? 'track' : 'tracks'} to playlist`);
        return [...prev, ...toAdd];
      });
    },
    [notify],
  );

  const handleChangePlaylistMeta = useCallback((patch: Partial<PlaylistMeta>) => {
    setPlaylistMeta((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleChangeToken = useCallback(
    <K extends keyof Tokens>(
      key: K,
      value: Tokens[K],
      options?: { coalesceKey?: keyof Tokens },
    ) => {
      setHistory((prev) =>
        applyTokenChange(
          prev,
          prev.present.activeTemplateId,
          (t) => ({ ...t, [key]: value }),
          { coalesceKey: options?.coalesceKey },
        ),
      );
    },
    [],
  );

  const handleToggleAutoTheme = useCallback((enabled: boolean) => {
    setHistory((prev) => {
      const tpl = getTemplateById(prev.present.activeTemplateId);
      return applyTokenChange(prev, tpl.id, (t) => {
        if (!enabled) {
          return {
            ...t,
            autoTheme: false,
            glassTint: undefined,
            accent: tpl.defaults.accent,
          };
        }
        const cached = extractedThemeRef.current;
        return {
          ...t,
          autoTheme: true,
          accent: cached ? cached.accent : t.accent,
          glassTint: cached ? cached.glassTint : t.glassTint,
        };
      });
    });
  }, []);

  const handleSelectManualAccent = useCallback((hex: string) => {
    setHistory((prev) =>
      applyTokenChange(prev, prev.present.activeTemplateId, (t) => ({
        ...t,
        autoTheme: false,
        glassTint: undefined,
        accent: hex,
      })),
    );
  }, []);

  const handleResetTokens = useCallback(() => {
    setHistory((prev) => {
      const tpl = getTemplateById(prev.present.activeTemplateId);
      const cached = extractedThemeRef.current;
      const shouldApplyAuto =
        tpl.defaults.autoTheme !== false &&
        Boolean(cached) &&
        (tpl.controls.includes('accent') || tpl.controls.includes('autoTheme'));
      return applyTokenChange(prev, tpl.id, () => ({
        ...tpl.defaults,
        accent: shouldApplyAuto && cached ? cached.accent : tpl.defaults.accent,
        glassTint: shouldApplyAuto && cached ? cached.glassTint : undefined,
        timestamp: clampTimestamp(tpl.defaults.timestamp, track.durationMs),
      }));
    });
  }, [track.durationMs]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => undoTokenHistory(prev));
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prev) => redoTokenHistory(prev));
  }, []);

  const handleUploadCode = useCallback(
    (dataUrl: string) => {
      setCustomCodeUrl(dataUrl);
      notify('Uploaded custom Spotify code');
    },
    [notify],
  );

  const handleClearCustomCode = useCallback(() => {
    setCustomCodeUrl(null);
    setSpotifyCodeFailed(false);
  }, []);

  const handleOpenSavedPoster = useCallback(
    (poster: SavedPoster) => {
      const restoredTracks =
        poster.tracks && poster.tracks.length >= MIN_PLAYLIST_TRACKS
          ? poster.tracks.slice(0, MAX_PLAYLIST_TRACKS)
          : [
              poster.track,
              ...DEFAULT_PLAYLIST_TRACKS.slice(1).filter(
                (t) => !(t.title === poster.track.title && t.artist === poster.track.artist),
              ),
            ].slice(0, DEFAULT_PLAYLIST_TRACKS.length);

      setTracks(restoredTracks);
      setPlaylistMeta(poster.meta ?? DEFAULT_PLAYLIST_META);
      setCustomCodeUrl(poster.codeImageDataUrl ?? null);
      setSpotifyCodeFailed(false);
      setActiveSavedPosterId(poster.id);
      setHistory((prev) =>
        openSavedPosterInHistory(prev, poster.templateId, poster.tokens, poster.track.durationMs),
      );
      navigateTo('editor');
      notify(`Loaded “${poster.name}”`);
    },
    [navigateTo, notify],
  );

  const handleRenameSavedPoster = useCallback(
    async (id: string, name: string) => {
      try {
        const updated = await posterStorage.renamePoster(id, name);
        if (!updated) return;
        const list = await posterStorage.listPosters();
        setSavedPosters(list);
      } catch (err) {
        notify(
          isQuotaExceededError(err)
            ? 'Browser storage is full. Could not rename poster.'
            : 'Could not rename poster.',
          'error',
        );
      }
    },
    [notify],
  );

  const handleDuplicateSavedPoster = useCallback(
    async (id: string) => {
      try {
        const copy = await posterStorage.duplicatePoster(id);
        if (!copy) return;
        const list = await posterStorage.listPosters();
        setSavedPosters(list);
        notify(`Duplicated “${copy.name}”`);
      } catch (err) {
        notify(
          isQuotaExceededError(err)
            ? 'Browser storage is full. Delete unused posters to make room for duplicates.'
            : 'Could not duplicate poster.',
          'error',
        );
      }
    },
    [notify],
  );

  const handleDeleteSavedPoster = useCallback(
    async (id: string) => {
      try {
        const result = await posterStorage.deletePoster(id);
        if (!result) return;
        const list = await posterStorage.listPosters();
        setSavedPosters(list);
        if (activeSavedPosterId === id) {
          setActiveSavedPosterId(null);
        }

        notify(`Deleted “${result.deleted.name}”`, 'info', {
          label: 'Undo',
          onClick: () => {
            posterStorage
              .restorePoster(result.deleted, result.previousIndex)
              .then(() => posterStorage.listPosters())
              .then((restoredList) => {
                setSavedPosters(restoredList);
                notify(`Restored “${result.deleted.name}”`);
              })
              .catch((err) => {
                notify(
                  isQuotaExceededError(err)
                    ? 'Browser storage is full. Could not restore poster.'
                    : 'Could not restore poster.',
                  'error',
                );
              });
          },
        });
      } catch {
        notify('Could not delete poster.', 'error');
      }
    },
    [activeSavedPosterId, notify],
  );

  const handleConfirmExport = useCallback(
    async (presetId: ExportPresetId, format: ExportFormat) => {
      if (!exportRef.current) {
        navigateTo('editor');
        setExportError('Switch to the Editor view to render the poster before exporting.');
        return;
      }
      setExportError(null);
      setIsExporting(true);
      setExportProgressLabel('Preparing poster…');
      setExportProgressPercent(10);

      try {
        const preset = getExportPreset(presetId);
        const exportTitle = activeTemplate.multiTrack
          ? playlistMeta.title.trim() || 'playlist'
          : track.title;
        const exportArtist = activeTemplate.multiTrack ? `${tracks.length}-tracks` : track.artist;

        await exportPoster(exportRef.current, {
          title: exportTitle,
          artist: exportArtist,
          templateId: activeTemplate.id,
          presetId,
          format,
          onProgress: (label, percent) => {
            setExportProgressLabel(label);
            setExportProgressPercent(percent);
          },
        });
        setExportModalOpen(false);
        notify(
          `Exported ${preset.label} ${format.toUpperCase()} (${preset.outputWidthPx} × ${preset.outputHeightPx} px)`,
        );
      } catch (err) {
        const reason =
          err instanceof Error && err.message ? err.message : 'Export could not complete.';
        setExportError(`Export failed: ${reason}`);
        notify('Export failed. Try a smaller size preset.', 'error');
      } finally {
        setIsExporting(false);
      }
    },
    [
      activeTemplate.id,
      activeTemplate.multiTrack,
      navigateTo,
      notify,
      playlistMeta.title,
      track.artist,
      track.title,
      tracks.length,
    ],
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0B0C] text-[#F5F5F5] overflow-hidden">
      <TopBar
        activeSection={activeSection}
        savedCount={savedPosters.length}
        hasActiveSavedPoster={Boolean(activeSavedEntry)}
        onNavigate={navigateTo}
        onSave={handleSavePoster}
        onDownload={openExportModal}
        isSaving={isSaving}
        isExporting={isExporting}
      />

      {activeSection === 'editor' && (
        <div className="flex-1 min-h-0 flex relative overflow-hidden">
          <PosterStage
            track={track}
            tracks={tracks}
            playlistMeta={playlistMeta}
            template={activeTemplate}
            tokens={tokens}
            tokensByTemplate={history.present.tokensByTemplate}
            codeUrl={effectiveCodeUrl}
            customizeOpen={customizeOpen}
            canUndo={canUndo}
            canRedo={canRedo}
            searchInputRef={searchInputRef}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onToggleCustomize={() => setCustomizeOpen((prev) => !prev)}
            onOpenTracksManager={() => {
              setCustomizeTab('tracks');
              setCustomizeOpen(true);
            }}
            onOpenMockup={() => setMockupOpen(true)}
            onSelectTemplate={handleSelectTemplate}
            onSelectTrack={handleSelectTrackFromSearch}
            onOpenSongPicker={() => {
              setSongPickerMode('replace');
              setSongPickerOpen(true);
            }}
            onChangePlaylistMeta={handleChangePlaylistMeta}
            onUploadCode={handleUploadCode}
            onCodeLoadError={() => setSpotifyCodeFailed(true)}
            onNotify={notify}
            exportRef={exportRef}
          />
          <CustomizePanel
            isOpen={customizeOpen}
            onClose={() => setCustomizeOpen(false)}
            template={activeTemplate}
            tokens={tokens}
            track={track}
            tracks={tracks}
            playlistMeta={playlistMeta}
            activeTab={customizeTab}
            onChangeTab={setCustomizeTab}
            hasCustomCode={Boolean(customCodeUrl)}
            onChangeToken={handleChangeToken}
            onChangePlaylistMeta={handleChangePlaylistMeta}
            onReorderTracks={handleReorderTracks}
            onRemoveTrack={handleRemoveTrack}
            onApplyBulkTracks={handleApplyBulkTracks}
            onOpenAddCustomSong={() => {
              setSongPickerMode('append');
              setSongPickerOpen(true);
            }}
            onNotify={notify}
            onToggleAutoTheme={handleToggleAutoTheme}
            onSelectManualAccent={handleSelectManualAccent}
            onUploadCode={handleUploadCode}
            onClearCustomCode={handleClearCustomCode}
            onReset={handleResetTokens}
          />
        </div>
      )}

      {activeSection === 'templates' && (
        <TemplatesGallery
          track={track}
          tracks={tracks}
          playlistMeta={playlistMeta}
          activeTemplateId={activeTemplate.id}
          tokensByTemplate={history.present.tokensByTemplate}
          codeUrl={effectiveCodeUrl}
          onSelectTemplate={(id) => {
            handleSelectTemplate(id);
            navigateTo('editor');
          }}
        />
      )}

      {activeSection === 'library' && (
        <LibraryView
          posters={savedPosters}
          activePosterId={activeSavedPosterId}
          onOpenPoster={handleOpenSavedPoster}
          onDuplicatePoster={(id) => void handleDuplicateSavedPoster(id)}
          onRenamePoster={(id, name) => void handleRenameSavedPoster(id, name)}
          onDeletePoster={(id) => void handleDeleteSavedPoster(id)}
          onGoToEditor={() => navigateTo('editor')}
        />
      )}

      {activeSection === 'about' && <AboutView onOpenEditor={() => navigateTo('editor')} />}

      <SongPickerModal
        isOpen={songPickerOpen}
        onClose={() => setSongPickerOpen(false)}
        currentTrack={track}
        mode={songPickerMode}
        onSelectTrack={(t) => {
          if (songPickerMode === 'append') {
            handleAppendTrack(t);
          } else {
            handleReplaceSingleTrack(t);
          }
        }}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => {
          if (!isExporting) setExportModalOpen(false);
        }}
        track={track}
        tracks={tracks}
        meta={playlistMeta}
        template={activeTemplate}
        isExporting={isExporting}
        progressLabel={exportProgressLabel}
        progressPercent={exportProgressPercent}
        exportError={exportError}
        onConfirmExport={handleConfirmExport}
        onClearError={() => setExportError(null)}
      />

      <MockupStudioModal
        isOpen={mockupOpen}
        onClose={() => setMockupOpen(false)}
        track={track}
        tracks={tracks}
        meta={playlistMeta}
        template={activeTemplate}
        tokens={tokens}
        codeUrl={effectiveCodeUrl}
        onNotify={notify}
      />

      {toast && (
        <div
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-2xl max-w-md flex items-center gap-3 ${
            toast.tone === 'error'
              ? 'bg-[#1D1416] border-rose-500/40 text-rose-200'
              : 'bg-[#151517] border-white/[0.12] text-[#F5F5F5]'
          }`}
        >
          <span className="text-left">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={toast.action.onClick}
              className="px-2.5 py-1 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] text-[#07110B] text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
