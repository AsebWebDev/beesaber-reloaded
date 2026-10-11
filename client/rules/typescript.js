module.exports = {
  overrides: [
    {
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      files: ['*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          {
            assertionStyle: 'as',
            objectLiteralTypeAssertions: 'allow',
          },
        ],
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/member-ordering': [
          'error',
          { default: { memberTypes: 'never', order: 'alphabetically' } },
        ],
        '@typescript-eslint/method-signature-style': 'error',
        '@typescript-eslint/no-base-to-string': 'error',
        '@typescript-eslint/no-confusing-non-null-assertion': 'error',

        '@typescript-eslint/no-confusing-void-expression': [
          'error',
          { ignoreArrowShorthand: true },
        ],
        '@typescript-eslint/no-dynamic-delete': 'error',
        '@typescript-eslint/no-implicit-any-catch': 'error',
        '@typescript-eslint/no-invalid-void-type': 'error',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
        '@typescript-eslint/no-unnecessary-condition': [
          'error',
          { allowConstantLoopConditions: true },
        ],
        '@typescript-eslint/no-unnecessary-type-arguments': 'error',
        '@typescript-eslint/no-unnecessary-type-constraint': 'error',
        '@typescript-eslint/non-nullable-type-assertion-style': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-includes': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/prefer-reduce-type-parameter': 'error',
        '@typescript-eslint/prefer-string-starts-ends-with': 'error',
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        '@typescript-eslint/promise-function-async': 'error',
        '@typescript-eslint/require-array-sort-compare': [
          'error',
          { ignoreStringArrays: true },
        ],
        '@typescript-eslint/sort-type-union-intersection-members': 'error',
        '@typescript-eslint/strict-boolean-expressions': [
          'error',
          { allowNumber: false },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        '@typescript-eslint/unified-signatures': 'error',

        // Extension rules
        // https://github.com/typescript-eslint/typescript-eslint/tree/v4.15.0/packages/eslint-plugin#extension-rules
        '@typescript-eslint/dot-notation': 'error',
        'dot-notation': 'off',
        '@typescript-eslint/no-duplicate-imports': 'error',
        'no-duplicate-imports': 'off',
        '@typescript-eslint/no-loop-func': 'error',
        'no-loop-func': 'off',
        '@typescript-eslint/no-redeclare': 'error',
        '@typescript-eslint/no-shadow': 'error',
        'no-shadow': 'off',
        '@typescript-eslint/no-throw-literal': 'error',
        'no-throw-literal': 'off',
        '@typescript-eslint/no-unused-expressions': 'error',
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { ignoreRestSiblings: true },
        ],
        '@typescript-eslint/no-use-before-define': 'error',
        'no-use-before-define': 'off',
        '@typescript-eslint/return-await': 'error',
        'no-return-await': 'off',

        // https://github.com/typescript-eslint/typescript-eslint/issues/561#issuecomment-496664453
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message:
              "Don't declare Enums. Use `as const` instead (see: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)",
          },
        ],

        // This rule warns when using explicit typing over casting
        // See https://planetromeo.slack.com/archives/C01JLPA99N0/p1615983778010500
        '@typescript-eslint/no-unsafe-assignment': 'off',

        // The following rules should be errors
        // But we have a lot of javascript code that is understood as any
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
      },
    },
    {
      files: ['*.test.{ts,tsx}'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error',
      },
    },
  ],

  parserOptions: {
    project: './tsconfig.json',
  },
};
