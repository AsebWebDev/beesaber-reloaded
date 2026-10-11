import { toast } from 'react-toastify';

import type {
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';

type PossibleResponses =
  Error | GoogleLoginResponse | GoogleLoginResponseOffline;

const errHandler = (err: PossibleResponses): string => {
  const errorString = err instanceof Error ? err.message : 'Unknown Error';

  if (errorString.length > 0) toast.error(errorString);

  return errorString;
};

export type { PossibleResponses };

export default errHandler;
