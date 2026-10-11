type MediaSize = 'lg' | 'md' | 'mobile' | 'sm' | 'xl';

type BreakPointSize = '0px' | '575px' | '576px' | '768px' | '1024px' | '1680px';

type Breakpoints = Record<MediaSize, BreakPointSize>;

const breakpoints: Breakpoints = {
  mobile: '575px',
  sm: '576px',
  md: '768px',
  lg: '1024px',
  xl: '1680px',
};

type MediaQuery = Record<MediaSize, string>;

const mediaQuery: MediaQuery = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
};

const layout = {
  breakpoints,
  mediaQuery,
};

export { breakpoints, mediaQuery };

export default layout;
