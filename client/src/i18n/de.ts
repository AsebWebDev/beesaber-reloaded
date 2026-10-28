import type { Translation } from './en.ts';

/**
 * The German texts. They have to have exactly the keys of the English ones
 * (`Translation`), so a text that is added to en.ts and forgotten here
 * fails the type check.
 *
 * The app says "du": it is meant for friends. "Hive" stays as the name of
 * the thing, female like "die Gruppe"; its members are "Bienen". Score,
 * Map and pp stay as Beat Saber players say them.
 */
const de: Translation = {
  common: {
    loading: 'Wird geladen',
    signOut: 'Abmelden',
    somethingWentWrong: 'Etwas ist schiefgelaufen',
    tryAgain: 'Erneut versuchen',
    mapsPlayed_one: '{{number}} Map gespielt',
    mapsPlayed_other: '{{number}} Maps gespielt',
  },
  layout: {
    dashboard: 'Übersicht',
    hive: 'Meine Hive',
    mainMenu: 'Hauptmenü',
    profile: 'Mein Profil',
    skipToContent: 'Zum Inhalt springen',
    sync: {
      button: 'Scores abrufen',
      done: 'Die Scores sind aktuell.',
      running: 'Scores werden von ScoreSaber abgerufen…',
      upToDate: 'Schon aktuell, vor weniger als einer Minute geprüft.',
    },
  },
  notFound: {
    text: 'Unter dieser Adresse gibt es nichts. <home>Zurück zur Übersicht</home>',
    title: 'Seite nicht gefunden',
  },
  crash: {
    backToStart: 'Zurück zum Start',
    reload: 'Neu laden',
    text: 'Diese Seite konnte nicht angezeigt werden. Neu laden hilft meistens.',
    title: 'Etwas ist schiefgelaufen',
  },
  demo: {
    banner:
      'Eine Demo mit erfundenen Spielern und Scores. Nichts hier ist echt, und nichts, was du tust, verlässt deinen Browser.',
    back: 'Zurück zu BeeSaber',
    unsupported:
      'Die Demo beantwortet ihre Anfragen in deinem Browser, mit einem Service Worker, und dieser Browser führt hier keinen aus. Private Fenster und in andere Apps eingebaute Browser schalten sie oft ab. Öffne die Demo in einem normalen Fenster von Chrome, Edge, Firefox oder Safari.',
  },
  landing: {
    credits:
      'Scores und Spieler stammen von <scoresaber>ScoreSaber</scoresaber>. BeeSaber ist ein Fanprojekt und steht in keiner Verbindung zu ScoreSaber, Beat Games oder Meta. Beat Saber ist eine Marke der Meta Platforms, Inc.',
    demo: 'Nicht eingeladen? Sieh dir eine Demo mit erfundenen Daten an',
    devLogin: 'Dev-Login',
    google: 'Mit Google anmelden',
    noSignIn: 'Auf dem Server ist keine Anmeldung eingerichtet.',
    private:
      '<strong>BeeSaber ist ein privates, nicht kommerzielles Projekt.</strong> Anmelden können sich nur eingeladene Freunde des Entwicklers. Wer nicht eingeladen ist, wird von Google nicht hereingelassen.',
    slogan: 'Finde deine Hive',
    tagline:
      'Vergleiche deine Beat-Saber-Scores mit deinen Freunden. Sieh, wo sie vor dir liegen, und erfahre es, wenn jemand deinen Score schlägt.',
  },
  onboarding: {
    heading: 'Wer bist du auf ScoreSaber?',
    intro:
      'BeeSaber vergleicht Scores von ScoreSaber. Such unten dein ScoreSaber-Profil, dann holen wir deine Scores. Du kannst das später auf deiner Profilseite ändern.',
    signedInAs: 'Angemeldet als {{email}}.',
    title: 'Profil wählen',
  },
  pickProfile: {
    action: 'Das bin ich',
    actionFor: 'Das bin ich: {{name}}',
    searchLabel: 'Dein Name auf ScoreSaber',
  },
  playerSearch: {
    found_one: '{{count}} Spieler gefunden.',
    found_other: '{{count}} Spieler gefunden.',
    hint_one: 'Gib mindestens {{count}} Zeichen ein.',
    hint_other: 'Gib mindestens {{count}} Zeichen ein.',
    nobody: 'Kein Spieler namens „{{name}}“ gefunden.',
    placeholder: 'Spielername',
    searching: 'Suche läuft',
    working: 'Moment…',
  },
  dashboard: {
    beatYourScore: '<player/> hat <when/> deinen Score geschlagen',
    emptyHive:
      'Deine Hive ist leer. <hive>Füge eine Biene hinzu</hive>, um Scores zu vergleichen.',
    fetching: 'Scores werden abgerufen…',
    headToHead: 'Direktvergleich',
    news: 'Neuigkeiten',
    noNews:
      'Niemand hat in letzter Zeit einen deiner Scores geschlagen. Genieß es, solange es anhält.',
    revenge: 'Revanche',
    revengeAll_one: 'Ganze Revanche-Liste: {{number}} Map',
    revengeAll_other: 'Ganze Revanche-Liste: {{number}} Maps',
    sharedMaps_one: '{{number}} gemeinsame Map',
    sharedMaps_other: '{{number}} gemeinsame Maps',
    theirs: 'Score der Biene',
    theyLead: 'Biene vorne: {{number}}',
    waitForMyScores:
      'Deine eigenen Scores werden noch von ScoreSaber geholt. Das hier erscheint, sobald sie da sind.',
    title: 'Übersicht',
    trending: 'Was die Hive gerade spielt',
    trendingAll_one: 'Alles, was die Hive gerade spielt: {{number}} Map',
    trendingAll_other: 'Alles, was die Hive gerade spielt: {{number}} Maps',
    youLead: 'Du vorne: {{number}}',
    yours: 'deiner',
  },
  hive: {
    add: 'Hinzufügen',
    addFor: '{{name}} zu meiner Hive hinzufügen',
    added: '{{name}} ist jetzt in deiner Hive.',
    addHeading: 'Biene hinzufügen',
    empty: 'Noch keine Bienen. Such unten nach einem Spieler.',
    fetching: 'Scores werden von ScoreSaber abgerufen…',
    inHive: 'In deiner Hive',
    isYou: 'Das bist du',
    remove: 'Entfernen',
    removeFor: '{{name}} aus meiner Hive entfernen',
    removed: '{{name}} wurde aus deiner Hive entfernt.',
    searchLabel: 'Spieler auf ScoreSaber suchen',
    sharedWithYou: '{{number}} gemeinsam mit dir',
    syncFailed:
      'Der letzte Abruf der Scores ist fehlgeschlagen. Er wird wiederholt.',
    syncGone: 'ScoreSaber kennt dieses Profil nicht mehr.',
    title: 'Meine Hive',
  },
  comparison: {
    back: '← Meine Hive',
    columns: {
      difference: 'Differenz',
      map: 'Map',
      me: 'Ich',
      them: 'Biene',
    },
    emptyAll: 'Ihr habt noch keine Map gemeinsam gespielt.',
    emptyFilter: 'Keine Map passt zu diesem Filter.',
    filter: {
      all: 'Alle gemeinsamen Maps',
      label: 'Filter',
      losing: 'Wo ich hinten liege',
      winning: 'Wo ich vorne liege',
    },
    heading: 'Ich vs. {{name}}',
    listed_one: '{{number}} Map in dieser Liste.',
    listed_other: '{{number}} Maps in dieser Liste.',
    listedPaged_one:
      '{{number}} Map in dieser Liste, Seite {{page}} von {{total}}.',
    listedPaged_other:
      '{{number}} Maps in dieser Liste, Seite {{page}} von {{total}}.',
    loading: 'Vergleich wird geladen',
    notInHive: {
      text: 'Du kannst nur mit Bienen aus deiner Hive vergleichen, und diese gehört nicht dazu. <hive>Öffne deine Hive</hive>, um sie hinzuzufügen.',
      title: 'Nicht in deiner Hive',
    },
    leads: 'du führst bei {{winning}}, die Biene bei {{losing}}',
    tableName: 'Scores: ich gegen {{name}}',
    thisBee: 'dieser Biene',
    title: 'Vergleich',
  },
  map: {
    columns: {
      accuracy: 'Genauigkeit',
      gap: 'Rückstand',
      played: 'Gespielt',
      player: 'Spieler',
      score: 'Score',
    },
    empty: 'Aus deiner Hive hat diese Map noch niemand gespielt.',
    onScoreSaber: 'Auf ScoreSaber ansehen',
    place: '{{place}}.',
    ranking: 'Hive-Rangliste',
    tableName: 'Hive-Rangliste für {{song}}',
    title: 'Map',
    unknown: {
      text: 'BeeSaber kennt diese Map nicht. <home>Zurück zur Übersicht</home>',
      title: 'Map nicht gefunden',
    },
    you: 'du',
  },
  revenge: {
    columns: {
      bee: 'Biene',
      map: 'Map',
      mine: 'Du',
      need: 'Dir fehlen',
      theirs: 'Score der Biene',
    },
    empty: 'Auf keiner gemeinsamen Map liegt eine Biene vor dir.',
    emptyBee: '{{name}} liegt auf keiner gemeinsamen Map vor dir.',
    filter: {
      all: 'Alle Bienen',
      label: 'Biene',
    },
    intro:
      'Maps, auf denen eine Biene vor dir liegt, die knappsten zuerst. Was dir fehlt, steht in Prozentpunkten der Genauigkeit: so viel mehr, und du bist vorne.',
    listed_one: '{{number}} Map in dieser Liste.',
    listed_other: '{{number}} Maps in dieser Liste.',
    listedPaged_one:
      '{{number}} Map in dieser Liste, Seite {{page}} von {{total}}.',
    listedPaged_other:
      '{{number}} Maps in dieser Liste, Seite {{page}} von {{total}}.',
    loading: 'Revanche-Liste wird geladen',
    points_one: '+{{number}} Punkt',
    points_other: '+{{number}} Punkte',
    title: 'Revanche-Liste',
  },
  trending: {
    columns: {
      bees: 'Bienen',
      map: 'Map',
      played: 'Zuletzt gespielt',
      scoreSaber: 'Rangliste',
    },
    empty:
      'In den letzten {{days}} Tagen haben deine Bienen auf keiner Map einen Score gesetzt, die du noch nie gespielt hast.',
    intro:
      'Maps, die du noch nie gespielt hast und auf denen deine Bienen in den letzten {{days}} Tagen einen neuen Bestwert gesetzt haben, die von den meisten Bienen gespielten zuerst. Es zählen nur neue Bestwerte: Runden ohne einen meldet ScoreSaber nicht.',
    listed_one: '{{number}} Map in dieser Liste.',
    listed_other: '{{number}} Maps in dieser Liste.',
    listedPaged_one:
      '{{number}} Map in dieser Liste, Seite {{page}} von {{total}}.',
    listedPaged_other:
      '{{number}} Maps in dieser Liste, Seite {{page}} von {{total}}.',
    loading: 'Wird geladen, was die Hive gerade spielt',
    onScoreSaber: 'ScoreSaber',
    onScoreSaberFor: '{{song}} auf ScoreSaber',
    title: 'Was die Hive gerade spielt',
  },
  profile: {
    change: 'Profil wechseln',
    changed: 'Du vergleichst jetzt als {{name}}.',
    changeIntro:
      'Wähle das ScoreSaber-Profil, als das du vergleichen willst. Deine Hive bleibt, wie sie ist; die Scores des neuen Profils werden abgerufen.',
    current: 'Dein aktuelles Profil',
    keep: 'Profil behalten',
    countryRank: 'Rang {{rank}} in {{country}}',
    title: 'Mein Profil',
  },
  scores: {
    columns: {
      accuracy: 'Genauigkeit',
      map: 'Map',
      played: 'Gespielt',
      rank: 'Rang',
      score: 'Score',
    },
    empty: 'Noch keine Scores.',
    filterLabel: 'Songs filtern',
    filterPlaceholder: 'Song oder Künstler',
    listed_one: '{{number}} Score in dieser Liste.',
    listed_other: '{{number}} Scores in dieser Liste.',
    listedPaged_one:
      '{{number}} Score in dieser Liste, Seite {{page}} von {{total}}.',
    listedPaged_other:
      '{{number}} Scores in dieser Liste, Seite {{page}} von {{total}}.',
    loading: 'Scores werden geladen',
    noMatch: 'Kein Song passt zu „{{search}}“.',
    sort: {
      label: 'Sortieren nach',
      recent: 'Neueste',
      top: 'Höchster Score',
    },
    tableName: 'Meine Scores',
  },
  language: {
    heading: 'Sprache',
    label: 'Sprache',
  },
  deleteAccount: {
    confirm: 'Ja, mein Konto löschen',
    heading: 'Konto löschen',
    keep: 'Konto behalten',
    open: 'Konto löschen',
    question:
      'Dein Konto endgültig löschen? Das lässt sich nicht rückgängig machen.',
    text: 'Entfernt dein BeeSaber-Konto und deine Hive. Auf ScoreSaber ändert sich nichts.',
  },
  format: {
    now: 'gerade eben',
    rank: 'Rang {{rank}}',
    unranked: 'Ohne Rang',
  },
  song: {
    byline: '{{author}} · gemappt von {{mapper}}',
  },
  errors: {
    api: {
      cannot_add_self: 'Dich selbst kannst du nicht zu deiner Hive hinzufügen.',
      forbidden: 'Das ist nicht erlaubt.',
      hive_full: 'Eine Hive kann höchstens {{maxSize}} Bienen haben.',
      internal_error:
        'Der Server hat gerade Probleme. Bitte versuch es später noch einmal.',
      no_player_linked: 'Wähle zuerst dein ScoreSaber-Profil.',
      not_found: 'Hier gibt es nichts.',
      not_in_hive: 'Diese Biene ist nicht in deiner Hive.',
      rate_limited:
        'Das war viel auf einmal. Warte einen Moment und versuch es dann noch einmal.',
      scoresaber_unavailable:
        'ScoreSaber ist gerade nicht erreichbar. Bitte versuch es später noch einmal.',
      unauthorized: 'Du bist nicht angemeldet.',
      unknown_map: 'BeeSaber kennt diese Map nicht.',
      unknown_player: 'ScoreSaber kennt dieses Profil nicht.',
      validation_failed:
        'Die Anfrage wurde nicht angenommen. Bitte prüf deine Eingabe.',
    },
    local: {
      deleteAccountFailed:
        'Das Konto konnte nicht gelöscht werden. Es besteht weiter, bitte versuch es noch einmal.',
      devSignInFailed: 'Die Anmeldung mit dem Testkonto ist fehlgeschlagen.',
      googleFailed: 'Die Anmeldung mit Google ist fehlgeschlagen.',
      signOutFailed:
        'Das Abmelden ist fehlgeschlagen. Du bist noch angemeldet, bitte versuch es noch einmal.',
    },
    network:
      'Der Server ist nicht erreichbar. Prüf deine Verbindung und versuch es noch einmal.',
  },
  pagination: {
    label: 'Seiten',
    next: 'Weiter',
    position: 'Seite {{page}} von {{total}}',
    previous: 'Zurück',
  },
};

export { de };
