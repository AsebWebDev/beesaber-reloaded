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
  landing: {
    credits:
      'Scores and players come from <scoresaber>ScoreSaber</scoresaber>. BeeSaber is a fan project and not affiliated with ScoreSaber, Beat Games or Meta. Beat Saber is a trademark of Meta Platforms, Inc.',
    devLogin: 'Dev Login',
    google: 'Sign in with Google',
    noSignIn: 'No way to sign in is configured on the server.',
    private:
      '<strong>BeeSaber is a private, non-commercial project.</strong> Sign-in is open only to friends of the developer who have been invited. If you were not invited, Google will not let you sign in.',
    slogan: 'Find your hive',
    tagline:
      'Compare your Beat Saber scores with your friends. See where they are ahead of you, and hear about it when someone beats your score.',
  },
  onboarding: {
    heading: 'Which player are you?',
    intro:
      'BeeSaber compares scores from ScoreSaber. Find your profile there, and we fetch your scores. You can change this later on your profile page.',
    signedInAs: 'Signed in as {{email}}.',
    title: 'Pick your profile',
  },
  // Picking one's own ScoreSaber profile, at the start and on the profile page
  pickProfile: {
    action: 'This is me',
    actionFor: 'This is me: {{name}}',
    searchLabel: 'Your name on ScoreSaber',
  },
  playerSearch: {
    found_one: '{{count}} player found.',
    found_other: '{{count}} players found.',
    hint_one: 'Type at least {{count}} character.',
    hint_other: 'Type at least {{count}} characters.',
    nobody: 'No player called “{{name}}” found.',
    placeholder: 'Player name',
    searching: 'Searching',
    working: 'Working…',
  },
  pagination: {
    label: 'Pages',
    next: 'Next',
    position: 'Page {{page}} of {{total}}',
    previous: 'Previous',
  },
};

export { en };
