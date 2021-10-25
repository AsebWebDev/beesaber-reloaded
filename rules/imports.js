module.exports = {
  plugins: ['import', 'simple-import-sort'],

  rules: {
    'import/export': 'error',
    'import/exports-last': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-amd': 'error',
    'import/no-commonjs': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-named-default': 'error',
    'import/no-unassigned-import': 'error',
    'import/prefer-default-export': 'error',
    'simple-import-sort/imports': [
      'error',
      // The default grouping, but with type imports last as a separate
      // group, sorting that group like non-type imports are grouped.
      // https://github.com/lydell/eslint-plugin-simple-import-sort/blob/v7.0.0/examples/.eslintrc.js#L167
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
    'simple-import-sort/exports': 'error',
  },
};
