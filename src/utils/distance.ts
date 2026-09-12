import { OUTCODE_CENTROIDS, extractOutcode } from '../data/outcodes';
import type { Tradie, MatchedTradie, Trade } from '../types';
import { TRADESPEOPLE } from '../data/tradespeople';

function haversineMiles(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceMiles(fromPostcode: string, toPostcode: string): number | null {
  const fromOc = extractOutcode(fromPostcode);
  const toOc = extractOutcode(toPostcode);
  if (!fromOc || !toOc) return null;
  const a = OUTCODE_CENTROIDS[fromOc];
  const b = OUTCODE_CENTROIDS[toOc];
  if (!a || !b) return null;
  return Math.round(haversineMiles(a, b) * 10) / 10;
}

export interface MatchResult {
  matches: MatchedTradie[];
  farFromSeed: boolean;
  nearestNote?: string;
}

export function findNearbyTradies(trade: Trade, customerPostcode: string, limit = 12, extras: Tradie[] = []): MatchResult {
  const candidates: { tradie: Tradie; miles: number }[] = [];

  const directory = [...extras, ...TRADESPEOPLE];
  const seen = new Set<string>();

  for (const t of directory) {
    const key = `${t.name}|${t.phone}|${t.email}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (trade !== 'other' && t.trade !== trade && t.trade !== 'handyman') continue;
    if (trade === 'other' && t.trade !== 'handyman' && t.trade !== 'builder') continue;

    const miles = distanceMiles(customerPostcode, t.postcode);
    candidates.push({ tradie: t, miles: miles ?? 999 });
  }

  // Prefer exact trade over handyman fallback when trade is specific
  candidates.sort((a, b) => {
    const aExact = a.tradie.trade === trade ? 0 : 1;
    const bExact = b.tradie.trade === trade ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    if (a.miles !== b.miles) return a.miles - b.miles;
    return b.tradie.rating - a.tradie.rating;
  });

  const realCandidates = candidates.filter((c) => c.tradie.real);
  const useReal = realCandidates.length > 0;
  const source = useReal ? realCandidates : candidates;

  let pool = source.filter((c) => c.miles < 40);
  let farFromSeed = false;
  let nearestNote: string | undefined;

  if (pool.length < 1) {
    pool = source.slice(0, Math.max(limit, 6));
    farFromSeed = true;
    nearestNote = useReal
      ? 'These are live local firms from their own websites. We are still thin on this trade — call before you assume they cover your street.'
      : 'We do not have live listings for this trade yet — showing placeholder names only.';
  } else if (useReal) {
    nearestNote =
      'Live listings from each firm’s own website. Numbers and emails are public, not made up.';
  }

  if (!useReal && pool.length < 3) {
    pool = source.slice(0, Math.max(limit, 6));
    farFromSeed = true;
    nearestNote =
      'We do not have live listings for this trade yet — showing placeholder names only.';
  }

  const matches: MatchedTradie[] = pool.slice(0, limit).map(({ tradie, miles }) => ({
    ...tradie,
    miles,
    selected: Boolean(tradie.email || tradie.phone),
  }));

  return { matches, farFromSeed, nearestNote };
}
