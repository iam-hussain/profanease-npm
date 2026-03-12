# Profanease

Modern, lightweight profanity detection & content moderation toolkit for JavaScript/TypeScript.

- **Universal** — works in Node.js, Browser, Deno, Bun, and Edge runtimes (no `fs` dependency)
- **Tree-shakeable** — import only the language packs you need
- **Evasion-resistant** — detects l33t speak (`$h1t`), homoglyphs, zero-width character tricks
- **Categorized** — filter by content category (slurs, sexual, insults, drugs, etc.) for guard rails
- **Lightweight** — core engine is tiny; word lists are separate imports
- **Dual format** — ships ESM + CJS with full TypeScript types
- **54 tests** — comprehensive test coverage

## Installation

```bash
npm install profanease
```

## Quick Start

```ts
import { Profanease } from 'profanease';
import en from 'profanease/langs/en';

const filter = new Profanease({ languages: [en] });

filter.check('hello world');        // false
filter.check('what the fuck');      // true
filter.clean('what the fuck');      // "what the ****"
```

## Functional API

For one-off checks without creating an instance:

```ts
import { check, clean, analyze } from 'profanease';
import en from 'profanease/langs/en';

check('some text', { languages: [en] });   // boolean
clean('some text', { languages: [en] });   // censored string
analyze('some text', { languages: [en] }); // detailed analysis result
```

## Language Packs

Import only the languages you need — unused languages are tree-shaken out:

```ts
import en from 'profanease/langs/en';
import es from 'profanease/langs/es';
import fr from 'profanease/langs/fr';

const filter = new Profanease({ languages: [en, es, fr] });
```

Or import all 25 languages:

```ts
import all from 'profanease/langs/all';

const filter = new Profanease({ languages: [all] });
```

**Available languages:** `ar`, `cs`, `da`, `de`, `en`, `eo`, `es`, `fa`, `fi`, `fr`, `hi`, `hu`, `it`, `ja`, `ko`, `nl`, `no`, `pl`, `pt`, `ru`, `sv`, `th`, `tlh`, `tr`, `zh`

## Normalization Levels

Control how aggressively the filter detects evasion attempts:

```ts
// 'none'       — exact match only
// 'basic'      — lowercase + strip accents (default for speed)
// 'moderate'   — basic + l33t speak decoding ($h1t → shit)
// 'aggressive' — moderate + homoglyphs + zero-width char stripping

const filter = new Profanease({
  languages: [en],
  normalize: 'moderate',
});

filter.check('$h1t');      // true (l33t speak detected)
filter.check('f\u200Buck'); // true with 'aggressive' level
```

## Content Categories (Guard Rails)

The English word list includes category tags for fine-grained filtering:

```ts
import { Profanease, Category } from 'profanease';
import { categorized } from 'profanease/langs/en';

// Only block slurs and sexual content — allow mild profanity
const filter = new Profanease({
  languages: [categorized],
  categories: [Category.SLUR, Category.SEXUAL],
});
```

**Categories:** `PROFANITY`, `SEXUAL`, `SLUR`, `INSULT`, `RELIGIOUS`, `DRUGS`, `VIOLENCE`

## Analyze (Detailed Results)

Get rich metadata about matches — useful for moderation dashboards and guard rails:

```ts
const result = filter.analyze('some profane text');

// {
//   isProfane: true,
//   matches: [{ original, normalized, matched, index, categories }],
//   categories: [Category.PROFANITY],
//   severity: 'mild' | 'moderate' | 'severe',
//   cleaned: 'some ******* text'
// }
```

## Replacement Strategies

```ts
// Asterisk (default): "f***"
new Profanease({ languages: [en], replacement: 'asterisk' });

// Grawlix (comic-style): "f@#$"
new Profanease({ languages: [en], replacement: 'grawlix' });

// Word label: "[censored]"
new Profanease({ languages: [en], replacement: 'word' });

// Full replacement: "****"
new Profanease({ languages: [en], replacement: 'full' });

// Custom function:
new Profanease({ languages: [en], replacement: (word) => `[${word.length} chars]` });
```

## Custom Placeholder

```ts
const filter = new Profanease({ languages: [en], placeholder: '#' });
filter.clean('fuck');  // "####"
```

## Add / Remove Words

```ts
const filter = new Profanease({ languages: [en] });

// Add custom words
filter.addWords(['customBad', 'anotherBad']);

// Remove words from filtering
filter.removeWords(['hell', 'damn']);
```

## Empty List + Custom Words

```ts
const filter = new Profanease({ emptyList: true, list: ['bad', 'words'] });
filter.check('bad');    // true
filter.check('fuck');   // false (not in custom list)
```

## Exclude Words

```ts
const filter = new Profanease({ languages: [en], exclude: ['hell', 'damn'] });
filter.check('hell');   // false
filter.check('fuck');   // true
```

## Get Word List

```ts
const filter = new Profanease({ languages: [en] });
filter.wordsList();       // current loaded words
filter.wordsList('es');   // Spanish word list
```

## Advanced: Core Utilities

For building custom pipelines, the core utilities are also exported:

```ts
import { normalize, tokenize, replaceWord, decodeLeet, normalizeHomoglyphs } from 'profanease';

normalize('$h1t', 'moderate');  // "shit"
decodeLeet('@$$h0l3');          // "asshole"
```

## Legacy v1 Compatibility

The v1 `lang` and `placeHolder` options still work:

```ts
const filter = new Profanease({ lang: 'en', placeHolder: 'x' });
filter.clean('fuck');  // "xxxx"
```

## License

ISC
