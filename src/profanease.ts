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
   * Check if text contains profanity.
   */
  check(text: string): boolean {
    // Use raw tokenizer (split by whitespace) so that obfuscated words like "$h1t"
    // stay as one token. The matcher normalizes internally.
    const tokens = tokenizeRaw(text);
    const words = tokens.filter((t) => t.isWord).map((t) => t.value);

    for (let i = 0; i < words.length; i++) {
      // Check phrases first
      const phraseMatch = this.matcher.matchPhrase(words, i);
      if (phraseMatch) return true;

      // Check single word
      if (this.matcher.matchWord(words[i])) return true;
    }

    return false;
  }

  /**
   * Clean text by replacing profane words with placeholders.
   */
  clean(text: string): string {
    const tokens = tokenizeRaw(text);
    const result: string[] = [];

    for (const token of tokens) {
      if (!token.isWord) {
        result.push(token.value);
        continue;
      }

      // Split on word boundaries within the raw token for finer replacement
      const subTokens = tokenize(token.value);
      let anyMatch = false;

      // First check: does the whole raw token match?
      const wholeMatch = this.matcher.matchWord(token.value);
      if (wholeMatch) {
        result.push(replaceWord(token.value, this.replacement, this.placeholder));
        continue;
      }

      // Otherwise check individual word sub-tokens
      for (const sub of subTokens) {
        if (!sub.isWord) {
          result.push(sub.value);
          continue;
        }
        const match = this.matcher.matchWord(sub.value);
        if (match) {
          result.push(replaceWord(sub.value, this.replacement, this.placeholder));
        } else {
          result.push(sub.value);
        }
      }
    }

    return result.join('');
  }

  /**
   * Analyze text for profanity with detailed results.
   */
  analyze(text: string): AnalysisResult {
    const tokens = tokenizeRaw(text);
    const matches: MatchResult[] = [];
    const cleanedParts: string[] = [];
    const allCategories = new Set<Category>();

    for (const token of tokens) {
      if (!token.isWord) {
        cleanedParts.push(token.value);
        continue;
      }

      // Try whole-token match first (handles obfuscated words like "$h1t")
      const wholeMatch = this.matcher.matchWord(token.value);
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
        cleanedParts.push(replaceWord(token.value, this.replacement, this.placeholder));
        continue;
      }

      // Otherwise check sub-tokens
      const subTokens = tokenize(token.value);
      for (const sub of subTokens) {
        if (!sub.isWord) {
          cleanedParts.push(sub.value);
          continue;
        }
        const match = this.matcher.matchWord(sub.value);
        if (match) {
          matches.push({
            original: match.original,
            normalized: match.normalized,
            matched: match.matched,
            index: token.index + sub.index,
            categories: match.matchedCategories,
          });
          for (const cat of match.matchedCategories) {
            allCategories.add(cat);
          }
          cleanedParts.push(replaceWord(sub.value, this.replacement, this.placeholder));
        } else {
          cleanedParts.push(sub.value);
        }
      }
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
