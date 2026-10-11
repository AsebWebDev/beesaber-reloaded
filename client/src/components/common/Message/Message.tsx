import type BadgeColor from '@beesaber/shared/BadgeColor';
import type { JSX } from 'react';

type Props = {
  text: string;
  type: BadgeColor;
};

export default function Message({ text, type }: Props): JSX.Element {
  return (
    <div className={'alert alert-' + type} role="alert">
      {text}
    </div>
  );
}
