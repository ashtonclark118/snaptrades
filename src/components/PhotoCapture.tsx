import { useRef } from 'react';
import type { JobPhoto } from '../types';

interface Props {
  photos: JobPhoto[];
  onChange: (photos: JobPhoto[]) => void;
}

function readFile(file: File): Promise<JobPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl: String(reader.result),
        fileName: file.name || 'photo.jpg',
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PhotoCapture({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: JobPhoto[] = [...photos];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      next.push(await readFile(file));
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div className="photo-capture">
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((p) => (
            <div className="photo-thumb" key={p.id}>
              {p.dataUrl ? (
                <img src={p.dataUrl} alt={p.fileName} />
              ) : (
                <div className="photo-fallback">{p.fileName}</div>
              )}
              <button
                type="button"
                className="photo-remove"
                aria-label={`Remove ${p.fileName}`}
                onClick={() => remove(p.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="photo-drop">
        <span className="photo-drop-icon" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l.7-1.4A1.5 1.5 0 0 1 9.7 3.5h4.6a1.5 1.5 0 0 1 1.3 1.1L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <circle cx="12" cy="12.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
          </svg>
        </span>
        <span className="photo-drop-title">
          {photos.length ? 'Add another photo' : 'Add a photo of the job'}
        </span>
        <span className="photo-drop-hint">Tap to open your camera or gallery</span>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>
    </div>
  );
}
