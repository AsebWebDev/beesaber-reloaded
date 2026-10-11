import { describe, expect, it } from 'vitest';

import { loadConfig } from './config.ts';

const DATABASE_URL = 'postgres://user:password@localhost:5432/db';

describe('loadConfig', () => {
  it('fills in defaults for everything optional', () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      PORT: 5001,
      DATABASE_URL,
      SCORESABER_URL: 'https://scoresaber.com',
    });
  });

  it('turns the port into a number', () => {
    expect(loadConfig({ DATABASE_URL, PORT: '8080' }).PORT).toBe(8080);
  });

  it('treats an empty value like a missing one', () => {
    const config = loadConfig({ DATABASE_URL, PORT: '', DEV_PLAYER_ID: '' });

    expect(config.PORT).toBe(5001);
    expect(config.DEV_PLAYER_ID).toBeUndefined();
  });

  it('names the variable that is missing', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a database URL for another kind of database', () => {
    expect(() =>
      loadConfig({ DATABASE_URL: 'mongodb://localhost:27017/beesaber' })
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a player id that is not numeric', () => {
    expect(() =>
      loadConfig({ DATABASE_URL, DEV_PLAYER_ID: 'not-a-number' })
    ).toThrow(/DEV_PLAYER_ID/);
  });
});
