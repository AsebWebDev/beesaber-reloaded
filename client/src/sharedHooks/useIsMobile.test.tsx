import { renderHook } from '@testing-library/react-hooks';
import { clear, mockUserAgent } from 'jest-useragent-mock';

import mobileUserAgents from '../testing/mobileUserAgents';
import useIsMobile from './useIsMobile';

describe('test useragent', () => {
  afterEach(() => {
    clear();
  });

  it.each(mobileUserAgents)(
    'should return true when useragent is %s',
    (userAgent) => {
      mockUserAgent(userAgent);
      const { result } = renderHook(() => useIsMobile());

      expect(result.current.isMobile).toBe(true);
      expect(window.navigator.userAgent).toStrictEqual(userAgent);
    }
  );

  it('should return false when useragent is not mobile', () => {
    mockUserAgent('desktop');
    const { result } = renderHook(() => useIsMobile());

    expect(result.current.isMobile).toBe(false);
    expect(window.navigator.userAgent).toStrictEqual('desktop');
  });
});
