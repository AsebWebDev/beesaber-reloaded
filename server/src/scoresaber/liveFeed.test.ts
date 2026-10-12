import { describe, expect, it, vi } from 'vitest';

import { createLiveFeed, playerIdOf } from './liveFeed.ts';

import type { Socket } from './liveFeed.ts';

const scoreMessage = (playerId: unknown) =>
  JSON.stringify({
    commandName: 'score',
    commandData: {
      score: { id: 1, leaderboardPlayerInfo: { id: playerId, name: 'x' } },
      leaderboard: { id: 2 },
    },
  });

/** A socket the test controls: it can make it open, speak and close */
const createFakeSockets = () => {
  const sockets: {
    closed: boolean;
    emit: (type: string, data?: unknown) => void;
    url: string;
  }[] = [];

  const connect = (url: string): Socket => {
    const listeners = new Map<
      string,
      ((event: { data?: unknown }) => void)[]
    >();
    const socket = {
      url,
      closed: false,
      emit: (type: string, data?: unknown) => {
        for (const listener of listeners.get(type) ?? []) listener({ data });
      },
    };

    sockets.push(socket);

    return {
      addEventListener: (type, listener) => {
        listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      },
      close: () => {
        socket.closed = true;
      },
    };
  };

  return { connect, sockets };
};

/** Collects timers instead of waiting for them */
const createTimers = () => {
  const timers: { callback: () => void; ms: number }[] = [];

  return {
    timers,
    setTimer: (callback: () => void, ms: number) => {
      timers.push({ callback, ms });
    },
  };
};

describe('playerIdOf', () => {
  it('reads the player id from a score message', () => {
    expect(playerIdOf(scoreMessage('76561198000000001'))).toBe(
      '76561198000000001'
    );
  });

  it('ignores the greeting, which is not JSON', () => {
    expect(playerIdOf('Connected to the ScoreSaber WSS')).toBeUndefined();
  });

  it('ignores messages of another kind', () => {
    expect(
      playerIdOf(JSON.stringify({ commandName: 'ping', commandData: {} }))
    ).toBeUndefined();
  });

  it('ignores a score message that looks different than expected', () => {
    expect(
      playerIdOf(JSON.stringify({ commandName: 'score', commandData: {} }))
    ).toBeUndefined();
    expect(playerIdOf(scoreMessage(12345))).toBeUndefined();
    expect(playerIdOf(scoreMessage("1'; drop table players"))).toBeUndefined();
  });

  it('ignores data that is not text', () => {
    expect(playerIdOf(new Uint8Array([1, 2, 3]))).toBeUndefined();
  });
});

describe('createLiveFeed', () => {
  const setup = () => {
    const { connect, sockets } = createFakeSockets();
    const { setTimer, timers } = createTimers();
    const onScore = vi.fn();
    const feed = createLiveFeed({
      connect,
      log: () => {},
      onScore,
      reconnect: { minMs: 1000, maxMs: 4000 },
      setTimer,
      url: 'wss://feed.test/ws',
    });

    return { feed, onScore, sockets, timers };
  };

  it('reports the player of every score that arrives', () => {
    const { feed, onScore, sockets } = setup();

    feed.start();
    sockets[0]!.emit('open');
    sockets[0]!.emit('message', 'Connected to the ScoreSaber WSS');
    sockets[0]!.emit('message', scoreMessage('1'));
    sockets[0]!.emit('message', scoreMessage('2'));

    expect(sockets[0]!.url).toBe('wss://feed.test/ws');
    expect(onScore.mock.calls).toEqual([['1'], ['2']]);
  });

  it('connects again after the connection closed', () => {
    const { feed, onScore, sockets, timers } = setup();

    feed.start();
    sockets[0]!.emit('close');

    expect(timers.map((timer) => timer.ms)).toEqual([1000]);

    timers[0]!.callback();
    sockets[1]!.emit('message', scoreMessage('7'));

    expect(sockets).toHaveLength(2);
    expect(onScore).toHaveBeenCalledWith('7');
  });

  it('waits longer after every failed attempt, up to a limit', () => {
    const { feed, sockets, timers } = setup();

    feed.start();

    // Four attempts in a row fail without ever opening
    for (let attempt = 0; attempt < 4; attempt++) {
      sockets.at(-1)!.emit('close');
      timers.at(-1)!.callback();
    }

    expect(timers.map((timer) => timer.ms)).toEqual([1000, 2000, 4000, 4000]);
  });

  it('starts with a short wait again once a connection worked', () => {
    const { feed, sockets, timers } = setup();

    feed.start();
    sockets[0]!.emit('close');
    timers[0]!.callback();
    sockets[1]!.emit('close');
    timers[1]!.callback();

    sockets[2]!.emit('open');
    sockets[2]!.emit('close');

    expect(timers.map((timer) => timer.ms)).toEqual([1000, 2000, 1000]);
  });

  it('closes the socket and stays closed when stopped', () => {
    const { feed, sockets, timers } = setup();

    feed.start();
    feed.stop();
    sockets[0]!.emit('close');

    expect(sockets[0]!.closed).toBe(true);
    expect(timers).toEqual([]);
  });
});
