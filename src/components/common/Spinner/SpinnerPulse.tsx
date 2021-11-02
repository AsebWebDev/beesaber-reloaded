import styled from 'styled-components';

import tokens from '@/tokens/index';

const Container = styled.div`
  @keyframes ldio-do9usc7wgsf {
    0% {
      top: 90px;
      left: 90px;
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      top: 15px;
      left: 15px;
      width: 150px;
      height: 150px;
      opacity: 0;
    }
  }
  .ldio-do9usc7wgsf div {
    position: absolute;
    border-width: 10px;
    border-style: solid;
    opacity: 1;
    border-radius: 50%;
    animation: ldio-do9usc7wgsf 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }
  .ldio-do9usc7wgsf div:nth-child(1) {
    border-color: ${tokens.color.yellow.main};
    animation-delay: 0s;
  }
  .ldio-do9usc7wgsf div:nth-child(2) {
    border-color: ${tokens.color.blue.main};
    animation-delay: -0.5s;
  }
  .loadingio-spinner-ripple-rt8n616prbh {
    width: 200px;
    height: 200px;
    display: inline-block;
    overflow: hidden;
    background: ${tokens.color.page.bgColor};
  }
  .ldio-do9usc7wgsf {
    width: 100%;
    height: 100%;
    position: relative;
    transform: translateZ(0) scale(1);
    backface-visibility: hidden;
    transform-origin: 0 0; /* see note above */
  }
  .ldio-do9usc7wgsf div {
    box-sizing: content-box;
  }
`;

function SpinnerPulse(): JSX.Element {
  return (
    <Container>
      <div className="loadingio-spinner-ripple-rt8n616prbh">
        <div className="ldio-do9usc7wgsf">
          <div></div>
          <div></div>
        </div>
      </div>
    </Container>
  );
}

export default SpinnerPulse;
