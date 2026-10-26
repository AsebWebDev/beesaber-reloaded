import 'i18next';

import type { en } from './en.ts';

// Tells TypeScript which keys exist, so `t('commn.loading')` is a type error
// instead of a text that silently shows its key
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
