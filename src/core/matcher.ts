import type { Category, CategorizedWord, LanguagePack, NormalizationLevel } from '../types.js';
import { normalize } from './normalizer.js';

/**
 * Internal entry storing a word with its normalized form and categories.
 */
interface WordEntry {
  original: string;
  normalized: string;
  categories: Category[];
  isPattern: boolean;
  regex?: RegExp;
}

/**
 * Match result from the matcher.
 */
export interface InternalMatch {
  original: string;
  normalized: string;
  matched: string;
  matchedCategories: Category[];
}

/**
 * High-performance word matcher using Set-based lookup for O(1) exact matches
 * and regex fallback for wildcard patterns.
 */
export class Matcher {
  private exactSet: Map<string, WordEntry> = new Map();
  private patterns: WordEntry[] = [];
  private phraseStarters: Map<string, WordEntry[]> = new Map();
  private excludeSet: Set<string> = new Set();
  private level: NormalizationLevel;

  constructor(level: NormalizationLevel = 'moderate') {
    this.level = level;
  }

  /**
   * Load words from language packs.
   */
  load(packs: LanguagePack[], categoryFilter?: Category[]): void {
    for (const pack of packs) {
      for (const entry of pack) {
        const item: { word: string; categories: Category[] } =
          typeof entry === 'string' ? { word: entry, categories: [] } : entry;

        // Skip if category filter is active and word doesn't match
        if (
          categoryFilter &&
          categoryFilter.length > 0 &&
          item.categories.length > 0 &&
          !item.categories.some((c) => categoryFilter.includes(c))
        ) {
          continue;
        }

        this.addWord(item.word, item.categories);
      }
    }
  }

  /**
   * Add a single word to the matcher.
   */
  addWord(word: string, categories: Category[] = []): void {
    const normalized = normalize(word, this.level);
    const hasWildcard = word.includes('*');
    const isPhrase = word.includes(' ');

    const entry: WordEntry = {
      original: word,
      normalized,
      categories,
      isPattern: hasWildcard,
    };

    if (hasWildcard) {
      // Convert wildcard pattern to regex: *fuck* → /fuck/i, Cock* → /^cock/i
      const escaped = normalized
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*');
      const pattern = word.startsWith('*') && word.endsWith('*')
        ? escaped
        : word.startsWith('*')
          ? `${escaped}$`
          : word.endsWith('*')
            ? `^${escaped}`
            : `^${escaped}$`;
      entry.regex = new RegExp(pattern.replace(/\.\*/g, ''), 'i');
      this.patterns.push(entry);
    } else if (isPhrase) {
      // Multi-word phrase: index by first word for quick prefix lookup
      const firstWord = normalized.split(/\s+/)[0];
      const existing = this.phraseStarters.get(firstWord) || [];
      existing.push(entry);
      this.phraseStarters.set(firstWord, existing);
    } else {
      this.exactSet.set(normalized, entry);
    }
  }

  /**
   * Add words to the exclude list.
   */
  exclude(words: string[]): void {
    for (const w of words) {
      this.excludeSet.add(normalize(w, this.level));
    }
  }

  /**
   * Remove words from the exclude list (re-enable them).
   */
  unexclude(words: string[]): void {
    for (const w of words) {
      this.excludeSet.delete(normalize(w, this.level));
    }
  }

  /**
   * Check if a single word matches any entry.
   */
  matchWord(word: string): InternalMatch | null {
    const norm = normalize(word, this.level);

    if (this.excludeSet.has(norm)) return null;

    // O(1) exact match
    const exact = this.exactSet.get(norm);
    if (exact) {
      return {
        original: word,
        normalized: norm,
        matched: exact.original,
        matchedCategories: exact.categories,
      };
    }

    // Wildcard pattern match
    for (const pattern of this.patterns) {
      if (pattern.regex && pattern.regex.test(norm)) {
        if (this.excludeSet.has(pattern.normalized)) continue;
        return {
          original: word,
          normalized: norm,
          matched: pattern.original,
          matchedCategories: pattern.categories,
        };
      }
    }

    return null;
  }

  /**
   * Check if a sequence of words starting at the given position matches a phrase.
   * Returns the number of words consumed, or 0 if no match.
   */
  matchPhrase(words: string[], startIndex: number): { match: InternalMatch; length: number } | null {
    const firstNorm = normalize(words[startIndex], this.level);
    const phrases = this.phraseStarters.get(firstNorm);
    if (!phrases) return null;

    for (const phrase of phrases) {
      const phraseWords = phrase.normalized.split(/\s+/);
      if (startIndex + phraseWords.length > words.length) continue;

      let matches = true;
      for (let i = 0; i < phraseWords.length; i++) {
        const norm = normalize(words[startIndex + i], this.level);
        if (norm !== phraseWords[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const originalText = words.slice(startIndex, startIndex + phraseWords.length).join(' ');
        if (this.excludeSet.has(phrase.normalized)) continue;
        return {
          match: {
            original: originalText,
            normalized: phrase.normalized,
            matched: phrase.original,
            matchedCategories: phrase.categories,
          },
          length: phraseWords.length,
        };
      }
    }

    return null;
  }

  /**
   * Get all loaded words (flat list of originals).
   */
  getWords(): string[] {
    const words: string[] = [];
    for (const entry of this.exactSet.values()) words.push(entry.original);
    for (const entry of this.patterns) words.push(entry.original);
    for (const entries of this.phraseStarters.values()) {
      for (const entry of entries) words.push(entry.original);
    }
    return words;
  }
}
