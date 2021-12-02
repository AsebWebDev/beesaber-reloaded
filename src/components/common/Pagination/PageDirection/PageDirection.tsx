import React from 'react';

type Props = {
  direction: 'Next' | 'Previous';
  onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
};

const PageDirection = ({ onClick, direction }: Props): JSX.Element => (
  <li className="page-item">
    <a className="page-link" href="/#" aria-label={direction} onClick={onClick}>
      <span aria-hidden="true">&laquo;</span>
      <span className="sr-only">{direction}</span>
    </a>
  </li>
);

export default PageDirection;
