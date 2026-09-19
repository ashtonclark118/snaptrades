import type { Diagnosis, Trade, Urgency, JobPhoto } from '../types';
import {
  analyseCanvasCues,
  classifyPhotoWithClip,
  type CanvasCues,
  type ClipResult,
} from './vision';

const TRADE_KEYWORDS: Record<Trade, string[]> = {
  plumber: [
    'leak', 'leaking', 'pipe', 'tap', 'faucet', 'toilet', 'loo', 'cistern', 'radiator',
    'boiler', 'drain', 'blocked', 'sink', 'bath', 'shower', 'water', 'flood', 'drip',
    'plumbing', 'washer', 'u-bend', 'stopcock', 'hot water', 'cold water', 'wet',
  ],
  electrician: [
    'electric', 'socket', 'fuse', 'trip', 'tripping', 'wiring', 'light', 'bulb',
    'switch', 'power', 'sparks', 'consumer unit', 'fuse box', 'smoke alarm',
    'extractor', 'downlight', 'pendant', 'ev charger', 'sparky',
  ],
  plasterer: [
    'plaster', 'skim', 'crack', 'ceiling crack', 'wall crack', 'damp patch',
    'render', 'artex', 'blown plaster', 'dot and dab',
  ],
  'painter & decorator': [
    'paint', 'painting', 'decorate', 'wallpaper', 'emulsion', 'gloss', 'peeling',
    'stain', 'touch up', 'decorator', 'woodchip',
  ],
  roofer: [
    'roof', 'tile', 'slate', 'gutter', 'guttering', 'leak roof', 'chimney',
    'fascia', 'soffit', 'felt', 'flashing', 'ridge', 'skylight', 'downpipe',
  ],
  carpenter: [
    'door', 'wardrobe', 'shelf', 'shelving', 'skirting', 'architrave', 'stairs',
    'banister', 'decking', 'joist', 'timber', 'cupboard', 'kitchen unit', 'hinge',
    'floorboard', 'carpentry', 'joinery',
  ],
  'gas engineer': [
    'gas', 'boiler service', 'gas safe', 'cooker', 'hob', 'gas leak', 'combi',
    'thermostat', 'heating', 'central heating', 'pilot light',
  ],
  builder: [
    'extension', 'knock through', 'wall removal', 'foundation', 'brick', 'blockwork',
    'structural', 'loft conversion', 'building', 'renovation', 'conservatory',
  ],
  locksmith: [
    'lock', 'key', 'locked out', 'broken key', 'door lock', 'padlock', 'security',
    'cylinder', 'deadbolt', 'locksmith',
  ],
  gardener: [
    'garden', 'lawn', 'hedge', 'fence', 'fencing', 'tree', 'weeds', 'patio',
    'decking garden', 'mow', 'pruning', 'landscap', 'turf',
  ],
  tiler: [
    'tiling', 'grout', 'bathroom tiles', 'kitchen tiles', 'floor tiles',
    'splashback', 'mosaic', 'ceramic tile',
  ],
  handyman: [
    'fix', 'repair', 'odd job', 'assemble', 'ikea', 'mount', 'hang', 'picture',
    'curtain', 'blind', 'general', 'handyman', 'diy fail',
  ],
  other: [],
};

const URGENCY_HIGH = [
  'flood', 'flooding', 'gas leak', 'no power', 'locked out', 'burst', 'emergency',
  'urgent', 'dangerous', 'sparking', 'smoke', 'fire', 'no heating', 'no hot water',
];
const URGENCY_MEDIUM = [
  'leak', 'leaking', 'drip', 'blocked', 'broken', 'not working', 'tripping', 'crack',
];

const TRADE_LABELS: Record<Trade, string> = {
  plumber: 'Plumbing job',
  electrician: 'Electrical job',
  plasterer: 'Plastering job',
  'painter & decorator': 'Painting & decorating',
  roofer: 'Roofing job',
  carpenter: 'Carpentry job',
  'gas engineer': 'Gas / heating job',
  builder: 'Building job',
  locksmith: 'Locksmith job',
  gardener: 'Garden job',
  tiler: 'Tiling job',
  handyman: 'Handyman job',
  other: 'General household job',
};

function scoreText(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      score += kw.includes(' ') ? 3 : 2;
    }
  }
  return score;
}

