import { setupWorker } from 'msw/browser';

import handlers from './handlers';

// Answers API calls in the browser, used by `pnpm client:mock`
const worker = setupWorker(...handlers);

export default worker;
