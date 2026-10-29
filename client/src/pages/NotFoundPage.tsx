import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { HexLogo } from '@/components/HexLogo.tsx';
import { NeonHeading } from '@/components/ui.tsx';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** For an address inside the app that leads nowhere, like an old link */
const NotFoundPage = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  usePageTitle(t('notFound.title'));

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <HexLogo size={96} />
      <NeonHeading color="yellow" className="text-3xl">
        {t('notFound.title')}
      </NeonHeading>
      <p className="max-w-md text-slate-300">
        <Trans
          i18nKey="notFound.address"
          values={{ path: pathname }}
          components={{
            path: <code className="text-neon-yellow-core break-all" />,
          }}
        />
      </p>
      <p className="text-slate-300">
        <Trans
          i18nKey="notFound.text"
          components={{
            home: <Link to="/" className="text-neon-yellow-core underline" />,
          }}
        />
      </p>
    </div>
  );
};

export { NotFoundPage };
