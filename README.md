# Profanease

Modern, lightweight profanity detection & content moderation toolkit for JavaScript/TypeScript.

- **Universal** — Node.js, Browser, Deno, Bun, Edge runtimes (zero platform dependencies)
- **Tree-shakeable** — import only the language packs you need
- **Evasion-resistant** — l33t speak (`$h1t`), homoglyphs, zero-width chars
- **Guard rails** — filter by content category (slurs, sexual, insults, drugs, violence)
- **Custom filters** — use your own word lists with zero defaults
- **Dual format** — ESM + CJS with full TypeScript types

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Overview](#api-overview)
- [Custom Filter (No Defaults)](#custom-filter-no-defaults)
- [Language Packs](#language-packs)
- [Normalization (Evasion Detection)](#normalization-evasion-detection)
- [Content Categories (Guard Rails)](#content-categories-guard-rails)
- [Replacement Strategies](#replacement-strategies)
- [Detailed Analysis](#detailed-analysis)
- [Dynamic Word Management](#dynamic-word-management)
- [Core Utilities](#core-utilities)
- [Configuration Reference](#configuration-reference)
- [Migrating from v1](#migrating-from-v1)

---

## Installation

```bash
npm install profanease
```

```bash
yarn add profanease
```

```bash
pnpm add profanease
```

## Quick Start

### Class API

```ts
import { Profanease } from 'profanease';
import en from 'profanease/langs/en';

const filter = new Profanease({ languages: [en] });

filter.check('hello world');         // false
filter.check('what the fuck');       // true
filter.clean('what the fuck');       // 'what the ****'
filter.analyze('what the fuck');     // { isProfane: true, matches: [...], ... }
```

### Functional API

Stateless one-off checks — no instance needed:

```ts
import { check, clean, analyze } from 'profanease';
import en from 'profanease/langs/en';

check('some text', { languages: [en] });     // boolean
clean('bad text', { languages: [en] });      // censored string
analyze('bad text', { languages: [en] });    // detailed result
```

### CommonJS

```js
const { Profanease } = require('profanease');
const en = require('profanease/langs/en');

const filter = new Profanease({ languages: [en.default] });
```

---

## API Overview

| Method | Returns | Description |
|--------|---------|-------------|
| `filter.check(text)` | `boolean` | Does text contain profanity? |
| `filter.clean(text)` | `string` | Replace profane words with placeholders |
| `filter.analyze(text)` | `AnalysisResult` | Detailed match info, categories, severity |
| `filter.addWords(words)` | `void` | Add words to the filter at runtime |
| `filter.removeWords(words)` | `void` | Exclude words from filtering at runtime |
| `filter.wordsList(lang?)` | `string[]` | Get loaded word list (or a specific language) |
| `Profanease.custom(words, opts?)` | `Profanease` | Create filter with only your custom words |

---

## Custom Filter (No Defaults)

Use `Profanease.custom()` to create a filter with **only your own words** — no built-in profanity lists are loaded. This is useful for brand-specific content moderation, domain-specific filtering, or building your own word lists from scratch.

```ts
import { Profanease } from 'profanease';

// Only these words will be filtered — nothing else
const filter = Profanease.custom(['spam', 'scam', 'phishing', 'clickbait']);

filter.check('this is spam');         // true
filter.check('fuck');                 // false (not in your list)
filter.clean('report this scam');     // 'report this ****'
```

### With options

```ts
const filter = Profanease.custom(['competitor-name', 'banned-term'], {
  placeholder: '#',
  replacement: 'word',
  normalize: 'aggressive',   // catches l33t speak evasion of your terms too
});

filter.clean('use competitor-name');  // 'use [censored]'
```

### Build up dynamically

```ts
const filter = Profanease.custom([]);  // start empty

// Add words as you discover them
filter.addWords(['new-bad-word', 'another']);
filter.check('new-bad-word');          // true

// Remove if needed
filter.removeWords(['another']);
filter.check('another');               // false
```

### Combine custom words with built-in lists

If you want built-in profanity **plus** your custom words:

```ts
import en from 'profanease/langs/en';

const filter = new Profanease({
  languages: [en],
  list: ['company-specific-term', 'internal-jargon'],
});

filter.check('fuck');                      // true  (from English pack)
filter.check('company-specific-term');     // true  (from your list)
```

---

## Language Packs

Import only what you need — unused languages are tree-shaken from your bundle:

```ts
import en from 'profanease/langs/en';   // English (2,983 words)
import es from 'profanease/langs/es';   // Spanish (190 words)
import fr from 'profanease/langs/fr';   // French (200 words)
import de from 'profanease/langs/de';   // German (179 words)

const filter = new Profanease({ languages: [en, es, fr, de] });
```

### All languages at once

```ts
import all from 'profanease/langs/all';

const filter = new Profanease({ languages: [all] });
```

### Available languages (25)

| Code | Language | Code | Language | Code | Language |
|------|----------|------|----------|------|----------|
| `ar` | Arabic | `hi` | Hindi | `pl` | Polish |
| `cs` | Czech | `hu` | Hungarian | `pt` | Portuguese |
| `da` | Danish | `it` | Italian | `ru` | Russian |
| `de` | German | `ja` | Japanese | `sv` | Swedish |
| `en` | English | `ko` | Korean | `th` | Thai |
| `eo` | Esperanto | `nl` | Dutch | `tlh` | Klingon |
| `es` | Spanish | `no` | Norwegian | `tr` | Turkish |
| `fa` | Persian | | | `zh` | Chinese |
| `fi` | Finnish | | | | |
| `fr` | French | | | | |

---

## Normalization (Evasion Detection)

Control how aggressively the filter catches obfuscation attempts:

| Level | What it does | Example |
|-------|-------------|---------|
| `'none'` | Exact match only | `'Fuck'` misses `'fuck'` |
| `'basic'` | Lowercase + strip accents | `'Fück'` → `'fuck'` |
| `'moderate'` | + l33t speak decoding | `'$h1t'` → `'shit'` |
| `'aggressive'` | + homoglyphs + zero-width chars | `'f​uck'` (zero-width) → `'fuck'` |

```ts
const filter = new Profanease({
  languages: [en],
  normalize: 'moderate',    // default
});

filter.check('$h1t');       // true — l33t speak detected
filter.check('@$$hole');    // true
```

```ts
const strict = new Profanease({
  languages: [en],
  normalize: 'aggressive',
});

strict.check('f\u200Buck');    // true — zero-width char stripped
strict.check('fuuuuck');       // true — repeated chars collapsed
```

---

## Content Categories (Guard Rails)

The English pack includes category tags on every word. Use this for fine-grained content policies:

```ts
import { Profanease, Category } from 'profanease';
import { categorized } from 'profanease/langs/en';

// Only block slurs and sexual content — allow mild profanity through
const filter = new Profanease({
  languages: [categorized],
  categories: [Category.SLUR, Category.SEXUAL],
});
```

### Available categories

| Category | Enum | Description |
|----------|------|-------------|
| General profanity | `Category.PROFANITY` | Swear words, expletives |
| Sexual content | `Category.SEXUAL` | Sexual terms, explicit content |
| Slurs | `Category.SLUR` | Racial, ethnic, identity slurs |
| Insults | `Category.INSULT` | Personal insults, derogatory terms |
| Religious | `Category.RELIGIOUS` | Religious profanity, blasphemy |
| Drugs | `Category.DRUGS` | Drug references |
| Violence | `Category.VIOLENCE` | Violent language |

---

## Replacement Strategies

Choose how matched words are censored:

```ts
import { Profanease } from 'profanease';
import en from 'profanease/langs/en';

// Asterisk (default): "****"
new Profanease({ languages: [en], replacement: 'asterisk' });

// Grawlix (comic-style): "@#$%"
new Profanease({ languages: [en], replacement: 'grawlix' });

// Word label: "[censored]"
new Profanease({ languages: [en], replacement: 'word' });

// Full placeholder fill: "****"
new Profanease({ languages: [en], replacement: 'full' });

// Custom function — full control
new Profanease({
  languages: [en],
  replacement: (word) => `[${word.length} chars redacted]`,
});
```

### Custom placeholder character

```ts
const filter = new Profanease({ languages: [en], placeholder: '#' });
filter.clean('fuck');   // '####'
```

---

## Detailed Analysis

`analyze()` returns rich metadata for moderation dashboards, logging, or guard rail decisions:

```ts
const filter = new Profanease({ languages: [en] });
const result = filter.analyze('what the fuck');

// result:
// {
//   isProfane: true,
//   matches: [{
//     original: 'fuck',        // as it appeared in text
//     normalized: 'fuck',      // after normalization
//     matched: 'fuck',         // word list entry it matched
//     index: 9,                // position in original text
//     categories: ['profanity']
//   }],
//   categories: ['profanity'],  // all unique categories found
//   severity: 'mild',           // 'none' | 'mild' | 'moderate' | 'severe'
//   cleaned: 'what the ****'
// }
```

### Severity scoring

| Severity | Criteria |
|----------|----------|
| `'none'` | No matches |
| `'mild'` | 1-2 general profanity matches |
| `'moderate'` | 3+ matches, or sexual/violence content |
| `'severe'` | Any slurs, or 5+ matches |

---

## Dynamic Word Management

### Add words at runtime

```ts
const filter = new Profanease({ languages: [en] });

filter.addWords(['custom-term', 'brand-name']);
filter.check('custom-term');   // true
```

### Remove words at runtime

```ts
const filter = new Profanease({ languages: [en] });

filter.removeWords(['hell', 'damn']);
filter.check('hell');   // false
filter.check('fuck');   // true (still active)
```

### Exclude on initialization

```ts
const filter = new Profanease({
  languages: [en],
  exclude: ['hell', 'damn'],   // these won't be filtered
});
```

### Get the active word list

```ts
const filter = new Profanease({ languages: [en] });

filter.wordsList();       // all currently loaded words
filter.wordsList('es');   // Spanish word list (for reference)
```

---

## Core Utilities

For building custom text processing pipelines, the low-level utilities are exported:

```ts
import {
  normalize,
  tokenize,
  replaceWord,
  decodeLeet,
  normalizeHomoglyphs,
} from 'profanease';

// Normalize text through the full pipeline
normalize('$h1t', 'moderate');       // 'shit'
normalize('café', 'basic');          // 'cafe'

// Decode l33t speak specifically
decodeLeet('@$$h0l3');               // 'asshole'
decodeLeet('$h1t', 'aggressive');    // 'shit' (with aggressive mode)

// Normalize Unicode homoglyphs
normalizeHomoglyphs('\u0430ss');     // 'ass' (Cyrillic 'а' → Latin 'a')

// Tokenize text
tokenize('hello world!');            // [{ value: 'hello', isWord: true }, ...]

// Replace a word with a strategy
replaceWord('fuck', 'grawlix');      // '@#$%'
```

---

## Configuration Reference

### `ProfaneaseOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `languages` | `LanguagePack[]` | all languages | Language packs to load |
| `list` | `string[]` | `[]` | Additional custom words to add |
| `exclude` | `string[]` | `[]` | Words to skip during filtering |
| `emptyList` | `boolean` | `false` | Start with no words (use with `list`) |
| `placeholder` | `string` | `'*'` | Character used for censoring |
| `replacement` | `ReplacementStrategy` | `'asterisk'` | How to replace matches |
| `normalize` | `NormalizationLevel` | `'moderate'` | Evasion detection level |
| `categories` | `Category[]` | all | Only filter these categories |

### `AnalysisResult`

| Field | Type | Description |
|-------|------|-------------|
| `isProfane` | `boolean` | Whether any match was found |
| `matches` | `MatchResult[]` | Detailed info for each match |
| `categories` | `Category[]` | All unique categories found |
| `severity` | `Severity` | Overall severity score |
| `cleaned` | `string` | Text with matches censored |

### `MatchResult`

| Field | Type | Description |
|-------|------|-------------|
| `original` | `string` | Word as it appeared in input |
| `normalized` | `string` | Word after normalization |
| `matched` | `string` | Word list entry it matched against |
| `index` | `number` | Start position in input text |
| `categories` | `Category[]` | Categories of the matched word |

---

## Migrating from v1

Profanease v2 is a complete rewrite. Most v1 options still work for backward compatibility:

| v1 | v2 | Notes |
|----|-----|-------|
| `new Profanease({ lang: 'en' })` | `new Profanease({ languages: [en] })` | Import language packs directly |
| `{ placeHolder: 'x' }` | `{ placeholder: 'x' }` | `placeHolder` still works (deprecated) |
| `require('profanease')` | `require('profanease')` | CJS still supported |
| `isProfane.check(text)` | `filter.check(text)` | Same API |
| `isProfane.clean(text)` | `filter.clean(text)` | Same API |
| `isProfane.addWords([...])` | `filter.addWords([...])` | Same API |
| `isProfane.removeWords([...])` | `filter.removeWords([...])` | Same API |
| `isProfane.wordsList('en')` | `filter.wordsList('en')` | Same API |
| `{ regex, replaceRegex }` | `{ normalize, replacement }` | New approach to customization |
| N/A | `filter.analyze(text)` | New in v2 |
| N/A | `Profanease.custom([...])` | New in v2 |
| N/A | `{ categories: [...] }` | New in v2 |

### v1 code still works:

```ts
// This still works in v2
const filter = new Profanease({ lang: 'en', placeHolder: 'x' });
filter.clean('fuck');   // 'xxxx'
```

---

## License

ISC
