import styled from 'styled-components';

import useIsScrollingDown from '@/sharedHooks/useIsScrollingDown';

const Indicator = styled.div`
    position: relative;
    width: 100%;
  
  ::before {
    animation: bounce 1s ease infinite;
    bottom: 4rem;
    color: #fff;
    content: '╲╱';
    font-size: 2rem;
    height: 1rem;
    left: 50%;
    letter-spacing: -1px;
    line-height: 4rem;
    margin-left: -3rem;
    opacity: 0.8;
    position: absolute;
    text-align: center;
    width: 6rem;
  }
  
  @keyframes bounce {
    50% {
      transform: translateY(-50%);
    }
`;

const ScrollDownIndicator = (): JSX.Element | null => {
  const { isScrollingDown } = useIsScrollingDown();

  if (isScrollingDown) return null;

  return <Indicator data-testid={'indicator'} />;
};

export default ScrollDownIndicator;
