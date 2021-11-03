import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';
import styled from 'styled-components';

import ScrollDownIndicator from './components/common/ScrollDownIndicator/ScrollDownIndicator';
import MainContent from './components/pages/MainContent/MainContent';
import Menu from './components/pages/Menu/Menu';
import useIsMobile from './sharedHooks/useIsMobile';
import { useAppSelector } from './store/hooks';
import { selectIsLoggedIn } from './store/reducer/appStatusReducer';
import { mediaQuery } from './tokens/definitions/layout';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 101vw;

  ${mediaQuery.sm} {
    flex-direction: row;
  }
`;

function App(): JSX.Element {
  const { isMobile } = useIsMobile();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return (
    <Container>
      {isLoggedIn && <Menu />}
      {isMobile && <ScrollDownIndicator />}
      <MainContent />
      <ToastContainer theme="dark" />
    </Container>
  );
}

export default App;
