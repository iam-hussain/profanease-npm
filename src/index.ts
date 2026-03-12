// Main class
export { Profanease } from './profanease.js';

// Functional API
export { check, clean, analyze } from './functional.js';

// Types
export type {
  ProfaneaseOptions,
  AnalysisResult,
  MatchResult,
  Severity,
  NormalizationLevel,
  ReplacementStrategy,
  CustomReplacer,
  LanguagePack,
  CategorizedWord,
} from './types.js';

export { Category } from './types.js';

// Core utilities (for advanced usage)
export { normalize } from './core/normalizer.js';
export { tokenize } from './core/tokenizer.js';
export { replaceWord } from './core/replacer.js';
export { decodeLeet } from './leet-map.js';
export { normalizeHomoglyphs } from './homoglyphs.js';
