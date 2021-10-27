/* eslint-disable import/no-commonjs */
const { pathsToModuleNameMapper } = require('ts-jest/utils');

const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  testPathIgnorePatterns: [
    "dist"
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    '^img/': '<rootDir>/src/testing/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/src/testing/__mocks__/styleMock.js',
  },
};
