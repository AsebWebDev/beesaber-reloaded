import color from './definitions/color';
import layout from './definitions/layout';
import text from './definitions/text';

import type StyledCSSValue from '@/sharedTypes/StyledCSSValue';
import type { CSSValue } from '@/sharedTypes/StyledCSSValue';

type TokenValue = CSSValue;
type Token = StyledCSSValue;

const tokens = {
  color,
  layout,
  text,
};

export default tokens;

export type { Token, TokenValue };
