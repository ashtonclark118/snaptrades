/**
 * Client-side photo understanding for SnapTrades.
 * Tries CLIP zero-shot (Transformers.js) when available; always has canvas cues fallback.
 * Models load from Hugging Face CDN on first use — no paid API key.
 */
import type { Trade } from '../types';

export interface VisionLabel {
  /** Phrase shown to CLIP */
  phrase: string;
  trade: Trade;
  title: string;
  /** Plain-English job summary fragment */
  whatNeedsDoing: string;
}

/** Candidate scenes CLIP scores against the photo */
export const VISION_CANDIDATES: VisionLabel[] = [
  {
    phrase: 'a leaking pipe or dripping tap with water damage',
    trade: 'plumber',
    title: 'Suspected water leak',
    whatNeedsDoing: 'Inspect and fix a water leak / dripping plumbing issue shown in the photo.',
  },
  {
    phrase: 'a blocked sink drain or bathroom plumbing problem',
    trade: 'plumber',
    title: 'Sink or drain problem',
    whatNeedsDoing: 'Clear or repair a sink, drain or bathroom plumbing fault.',
  },
  {
    phrase: 'a toilet cistern or bathroom toilet that needs repair',
    trade: 'plumber',
    title: 'Toilet / cistern issue',
    whatNeedsDoing: 'Diagnose and repair a toilet or cistern problem.',
  },
  {
    phrase: 'a boiler, radiator or central heating problem',
    trade: 'gas engineer',
    title: 'Boiler / heating problem',
    whatNeedsDoing: 'Check and repair a boiler, radiator or heating issue.',
  },
  {
    phrase: 'an electrical socket switch or fuse board with wiring problem',
    trade: 'electrician',
    title: 'Electrical fault',
    whatNeedsDoing: 'Investigate a socket, switch, lighting or consumer-unit electrical fault.',
  },
  {
    phrase: 'broken or missing light fitting or ceiling light',
    trade: 'electrician',
    title: 'Lighting fault',
    whatNeedsDoing: 'Repair or replace a light fitting / lighting circuit issue.',
  },
  {
    phrase: 'damaged roof tiles gutters or a roof leak',
    trade: 'roofer',
    title: 'Roof or guttering problem',
    whatNeedsDoing: 'Inspect and repair damaged roof tiles, flashing or guttering.',
  },
  {
    phrase: 'cracked plaster wall or damaged ceiling needing skim',
    trade: 'plasterer',
    title: 'Plaster / wall repair',
    whatNeedsDoing: 'Repair cracked or blown plaster and make good the wall or ceiling.',
  },
  {
    phrase: 'peeling paint wallpaper or room that needs decorating',
    trade: 'painter & decorator',
    title: 'Painting & decorating',
    whatNeedsDoing: 'Prep and redecorate the painted or wallpapered surface shown.',
  },
  {
    phrase: 'broken wooden door cupboard shelf or carpentry joinery',
    trade: 'carpenter',
    title: 'Carpentry / joinery job',
    whatNeedsDoing: 'Repair or adjust door, cupboard, shelving or other joinery.',
  },
  {
    phrase: 'broken door lock or locksmith key problem',
    trade: 'locksmith',
    title: 'Lock / key problem',
    whatNeedsDoing: 'Repair or replace a faulty lock or help with a key issue.',
  },
  {
    phrase: 'overgrown garden lawn hedge fence or outdoor landscaping',
    trade: 'gardener',
    title: 'Garden / outdoor job',
    whatNeedsDoing: 'Carry out garden maintenance (lawn, hedge, fence or outdoor tidy-up).',
  },
  {
    phrase: 'bathroom or kitchen wall tiles with broken grout',
    trade: 'tiler',
    title: 'Tiling repair',
    whatNeedsDoing: 'Repair or replace damaged tiles and grout.',
  },
  {
    phrase: 'brickwork extension building work or structural renovation',
    trade: 'builder',
    title: 'Building / renovation job',
    whatNeedsDoing: 'Assess and quote for building or structural repair work.',
  },
  {
    phrase: 'general household repair odd job or DIY problem',
    trade: 'handyman',
    title: 'General handyman job',
    whatNeedsDoing: 'Carry out a general household repair or odd job.',
  },
];

export interface CanvasCues {
  brightness: number;
  coolBias: boolean;
  warmBias: boolean;
  greenBias: boolean;
  highEdgeDensity: boolean;
  hintText: string[];
  tradeBoosts: Partial<Record<Trade, number>>;
}

export interface ClipResult {
  ok: true;
  top: { phrase: string; score: number; candidate: VisionLabel }[];
  usedModel: true;
}

export interface ClipFail {
  ok: false;
  reason: string;
  usedModel: false;
}

type Classifier = (
  image: string,
  labels: string[],
  options?: { top_k?: number },
) => Promise<{ label: string; score: number }[]>;

let classifierPromise: Promise<Classifier | null> | null = null;

