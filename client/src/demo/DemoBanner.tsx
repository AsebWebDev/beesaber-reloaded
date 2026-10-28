import { useTranslation } from 'react-i18next';

/**
 * Above every page of the demo: that what follows is made up, so nobody
 * takes a sample hive for someone's real one
 */
const DemoBanner = () => {
  const { t } = useTranslation();

  return (
    <aside
      aria-label="Demo"
      className="bg-neon-yellow-core px-4 py-2 text-center text-sm font-semibold text-slate-950"
    >
      {t('demo.banner')}{' '}
      {/* A plain link on purpose: it leaves the demo for the real app */}
      <a href="/" className="underline">
        {t('demo.back')}
      </a>
    </aside>
  );
};

/** Instead of the app, where the demo's service worker cannot run */
const DemoUnsupported = () => {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-xl px-6 py-16 text-center text-slate-300">
      <p>{t('demo.unsupported')}</p>
    </main>
  );
};

export { DemoBanner, DemoUnsupported };
