import { Route, useHistory } from 'react-router-dom';

import { useAppSelector } from '@/store/hooks';
import { selectIsLoggedIn } from '@/store/reducer/appStatusReducer';

import type { ComponentType } from 'react';
import type { RouteComponentProps } from 'react-router-dom';

type Props = {
  component:
    | ComponentType<JSX.Element>
    | ComponentType<RouteComponentProps<Record<string, string | undefined>>>;
  path: string;
};

function PrivateRoute({ component, path }: Props): JSX.Element {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const history = useHistory();

  if (!isLoggedIn) history.push('/');

  return <Route path={path} component={component} />;
}

export default PrivateRoute;
