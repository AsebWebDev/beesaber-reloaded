import { MDBIcon } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import NeonText from '@/components/common/NeonText/NeonText';

import type { ElementType } from '../NeonText/NeonText';

type Props = {
  as?: ElementType;
  logo: string;
  text: string;
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  margin: 0 10px;

  body {
    align-items: center;
    background: #00111f;
    display: flex;
    font-family: 'consolas', sans-serif;
    justify-content: center;
    margin: 0;
    min-height: 100vh;
    padding: 0;
  }
`;
const Button = styled.div`
  color: rgb(0 0 255);
  display: inline-block;
  font-size: 20px;
  letter-spacing: 2px;
  overflow: hidden;
  padding: 0 30px;
  position: relative;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  transition: 0.2s;

  :hover {
    background: rgb(0 0 255);
    box-shadow: 0 0 10px rgb(0 0 255), 0 0 40px rgb(0 0 255),
      0 0 80px rgb(0 0 255);
    color: #fff0f0;
    transition-delay: 1s;
  }

  span {
    display: block;
    position: absolute;
  }

  span:nth-child(1) {
    background: linear-gradient(90deg, transparent, rgb(0 0 255));
    height: 2px;
    left: -100%;
    top: 0;
    width: 100%;
  }

  span:nth-child(2) {
    background: linear-gradient(270deg, transparent, rgb(0 0 255));
    bottom: 0;
    height: 2px;
    right: -100%;
    width: 100%;
  }

  span:nth-child(3) {
    background: linear-gradient(180deg, transparent, rgb(0 0 255));
    height: 100%;
    right: 0%;
    top: -100%;
    width: 2px;
  }

  span:nth-child(4) {
    background: linear-gradient(360deg, transparent, rgb(0 0 255));
    bottom: -100%;
    height: 100%;
    left: 0%;
    width: 2px;
  }

  :hover span:nth-child(1) {
    left: 100%;
    transition: 1s;
  }

  :hover span:nth-child(2) {
    right: 100%;
    transition: 1s;
    transition-delay: 0.5s;
  }

  :hover span:nth-child(3) {
    top: 100%;
    transition: 1s;
    transition-delay: 0.25s;
  }

  :hover span:nth-child(4) {
    bottom: 100%;
    transition: 1s;
    transition-delay: 0.75s;
  }
`;

const NeonButton = ({ as, logo, text }: Props): JSX.Element => (
  <Container>
    <Button role="button">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <MDBIcon fab icon={logo || ''} />{' '}
      <NeonText glow as={as} titleColor={'blue'}>
        {text}
      </NeonText>
    </Button>
  </Container>
);

export default NeonButton;
