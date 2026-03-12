import type {
  AnalysisResult,
  Category,
  LanguagePack,
  MatchResult,
  NormalizationLevel,
  ProfaneaseOptions,
  ReplacementStrategy,
  Severity,
} from './types.js';
import { Matcher, type InternalMatch } from './core/matcher.js';
import { tokenize, tokenizeRaw } from './core/tokenizer.js';
import { replaceWord } from './core/replacer.js';
import all from './langs/all.js';
import { byLanguage } from './langs/all.js';

/**
 * A processed token with both raw value and stripped word content.
 */
interface ProcessedToken {
  /** Full raw text of the token (e.g. "(fuck!)" ) */
  raw: string;
  /** Start index in original text */
  index: number;
  /** Whether this token contains word characters */
  isWord: boolean;
  /** Leading punctuation stripped (e.g. "(") */
  prefix: string;
  /** The core word content (e.g. "fuck") */
  core: string;
  /** Trailing punctuation stripped (e.g. "!)") */
  suffix: string;
}

/**
 * Strip leading/trailing non-word chars from a raw token.
 * Returns { prefix, core, suffix } so we can reconstruct or replace the core only.
 */
function stripPunctuation(raw: string): { prefix: string; core: string; suffix: string } {
  const match = raw.match(/^(\W*)(.*?)(\W*)$/s);
  if (!match) return { prefix: '', core: raw, suffix: '' };
  return { prefix: match[1], core: match[2], suffix: match[3] };
}

/**
 * Profanease — Modern profanity detection & content moderation toolkit.
 *
 * @example
 * ```ts
 * import { Profanease } from 'profanease';
 * import en from 'profanease/langs/en';
 *
 * const filter = new Profanease({ languages: [en] });
 * filter.check('some bad text');   // true/false
 * filter.clean('some bad text');   // censored string
 * filter.analyze('some bad text'); // detailed analysis
 * ```
 */
export class Profanease {
  private matcher: Matcher;
  private placeholder: string;
  private replacement: ReplacementStrategy;
  private normalizeLevel: NormalizationLevel;
  private categoryFilter?: Category[];

  constructor(options: ProfaneaseOptions = {}) {
    // Handle legacy v1 compat
    const placeholder = options.placeholder ?? options.placeHolder ?? '*';
    const normalizeLevel = options.normalize ?? 'moderate';

    this.placeholder = placeholder;
    this.replacement = options.replacement ?? 'asterisk';
    this.normalizeLevel = normalizeLevel;
    this.categoryFilter = options.categories;
    this.matcher = new Matcher(normalizeLevel);

    // Determine word source
    if (options.emptyList) {
      // Start with empty list
    } else if (options.languages && options.languages.length > 0) {
      // Modern API: use provided language packs
      this.matcher.load(options.languages, this.categoryFilter);
    } else if (options.lang) {
      // Legacy v1 compat: load by language code
      const langWords = options.lang === 'all' ? all : byLanguage[options.lang];
      if (langWords) {
        this.matcher.load([langWords], this.categoryFilter);
      }
    } else {
      // Default: load all languages
      this.matcher.load([all], this.categoryFilter);
    }

    // Add custom words
    if (options.list) {
      for (const word of options.list) {
        this.matcher.addWord(word);
      }
    }

    // Exclude words
    if (options.exclude) {
      this.matcher.exclude(options.exclude);
    }
  }

  /**
   * Process raw tokens into ProcessedTokens with punctuation stripped.
   */
  private processTokens(text: string): ProcessedToken[] {
    const rawTokens = tokenizeRaw(text);
    return rawTokens.map((t) => {
      if (!t.isWord) {
        return { raw: t.value, index: t.index, isWord: false, prefix: '', core: '', suffix: '' };
      }
      const { prefix, core, suffix } = stripPunctuation(t.value);
      return { raw: t.value, index: t.index, isWord: core.length > 0, prefix, core, suffix };
    });
  }

