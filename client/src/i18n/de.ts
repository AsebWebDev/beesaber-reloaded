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
  landing: {
    credits:
      'Scores und Spieler stammen von <scoresaber>ScoreSaber</scoresaber>. BeeSaber ist ein Fanprojekt und gehört weder zu ScoreSaber noch zu Beat Games oder Meta. Beat Saber ist eine Marke der Meta Platforms, Inc.',
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
    heading: 'Welcher Spieler bist du?',
    intro:
      'BeeSaber vergleicht Scores von ScoreSaber. Such dort dein Profil, und wir holen deine Scores. Du kannst das später auf deiner Profilseite ändern.',
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
    headToHead: 'Kopf an Kopf',
    news: 'Neuigkeiten',
    noNews:
      'Niemand hat in letzter Zeit einen deiner Scores geschlagen. Genieß es, solange es anhält.',
    sharedMaps_one: '{{count}} gemeinsame Map',
    sharedMaps_other: '{{count}} gemeinsame Maps',
    theirs: 'Biene',
    theyLead: 'Biene vorn: {{number}}',
    title: 'Übersicht',
    youLead: 'Du vorn: {{number}}',
    yours: 'du',
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
    stats: '{{rank}} · {{played}} Maps gespielt · {{shared}} gemeinsam mit dir',
    syncFailed:
      'Der letzte Abruf der Scores ist fehlgeschlagen. Er wird wiederholt.',
    syncGone: 'ScoreSaber kennt diesen Spieler nicht mehr.',
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
    listed_one: '{{count}} Map in dieser Liste.',
    listed_other: '{{count}} Maps in dieser Liste.',
    listedPaged_one:
      '{{count}} Map in dieser Liste, Seite {{page}} von {{total}}.',
    listedPaged_other:
      '{{count}} Maps in dieser Liste, Seite {{page}} von {{total}}.',
    loading: 'Vergleich wird geladen',
    notInHive: {
      text: 'Vergleichen kannst du nur mit Spielern in deiner Hive, und dieser gehört nicht dazu. <hive>Zu meiner Hive</hive>, um ihn hinzuzufügen.',
      title: 'Nicht in deiner Hive',
    },
    summary:
      '{{shared}} gemeinsame Maps · du führst auf {{winning}}, die Biene auf {{losing}}',
    tableName: 'Scores von mir und {{name}}',
    thisBee: 'dieser Biene',
    title: 'Vergleich',
  },
  profile: {
    change: 'Profil wechseln',
    changed: 'Du vergleichst jetzt als {{name}}.',
    changeIntro:
      'Wähle das ScoreSaber-Profil, als das du vergleichen willst. Deine Hive bleibt, wie sie ist; die Scores des neuen Profils werden abgerufen.',
    current: 'Dein aktuelles Profil',
    keep: 'Profil behalten',
    stats:
      '{{rank}} · Platz {{countryRank}} in {{country}} · {{pp}} pp · {{played}} Maps gespielt',
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
    listed_one: '{{count}} Score in dieser Liste.',
    listed_other: '{{count}} Scores in dieser Liste.',
    listedPaged_one:
      '{{count}} Score in dieser Liste, Seite {{page}} von {{total}}.',
    listedPaged_other:
      '{{count}} Scores in dieser Liste, Seite {{page}} von {{total}}.',
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
      not_in_hive: 'Dieser Spieler ist nicht in deiner Hive.',
      rate_limited:
        'Das war viel auf einmal. Warte einen Moment und versuch es dann noch einmal.',
      scoresaber_unavailable:
        'ScoreSaber ist gerade nicht erreichbar. Bitte versuch es später noch einmal.',
      unauthorized: 'Du bist nicht angemeldet.',
      unknown_player: 'ScoreSaber kennt diesen Spieler nicht.',
      validation_failed:
        'Die Anfrage wurde nicht angenommen. Bitte prüf deine Eingabe.',
    },
    local: {
      deleteAccountFailed:
        'Das Konto konnte nicht gelöscht werden. Es besteht weiter, bitte versuch es noch einmal.',
      devSignInFailed: 'Die Anmeldung mit dem Testkonto ist fehlgeschlagen.',
      googleFailed: 'Die Anmeldung mit Google ist fehlgeschlagen.',
      signOutFailed:
        'Abmelden ist fehlgeschlagen. Du bist noch angemeldet, bitte versuch es noch einmal.',
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
