/** UK postcode validation and normalisation (British English). */

export function normalisePostcode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  const match = cleaned.match(/^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/);
  if (!match) return raw.trim().toUpperCase();
  return `${match[1]} ${match[2]}`;
}

export function validatePostcode(raw: string): {
  ok: boolean;
  message?: string;
  normalised?: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: 'Please enter your postcode so we can find local tradies.',
    };
  }
  const cleaned = trimmed.toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(cleaned)) {
    return {
      ok: false,
      message: 'That doesn’t look like a UK postcode. Try something like RG1 1AA.',
    };
  }
  return { ok: true, normalised: normalisePostcode(trimmed) };
}
