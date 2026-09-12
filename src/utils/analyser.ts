import type { Diagnosis, Trade, Urgency, JobPhoto } from '../types';

const TRADE_KEYWORDS: Record<Trade, string[]> = {
  plumber: [
    'leak', 'leaking', 'pipe', 'tap', 'faucet', 'toilet', 'loo', 'cistern', 'radiator',
    'boiler', 'drain', 'blocked', 'sink', 'bath', 'shower', 'water', 'flood', 'drip',
    'plumbing', 'washer', 'u-bend', 'stopcock', 'hot water', 'cold water',
  ],
  electrician: [
    'electric', 'socket', 'fuse', 'trip', 'tripping', 'wiring', 'light', 'bulb',
    'switch', 'power', 'sparks', 'consumer unit', 'fuse box', 'smoke alarm',
    'extractor', 'downlight', 'pendant', 'ev charger',
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
    'tile', 'tiling', 'grout', 'bathroom tiles', 'kitchen tiles', 'floor tiles',
    'splashback', 'mosaic',
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

function titleFrom(trade: Trade, notes: string): string {
  const lower = notes.toLowerCase();
  const titles: Partial<Record<Trade, [string, string][]>> = {
    plumber: [
      ['leak', 'Suspected water leak'],
      ['toilet', 'Toilet / loft cistern issue'],
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
  const labels: Record<Trade, string> = {
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
  return labels[trade];
}

function descriptionFor(trade: Trade, notes: string, photoNames: string[]): string {
  const bits: string[] = [];
  bits.push(`Homeowner has requested a ${trade} for a household issue.`);
  if (notes.trim()) {
    bits.push(`Their notes: “${notes.trim()}”`);
  }
  if (photoNames.length) {
    bits.push(`Photos attached (filenames): ${photoNames.join(', ')}.`);
  }
  bits.push('Please reply to the customer directly to arrange a visit or quote.');
  return bits.join(' ');
}

/** Optional light colour/brightness hint from a data URL (canvas). Never invents vision details. */
export async function colourHint(dataUrl: string): Promise<string | null> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('img'));
    });
    const canvas = document.createElement('canvas');
    const size = 32;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    r /= n; g /= n; b /= n;
    const brightness = (r + g + b) / 3;
    const hints: string[] = [];
    if (brightness < 60) hints.push('photo looks quite dark');
    else if (brightness > 200) hints.push('photo looks very bright');
    if (b > r + 20 && b > g + 15) hints.push('cool / bluish tones (possible water or tile)');
    if (r > g + 25 && r > b + 25) hints.push('warm / reddish tones');
    if (g > r + 15 && g > b + 15) hints.push('greenish tones (possible outdoor / garden)');
    return hints.length ? hints.join('; ') : null;
  } catch {
    return null;
  }
}

export async function analyseJob(
  photos: JobPhoto[],
  notes: string,
): Promise<Diagnosis> {
  const fileText = photos.map((p) => p.fileName).join(' ');
  const combined = `${notes} ${fileText}`;

  const scores: { trade: Trade; score: number }[] = [];
  (Object.keys(TRADE_KEYWORDS) as Trade[]).forEach((trade) => {
    if (trade === 'other') return;
    scores.push({ trade, score: scoreText(combined, TRADE_KEYWORDS[trade]) });
  });
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];
  const second = scores[1];
  let trade: Trade = best && best.score > 0 ? best.trade : 'handyman';
  let confidence = 0.35;

  if (best && best.score >= 6) confidence = 0.85;
  else if (best && best.score >= 3) confidence = 0.65;
  else if (best && best.score > 0) confidence = 0.5;
  else {
    trade = 'other';
    confidence = 0.3;
  }

  if (second && best && best.score - second.score < 2 && best.score > 0) {
    confidence = Math.min(confidence, 0.55);
  }

  const hints: string[] = [];
  if (best && best.score > 0) {
    hints.push(`Matched keywords pointing to ${trade}.`);
  } else {
    hints.push('No strong keyword match — please check the trade.');
  }
  if (photos[0]) {
    const hint = await colourHint(photos[0].dataUrl);
    if (hint) hints.push(`Image hint: ${hint}.`);
  }

  const urgency = guessUrgency(combined);
  const title = titleFrom(trade, notes);
  const description = descriptionFor(
    trade,
    notes,
    photos.map((p) => p.fileName),
  );

  return { title, trade, description, confidence, urgency, hints };
}
