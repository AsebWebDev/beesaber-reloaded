import styled from 'styled-components';

import tokens from '@/tokens/index';

const Container = styled.div`
  @keyframes ldio-reyiqutdbqg {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
  }
  .ldio-reyiqutdbqg div {
    position: absolute;
    animation: ldio-reyiqutdbqg 1s linear infinite;
    box-sizing: border-box !important;
  }
  .ldio-reyiqutdbqg div:nth-child(1) {
    width: 44px;
    height: 44px;
    left: 34px;
    top: 128px;
    border-radius: 50%;
    background: ${tokens.color.red.main};
  }
  .ldio-reyiqutdbqg div:nth-child(2) {
    width: 66px;
    height: 66px;
    left: 56px;
    top: 84px;
    border-radius: 0 66px 0 0;
    border: 20px solid ${tokens.color.red.shadow};
    background: none;
    animation-delay: 0.1s;
    border-bottom: 0;
    border-left: 0;
  }
  .ldio-reyiqutdbqg div:nth-child(3) {
    width: 110px;
    height: 110px;
    left: 56px;
    top: 40px;
    border-radius: 0 110px 0 0;
    border: 20px solid ${tokens.color.red.light};
    background: none;
    animation-delay: 0.2s;
    border-bottom: 0;
    border-left: 0;
  }
  .loadingio-spinner-radio-5b7w2tupa5t {
    width: 200px;
    height: 200px;
    display: inline-block;
    overflow: hidden;
    background: ${tokens.color.page.bgColor};
  }
  .ldio-reyiqutdbqg {
    width: 100%;
    height: 100%;
    position: relative;
    transform: translateZ(0) scale(1);
    backface-visibility: hidden;
    transform-origin: 0 0; /* see note above */
  }
  .ldio-reyiqutdbqg div {
    box-sizing: content-box;
  }
`;

function SpinnerWifi(): JSX.Element {
  return (
    <Container>
      <div className="loadingio-spinner-radio-5b7w2tupa5t">
        <div className="ldio-reyiqutdbqg">
          <div />
          <div />
          <div />
        </div>
      </div>
    </Container>
  );
}

export default SpinnerWifi;
