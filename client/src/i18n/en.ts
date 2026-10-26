/**
 * The English texts, and the shape every other language has to match.
 *
 * Keys are grouped by the part of the app that shows them. A text with
 * `{{name}}` gets a value filled in. Keys ending in `_one` and `_other` are
 * the singular and plural of the same text; the app asks for the key without
 * the ending, with a `count`, and i18next picks the form the language needs.
 */
const en = {
  common: {
    loading: 'Loading',
  },
};

export { en };
