import { setupServer } from 'msw/node';

import handlers from './handlers';

// Answers API calls in Node, used by the tests
const server = setupServer(...handlers);

export default server;
