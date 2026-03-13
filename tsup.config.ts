import { defineConfig } from 'tsup';
import { readdirSync } from 'fs';

const langFiles = readdirSync('src/langs')
  .filter(f => f.endsWith('.ts') && f !== 'index.ts')
  .map(f => `src/langs/${f}`);

export default defineConfig([
  // Library build: ESM + CJS with types
  {
    entry: ['src/index.ts', ...langFiles],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    target: 'es2022',
    splitting: false,
    sourcemap: true,
    outDir: 'dist',
    treeshake: true,
  },
  // MCP server build: ESM only, no types needed
  {
    entry: ['src/mcp-server.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
    target: 'es2022',
    splitting: false,
    sourcemap: false,
    outDir: 'dist',
    treeshake: true,
    async onSuccess() {
      const { readFileSync, writeFileSync, chmodSync } = await import('fs');
      const path = 'dist/mcp-server.js';
      const content = readFileSync(path, 'utf8');
      if (!content.startsWith('#!/usr/bin/env node')) {
        writeFileSync(path, '#!/usr/bin/env node\n' + content);
      }
      chmodSync(path, 0o755);
    },
  },
]);
