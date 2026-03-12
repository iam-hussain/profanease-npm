/**
 * L33t speak character mappings at different intensity levels.
 */

/** Basic l33t substitutions — very common, low false-positive risk */
export const LEET_BASIC: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
};

/** Moderate l33t — adds more substitutions */
export const LEET_MODERATE: Record<string, string> = {
  ...LEET_BASIC,
  '!': 'i',
  '+': 't',
  '(': 'c',
  '8': 'b',
  '9': 'g',
  '6': 'g',
  '2': 'z',
};

/** Aggressive l33t — maximum coverage, higher false-positive risk */
export const LEET_AGGRESSIVE: Record<string, string> = {
  ...LEET_MODERATE,
  '|': 'l',
  '}{': 'h',
  '><': 'x',
  '[]': 'd',
  '/\\': 'a',
  '\\/': 'v',
  '|\\|': 'n',
  '|/|': 'n',
  '()': 'o',
  '|-|': 'h',
  '|_|': 'u',
};

/**
 * Decode l33t speak in a string.
 */
export function decodeLeet(
  input: string,
  level: 'basic' | 'moderate' | 'aggressive' = 'moderate',
): string {
  const map =
    level === 'basic' ? LEET_BASIC : level === 'moderate' ? LEET_MODERATE : LEET_AGGRESSIVE;

  // Handle multi-char sequences first (aggressive mode)
  let result = input;
  if (level === 'aggressive') {
    const multiChar: [string, string][] = [
      ['|\\|', 'n'],
      ['|/|', 'n'],
      ['|-|', 'h'],
      ['|_|', 'u'],
      ['}{', 'h'],
      ['><', 'x'],
      ['[]', 'd'],
      ['/\\', 'a'],
      ['\\/', 'v'],
      ['()', 'o'],
    ];
    for (const [from, to] of multiChar) {
      result = result.split(from).join(to);
    }
  }

  // Single-char replacements
  let output = '';
  for (const ch of result) {
    output += map[ch] ?? ch;
  }

  return output;
}
