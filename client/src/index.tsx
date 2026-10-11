import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import './index.scss';

import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';

import store from '@/store/store';

import App from './App';

async function prepareWorkers(): Promise<void> {
  if (import.meta.env.VITE_MSW === 'enabled') {
    // Loaded on demand, so msw is not part of the production bundle
    const { default: worker } = await import('./mocks/browser');

    await worker.start({ onUnhandledFrame: 'bypass' });

    console.log('MSW Worker started');
  }
}

void prepareWorkers().then(() => {
  const container = document.getElementById('root');

  if (container === null) throw new Error('Root element is missing');

  createRoot(container).render(
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  );
});
