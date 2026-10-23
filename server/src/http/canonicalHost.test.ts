import { describe, expect, it } from 'vitest';

import { withCanonicalHost } from './canonicalHost.ts';

const site = withCanonicalHost(
  { fetch: () => new Response('the app') },
  'https://beesaber.de'
);

describe('the www form of the address', () => {
  it('sends visitors on to the address itself, keeping the path and query', async () => {
    const response = await site.fetch(
      new Request('https://www.beesaber.de/hive/1?tab=songs')
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://beesaber.de/hive/1?tab=songs'
    );
  });

  it('leaves the address itself alone', async () => {
    const response = await site.fetch(
      new Request('https://beesaber.de/hive/1')
    );

    expect(await response.text()).toBe('the app');
  });

  it('leaves other addresses alone, like the one Azure gives the app', async () => {
    const response = await site.fetch(
      new Request(
        'https://ca-beesaber.example.azurecontainerapps.io/api/health'
      )
    );

    expect(await response.text()).toBe('the app');
  });
});
