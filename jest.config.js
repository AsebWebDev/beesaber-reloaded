/* eslint-disable import/no-commonjs */
const { pathsToModuleNameMapper } = require('ts-jest/utils');

const paths = {
  "@/*": ["./src/*"]
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testPathIgnorePatterns: ['dist'],
  moduleNameMapper: pathsToModuleNameMapper(paths, {
    prefix: '<rootDir>/',
    '^img/': '<rootDir>/app/js/testing/__mocks__/fileMock.js',
    '^emoji-datasource/': '<rootDir>/app/js/testing/__mocks__/fileMock.js',
  }),
  transform: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/testing/__mocks__/fileTransformer.js',
  },
};
