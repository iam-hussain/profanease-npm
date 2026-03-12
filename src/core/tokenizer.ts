/**
 * Token representing a segment of text — either a word or a separator.
 */
export interface Token {
  /** The text content */
  value: string;
  /** Start index in the original text */
  index: number;
  /** Whether this is a word (vs whitespace/punctuation) */
  isWord: boolean;
}

/**
 * Tokenize text into words and separators, preserving original indices.
 * Uses word boundary splitting that respects contractions and hyphenated words.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // Match sequences of word chars (including apostrophes mid-word and digits)
  // or sequences of non-word chars
  const regex = /[\w']+|[^\w']+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    const isWord = /\w/.test(value);
    tokens.push({ value, index: match.index, isWord });
  }

  return tokens;
}

/**
 * Tokenize text in a normalization-aware way.
 *
 * For profanity detection, we need to group characters that would form a word
 * after normalization (e.g. "$h1t" is one "word" because "$" → "s" and "1" → "i").
 *
 * Returns pairs of [originalSegment, isWordAfterNormalization].
 */
export function tokenizeRaw(text: string): Token[] {
  const tokens: Token[] = [];
  // Greedily grab runs of non-whitespace as potential words
  const regex = /\S+|\s+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const value = match[0];
    const isWord = /\S/.test(value);
    tokens.push({ value, index: match.index, isWord });
  }

  return tokens;
}
