import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['./src/index.ts', 'src/cli.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  shims: true,
  clean: true,
  skipNodeModulesBundle: true,
  outDir: './dist',
});
