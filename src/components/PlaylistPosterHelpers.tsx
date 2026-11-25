import { useEffect, useState, type CSSProperties } from 'react';
import { proxifyImageUrl } from '../utils/imageProxy';

interface CoverArtImageProps {
  src: string;
  alt: string;
  fallbackText?: string;
  placeholderBg: string;
  mutedColor: string;
  style?: CSSProperties;
}

export function CoverArtImage({
  src,
  alt,
  fallbackText,
  placeholderBg,
  mutedColor,
  style,
}: CoverArtImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!failed && src) {
    return (
      <img
        src={proxifyImageUrl(src)}
        alt={alt}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: placeholderBg,
        color: mutedColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 500,
        boxSizing: 'border-box',
      }}
    >
      {fallbackText || 'Art'}
    </div>
  );
}

interface InlineEditableTextProps {
  value: string;
  placeholder: string;
  ariaLabel: string;
  editable: boolean;
  onChange?: (next: string) => void;
  style?: CSSProperties;
}

export function InlineEditableText({
  value,
  placeholder,
  ariaLabel,
  editable,
  onChange,
  style,
}: InlineEditableTextProps) {
  if (!editable || !onChange) {
    return (
      <div
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          ...style,
        }}
      >
        {value || placeholder}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
        color: 'inherit',
        letterSpacing: 'inherit',
        lineHeight: 'inherit',
        textAlign: 'inherit',
        ...style,
      }}
    />
  );
}
