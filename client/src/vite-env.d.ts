/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OAuth client ID from the Google Cloud Console */
  readonly VITE_GOOGLE_CLIENTID?: string;
  /** Set to "enabled" to answer API calls with mocked responses */
  readonly VITE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
