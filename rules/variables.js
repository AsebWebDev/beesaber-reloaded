module.exports = {
  rules: {
    'no-label-var': 'error',
    'no-restricted-globals': 'error',
    'no-shadow': 'error',
    'no-shadow-restricted-names': 'error',
    'no-undef-init': 'error',
    'no-unused-vars': [
      'error',
      { args: 'after-used', vars: 'all', ignoreRestSiblings: true },
    ],
    'no-use-before-define': 'error',
  },
};
