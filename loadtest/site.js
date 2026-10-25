// Load test of the site: visitors who open the start page, as a browser
// does, and now and then ask the API something. Run it with Docker, see
// loadtest/README.md.
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { Counter } from 'k6/metrics';

// k6 hands the environment variables to the script in this global
/* global __ENV */

const BASE_URL = __ENV.BASE_URL ?? 'https://beesaber.de';

// The API limits each address to 60 requests a minute on its open routes.
// All visitors of this test share one address, so most of their API
// requests are refused on purpose; they are counted, not failed.
const rateLimited = new Counter('rate_limited');

// What a current browser sends, so that the server picks the compressed
// copies of the files
const HEADERS = { 'Accept-Encoding': 'br, gzip' };

export const options = {
  scenarios: {
    // More visitors step by step, each step held for a while, to see at
    // which number the answers get slow
    visitors: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 400 },
        { duration: '1m', target: 400 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    // A page that takes longer than this feels slow
    'http_req_duration{kind:page}': ['p(95)<500'],
    'http_req_duration{kind:file}': ['p(95)<500'],
    // Errors other than the API's deliberate 429
    http_req_failed: ['rate<0.01'],
  },
};

// The built files have a hash in their names, which changes with every
// release, so they are read from the page once, before the test
export const setup = () => {
  const page = http.get(`${BASE_URL}/`);
  const files = [
    ...page.body.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g),
  ].map(([, path]) => path);

  if (files.length === 0) throw new Error('No files found in the page');

  return { files };
};

export default ({ files }) => {
  const page = http.get(`${BASE_URL}/`, {
    headers: HEADERS,
    tags: { kind: 'page' },
  });

  check(page, { 'page answers 200': (r) => r.status === 200 });

  // The files' names change with their content, so a browser keeps them for
  // good: only a visitor's first visit loads them, side by side
  if (exec.vu.iterationInScenario === 0) {
    const loaded = http.batch(
      files.map((path) => [
        'GET',
        `${BASE_URL}${path}`,
        null,
        { headers: HEADERS, tags: { kind: 'file' } },
      ])
    );

    check(loaded, {
      'files answer 200': (rs) => rs.every((r) => r.status === 200),
    });
  }

  // One visit in ten asks the API which ways to sign in exist, as the
  // landing page does
  if (Math.random() < 0.1) {
    const api = http.get(`${BASE_URL}/api/config`, {
      tags: { kind: 'api' },
      responseCallback: http.expectedStatuses(200, 429),
    });

    if (api.status === 429) rateLimited.add(1);

    check(api, {
      'api answers 200 or 429': (r) => [200, 429].includes(r.status),
    });
  }

  // Reading the page before the next visit
  sleep(1);
};
