/**
 * The English texts, and the shape every other language has to match.
 *
 * Keys are grouped by the part of the app that shows them. A text with
 * `{{name}}` gets a value filled in. Keys ending in `_one` and `_other` are
 * the singular and plural of the same text; the app asks for the key without
 * the ending, with a `count`, and i18next picks the form the language needs.
 *
 * A tag like `<home>…</home>` marks where the app puts a link or another
 * element around part of a text. Never name one after an HTML element that
 * has no content, like `link`, `img` or `br`: i18next reads those as
 * empty and leaves the text outside of them.
 */
const en = {
  common: {
    loading: 'Loading',
    signOut: 'Sign out',
    somethingWentWrong: 'Something went wrong',
    tryAgain: 'Try again',
  },
  layout: {
    dashboard: 'Dashboard',
    hive: 'My hive',
    mainMenu: 'Main',
    profile: 'My profile',
    skipToContent: 'Skip to content',
    sync: {
      button: 'Sync scores',
      done: 'Scores are up to date.',
      running: 'Fetching scores from ScoreSaber…',
      upToDate: 'Already up to date, checked less than a minute ago.',
    },
  },
  notFound: {
    text: 'There is nothing at this address. <home>Back to the dashboard</home>',
    title: 'Page not found',
  },
  crash: {
    backToStart: 'Back to the start',
    reload: 'Reload',
    text: 'This page could not be shown. Loading it again usually helps.',
    title: 'Something went wrong',
  },
  pagination: {
    label: 'Pages',
    next: 'Next',
    position: 'Page {{page}} of {{total}}',
    previous: 'Previous',
  },
};

export { en };
