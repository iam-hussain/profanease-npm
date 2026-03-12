import type { ReplacementStrategy } from '../types.js';

const GRAWLIX_CHARS = '@#$%&!';

/**
 * Replace a matched word using the given strategy.
 */
export function replaceWord(
  word: string,
  strategy: ReplacementStrategy = 'asterisk',
  placeholder: string = '*',
): string {
  if (typeof strategy === 'function') {
    return strategy(word);
  }

  switch (strategy) {
    case 'asterisk': {
      // Replace only word characters, keep punctuation
      return word.replace(/\w/g, placeholder);
    }
    case 'grawlix': {
      // Comic-style replacement: f@#$
      let result = '';
      let gi = 0;
      for (const ch of word) {
        if (/\w/.test(ch)) {
          result += GRAWLIX_CHARS[gi % GRAWLIX_CHARS.length];
          gi++;
        } else {
          result += ch;
        }
      }
      return result;
    }
    case 'word': {
      return '[censored]';
    }
    case 'full': {
      return placeholder.repeat(word.length);
    }
    default:
      return word.replace(/\w/g, placeholder);
  }
}
