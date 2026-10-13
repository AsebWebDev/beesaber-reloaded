import { useEffect } from 'react';

const APP_NAME = 'BeeSaber';

/**
 * Sets what the browser tab says. A screen reader announces the title when a
 * page opens, and it is what tells several open tabs apart. Without a title
 * of its own, a page gets the name of the app.
 */
const usePageTitle = (title?: string) => {
  useEffect(() => {
    document.title = title === undefined ? APP_NAME : `${title} · ${APP_NAME}`;
  }, [title]);
};

export { usePageTitle };
