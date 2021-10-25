// eslint-disable-next-line strict
module.exports = {
  env: {
    'jest/globals': true,
  },

  plugins: ['jest'],

  extends: ['plugin:jest/recommended'],

  rules: {
    'jest/consistent-test-it': 'error',
    'jest/expect-expect': [
      'error',
      { assertFunctionNames: ['expect', 'expectSaga'] },
    ],
    'jest/no-restricted-matchers': [
      'error',
      {
        toBeTruthy: 'Avoid `toBeTruthy`',
        toBeFalsy: 'Avoid `toBeFalsy`',
      },
    ],
    'jest/no-done-callback': 'error',
    'jest/prefer-called-with': 'error',
    'jest/prefer-strict-equal': 'error',
    // 'jest/prefer-to-be': 'error',
    'jest/prefer-to-contain': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/prefer-todo': 'error',
    'jest/require-to-throw-message': 'error',
    'jest/valid-title': 'error',
  },
};
