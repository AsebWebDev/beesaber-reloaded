/**
 * Where the demo's browser-made API lives (see client/src/demo/main.tsx):
 * a path the real server has no route for. A request the demo failed to
 * answer itself then gets a 404 from the server, and never reaches the
 * real API with a visitor's session cookie.
 */
const DEMO_API_PREFIX = '/demo-api';

/** What every request to our API starts with */
const API_BASE = `${window.location.origin}${
  import.meta.env.MODE === 'demo' ? DEMO_API_PREFIX : ''
}`;

export { API_BASE, DEMO_API_PREFIX };
