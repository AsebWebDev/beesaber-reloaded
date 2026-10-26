import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useLinkProfile, useMe } from '@/api/queries.ts';
import { useSignOut } from '@/auth/useSignOut.ts';
import { PlayerSearch } from '@/components/PlayerSearch.tsx';
import { Button, Card, ErrorNote, NeonHeading } from '@/components/ui.tsx';
import { useFocusOnMount } from '@/lib/useFocusOnMount.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** After the first sign-in: which ScoreSaber profile is yours? */
const OnboardingPage = ({ takeFocus = false }: { takeFocus?: boolean }) => {
  const { t } = useTranslation();
  const main = useRef<HTMLElement>(null);
  const link = useLinkProfile();
  const me = useMe();
  const logout = useSignOut();

  usePageTitle(t('onboarding.title'));
  useFocusOnMount(main, takeFocus);

  return (
    <main
      ref={main}
      tabIndex={-1}
      className="mx-auto max-w-2xl space-y-6 px-6 py-16 outline-none"
    >
      <NeonHeading color="yellow" className="text-4xl">
        {t('onboarding.heading')}
      </NeonHeading>
      <p className="text-slate-300">{t('onboarding.intro')}</p>

      <Card>
        <PlayerSearch
          label={t('pickProfile.searchLabel')}
          actionLabel={t('pickProfile.action')}
          actionName={(player) =>
            t('pickProfile.actionFor', { name: player.name })
          }
          pendingId={link.isPending ? link.variables : undefined}
          onPick={(player) => link.mutate(player.id)}
        />
      </Card>

      {link.isError && <ErrorNote error={link.error} />}

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        {me.data != null && (
          <span>
            {t('onboarding.signedInAs', { email: me.data.user.email })}
          </span>
        )}
        <Button
          look="ghost"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {t('common.signOut')}
        </Button>
      </div>
      {logout.isError && <ErrorNote error={logout.error} />}
    </main>
  );
};

export { OnboardingPage };
