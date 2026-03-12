/**
 * Content categories for guard rails filtering.
 */
export enum Category {
  PROFANITY = 'profanity',
  SEXUAL = 'sexual',
  SLUR = 'slur',
  INSULT = 'insult',
  RELIGIOUS = 'religious',
  DRUGS = 'drugs',
  VIOLENCE = 'violence',
}

/**
 * A word entry with optional category tags.
 */
export interface CategorizedWord {
  word: string;
  categories: Category[];
}

/**
 * A language pack is either a flat string array or categorized word entries.
 */
export type LanguagePack = string[] | CategorizedWord[];

/**
 * Normalization intensity levels.
 */
export type NormalizationLevel = 'none' | 'basic' | 'moderate' | 'aggressive';

/**
 * Replacement strategy for censoring matched words.
 */
export type ReplacementStrategy = 'asterisk' | 'grawlix' | 'word' | 'full' | CustomReplacer;

/**
 * Custom replacer function.
 */
export type CustomReplacer = (word: string) => string;

/**
 * Configuration options for Profanease.
 */
export interface ProfaneaseOptions {
  /** Language packs to use (import from profanease/langs/*) */
  languages?: LanguagePack[];
  /** Replacement placeholder character (default: '*') */
  placeholder?: string;
  /** Replacement strategy (default: 'asterisk') */
  replacement?: ReplacementStrategy;
  /** Words to exclude from filtering */
  exclude?: string[];
  /** Additional words to add to the filter list */
  list?: string[];
  /** Start with empty word list (default: false) */
  emptyList?: boolean;
  /** Only filter these categories (default: all) */
  categories?: Category[];
  /** Normalization level (default: 'moderate') */
  normalize?: NormalizationLevel;

  // Legacy v1 compat
  /** @deprecated Use `placeholder` instead */
  placeHolder?: string;
  /** @deprecated Use `languages` with imported packs instead */
  lang?: string;
  /** @deprecated Use `normalize` instead */
  regex?: RegExp;
  /** @deprecated Use `replacement` instead */
  replaceRegex?: RegExp;
}

/**
 * A single match found during analysis.
 */
export interface MatchResult {
  /** The original word as it appeared in the text */
  original: string;
  /** The normalized form that matched */
  normalized: string;
  /** The word-list entry it matched against */
  matched: string;
  /** Start index in the original text */
  index: number;
  /** Categories of the matched word (if available) */
  categories: Category[];
}

/**
 * Severity level of detected content.
 */
export type Severity = 'none' | 'mild' | 'moderate' | 'severe';

/**
 * Detailed analysis result from analyze().
 */
export interface AnalysisResult {
  /** Whether any profanity was found */
  isProfane: boolean;
  /** All matches found */
  matches: MatchResult[];
  /** All unique categories found */
  categories: Category[];
  /** Overall severity */
  severity: Severity;
  /** The cleaned text */
  cleaned: string;
}
