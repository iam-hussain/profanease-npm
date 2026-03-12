import { describe, it, expect } from 'vitest';
import { Profanease } from '../profanease.js';
import { Category } from '../types.js';
import en from '../langs/en.js';
import es from '../langs/es.js';
import { categorized } from '../langs/en.js';

describe('Profanease class', () => {
  describe('basic usage', () => {
    it('detects profanity with English pack', () => {
      const filter = new Profanease({ languages: [en] });
      expect(filter.check('I am fucking asshole')).toBe(true);
    });

    it('cleans profanity with English pack', () => {
      const filter = new Profanease({ languages: [en] });
      expect(filter.clean('I am fucking asshole')).toBe('I am ******* *******');
    });

    it('does not flag clean text', () => {
      const filter = new Profanease({ languages: [en] });
      expect(filter.check('hello world')).toBe(false);
      expect(filter.clean('hello world')).toBe('hello world');
    });
  });

  describe('legacy v1 compat', () => {
    it('supports lang option', () => {
      const filter = new Profanease({ lang: 'en' });
      expect(filter.check('fuck')).toBe(true);
    });

    it('supports placeHolder option', () => {
      const filter = new Profanease({ lang: 'en', placeHolder: 'x' });
      expect(filter.clean('fuck')).toBe('xxxx');
    });

    it('loads all languages by default', () => {
      const filter = new Profanease();
      expect(filter.check('fuck')).toBe(true);
    });
  });

  describe('options', () => {
    it('uses custom placeholder', () => {
      const filter = new Profanease({ languages: [en], placeholder: '#' });
      expect(filter.clean('fuck')).toBe('####');
    });

    it('supports grawlix replacement', () => {
      const filter = new Profanease({ languages: [en], replacement: 'grawlix' });
      const cleaned = filter.clean('fuck');
      expect(cleaned).toHaveLength(4);
      expect(cleaned).toMatch(/[@#$%&!]+/);
    });

    it('supports word replacement', () => {
      const filter = new Profanease({ languages: [en], replacement: 'word' });
      expect(filter.clean('fuck you')).toContain('[censored]');
    });

    it('supports custom replacer function', () => {
      const filter = new Profanease({
        languages: [en],
        replacement: () => '[REDACTED]',
      });
      expect(filter.clean('fuck')).toBe('[REDACTED]');
    });

    it('supports emptyList option', () => {
      const filter = new Profanease({ emptyList: true });
      expect(filter.check('fuck')).toBe(false);
      expect(filter.clean('fuck shit')).toBe('fuck shit');
    });

    it('supports custom list', () => {
      const filter = new Profanease({ emptyList: true, list: ['badword'] });
      expect(filter.check('badword')).toBe(true);
      expect(filter.clean('this is badword!')).toBe('this is *******!');
    });

    it('supports exclude option', () => {
      const filter = new Profanease({ languages: [en], exclude: ['hell'] });
      expect(filter.check('hell')).toBe(false);
    });

    it('supports multiple language packs', () => {
      const filter = new Profanease({ languages: [en, es] });
      expect(filter.check('fuck')).toBe(true);
    });
  });

  describe('addWords / removeWords', () => {
    it('adds words dynamically', () => {
      const filter = new Profanease({ emptyList: true });
      filter.addWords(['some', 'bad', 'word']);
      expect(filter.clean('some bad word!')).toBe('**** *** ****!');
    });

    it('removes words dynamically', () => {
      const filter = new Profanease({ languages: [en] });
      filter.removeWords(['hell']);
      expect(filter.check('hell')).toBe(false);
    });

    it('addWords overrides previous exclude', () => {
      const filter = new Profanease({ languages: [en], exclude: ['some', 'bad', 'word'] });
      filter.addWords(['some', 'bad', 'word']);
      expect(filter.clean('some bad word!')).toBe('**** *** ****!');
    });
  });

  describe('wordsList', () => {
    it('returns words for a specific language', () => {
      const filter = new Profanease({ languages: [en] });
      const esList = filter.wordsList('es');
      expect(esList).toBeInstanceOf(Array);
      expect(esList.length).toBeGreaterThan(0);
    });

    it('returns current word list when no lang specified', () => {
      const filter = new Profanease({ languages: [en] });
      const list = filter.wordsList();
      expect(list).toBeInstanceOf(Array);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('analyze', () => {
    it('returns detailed analysis', () => {
      const filter = new Profanease({ languages: [en] });
      const result = filter.analyze('this is fucking bullshit');
      expect(result.isProfane).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.severity).toBeDefined();
      expect(result.cleaned).not.toBe('this is fucking bullshit');
    });

    it('returns clean result for clean text', () => {
      const filter = new Profanease({ languages: [en] });
      const result = filter.analyze('hello world');
      expect(result.isProfane).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.severity).toBe('none');
      expect(result.cleaned).toBe('hello world');
    });

    it('includes match details', () => {
      const filter = new Profanease({ languages: [en] });
      const result = filter.analyze('fuck');
      expect(result.matches[0]).toHaveProperty('original');
      expect(result.matches[0]).toHaveProperty('normalized');
      expect(result.matches[0]).toHaveProperty('matched');
      expect(result.matches[0]).toHaveProperty('index');
      expect(result.matches[0]).toHaveProperty('categories');
    });
  });

  describe('normalization levels', () => {
    it('detects l33t speak at moderate level', () => {
      const filter = new Profanease({ languages: [en], normalize: 'moderate' });
      expect(filter.check('$h1t')).toBe(true);
      expect(filter.check('f4ck')).toBe(true);
    });

    it('does not detect l33t speak at basic level', () => {
      const filter = new Profanease({ languages: [en], normalize: 'basic' });
      // 'f4ck' should not match 'fack' (not in word list) at basic level
      expect(filter.check('f4ck')).toBe(false);
    });

    it('detects zero-width evasion at aggressive level', () => {
      const filter = new Profanease({ languages: [en], normalize: 'aggressive' });
      expect(filter.check('f\u200Buck')).toBe(true);
    });
  });

  describe('category filtering', () => {
    it('filters only specified categories', () => {
      const filter = new Profanease({
        languages: [categorized],
        categories: [Category.SLUR],
      });
      // Slurs should be detected
      // General profanity-only words should pass through
    });

    it('loads categorized packs', () => {
      const filter = new Profanease({ languages: [categorized] });
      expect(filter.check('fuck')).toBe(true);
    });
  });

  describe('Profanease.custom() — purely custom filter', () => {
    it('only matches provided words', () => {
      const filter = Profanease.custom(['spam', 'scam', 'phishing']);
      expect(filter.check('this is spam')).toBe(true);
      expect(filter.check('this is scam')).toBe(true);
      expect(filter.check('fuck')).toBe(false);
      expect(filter.check('hello world')).toBe(false);
    });

    it('cleans only custom words', () => {
      const filter = Profanease.custom(['blocked', 'banned']);
      expect(filter.clean('this is blocked content')).toBe('this is ******* content');
      expect(filter.clean('fuck is fine here')).toBe('fuck is fine here');
    });

    it('accepts all standard options', () => {
      const filter = Profanease.custom(['secret'], {
        placeholder: 'X',
        replacement: 'full',
        normalize: 'aggressive',
      });
      expect(filter.clean('secret')).toBe('XXXXXX');
    });

    it('supports addWords after creation', () => {
      const filter = Profanease.custom(['one']);
      expect(filter.check('two')).toBe(false);
      filter.addWords(['two']);
      expect(filter.check('two')).toBe(true);
    });

    it('supports removeWords after creation', () => {
      const filter = Profanease.custom(['one', 'two']);
      expect(filter.check('one')).toBe(true);
      filter.removeWords(['one']);
      expect(filter.check('one')).toBe(false);
      expect(filter.check('two')).toBe(true);
    });

    it('works with analyze()', () => {
      const filter = Profanease.custom(['flagged']);
      const result = filter.analyze('this is flagged text');
      expect(result.isProfane).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].original).toBe('flagged');
      expect(result.cleaned).toBe('this is ******* text');
    });

    it('starts completely empty with no words', () => {
      const filter = Profanease.custom([]);
      expect(filter.check('anything')).toBe(false);
      expect(filter.check('fuck shit damn')).toBe(false);
    });
  });

  describe('phrase matching', () => {
    it('check() detects multi-word phrases', () => {
      const filter = Profanease.custom(['blow job', 'carpet muncher']);
      expect(filter.check('get a blow job')).toBe(true);
      expect(filter.check('blow')).toBe(false);
      expect(filter.check('job')).toBe(false);
    });

    it('clean() censors multi-word phrases', () => {
      const filter = Profanease.custom(['blow job']);
      expect(filter.clean('get a blow job now')).toBe('get a **** *** now');
    });

    it('analyze() reports multi-word phrase matches', () => {
      const filter = Profanease.custom(['blow job']);
      const result = filter.analyze('get a blow job now');
      expect(result.isProfane).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0].matched).toBe('blow job');
      expect(result.cleaned).toBe('get a **** *** now');
    });

    it('handles phrases from built-in English pack', () => {
      const filter = new Profanease({ languages: [en] });
      // "Blow Job" is in the English word list
      expect(filter.check('Blow Job')).toBe(true);
      const result = filter.analyze('Blow Job');
      expect(result.isProfane).toBe(true);
    });
  });

  describe('punctuation handling', () => {
    it('check() detects words with trailing punctuation', () => {
      const filter = Profanease.custom(['bad']);
      expect(filter.check('bad!')).toBe(true);
      expect(filter.check('bad.')).toBe(true);
      expect(filter.check('bad?')).toBe(true);
    });

    it('check() detects words with surrounding punctuation', () => {
      const filter = Profanease.custom(['bad']);
      expect(filter.check('(bad)')).toBe(true);
      expect(filter.check('"bad"')).toBe(true);
    });

    it('clean() preserves punctuation around replaced words', () => {
      const filter = Profanease.custom(['bad']);
      expect(filter.clean('(bad)')).toBe('(***)')
      expect(filter.clean('bad!')).toBe('***!');
      expect(filter.clean('"bad"')).toBe('"***"');
    });

    it('analyze() detects words with punctuation', () => {
      const filter = Profanease.custom(['bad']);
      const result = filter.analyze('this is bad!');
      expect(result.isProfane).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.cleaned).toBe('this is ***!');
    });

    it('handles profanity with punctuation from English pack', () => {
      const filter = new Profanease({ languages: [en] });
      expect(filter.check('fuck!')).toBe(true);
      expect(filter.check('(fuck)')).toBe(true);
      expect(filter.clean('fuck!')).toBe('****!');
      expect(filter.clean('(fuck)')).toBe('(****)');
    });
  });
});
