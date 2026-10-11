import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.ts';

const required = {
  DATABASE_URL: 'postgres://user:password@localhost:5432/db',
  AUTH_SECRET: 'a-secret-that-is-long-enough-for-the-check',
};

describe('loadConfig', () => {
  it('fills in defaults for everything optional', () => {
    expect(loadConfig(required)).toEqual({
      ...required,
      NODE_ENV: 'development',
      PORT: 5001,
      SCORESABER_URL: 'https://scoresaber.com',
      APP_URL: 'http://localhost:3000',
      DEV_LOGIN: false,
    });
  });

  it('turns the port into a number', () => {
    expect(loadConfig({ ...required, PORT: '8080' }).PORT).toBe(8080);
  });

  it('treats an empty value like a missing one', () => {
    const config = loadConfig({ ...required, PORT: '', GOOGLE_CLIENT_ID: '' });

    expect(config.PORT).toBe(5001);
    expect(config.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it('names the variable that is missing', () => {
    expect(() => loadConfig({ AUTH_SECRET: required.AUTH_SECRET })).toThrow(
      /DATABASE_URL/
    );
  });

  it('rejects a database URL for another kind of database', () => {
    expect(() =>
      loadConfig({
        ...required,
        DATABASE_URL: 'mongodb://localhost:27017/beesaber',
      })
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a secret that is too short to be safe', () => {
    expect(() => loadConfig({ ...required, AUTH_SECRET: 'short' })).toThrow(
      /AUTH_SECRET/
    );
  });

  it('wants the Google client id and secret together', () => {
    expect(() =>
      loadConfig({ ...required, GOOGLE_CLIENT_ID: 'only-the-id' })
    ).toThrow(/GOOGLE_CLIENT_SECRET/);
  });

  it('reads DEV_LOGIN as a yes or no', () => {
    expect(loadConfig({ ...required, DEV_LOGIN: 'true' }).DEV_LOGIN).toBe(true);
    expect(loadConfig({ ...required, DEV_LOGIN: 'false' }).DEV_LOGIN).toBe(
      false
    );
  });

  it('refuses the test account sign-in in production', () => {
    expect(() =>
      loadConfig({ ...required, DEV_LOGIN: 'true', NODE_ENV: 'production' })
    ).toThrow(/DEV_LOGIN/);
  });
});
