import { defineConfig } from 'tsup';
import { readdirSync } from 'fs';

const langFiles = readdirSync('src/langs')
  .filter(f => f.endsWith('.ts') && f !== 'index.ts')
  .map(f => `src/langs/${f}`);

export default defineConfig({
  entry: ['src/index.ts', ...langFiles],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  treeshake: true,
});
