import React from 'react';
import styled from 'styled-components';

import colors from '@/tokens/definitions/color';

const ListElement = styled.li<{ isActive: boolean }>`
  ${({ isActive }) => `
        background-color: ${isActive ? colors.yellow.main : colors.white.light};
        font-size: 1rem;
        font-weight: 900;
        padding: 0.3rem;
        text-align: center;
    `}
`;

const PageLink = styled.a.attrs({ href: '/#' })`
  color: ${colors.page.bgColor.main};
  padding: 0.3rem;
`;

type Props = {
  gotoPage: (page: number) => void;
  isActive: boolean;
  page: number;
};

const PageNumber = ({ isActive, gotoPage, page }: Props): JSX.Element => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    gotoPage(page);
  };

  return (
    <ListElement isActive={isActive}>
      <PageLink onClick={handleClick}>{page}</PageLink>
    </ListElement>
  );
};

export default PageNumber;
