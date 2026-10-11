import type { DefaultTheme } from 'styled-components';

type CSSValue = number | string;

/**
 * Any CSS value that we want to use in Styled Components' templates literals
 *
 * @example
 * const helper = (color: StyledCSSValue) => `
 *   background-color: ${color}
 * `
 */
type StyledCSSValue =
  | CSSValue
  | (({ theme }: { theme: DefaultTheme }) => CSSValue);

export default StyledCSSValue;
export type { CSSValue };
