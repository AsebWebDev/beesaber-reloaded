module.exports = {
  rules: {
    'func-name-matching': 'error',
    'func-names': ['error', 'never'],
    'id-blacklist': 'error',
    'id-match': 'error',
    'max-depth': 'error',
    'max-len': [
      'error',
      120,
      {
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTrailingComments: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'max-lines': ['warn', { max: 450, skipComments: true }],
    'max-nested-callbacks': 'error',
    'no-array-constructor': 'error',
    'no-bitwise': 'error',
    'no-continue': 'error',
    'no-lonely-if': 'error',
    'no-new-object': 'error',
    'no-restricted-syntax': 'error',
    'no-tabs': 'error',
    'no-unneeded-ternary': 'error',
    'one-var': ['error', 'never'],
    'operator-assignment': 'error',
    'padding-line-between-statements': [
      'error',
      // lines-around-directive
      { blankLine: 'always', prev: 'directive', next: '*' },
      { blankLine: 'any', prev: 'directive', next: 'directive' },

      // newline after var
      { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
      {
        blankLine: 'any',
        prev: ['const', 'let', 'var'],
        next: ['const', 'let', 'var'],
      },

      // newline before return
      { blankLine: 'always', prev: '*', next: 'return' },

      // newline before export
      { blankLine: 'always', prev: '*', next: 'export' },
      { blankLine: 'any', prev: 'export', next: 'export' },
    ],
    'spaced-comment': 'error',
  },
};