  /**
   * Check if text contains profanity.
   */
  check(text: string): boolean {
    const tokens = this.processTokens(text);
    const wordTokens = tokens.filter((t) => t.isWord);
    const cores = wordTokens.map((t) => t.core);

    for (let i = 0; i < cores.length; i++) {
      // Check multi-word phrases first
      const phraseMatch = this.matcher.matchPhrase(cores, i);
      if (phraseMatch) return true;

      // Check whole raw token (for obfuscated words like "$h1t")
      if (this.matcher.matchWord(wordTokens[i].raw)) return true;

      // Check stripped core (for "fuck!" → "fuck")
      if (this.matcher.matchWord(cores[i])) return true;
    }

    return false;
  }

  /**
   * Clean text by replacing profane words with placeholders.
   */
  clean(text: string): string {
    const tokens = this.processTokens(text);
    const wordTokens = tokens.filter((t) => t.isWord);
    const cores = wordTokens.map((t) => t.core);

    // Find phrase matches first — mark word indices consumed by phrases
    const phraseConsumed = new Set<number>();
    const phraseReplacements = new Map<number, { length: number }>();

    for (let i = 0; i < cores.length; i++) {
      if (phraseConsumed.has(i)) continue;
      const phraseMatch = this.matcher.matchPhrase(cores, i);
      if (phraseMatch) {
        phraseReplacements.set(i, { length: phraseMatch.length });
        for (let j = i; j < i + phraseMatch.length; j++) {
          phraseConsumed.add(j);
        }
      }
    }

    // Build result by walking original tokens
    const result: string[] = [];
    let wordIndex = 0;

    for (const token of tokens) {
      if (!token.isWord) {
        result.push(token.raw);
        continue;
      }

      if (phraseConsumed.has(wordIndex)) {
        // This word is part of a phrase match — replace the core
        result.push(
          token.prefix +
            replaceWord(token.core, this.replacement, this.placeholder) +
            token.suffix,
        );
        wordIndex++;
        continue;
      }

      // Try whole raw token match (for obfuscated words like "$h1t")
      const wholeMatch = this.matcher.matchWord(token.raw);
      if (wholeMatch) {
        result.push(replaceWord(token.raw, this.replacement, this.placeholder));
        wordIndex++;
        continue;
      }

      // Try stripped core match (for "fuck!" → match "fuck", keep "!")
      const coreMatch = this.matcher.matchWord(token.core);
      if (coreMatch) {
        result.push(
          token.prefix +
            replaceWord(token.core, this.replacement, this.placeholder) +
            token.suffix,
        );
        wordIndex++;
        continue;
      }

      result.push(token.raw);
      wordIndex++;
    }

    return result.join('');
  }

