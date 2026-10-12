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

/**
 * A clock the test moves by hand. Timers are collected and run when the time
 * they were set for is reached, so a test about five minutes of silence takes
 * no time at all.
 */
const createClock = () => {
  let time = 0;
  let nextId = 1;
  let timers: { at: number; callback: () => void; id: number }[] = [];

  return {
    now: () => time,
    setTimer: (callback: () => void, ms: number) => {
      const id = nextId++;

      timers.push({ at: time + ms, callback, id });

      return id;
    },
    clearTimer: (id: unknown) => {
      timers = timers.filter((timer) => timer.id !== id);
    },
    /** Lets time pass and runs every timer that comes due on the way */
    advance: (ms: number) => {
      const end = time + ms;

      for (;;) {
        const [next] = timers
          .filter((timer) => timer.at <= end)
          .sort((a, b) => a.at - b.at);

        if (next === undefined) break;

        timers = timers.filter((timer) => timer !== next);
        time = next.at;
        next.callback();
      }

      time = end;
    },
  };
};

/** Sockets the test controls: it can make them open, speak and close */
const createFakeSockets = (now: () => number) => {
  const sockets: {
    closed: boolean;
    connectedAt: number;
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
      connectedAt: now(),
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

/** Lets the handlers of the messages sent so far run */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

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
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;

  const setup = (
    onScore: (playerId: string) => Promise<unknown> | void = () => {},
    maxPending?: number
  ) => {
    const clock = createClock();
    const { connect, sockets } = createFakeSockets(clock.now);
    const logs: string[] = [];
    const handler = vi.fn(onScore);
    const feed = createLiveFeed({
      clearTimer: clock.clearTimer,
      connect,
      idleTimeoutMs: 5 * MINUTE,
      log: (message) => logs.push(message),
      maxPending,
      now: clock.now,
      onScore: handler,
      reconnect: { minMs: 1000, maxMs: 4000, stableAfterMs: 30 * SECOND },
      setTimer: clock.setTimer,
      url: 'wss://feed.test/ws',
    });

    return { clock, feed, logs, onScore: handler, sockets };
  };

  it('reports the player of every score that arrives', async () => {
    const { feed, onScore, sockets } = setup();

    feed.start();
    sockets[0]!.emit('open');
    sockets[0]!.emit('message', 'Connected to the ScoreSaber WSS');
    sockets[0]!.emit('message', scoreMessage('1'));
    sockets[0]!.emit('message', scoreMessage('2'));
    await settle();

    expect(sockets[0]!.url).toBe('wss://feed.test/ws');
    expect(onScore.mock.calls).toEqual([['1'], ['2']]);
  });

  it('connects again after the connection closed', async () => {
    const { clock, feed, onScore, sockets } = setup();

    feed.start();
    sockets[0]!.emit('close');

    clock.advance(999);
    expect(sockets).toHaveLength(1);

    clock.advance(1);
    expect(sockets).toHaveLength(2);

    sockets[1]!.emit('message', scoreMessage('7'));
    await settle();

    expect(onScore).toHaveBeenCalledWith('7');
  });

  it('waits longer after every failed attempt, up to a limit', () => {
    const { clock, feed, sockets } = setup();
    const waits: number[] = [];

    feed.start();

    // Four attempts in a row fail without ever opening
    for (let attempt = 0; attempt < 4; attempt++) {
      const closedAt = clock.now();

      sockets.at(-1)!.emit('close');
      clock.advance(10 * SECOND);
      waits.push(sockets.at(-1)!.connectedAt - closedAt);
    }

    expect(waits).toEqual([1000, 2000, 4000, 4000]);
  });

  it('starts with a short wait again once a connection has held for a while', () => {
    const { clock, feed, sockets } = setup();

    feed.start();
    sockets[0]!.emit('close');
    clock.advance(1000);
    sockets[1]!.emit('close');
    clock.advance(2000);

    sockets[2]!.emit('open');
    clock.advance(30 * SECOND);

    const closedAt = clock.now();

    sockets[2]!.emit('close');
    clock.advance(10 * SECOND);

    expect(sockets[3]!.connectedAt - closedAt).toBe(1000);
  });

  it('keeps backing off when connections are accepted and dropped right away', () => {
    const { clock, feed, sockets } = setup();
    const waits: number[] = [];

    feed.start();

    // A server in trouble: it lets us in and throws us out a second later
    for (let attempt = 0; attempt < 3; attempt++) {
      sockets.at(-1)!.emit('open');
      clock.advance(SECOND);

      const closedAt = clock.now();

      sockets.at(-1)!.emit('close');
      clock.advance(10 * SECOND);
      waits.push(sockets.at(-1)!.connectedAt - closedAt);
    }

    expect(waits).toEqual([1000, 2000, 4000]);
  });

  it('replaces a connection that has gone silent without closing', () => {
    const { clock, feed, logs, sockets } = setup();

    feed.start();
    sockets[0]!.emit('open');
    sockets[0]!.emit('message', scoreMessage('1'));

    clock.advance(5 * MINUTE - 1);
    expect(sockets[0]!.closed).toBe(false);

    clock.advance(1);
    expect(sockets[0]!.closed).toBe(true);
    expect(logs.at(-1)).toMatch(/silent/);

    clock.advance(SECOND);
    expect(sockets).toHaveLength(2);
  });

  it('counts the silence from the last message, not from the start', () => {
    const { clock, feed, sockets } = setup();

    feed.start();
    sockets[0]!.emit('open');

    // A message every four minutes, for twenty minutes
    for (let count = 0; count < 5; count++) {
      clock.advance(4 * MINUTE);
      sockets[0]!.emit('message', scoreMessage('1'));
    }

    expect(sockets).toHaveLength(1);
    expect(sockets[0]!.closed).toBe(false);
  });

  it('ignores whatever a replaced connection still does', async () => {
    const { clock, feed, onScore, sockets } = setup();

    feed.start();
    sockets[0]!.emit('open');
    clock.advance(5 * MINUTE + SECOND);
    expect(sockets).toHaveLength(2);

    // The old socket wakes up after all, speaks, and only now closes
    sockets[0]!.emit('message', scoreMessage('1'));
    sockets[0]!.emit('close');
    clock.advance(MINUTE);
    await settle();

    expect(onScore).not.toHaveBeenCalled();
    expect(sockets).toHaveLength(2);
  });

  it('drops scores instead of collecting them when handling cannot keep up', async () => {
    // A handler that never finishes, like a database that has stopped answering
    const { feed, logs, onScore, sockets } = setup(
      () => new Promise(() => {}),
      2
    );

    feed.start();
    sockets[0]!.emit('open');
    for (let count = 0; count < 5; count++)
      sockets[0]!.emit('message', scoreMessage(String(count)));
    await settle();

    expect(onScore).toHaveBeenCalledTimes(2);
    expect(feed.status()).toMatchObject({ pending: 2, dropped: 3 });
    expect(logs.some((message) => message.includes('dropped'))).toBe(true);
  });

  it('carries on after a handler failed', async () => {
    const { feed, logs, onScore, sockets } = setup((playerId) =>
      playerId === '1' ? Promise.reject(new Error('boom')) : undefined
    );

    feed.start();
    sockets[0]!.emit('message', scoreMessage('1'));
    sockets[0]!.emit('message', scoreMessage('2'));
    await settle();

    expect(onScore).toHaveBeenCalledTimes(2);
    expect(logs.some((message) => message.includes('boom'))).toBe(true);
    expect(feed.status().pending).toBe(0);
  });

  it('closes the socket and stays closed when stopped', () => {
    const { clock, feed, sockets } = setup();

    feed.start();
    feed.stop();
    sockets[0]!.emit('close');
    clock.advance(10 * MINUTE);

    expect(sockets[0]!.closed).toBe(true);
    expect(sockets).toHaveLength(1);
  });
});
