import { describe, it, expect } from 'vitest';
import { Matcher } from '../core/matcher.js';

describe('Matcher', () => {
  it('matches exact words', () => {
    const m = new Matcher('basic');
    m.addWord('fuck');
    m.addWord('shit');

    expect(m.matchWord('fuck')).not.toBeNull();
    expect(m.matchWord('FUCK')).not.toBeNull();
    expect(m.matchWord('hello')).toBeNull();
  });

  it('respects exclude list', () => {
    const m = new Matcher('basic');
    m.addWord('hell');
    m.exclude(['hell']);

    expect(m.matchWord('hell')).toBeNull();
  });

  it('supports unexclude', () => {
    const m = new Matcher('basic');
    m.addWord('hell');
    m.exclude(['hell']);
    expect(m.matchWord('hell')).toBeNull();

    m.unexclude(['hell']);
    expect(m.matchWord('hell')).not.toBeNull();
  });

  it('matches wildcard patterns', () => {
    const m = new Matcher('basic');
    m.addWord('*fuck*');

    expect(m.matchWord('motherfucker')).not.toBeNull();
    expect(m.matchWord('unfuckingbelievable')).not.toBeNull();
    expect(m.matchWord('hello')).toBeNull();
  });

  it('matches phrases', () => {
    const m = new Matcher('basic');
    m.addWord('blow job');

    const words = ['get', 'a', 'blow', 'job', 'now'];
    const result = m.matchPhrase(words, 2);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result!.match.matched).toBe('blow job');
  });

  it('returns all loaded words', () => {
    const m = new Matcher('basic');
    m.addWord('fuck');
    m.addWord('shit');
    m.addWord('*damn');
    m.addWord('blow job');

    const words = m.getWords();
    expect(words).toContain('fuck');
    expect(words).toContain('shit');
    expect(words).toContain('*damn');
    expect(words).toContain('blow job');
  });

  it('loads language packs', () => {
    const m = new Matcher('basic');
    m.load([['word1', 'word2', 'word3']]);

    expect(m.matchWord('word1')).not.toBeNull();
    expect(m.matchWord('word2')).not.toBeNull();
    expect(m.matchWord('other')).toBeNull();
  });

  it('filters by categories when loading', () => {
    const m = new Matcher('basic');
    m.load(
      [
        [
          { word: 'badword1', categories: ['profanity' as any] },
          { word: 'badword2', categories: ['slur' as any] },
        ],
      ],
      ['slur' as any],
    );

    // Only slurs should be loaded
    expect(m.matchWord('badword2')).not.toBeNull();
    expect(m.matchWord('badword1')).toBeNull();
  });
});