async function loadClassifier(
  onProgress?: (msg: string) => void,
): Promise<Classifier | null> {
  if (classifierPromise) return classifierPromise;

  classifierPromise = (async () => {
    try {
      onProgress?.('Loading free on-device vision model (first time only)…');
      const transformers = await import('@huggingface/transformers');
      const { pipeline, env } = transformers;
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const clf = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        {
          // Quantised ONNX keeps download smaller on GitHub Pages clients
          dtype: 'q8',
          progress_callback: (p: { status?: string; progress?: number }) => {
            if (p?.status === 'progress' && typeof p.progress === 'number') {
              onProgress?.(
                `Downloading vision model… ${Math.min(99, Math.round(p.progress))}%`,
              );
            }
          },
        },
      );
      onProgress?.('Looking at your photo…');
      return clf as unknown as Classifier;
    } catch (err) {
      console.warn('[SnapTrades] Vision model unavailable, using photo cues + notes', err);
      return null;
    }
  })();

  return classifierPromise;
}

/** Run CLIP zero-shot against household-problem phrases. Soft-fails after timeout. */
export async function classifyPhotoWithClip(
  dataUrl: string,
  onProgress?: (msg: string) => void,
  timeoutMs = 45000,
): Promise<ClipResult | ClipFail> {
  try {
    const clf = await Promise.race([
      loadClassifier(onProgress),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);

    if (!clf) {
      return { ok: false, reason: 'Vision model timed out or failed to load', usedModel: false };
    }

    onProgress?.('Matching photo to likely trades…');
    const phrases = VISION_CANDIDATES.map((c) => c.phrase);
    const raw = await clf(dataUrl, phrases, { top_k: phrases.length });
    const byPhrase = new Map(VISION_CANDIDATES.map((c) => [c.phrase, c]));

    const top = (Array.isArray(raw) ? raw : [])
      .map((r) => {
        const candidate = byPhrase.get(r.label);
        if (!candidate) return null;
        return { phrase: r.label, score: r.score, candidate };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (!top.length) {
      return { ok: false, reason: 'No vision labels returned', usedModel: false };
    }

    return { ok: true, top, usedModel: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Vision classify failed';
    return { ok: false, reason, usedModel: false };
  }
}

/** Fast canvas colour / texture cues — always available, no model download. */
export async function analyseCanvasCues(dataUrl: string): Promise<CanvasCues | null> {
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img'));
    });

    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    let edge = 0;
    for (let i = 0; i < data.length; i += 4) {
      const rr = data[i];
      const gg = data[i + 1];
      const bb = data[i + 2];
      r += rr;
      g += gg;
      b += bb;
      n++;
      // crude horizontal edge energy
      if ((i / 4) % size < size - 1) {
        const j = i + 4;
        const dr = Math.abs(rr - data[j]);
        const dg = Math.abs(gg - data[j + 1]);
        const db = Math.abs(bb - data[j + 2]);
        edge += (dr + dg + db) / 3;
      }
    }
    r /= n;
    g /= n;
    b /= n;
    const brightness = (r + g + b) / 3;
    const edgeDensity = edge / n;
    const coolBias = b > r + 18 && b > g + 12;
    const warmBias = r > g + 22 && r > b + 22;
    const greenBias = g > r + 14 && g > b + 14;
    const highEdgeDensity = edgeDensity > 28;

    const hintText: string[] = [];
    const tradeBoosts: Partial<Record<Trade, number>> = {};

    if (brightness < 55) {
      hintText.push('photo is quite dark (indoor / poorly lit)');
      tradeBoosts.electrician = (tradeBoosts.electrician ?? 0) + 1;
    } else if (brightness > 200) {
      hintText.push('photo is very bright');
    }
    if (coolBias) {
      hintText.push('cool / bluish tones — often water, tile or bathroom');
      tradeBoosts.plumber = (tradeBoosts.plumber ?? 0) + 2;
      tradeBoosts.tiler = (tradeBoosts.tiler ?? 0) + 1;
    }
    if (warmBias) {
      hintText.push('warm / reddish tones — possible timber, brick or rust');
      tradeBoosts.carpenter = (tradeBoosts.carpenter ?? 0) + 1;
      tradeBoosts.builder = (tradeBoosts.builder ?? 0) + 1;
      tradeBoosts.roofer = (tradeBoosts.roofer ?? 0) + 1;
    }
    if (greenBias) {
      hintText.push('greenish tones — possible outdoor / garden');
      tradeBoosts.gardener = (tradeBoosts.gardener ?? 0) + 3;
    }
    if (highEdgeDensity) {
      hintText.push('busy textured surface (tiles, brick, foliage or clutter)');
    }

    return {
      brightness,
      coolBias,
      warmBias,
      greenBias,
      highEdgeDensity,
      hintText,
      tradeBoosts,
    };
  } catch {
    return null;
  }
}
