// Shared flat ESLint config for all NearBite packages.
// Encodes the coding standards from the foundation (E §4) and the
// module-boundary law (E §2) that keeps the modular monolith honest.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // --- Standards E§4 ---
      '@typescript-eslint/no-explicit-any': 'error', // use `unknown` + narrow
      '@typescript-eslint/no-floating-promises': 'off', // enabled in type-aware overrides per-app
      '@typescript-eslint/consistent-type-imports': 'error', // explicit `import type`
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ThrowStatement > Literal',
          message: 'Throw a typed domain error, never a string literal.',
        },
      ],
    },
  },
  {
    ignores: ['**/dist/**', '**/.next/**', '**/.expo/**', '**/node_modules/**'],
  },
);
