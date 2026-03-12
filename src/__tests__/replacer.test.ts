import { describe, it, expect } from 'vitest';
import { replaceWord } from '../core/replacer.js';

describe('replaceWord', () => {
  it('replaces with asterisks by default', () => {
    expect(replaceWord('fuck')).toBe('****');
  });

  it('uses custom placeholder', () => {
    expect(replaceWord('fuck', 'asterisk', '#')).toBe('####');
  });

  it('uses grawlix replacement', () => {
    const result = replaceWord('fuck', 'grawlix');
    expect(result).toHaveLength(4);
    expect(result).not.toBe('fuck');
    // Should contain grawlix characters
    expect(result).toMatch(/[@#$%&!]+/);
  });

  it('uses word replacement', () => {
    expect(replaceWord('fuck', 'word')).toBe('[censored]');
    expect(replaceWord('shit', 'word')).toBe('[censored]');
  });

  it('uses full replacement', () => {
    expect(replaceWord('fuck', 'full', '*')).toBe('****');
  });

  it('uses custom function replacement', () => {
    const custom = (word: string) => `[${word.length}]`;
    expect(replaceWord('fuck', custom)).toBe('[4]');
  });

  it('preserves non-word characters in asterisk mode', () => {
    expect(replaceWord("don't", 'asterisk')).toBe("***'*");
  });
});
