// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  // Extend ESLint's recommended rules
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  // Ignore patterns
  ignores: ['node_modules/**', 'dist/**'],
});
