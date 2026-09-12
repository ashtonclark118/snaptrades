import type { JobState, Screen, Tradie } from '../types';

const KEY = 'snaptrades:lastJob';

export interface PersistedJob {
  screen: Screen;
  job: JobState;
  farNote?: string;
  savedAt: string;
}

export function saveLastJob(data: PersistedJob): void {
  try {
    // Strip large data URLs for storage — keep filenames only for photos
    const slim: PersistedJob = {
      ...data,
      job: {
        ...data.job,
        photos: data.job.photos.map((p) => ({
          ...p,
          dataUrl: p.dataUrl.length > 200_000 ? '' : p.dataUrl,
        })),
      },
    };
    localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    // quota / private mode — ignore
  }
}

export function loadLastJob(): PersistedJob | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedJob;
  } catch {
    return null;
  }
}

export function clearLastJob(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const JOIN_KEY = 'snaptrades:joinedTradies';

export function loadJoinedTradies(): Tradie[] {
  try {
    const raw = localStorage.getItem(JOIN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tradie[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJoinedTradie(tradie: Tradie): Tradie[] {
  const next = [...loadJoinedTradies().filter((t) => t.id !== tradie.id), tradie];
  try {
    localStorage.setItem(JOIN_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
