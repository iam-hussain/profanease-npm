import { describe, it, expect } from 'vitest';
import { normalize } from '../core/normalizer.js';

describe('normalize', () => {
  it('returns input unchanged at level "none"', () => {
    expect(normalize('F*CK', 'none')).toBe('F*CK');
  });

  it('lowercases at level "basic"', () => {
    expect(normalize('HELLO', 'basic')).toBe('hello');
  });

  it('strips accents at level "basic"', () => {
    expect(normalize('café résumé', 'basic')).toBe('cafe resume');
  });

  it('decodes l33t speak at level "moderate"', () => {
    expect(normalize('f4ck', 'moderate')).toBe('fack');
    expect(normalize('@$$', 'moderate')).toBe('ass');
    expect(normalize('$h1t', 'moderate')).toBe('shit');
    expect(normalize('4$$h0l3', 'moderate')).toBe('asshole');
  });

  it('normalizes homoglyphs at level "aggressive"', () => {
    // Cyrillic 'а' (U+0430) should map to Latin 'a'
    expect(normalize('\u0430ss', 'aggressive')).toBe('ass');
  });

  it('strips zero-width characters at level "aggressive"', () => {
    expect(normalize('f\u200Buck', 'aggressive')).toBe('fuck');
  });

  it('collapses repeated chars at level "aggressive"', () => {
    expect(normalize('fuuuuck', 'aggressive')).toBe('fuuck');
    expect(normalize('shiiiiit', 'aggressive')).toBe('shiit');
  });

  it('defaults to "moderate" level', () => {
    expect(normalize('$h1t')).toBe('shit');
  });
});