  /**
   * Analyze text for profanity with detailed results.
   */
  analyze(text: string): AnalysisResult {
    const tokens = this.processTokens(text);
    const wordTokens = tokens.filter((t) => t.isWord);
    const cores = wordTokens.map((t) => t.core);
    const matches: MatchResult[] = [];
    const allCategories = new Set<Category>();

    // Find phrase matches first
    const phraseConsumed = new Set<number>();
    const phraseMatches = new Map<number, { match: InternalMatch; length: number }>();

    for (let i = 0; i < cores.length; i++) {
      if (phraseConsumed.has(i)) continue;
      const phraseMatch = this.matcher.matchPhrase(cores, i);
      if (phraseMatch) {
        phraseMatches.set(i, phraseMatch);
        for (let j = i; j < i + phraseMatch.length; j++) {
          phraseConsumed.add(j);
        }
      }
    }

    // Build cleaned text and collect matches
    const cleanedParts: string[] = [];
    let wordIndex = 0;

    for (const token of tokens) {
      if (!token.isWord) {
        cleanedParts.push(token.raw);
        continue;
      }

      // Check if this word starts a phrase match
      const phrase = phraseMatches.get(wordIndex);
      if (phrase) {
        matches.push({
          original: phrase.match.original,
          normalized: phrase.match.normalized,
          matched: phrase.match.matched,
          index: token.index,
          categories: phrase.match.matchedCategories,
        });
        for (const cat of phrase.match.matchedCategories) {
          allCategories.add(cat);
        }
        cleanedParts.push(
          token.prefix +
            replaceWord(token.core, this.replacement, this.placeholder) +
            token.suffix,
        );
        wordIndex++;
        continue;
      }

      if (phraseConsumed.has(wordIndex)) {
        // Continuation of a phrase — already matched, just replace
        cleanedParts.push(
          token.prefix +
            replaceWord(token.core, this.replacement, this.placeholder) +
            token.suffix,
        );
        wordIndex++;
        continue;
      }

      // Try whole raw token match (obfuscated words)
      const wholeMatch = this.matcher.matchWord(token.raw);
      if (wholeMatch) {
        matches.push({
          original: wholeMatch.original,
          normalized: wholeMatch.normalized,
          matched: wholeMatch.matched,
          index: token.index,
          categories: wholeMatch.matchedCategories,
        });
        for (const cat of wholeMatch.matchedCategories) {
          allCategories.add(cat);
        }
        cleanedParts.push(replaceWord(token.raw, this.replacement, this.placeholder));
        wordIndex++;
        continue;
      }

      // Try stripped core match
      const coreMatch = this.matcher.matchWord(token.core);
      if (coreMatch) {
        matches.push({
          original: coreMatch.original,
          normalized: coreMatch.normalized,
          matched: coreMatch.matched,
          index: token.index + token.prefix.length,
          categories: coreMatch.matchedCategories,
        });
        for (const cat of coreMatch.matchedCategories) {
          allCategories.add(cat);
        }
        cleanedParts.push(
          token.prefix +
            replaceWord(token.core, this.replacement, this.placeholder) +
            token.suffix,
        );
        wordIndex++;
        continue;
      }

      cleanedParts.push(token.raw);
      wordIndex++;
    }

    const categories = Array.from(allCategories);
    const severity = this.computeSeverity(matches);

    return {
      isProfane: matches.length > 0,
      matches,
      categories,
      severity,
      cleaned: cleanedParts.join(''),
    };
  }

  /**
   * Create a purely custom filter with no default word lists.
   * Only the words you provide will be filtered.
   *
   * @example
   * ```ts
   * const filter = Profanease.custom(['badword', 'offensive'], {
   *   placeholder: '#',
   *   normalize: 'aggressive',
   * });
   * filter.check('badword');  // true
   * filter.check('fuck');     // false
   * ```
   */
  static custom(
    words: string[],
    options: Omit<ProfaneaseOptions, 'languages' | 'lang' | 'emptyList' | 'list'> = {},
  ): Profanease {
    return new Profanease({ ...options, emptyList: true, list: words });
  }

  /**
   * Add words to the profanity list.
   */
  addWords(words: string[], categories: Category[] = []): void {
    this.matcher.unexclude(words);
    for (const word of words) {
      this.matcher.addWord(word, categories);
    }
  }

  /**
   * Remove words from filtering (add to exclude list).
   */
  removeWords(words: string[]): void {
    this.matcher.exclude(words);
  }

  /**
   * Get the current word list.
   */
  wordsList(lang?: string): string[] {
    if (lang && byLanguage[lang]) {
      return byLanguage[lang];
    }
    return this.matcher.getWords();
  }

  private computeSeverity(matches: MatchResult[]): Severity {
    if (matches.length === 0) return 'none';

    const hasSlur = matches.some((m) => m.categories.includes('slur' as Category));
    const hasSevere = matches.some((m) =>
      m.categories.some((c) => ['slur', 'sexual', 'violence'].includes(c)),
    );

    if (hasSlur || matches.length >= 5) return 'severe';
    if (hasSevere || matches.length >= 3) return 'moderate';
    return 'mild';
  }
}
