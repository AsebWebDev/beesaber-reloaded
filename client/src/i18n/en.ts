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
  dashboard: {
    beatYourScore: '<player>{{name}}</player> beat your score',
    emptyHive: 'Your hive is empty. <hive>Add a bee</hive> to compare scores.',
    fetching: 'Fetching scores…',
    headToHead: 'Head to head',
    news: 'News',
    noNews:
      'Nobody has beaten one of your scores lately. Enjoy it while it lasts.',
    sharedMaps_one: '{{count}} shared map',
    sharedMaps_other: '{{count}} shared maps',
    theirs: 'Theirs',
    theyLead: 'They lead on {{number}}',
    title: 'Dashboard',
    youLead: 'You lead on {{number}}',
    yours: 'yours',
  },
  hive: {
    add: 'Add',
    addFor: 'Add {{name}} to my hive',
    added: '{{name}} was added to your hive.',
    addHeading: 'Add a bee',
    empty: 'No bees yet. Search for a player below.',
    fetching: 'Fetching scores from ScoreSaber…',
    inHive: 'In your hive',
    isYou: 'That is you',
    remove: 'Remove',
    removeFor: 'Remove {{name}} from my hive',
    removed: '{{name}} was removed from your hive.',
    searchLabel: 'Find a player on ScoreSaber',
    stats: '{{rank}} · {{played}} maps played · {{shared}} shared with you',
    syncFailed:
      'The last attempt to fetch their scores failed. It will be tried again.',
    syncGone: 'ScoreSaber no longer knows this player.',
    title: 'My hive',
  },
  comparison: {
    back: '← My hive',
    columns: {
      difference: 'Difference',
      map: 'Map',
      me: 'Me',
      them: 'Them',
    },
    emptyAll: 'You have not played any of the same maps yet.',
    emptyFilter: 'No maps match this filter.',
    filter: {
      all: 'All shared maps',
      label: 'Filter',
      losing: 'Where I am behind',
      winning: 'Where I am ahead',
    },
    heading: 'Me vs {{name}}',
    listed_one: '{{count}} map in this list.',
    listed_other: '{{count}} maps in this list.',
    listedPaged_one: '{{count}} map in this list, page {{page}} of {{total}}.',
    listedPaged_other:
      '{{count}} maps in this list, page {{page}} of {{total}}.',
    loading: 'Loading comparison',
    notInHive: {
      text: 'You can only compare with players in your hive, and this one is not. <hive>Go to my hive</hive> to add them.',
      title: 'Not in your hive',
    },
    summary:
      '{{shared}} shared maps · you lead on {{winning}}, they lead on {{losing}}',
    tableName: 'Scores of me and {{name}}',
    thisBee: 'this bee',
    title: 'Comparison',
  },
  profile: {
    change: 'Change profile',
    changed: 'You now compare as {{name}}.',
    changeIntro:
      'Pick the ScoreSaber profile you want to compare as. Your hive stays as it is; the scores of the new profile are fetched.',
    current: 'Your current profile',
    keep: 'Keep this profile',
    stats:
      '{{rank}} · #{{countryRank}} in {{country}} · {{pp}} pp · {{played}} maps played',
    title: 'My profile',
  },
  scores: {
    columns: {
      accuracy: 'Accuracy',
      map: 'Map',
      played: 'Played',
      rank: 'Rank',
      score: 'Score',
    },
    empty: 'No scores yet.',
    filterLabel: 'Filter songs',
    filterPlaceholder: 'Song or artist',
    listed_one: '{{count}} score in this list.',
    listed_other: '{{count}} scores in this list.',
    listedPaged_one:
      '{{count}} score in this list, page {{page}} of {{total}}.',
    listedPaged_other:
      '{{count}} scores in this list, page {{page}} of {{total}}.',
    loading: 'Loading scores',
    noMatch: 'No song matches “{{search}}”.',
    sort: {
      label: 'Sort by',
      recent: 'Latest',
      top: 'Highest score',
    },
    tableName: 'My scores',
  },
  deleteAccount: {
    confirm: 'Yes, delete my account',
    heading: 'Delete account',
    keep: 'Keep my account',
    open: 'Delete account',
    question: 'Delete your account for good? This cannot be undone.',
    text: 'Removes your BeeSaber account and your hive. Nothing changes on ScoreSaber.',
  },
  song: {
    byline: '{{author}} · mapped by {{mapper}}',
  },
  pagination: {
    label: 'Pages',
    next: 'Next',
    position: 'Page {{page}} of {{total}}',
    previous: 'Previous',
  },
};

export { en };
