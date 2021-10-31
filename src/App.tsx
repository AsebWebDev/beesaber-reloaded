import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';

import MainContent from './components/pages/MainContent/MainContent';
import Menu from './components/pages/Menu/Menu';
import { useAppSelector } from './store/hooks';
import { selectIsLoggedIn } from './store/reducer/appStatusReducer';

function App(): JSX.Element {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return (
    <div className="App">
      {isLoggedIn && <Menu />}
      <MainContent />
      <ToastContainer theme="dark" />
    </div>
  );
}

export default App;
