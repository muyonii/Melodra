import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react';
import { proxifyImageUrl } from '../utils/imageProxy';

interface ScannableCodeSlotProps {
  codeUrl?: string;
  onUploadCode?: (dataUrl: string) => void;
  onCodeLoadError?: () => void;
  variant?: 'dark' | 'light';
  compact?: boolean;
}

function readImageFile(file: File, onDone: (dataUrl: string) => void) {
  if (!file.type.startsWith('image/')) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onDone(reader.result);
    }
  };
  reader.readAsDataURL(file);
}

export function ScannableCodeSlot({
  codeUrl,
  onUploadCode,
  onCodeLoadError,
  variant = 'dark',
  compact = false,
}: ScannableCodeSlotProps) {
  const [imgError, setImgError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [codeUrl]);

  if (codeUrl && !imgError) {
    const isTransparentSpotifyPng =
      codeUrl.startsWith('data:image/png') || codeUrl.includes('scannables.scdn.co');
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: compact ? 'flex-end' : 'center',
          height: compact ? 56 : 86,
        }}
      >
        <img
          src={proxifyImageUrl(codeUrl)}
          alt="Spotify scannable code"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onError={() => {
            setImgError(true);
            onCodeLoadError?.();
          }}
          style={{
            height: compact ? 52 : 82,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
            display: 'block',
            borderRadius: isTransparentSpotifyPng ? 0 : 12,
            filter: variant === 'light' && isTransparentSpotifyPng ? 'brightness(0)' : 'none',
          }}
        />
      </div>
    );
  }

  // Only render the interactive drop zone in the live editor preview (never in exported PNGs or thumbnails)
  if (!onUploadCode) {
    return null;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readImageFile(file, onUploadCode);
    }
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readImageFile(file, onUploadCode);
    }
  };

  const borderColor = isDragging
    ? '#1DB954'
    : variant === 'light'
      ? 'rgba(21, 21, 23, 0.25)'
      : 'rgba(255, 255, 255, 0.24)';
  const bgColor = isDragging
    ? 'rgba(29, 185, 84, 0.14)'
    : variant === 'light'
      ? 'rgba(21, 21, 23, 0.04)'
      : 'rgba(255, 255, 255, 0.04)';
  const textColor = variant === 'light' ? 'rgba(21, 21, 23, 0.78)' : 'rgba(255, 255, 255, 0.82)';

  return (
    <label
      aria-label="Upload your Spotify code"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 12 : 18,
        height: compact ? 58 : 82,
        padding: compact ? '0 22px' : '0 28px',
        borderRadius: compact ? 16 : 22,
        border: `2px dashed ${borderColor}`,
        backgroundColor: bgColor,
        color: textColor,
        cursor: 'pointer',
        transition: 'border-color 150ms ease, background-color 150ms ease',
        boxSizing: 'border-box',
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      />
      <svg
        width={compact ? 24 : 30}
        height={compact ? 24 : 30}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0, opacity: 0.9 }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span
        style={{
          fontSize: compact ? 20 : 25,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
        }}
      >
        Upload your Spotify code
      </span>
    </label>
  );
}
