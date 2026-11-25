import { Check, Music2, Search, Upload, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { SAMPLE_TRACKS } from '../data/tracks';
import type { Track } from '../types/poster';
import { formatDurationMs, parseDurationInput } from '../utils/format';

interface SongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track;
  mode?: 'replace' | 'append';
  onSelectTrack: (track: Track) => void;
}

export function SongPickerModal({
  isOpen,
  onClose,
  currentTrack,
  mode = 'replace',
  onSelectTrack,
}: SongPickerModalProps) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  const [query, setQuery] = useState('');

  // Custom song form state
  const [title, setTitle] = useState(currentTrack.title);
  const [artist, setArtist] = useState(currentTrack.artist);
  const [album, setAlbum] = useState(currentTrack.album);
  const [durationInput, setDurationInput] = useState(formatDurationMs(currentTrack.durationMs));
  const [coverUrl, setCoverUrl] = useState(currentTrack.coverUrl);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTrack.title);
      setArtist(currentTrack.artist);
      setAlbum(currentTrack.album);
      setDurationInput(formatDurationMs(currentTrack.durationMs));
      setCoverUrl(currentTrack.coverUrl);
      setFormError(null);
    }
  }, [isOpen, currentTrack]);

  if (!isOpen) {
    return null;
  }

  const filteredTracks = SAMPLE_TRACKS.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    );
  });

  const handleCoverUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCoverUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanArtist = artist.trim();
    if (!cleanTitle) {
      setFormError('Please enter a song title.');
      return;
    }
    if (!cleanArtist) {
      setFormError('Please enter an artist name.');
      return;
    }
    const parsedMs = parseDurationInput(durationInput);
    if (!parsedMs) {
      setFormError('Enter duration in mm:ss format (for example, 3:28).');
      return;
    }

    setFormError(null);
    onSelectTrack({
      title: cleanTitle,
      artist: cleanArtist,
      album: album.trim(),
      coverUrl: coverUrl || SAMPLE_TRACKS[0].coverUrl,
      durationMs: parsedMs,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-picker-title"
        className="w-full max-w-lg rounded-2xl bg-[#151517] border border-white/[0.1] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <h2 id="song-picker-title" className="text-sm font-semibold text-[#F5F5F5]">
              {mode === 'append' ? 'Add Song to Playlist' : 'Choose Song'}
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {mode === 'append'
                ? 'Pick a curated track or create a custom song entry to append.'
                : 'Pick a curated track or customize your own metadata and artwork.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close song picker"
            className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#F5F5F5] hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0B0B0C] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setTab('library')}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                tab === 'library'
                  ? 'bg-white/[0.12] text-[#F5F5F5]'
                  : 'text-[#8E8E93] hover:text-[#F5F5F5]'
              }`}
            >
              Curated Tracks
            </button>
            <button
              type="button"
              onClick={() => setTab('custom')}
              className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                tab === 'custom'
                  ? 'bg-white/[0.12] text-[#F5F5F5]'
                  : 'text-[#8E8E93] hover:text-[#F5F5F5]'
              }`}
            >
              Custom Song
            </button>
          </div>
        </div>

        {tab === 'library' ? (
          <div className="p-5 space-y-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title, artist, or album…"
                aria-label="Filter curated tracks"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-sm text-[#F5F5F5] placeholder:text-[#8E8E93] focus:outline-none focus:border-[#1DB954]"
              />
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto studio-scrollbar">
              {filteredTracks.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8E8E93]">
                  <Music2 className="w-6 h-6 mx-auto mb-2 opacity-40" aria-hidden="true" />
                  No tracks match “{query}”. Try Custom Song to create one.
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isCurrent =
                    track.title === currentTrack.title && track.artist === currentTrack.artist;
                  return (
                    <button
                      key={`${track.title}-${track.artist}`}
                      type="button"
                      onClick={() => {
                        onSelectTrack(track);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isCurrent
                          ? 'border-[#1DB954]/60 bg-[#1DB954]/10'
                          : 'border-transparent hover:bg-white/[0.05]'
                      }`}
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-lg object-cover shrink-0 bg-[#0B0B0C]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#F5F5F5] truncate">
                          {track.title}
                        </div>
                        <div className="text-xs text-[#8E8E93] truncate">
                          {track.artist} · {track.album}
                        </div>
                      </div>
                      <span className="text-xs text-[#8E8E93] tabular-nums shrink-0">
                        {formatDurationMs(track.durationMs)}
                      </span>
                      {isCurrent && (
                        <Check className="w-4 h-4 text-[#1DB954] shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label htmlFor="custom-title" className="block text-xs font-medium text-[#F5F5F5] mb-1.5">
                  Song Title
                </label>
                <input
                  id="custom-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label htmlFor="custom-artist" className="block text-xs font-medium text-[#F5F5F5] mb-1.5">
                  Artist
                </label>
                <input
                  id="custom-artist"
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label htmlFor="custom-album" className="block text-xs font-medium text-[#F5F5F5] mb-1.5">
                  Album
                </label>
                <input
                  id="custom-album"
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <label htmlFor="custom-duration" className="block text-xs font-medium text-[#F5F5F5] mb-1.5">
                  Duration (mm:ss)
                </label>
                <input
                  id="custom-duration"
                  type="text"
                  placeholder="03:28"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] text-sm text-[#F5F5F5] tabular-nums focus:outline-none focus:border-[#1DB954]"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#F5F5F5] mb-1.5">Cover Art</span>
                <label className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/[0.08] hover:border-white/[0.2] text-xs font-medium text-[#F5F5F5] cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#8E8E93]" aria-hidden="true" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-xs text-rose-400">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#8E8E93] hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-[#07110B] text-xs font-semibold transition-colors cursor-pointer"
              >
                {mode === 'append' ? 'Add to Playlist' : 'Apply Track'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
