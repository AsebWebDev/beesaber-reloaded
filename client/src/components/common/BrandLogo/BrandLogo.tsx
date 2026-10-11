import React from 'react';
import styled from 'styled-components';

import tokens from '@/tokens/index';

import BrandLogoI from './BrandLogoI/BrandLogoI';

const Container = styled.div`
  position: relative;
  height: 150px;
  width: 150px;
  font-size: 80px;
  margin-bottom: 1rem;

  div {
    position: absolute;
    transform-origin: center;
  }
  div:first-child {
    transform: rotate(90deg) translate(-36px, -68px);
    z-index: 5;
  }
  div:nth-child(2) {
    transform: rotate(150deg) translate(-103px, -49px);
    z-index: 4;
  }
  div:nth-child(3) {
    transform: rotate(30deg) translate(120px, -19px);
  }
  div:nth-child(4) {
    transform: rotate(90deg) translate(70px, -68px);
  }
  div:nth-child(5) {
    transform: rotate(150deg) translate(2px, -49px);
  }
  div:nth-child(6) {
    transform: rotate(30deg) translate(15px, -20px);
    z-index: 6;
  }

  .saber {
    position: absolute;
    height: 100%;
    width: 3px;
    top: 0%;
    border-radius: 3px;
  }

  .saber.neon-red {
    left: 49%;
    transform: rotate(30deg);
    background-color: ${tokens.color.red.light};
    box-shadow: 0px 0px 8px 2px ${tokens.color.red.shadow},
      0px 0px 12px 6px ${tokens.color.red.main};
  }

  .saber.neon-blue {
    right: 49%;
    transform: rotate(-30deg);
    background-color: ${tokens.color.blue.light};
    box-shadow: 0px 0px 8px 2px ${tokens.color.red.shadow},
      0px 0px 12px 6px ${tokens.color.red.main};
  }
`;

const BrandLogo = (): JSX.Element => (
  <Container>
    {/* neon honeycomb logo: */}
    <BrandLogoI />
    <BrandLogoI />
    <BrandLogoI />
    <BrandLogoI />
    <BrandLogoI />
    <BrandLogoI />
    {/* alternative logo made with svg: */}
    {/* <svg className="logo"><use xlinkHref="#logo-honeycomb" /></svg> */}
  </Container>
);

export default BrandLogo;
