import { describe, it, expect } from 'vitest';
import { check, clean, analyze } from '../functional.js';
import en from '../langs/en.js';

describe('Functional API', () => {
  it('check() detects profanity', () => {
    expect(check('this is fucking bad', { languages: [en] })).toBe(true);
    expect(check('this is clean', { languages: [en] })).toBe(false);
  });

  it('clean() censors profanity', () => {
    expect(clean('fuck you', { languages: [en] })).toBe('**** you');
  });

  it('analyze() returns detailed results', () => {
    const result = analyze('fuck', { languages: [en] });
    expect(result.isProfane).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.cleaned).toBe('****');
  });

  it('works with default options (all languages)', () => {
    expect(check('fuck')).toBe(true);
    expect(clean('fuck')).toBe('****');
  });
});
