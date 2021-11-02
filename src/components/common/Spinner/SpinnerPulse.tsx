import styled from 'styled-components';

import tokens from '@/tokens/index';

const Container = styled.div<{ isBig: boolean }>`
  ${({ isBig }) => `@keyframes ldio-do9usc7wgsf {
    0% {
      top: ${isBig ? '5.625rem' : '2.8125rem'};
      left: ${isBig ? '5.625rem' : '2.8125rem'};
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      top: ${isBig ? '0.9375rem' : '0.4688rem'};
      left: ${isBig ? '0.9375rem' : '0.4688rem'};
      width: ${isBig ? '9.375rem' : '4.6875rem'};
      height: ${isBig ? '9.375rem' : '4.6875rem'};
      opacity: 0;
    }
  }
  .ldio-do9usc7wgsf div {
    position: absolute;
    border-width: ${isBig ? '0.625rem' : '0.3125rem'};
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
    width: ${isBig ? '12.5rem' : '3.8125rem'};
    height: ${isBig ? '12.5rem' : '3.8125rem'};
    display: inline-block;
    overflow: hidden;
    background: ${tokens.color.page.bgColor};
  }
  .ldio-do9usc7wgsf {
    width: 100%;
    height: 100%;
    position: relative;
    transform: translateZ(0) scale(${isBig ? '1' : '0.61'});
    backface-visibility: hidden;
    transform-origin: 0 0; /* see note above */
  }
  .ldio-do9usc7wgsf div {
    box-sizing: content-box;
  }
`}
`;

type Props = {
  isBig?: boolean;
};

function SpinnerPulse({ isBig = false }: Props): JSX.Element {
  return (
    <Container isBig={isBig}>
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
