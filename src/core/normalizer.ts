import type { NormalizationLevel } from '../types.js';
import { decodeLeet } from '../leet-map.js';
import { normalizeHomoglyphs } from '../homoglyphs.js';

/** Zero-width Unicode characters that can be used to evade filters */
const ZERO_WIDTH_RE =
  /[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064]/g;

/** Repeated character collapsing: "fuuuuck" → "fuck" */
const REPEATED_CHARS_RE = /(.)\1{2,}/g;

/**
 * Normalize text for profanity matching.
 *
 * Pipeline: input → lowercase → strip accents → leet decode → homoglyphs → zero-width strip
 */
export function normalize(input: string, level: NormalizationLevel = 'moderate'): string {
  if (level === 'none') return input;

  // Always lowercase
  let result = input.toLowerCase();

  // Strip accents (basic+)
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (level === 'basic') return result;

  // Leet speak decoding (moderate+)
  const leetLevel = level === 'aggressive' ? 'aggressive' : 'moderate';
  result = decodeLeet(result, leetLevel);

  if (level === 'moderate') return result;

  // Homoglyph normalization (aggressive)
  result = normalizeHomoglyphs(result);

  // Strip zero-width characters (aggressive)
  result = result.replace(ZERO_WIDTH_RE, '');

  // Collapse repeated chars (aggressive): "fuuuck" → "fuck"
  result = result.replace(REPEATED_CHARS_RE, '$1$1');

  return result;
}
