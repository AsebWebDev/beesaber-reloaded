import { useTranslation } from 'react-i18next';

import { formatGap, formatScore } from '@/lib/format.ts';

/**
 * The smallest share of the maximum score that shows as more than "0.00%".
 * Below it, a percentage would say that nothing is missing.
 */
const SMALLEST_SHOWN_SHARE = 0.000_05;

/**
 * What I need to get past a bee: in accuracy points, a share of the map's
 * maximum score, since that is what a player can aim for. In points when
 * the map has no maximum score, or when the gap is too small for a
 * percentage to show it.
 */
const Gap = ({ gap, gapShare }: { gap: number; gapShare: number | null }) => {
  const { t } = useTranslation();

  return gapShare === null || gapShare < SMALLEST_SHOWN_SHARE
    ? t('revenge.points', { count: gap, number: formatScore(gap) })
    : formatGap(gapShare);
};

export { Gap };
