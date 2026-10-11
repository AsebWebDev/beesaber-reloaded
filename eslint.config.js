import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/dist',
    'client/public/mockServiceWorker.js',
    // The server is rewritten in phase 3 and gets linted from then on
    'server',
  ]),

  js.configs.recommended,

  // Rules that use type information, so they also catch things like a
  // promise nobody waits for
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/exports': 'error',
      // The default grouping, but with type imports last as a group of their own
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^@?\\w'],
            ['^'],
            ['^\\.'],
            ['^@?\\w.*\\u0000$', '^[^.].*\\u0000$', '^\\..*\\u0000$'],
          ],
        },
      ],
    },
  },

  {
    files: ['client/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // The components written before this rule existed derive state in
      // effects. They get rewritten in phase 5; until then this only warns.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  {
    // Config files are plain JavaScript without a tsconfig behind them
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Formatting is Prettier's job, switch off every rule that overlaps with it
  prettier
);
