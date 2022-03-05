const isLoggedIn = (_req: any, _res: any, next: () => void) => {
  // console.log("isLoggedIn ->  req.user",  req.user)
  // if (req.isAuthenticated()) next()
  // else next({ status: 403, message: 'Unauthorized' })
  // FIXME: protect routes
  next();
};

const isAdmin = (
  req: { user: { isAdmin: any } },
  _res: any,
  next: (arg0: { status: number; message: string }) => void
) => {
  if (req.user.isAdmin) next(undefined);
  else next({ status: 403, message: 'Unauthorized. No Admin' });
};

export { isLoggedIn, isAdmin };
