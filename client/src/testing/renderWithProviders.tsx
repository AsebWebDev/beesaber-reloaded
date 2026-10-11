import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { createAppStore } from '@/store/store';

import type { RenderResult } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { ReactElement } from 'react';

type Result = RenderResult & {
  store: ReturnType<typeof createAppStore>;
  user: UserEvent;
};

/**
 * Renders a component the way the app does: with a store and a router.
 * Every call gets a fresh store, so tests do not share state.
 */
const renderWithProviders = (ui: ReactElement, route = '/'): Result => {
  const store = createAppStore();
  const user = userEvent.setup();

  return {
    store,
    user,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>
    ),
  };
};

export default renderWithProviders;
