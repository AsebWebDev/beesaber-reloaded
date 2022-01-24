import React from 'react';
import styled from 'styled-components';

import colors from '@/tokens/definitions/color';

const ListElement = styled.li`
  background-color: ${colors.white.main}!important;
  font-size: 1rem;
  font-weight: 900;
  padding: 0.3rem;
  text-align: center;
`;

const PageLink = styled.a.attrs({ href: '/#' })`
  color: ${colors.page.bgColor.main};
  padding: 0.3rem;
`;

type Props = {
  direction: 'Next' | 'Previous';
  onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
};

const PageDirection = ({ onClick, direction }: Props): JSX.Element => (
  <ListElement>
    <PageLink aria-label={direction} onClick={onClick}>
      {direction === 'Previous' ? (
        <span aria-hidden="true">&laquo;</span>
      ) : (
        <span aria-hidden="true">&raquo;</span>
      )}
      <span>{direction}</span>
    </PageLink>
  </ListElement>
);

export default PageDirection;
