import { Route, useHistory } from 'react-router-dom';

import { useAppSelector } from '@/store/hooks';
import { selectIsLoggedIn } from '@/store/reducer/appStatusReducer';

type Props = {
  component: () => JSX.Element | null;
  path: string;
};

function PrivateRoute({ component, path }: Props): JSX.Element {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const history = useHistory();

  if (!isLoggedIn) history.push('/');

  return <Route path={path} component={component} />;
}

export default PrivateRoute;
