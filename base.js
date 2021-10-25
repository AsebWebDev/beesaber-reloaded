/* eslint-disable strict */
const rules = [
  './rules/best-practices',
  './rules/errors',
  './rules/node',
  './rules/style',
  './rules/variables',
  './rules/es6',
  './rules/imports',
  './rules/jest',
  './rules/typescript',
].map(require.resolve);

// const parser = require.resolve('./parser');

module.exports = {
  env: {
    browser: true,
  },

  extends: ['eslint:recommended', ...rules],

  rules: {
    strict: 'error',
  },
};
