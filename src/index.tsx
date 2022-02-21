import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import './index.scss';

import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { MemoryRouter as Router } from 'react-router-dom';
import { injectStyle } from 'react-toastify/dist/inject-style';

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
  injectStyle(); // import Toastify CSS without webpack css loader

  ReactDOM.render(
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>,
    document.getElementById('root')
  );
});
