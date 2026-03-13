#!/usr/bin/env node
/**
 * Profanease MCP Server
 *
 * Exposes profanity detection and content moderation as MCP tools
 * that AI assistants can invoke via the Model Context Protocol.
 *
 * Usage:
 *   npx profanease-mcp
 *   # or in MCP config:
 *   { "command": "npx", "args": ["profanease-mcp"] }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Profanease } from './profanease.js';
import { Category } from './types.js';
import all from './langs/all.js';
import en from './langs/en.js';

const CATEGORY_VALUES = [
  'profanity',
  'sexual',
  'slur',
  'insult',
  'religious',
  'drugs',
  'violence',
] as const;

const NORMALIZATION_VALUES = ['none', 'basic', 'moderate', 'aggressive'] as const;

const server = new McpServer({
  name: 'profanease',
  version: '2.0.1',
});

// ── Tool: check ──────────────────────────────────────────────

server.tool(
  'profanease_check',
  'Check if text contains profanity or inappropriate content. Returns true/false. Useful as a guard rail before processing user input.',
  {
    text: z.string().describe('The text to check for profanity'),
    language: z
      .enum(['en', 'all'])
      .default('en')
      .describe('Language pack: "en" for English only, "all" for all 25 languages'),
    normalize: z
      .enum(NORMALIZATION_VALUES)
      .default('moderate')
      .describe(
        'Evasion detection level. "moderate" catches l33t speak ($h1t→shit). "aggressive" also catches homoglyphs and zero-width chars.',
      ),
    categories: z
      .array(z.enum(CATEGORY_VALUES))
      .optional()
      .describe(
        'Only check these categories. Omit to check all. Options: profanity, sexual, slur, insult, religious, drugs, violence',
      ),
    custom_words: z
      .array(z.string())
      .optional()
      .describe(
        'Custom words to add to the filter. Use alone (without language packs) for purely custom filtering.',
      ),
    custom_only: z
      .boolean()
      .default(false)
      .describe(
        'If true, only use custom_words with no built-in word lists. Great for brand-specific or domain-specific filtering.',
      ),
  },
  async ({ text, language, normalize, categories, custom_words, custom_only }) => {
    const filter = createFilter({ language, normalize, categories, custom_words, custom_only });
    const result = filter.check(text);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ isProfane: result }, null, 2),
        },
      ],
    };
  },
);

// ── Tool: clean ──────────────────────────────────────────────

server.tool(
  'profanease_clean',
  'Clean text by replacing profane words with placeholders (e.g. "fuck" → "****"). Returns the censored text.',
  {
    text: z.string().describe('The text to clean'),
    language: z.enum(['en', 'all']).default('en'),
    normalize: z.enum(NORMALIZATION_VALUES).default('moderate'),
    placeholder: z.string().default('*').describe('Character used for censoring (default: *)'),
    replacement: z
      .enum(['asterisk', 'grawlix', 'word', 'full'])
      .default('asterisk')
      .describe(
        'Replacement style. asterisk: "****", grawlix: "@#$%", word: "[censored]", full: repeated placeholder',
      ),
    categories: z.array(z.enum(CATEGORY_VALUES)).optional(),
    custom_words: z.array(z.string()).optional(),
    custom_only: z.boolean().default(false),
  },
  async ({
    text,
    language,
    normalize,
    placeholder,
    replacement,
    categories,
    custom_words,
    custom_only,
  }) => {
    const filter = createFilter({
      language,
      normalize,
      categories,
      custom_words,
      custom_only,
      placeholder,
      replacement,
    });
    const result = filter.clean(text);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ cleaned: result }, null, 2) }],
    };
  },
);

// ── Tool: analyze ────────────────────────────────────────────

server.tool(
  'profanease_analyze',
  'Analyze text for profanity with detailed results including each match, its category, position, severity score, and cleaned text. Best for content moderation dashboards and guard rail decisions.',
  {
    text: z.string().describe('The text to analyze'),
    language: z.enum(['en', 'all']).default('en'),
    normalize: z.enum(NORMALIZATION_VALUES).default('moderate'),
    categories: z.array(z.enum(CATEGORY_VALUES)).optional(),
    custom_words: z.array(z.string()).optional(),
    custom_only: z.boolean().default(false),
  },
  async ({ text, language, normalize, categories, custom_words, custom_only }) => {
    const filter = createFilter({ language, normalize, categories, custom_words, custom_only });
    const result = filter.analyze(text);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  },
);

// ── Helper ───────────────────────────────────────────────────

function createFilter(opts: {
  language?: string;
  normalize?: string;
  categories?: string[];
  custom_words?: string[];
  custom_only?: boolean;
  placeholder?: string;
  replacement?: string;
}): Profanease {
  const categoryEnums = opts.categories?.map(
    (c) => Category[c.toUpperCase() as keyof typeof Category],
  );

  if (opts.custom_only && opts.custom_words?.length) {
    return Profanease.custom(opts.custom_words, {
      normalize: (opts.normalize as 'moderate') ?? 'moderate',
      categories: categoryEnums,
      placeholder: opts.placeholder,
      replacement: (opts.replacement as 'asterisk') ?? 'asterisk',
    });
  }

  const langPack = opts.language === 'all' ? all : en;

  return new Profanease({
    languages: [langPack],
    normalize: (opts.normalize as 'moderate') ?? 'moderate',
    categories: categoryEnums,
    list: opts.custom_words,
    placeholder: opts.placeholder,
    replacement: (opts.replacement as 'asterisk') ?? 'asterisk',
  });
}

// ── Start ────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Profanease MCP server failed to start:', error);
  process.exit(1);
});
