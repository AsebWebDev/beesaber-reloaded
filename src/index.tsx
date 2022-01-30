import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import './index.scss';

import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';

import store from '@/store/store';

import App from './App';
import worker from './mocks/browser';

async function prepareWorkers(): Promise<void> {
  if (process.env.REACT_APP_MSW === 'enabled') {
    await worker.start();
    // eslint-disable-next-line no-console
    console.log('MSW Worker started');
  }
}

void prepareWorkers().then(() => {
  ReactDOM.render(
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>,
    document.getElementById('root')
  );
});