function guessUrgency(text: string): Urgency {
  const lower = text.toLowerCase();
  if (URGENCY_HIGH.some((k) => lower.includes(k))) return 'high';
  if (URGENCY_MEDIUM.some((k) => lower.includes(k))) return 'medium';
  return 'low';
}

function titleFromNotes(trade: Trade, notes: string): string {
  const lower = notes.toLowerCase();
  const titles: Partial<Record<Trade, [string, string][]>> = {
    plumber: [
      ['leak', 'Suspected water leak'],
      ['toilet', 'Toilet / cistern issue'],
      ['boiler', 'Boiler / heating problem'],
      ['blocked', 'Blocked drain or pipe'],
      ['tap', 'Tap or mixer issue'],
      ['shower', 'Shower problem'],
    ],
    electrician: [
      ['trip', 'Tripping electrics'],
      ['socket', 'Socket / power issue'],
      ['light', 'Lighting fault'],
      ['fuse', 'Fuse board concern'],
    ],
    roofer: [
      ['gutter', 'Guttering problem'],
      ['leak', 'Possible roof leak'],
      ['tile', 'Damaged roof tiles'],
    ],
    locksmith: [
      ['locked out', 'Locked out'],
      ['key', 'Key / lock problem'],
    ],
    'gas engineer': [
      ['boiler', 'Boiler / gas heating'],
      ['gas', 'Gas appliance concern'],
    ],
  };
  const pairs = titles[trade] ?? [];
  for (const [kw, title] of pairs) {
    if (lower.includes(kw)) return title;
  }
  return TRADE_LABELS[trade];
}

function keywordTradeScores(combined: string): Map<Trade, number> {
  const scores = new Map<Trade, number>();
  (Object.keys(TRADE_KEYWORDS) as Trade[]).forEach((trade) => {
    if (trade === 'other') return;
    scores.set(trade, scoreText(combined, TRADE_KEYWORDS[trade]));
  });
  return scores;
}

function buildDescription(opts: {
  trade: Trade;
  title: string;
  notes: string;
  whatNeedsDoing: string;
  fromPhoto: boolean;
  visionDetail?: string;
}): string {
  const parts: string[] = [];
  parts.push(`What needs doing: ${opts.whatNeedsDoing}`);
  if (opts.notes.trim()) {
    parts.push(`Customer notes: “${opts.notes.trim()}”`);
  }
  if (opts.fromPhoto) {
    parts.push(
      opts.visionDetail
        ? `Photo diagnosis: ${opts.visionDetail}`
        : 'A photo of the problem was attached — please review it when quoting.',
    );
  }
  parts.push(
    `Trade requested: ${opts.trade}. Please reply to the customer directly to arrange a visit or quote.`,
  );
  return parts.join('\n\n');
}

export type AnalyseProgress = (msg: string) => void;

/**
 * Diagnose a household job from photo (+ optional notes).
 * Prefers free client-side CLIP vision when the model loads; otherwise
 * uses canvas colour/texture cues + keyword heuristics. Always produces
 * an editable plain-English "what needs doing" summary.
 */
