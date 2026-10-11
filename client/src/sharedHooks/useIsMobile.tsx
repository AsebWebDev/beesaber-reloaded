import { useEffect, useState } from 'react';

import { mobileUserAgentsRegEx } from '@/testing/mobileUserAgents';

export default function useIsMobile(): { isMobile: boolean } {
  const [isMobile, setMobile] = useState(false);

  useEffect(() => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobile = Boolean(mobileUserAgentsRegEx.exec(userAgent));

    setMobile(mobile);
  }, []);

  return { isMobile };
}
