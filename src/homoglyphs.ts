/**
 * Unicode homoglyph mappings — characters from other scripts that
 * visually resemble Latin letters. Used to detect evasion attempts.
 */
export const HOMOGLYPHS: Record<string, string> = {
  // Cyrillic → Latin
  '\u0430': 'a', // а
  '\u0435': 'e', // е
  '\u043E': 'o', // о
  '\u0440': 'p', // р
  '\u0441': 'c', // с
  '\u0443': 'y', // у
  '\u0445': 'x', // х
  '\u0456': 'i', // і
  '\u0458': 'j', // ј
  '\u044C': 'b', // ь (approximate)
  '\u0410': 'A', // А
  '\u0412': 'B', // В
  '\u0415': 'E', // Е
  '\u041A': 'K', // К
  '\u041C': 'M', // М
  '\u041D': 'H', // Н
  '\u041E': 'O', // О
  '\u0420': 'P', // Р
  '\u0421': 'C', // С
  '\u0422': 'T', // Т
  '\u0425': 'X', // Х

  // Greek → Latin
  '\u03B1': 'a', // α
  '\u03B5': 'e', // ε
  '\u03BF': 'o', // ο
  '\u03C1': 'p', // ρ
  '\u03BA': 'k', // κ
  '\u03BD': 'v', // ν
  '\u03C4': 't', // τ
  '\u0391': 'A', // Α
  '\u0392': 'B', // Β
  '\u0395': 'E', // Ε
  '\u0397': 'H', // Η
  '\u0399': 'I', // Ι
  '\u039A': 'K', // Κ
  '\u039C': 'M', // Μ
  '\u039D': 'N', // Ν
  '\u039F': 'O', // Ο
  '\u03A1': 'P', // Ρ
  '\u03A4': 'T', // Τ
  '\u03A5': 'Y', // Υ
  '\u03A7': 'X', // Χ
  '\u03B9': 'i', // ι

  // Fullwidth → ASCII
  '\uFF41': 'a',
  '\uFF42': 'b',
  '\uFF43': 'c',
  '\uFF44': 'd',
  '\uFF45': 'e',
  '\uFF46': 'f',
  '\uFF47': 'g',
  '\uFF48': 'h',
  '\uFF49': 'i',
  '\uFF4A': 'j',
  '\uFF4B': 'k',
  '\uFF4C': 'l',
  '\uFF4D': 'm',
  '\uFF4E': 'n',
  '\uFF4F': 'o',
  '\uFF50': 'p',
  '\uFF51': 'q',
  '\uFF52': 'r',
  '\uFF53': 's',
  '\uFF54': 't',
  '\uFF55': 'u',
  '\uFF56': 'v',
  '\uFF57': 'w',
  '\uFF58': 'x',
  '\uFF59': 'y',
  '\uFF5A': 'z',

  // Common look-alikes
  '\u0131': 'i', // ı (dotless i)
  '\u0142': 'l', // ł
  '\u00F8': 'o', // ø
  '\u00E6': 'ae', // æ
};

/**
 * Normalize homoglyphs in a string to their Latin equivalents.
 */
export function normalizeHomoglyphs(input: string): string {
  let output = '';
  for (const ch of input) {
    output += HOMOGLYPHS[ch] ?? ch;
  }
  return output;
}
