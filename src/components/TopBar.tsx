import { Bookmark, BookmarkCheck, Download, Loader2 } from 'lucide-react';

export type NavSection = 'editor' | 'templates' | 'library' | 'about';

interface TopBarProps {
  activeSection: NavSection;
  savedCount: number;
  hasActiveSavedPoster: boolean;
  onNavigate: (section: NavSection) => void;
  onSave: () => void;
  onDownload: () => void;
  isSaving: boolean;
  isExporting: boolean;
}

const NAV_ITEMS: { id: NavSection; label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'templates', label: 'Templates' },
  { id: 'library', label: 'My Posters' },
  { id: 'about', label: 'About' },
];

export function TopBar({
  activeSection,
  savedCount,
  hasActiveSavedPoster,
  onNavigate,
  onSave,
  onDownload,
  isSaving,
  isExporting,
}: TopBarProps) {
  return (
    <header className="h-14 shrink-0 bg-[#0B0B0C]/95 backdrop-blur-md border-b border-white/[0.08] px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-8 z-30">
      {/* Zone 1: Wordmark */}
      <button
        type="button"
        onClick={() => onNavigate('editor')}
        className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] rounded-lg px-0.5 sm:px-1 py-1 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-[#1DB954] shrink-0 hidden sm:block"
        >
          <rect x="2.5" y="7" width="3" height="10" rx="1.5" fill="currentColor" />
          <rect x="8" y="3.5" width="3" height="17" rx="1.5" fill="#F5F5F5" />
          <rect x="13.5" y="5.5" width="3" height="13" rx="1.5" fill="#F5F5F5" />
          <rect x="19" y="8.5" width="3" height="7" rx="1.5" fill="currentColor" />
        </svg>
        <span className="text-[13px] sm:text-[15px] font-semibold tracking-tight text-[#F5F5F5]">
          Melodra
        </span>
      </button>

      {/* Zone 2: Center Navigation */}
      <nav aria-label="Primary navigation" className="flex items-center gap-1.5 sm:gap-6 min-w-0">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-2 text-[11px] sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] rounded-md px-0.5 sm:px-1 inline-flex items-center gap-1 sm:gap-1.5 ${
                isActive ? 'text-[#F5F5F5]' : 'text-[#8E8E93] hover:text-[#F5F5F5]'
              }`}
            >
              <span>{item.label}</span>
              {item.id === 'library' && (
                <span
                  data-testid="library-count-badge"
                  className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none tabular-nums transition-colors duration-200 ${
                    isActive || savedCount > 0
                      ? 'bg-[#1DB954]/15 text-[#1DB954]'
                      : 'bg-white/[0.07] text-[#8E8E93]'
                  }`}
                >
                  {savedCount}
                </span>
              )}
              <span
                aria-hidden="true"
                className={`absolute left-0.5 right-0.5 sm:left-1 sm:right-1 -bottom-[1px] h-[1.5px] rounded-full transition-opacity duration-200 ${
                  isActive ? 'bg-[#1DB954] opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Save & Download Actions */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          aria-label={
            isSaving
              ? 'Saving poster'
              : hasActiveSavedPoster
                ? 'Save updates to poster'
                : 'Save poster to My Posters'
          }
          title={hasActiveSavedPoster ? 'Update saved poster' : 'Save poster to My Posters'}
          className="inline-flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 rounded-xl bg-[#151517] hover:bg-white/[0.1] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed border border-white/[0.1] hover:border-white/[0.2] text-[#F5F5F5] text-xs font-medium tracking-tight transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954]"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1DB954]" aria-hidden="true" />
          ) : hasActiveSavedPoster ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-[#1DB954]" aria-hidden="true" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-[#8E8E93]" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Saving…' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={onDownload}
          disabled={isExporting}
          aria-label={isExporting ? 'Exporting poster' : 'Download poster'}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-[#07110B] text-xs font-semibold tracking-tight transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0C]"
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'Download'}</span>
        </button>
      </div>
    </header>
  );
}