export async function analyseJob(
  photos: JobPhoto[],
  notes: string,
  onProgress?: AnalyseProgress,
): Promise<Diagnosis> {
  const fileText = photos.map((p) => p.fileName).join(' ');
  const combined = `${notes} ${fileText}`;
  const keywordScores = keywordTradeScores(combined);
  const hints: string[] = [];

  let clip: ClipResult | null = null;
  let cues: CanvasCues | null = null;

  if (photos[0]?.dataUrl) {
    onProgress?.('Reading your photo…');
    cues = await analyseCanvasCues(photos[0].dataUrl);
    if (cues?.hintText.length) {
      hints.push(`Photo cues: ${cues.hintText.join('; ')}.`);
    }

    const clipResult = await classifyPhotoWithClip(photos[0].dataUrl, onProgress);
    if (clipResult.ok) {
      clip = clipResult;
      const top = clip.top[0];
      hints.push(
        `Vision model matched “${top.candidate.title}” (~${Math.round(top.score * 100)}% similar).`,
      );
      if (clip.top[1] && clip.top[1].score > 0.12) {
        hints.push(`Also considered: ${clip.top[1].candidate.title}.`);
      }
    } else {
      hints.push(
        'On-device vision model skipped — using photo colour/texture cues and your notes instead.',
      );
    }
  } else {
    hints.push('No photo provided — diagnosis is based on notes only.');
  }

  // Aggregate trade scores: vision >> keywords >> canvas boosts
  const aggregate = new Map<Trade, number>();
  const add = (trade: Trade, pts: number) => {
    aggregate.set(trade, (aggregate.get(trade) ?? 0) + pts);
  };

  keywordScores.forEach((score, trade) => {
    if (score > 0) add(trade, score);
  });

  if (cues) {
    Object.entries(cues.tradeBoosts).forEach(([trade, pts]) => {
      add(trade as Trade, pts);
    });
  }

  if (clip) {
    clip.top.forEach((hit, i) => {
      // Strong weight for top vision hits
      const weight = hit.score * (i === 0 ? 14 : i === 1 ? 7 : 3);
      add(hit.candidate.trade, weight);
    });
  }

  const ranked = [...aggregate.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  let trade: Trade = ranked[0]?.[0] ?? 'handyman';
  let confidence = 0.35;
  const bestScore = ranked[0]?.[1] ?? 0;
  const secondScore = ranked[1]?.[1] ?? 0;

  if (clip && clip.top[0].score >= 0.28) {
    confidence = Math.min(0.92, 0.55 + clip.top[0].score * 0.45);
    trade = clip.top[0].candidate.trade;
    // If notes strongly disagree with a different trade, blend
    const noteBest = [...keywordScores.entries()].sort((a, b) => b[1] - a[1])[0];
    if (noteBest && noteBest[1] >= 6 && noteBest[0] !== trade) {
      trade = noteBest[0];
      confidence = Math.min(confidence, 0.7);
      hints.push(`Notes pointed more strongly to ${noteBest[0]} — using that trade.`);
    }
  } else if (bestScore >= 8) {
    confidence = 0.82;
  } else if (bestScore >= 4) {
    confidence = 0.65;
  } else if (bestScore > 0) {
    confidence = 0.5;
  } else {
    trade = photos.length ? 'handyman' : 'other';
    confidence = 0.3;
    hints.push('No strong match — please check the trade and description.');
  }

  if (secondScore > 0 && bestScore - secondScore < 2 && !clip) {
    confidence = Math.min(confidence, 0.55);
  }

  const fromPhoto = photos.length > 0;
  let title: string;
  let whatNeedsDoing: string;
  let visionDetail: string | undefined;
  let generatedFromPhoto = false;

  if (clip) {
    const top = clip.top[0].candidate;
    title = top.title;
    whatNeedsDoing = top.whatNeedsDoing;
    visionDetail = `looks most like “${top.phrase}”`;
    generatedFromPhoto = true;
  } else if (fromPhoto) {
    title = titleFromNotes(trade, notes) !== TRADE_LABELS[trade]
      ? titleFromNotes(trade, notes)
      : TRADE_LABELS[trade];
    whatNeedsDoing = notes.trim()
      ? `Address the household ${trade} issue shown in the photo. ${notes.trim()}`
      : `Inspect the household problem in the attached photo and quote for ${trade} work.`;
    generatedFromPhoto = true;
    if (!notes.trim()) {
      hints.push('Add notes on the previous step next time for a sharper diagnosis.');
    }
  } else {
    title = titleFromNotes(trade, notes);
    whatNeedsDoing = notes.trim()
      ? notes.trim()
      : `General ${trade} work — details to be confirmed with the customer.`;
  }

  if (fromPhoto && !hints.some((h) => /photo|vision|cues/i.test(h))) {
    hints.unshift('Generated from your photo — edit anything that looks off.');
  } else if (generatedFromPhoto) {
    hints.unshift('Generated from your photo — edit trade or summary before matching.');
  }

  const description = buildDescription({
    trade,
    title,
    notes,
    whatNeedsDoing,
    fromPhoto,
    visionDetail,
  });

  const urgency = guessUrgency(
    `${combined} ${whatNeedsDoing} ${clip?.top[0]?.candidate.phrase ?? ''}`,
  );

  return {
    title,
    trade,
    description,
    confidence,
    urgency,
    hints,
    generatedFromPhoto,
  };
}
