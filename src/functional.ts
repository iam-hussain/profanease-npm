import type { AnalysisResult, ProfaneaseOptions } from './types.js';
import { Profanease } from './profanease.js';

/**
 * Quick check if text contains profanity (stateless).
 *
 * @example
 * ```ts
 * import { check } from 'profanease';
 * import en from 'profanease/langs/en';
 *
 * check('some text', { languages: [en] }); // true/false
 * ```
 */
export function check(text: string, options?: ProfaneaseOptions): boolean {
  return new Profanease(options).check(text);
}

/**
 * Quick clean profanity from text (stateless).
 *
 * @example
 * ```ts
 * import { clean } from 'profanease';
 * import en from 'profanease/langs/en';
 *
 * clean('some bad text', { languages: [en] }); // censored string
 * ```
 */
export function clean(text: string, options?: ProfaneaseOptions): string {
  return new Profanease(options).clean(text);
}

/**
 * Quick analyze text for profanity with detailed results (stateless).
 *
 * @example
 * ```ts
 * import { analyze } from 'profanease';
 * import en from 'profanease/langs/en';
 *
 * const result = analyze('some text', { languages: [en] });
 * // { isProfane: boolean, matches: [...], categories: [...], severity: '...', cleaned: '...' }
 * ```
 */
export function analyze(text: string, options?: ProfaneaseOptions): AnalysisResult {
  return new Profanease(options).analyze(text);
}
