module.exports = {
  plugins: ['react'],

  extends: ['plugin:react/recommended'],

  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: {
    'react/button-has-type': 'error',
    'react/jsx-boolean-value': 'error',
    'react/jsx-fragments': 'error',
    'react/jsx-handler-names': 'error',
    'react/jsx-no-bind': ['error', { allowArrowFunctions: true }],
    'react/jsx-pascal-case': 'error',
    'react/no-access-state-in-setstate': 'error',
    'react/no-array-index-key': 'error',
    'react/no-danger': 'error',
    'react/no-did-mount-set-state': 'error',
    'react/no-did-update-set-state': 'error',
    'react/no-multi-comp': 'error',
    'react/no-this-in-sfc': 'error',
    'react/no-typos': 'error',
    'react/no-unsafe': 'error',
    'react/no-unused-prop-types': 'error',
    'react/no-unused-state': 'error',
    'react/no-will-update-set-state': 'error',
    'react/prefer-es6-class': 'error',
    'react/prefer-stateless-function': 'error',
    'react/style-prop-object': 'error',
    'react/void-dom-elements-no-children': 'error',
  },
};
