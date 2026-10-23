/** Anything that answers requests, like the site from withFrontend */
type Site = {
  fetch: (request: Request, env?: unknown) => Promise<Response> | Response;
};

/**
 * Sends visitors of the www form of the app's address to the address
 * itself, keeping the path: www.beesaber.de/hive/1 goes to
 * beesaber.de/hive/1. Sign-in only works on one address, since the session
 * cookie belongs to the site that set it and Google only sends people back
 * to the address it knows.
 *
 * Other addresses still answer. Azure's own address of the app is the one
 * deployments check.
 */
const withCanonicalHost = (site: Site, appUrl: string): Site => {
  const canonical = new URL(appUrl);
  const www = `www.${canonical.host}`;

  return {
    fetch: (request, env) => {
      const url = new URL(request.url);

      if (url.host !== www) return site.fetch(request, env);

      // Permanent, so browsers and search engines remember the address
      return new Response(null, {
        status: 301,
        headers: {
          Location: `${canonical.origin}${url.pathname}${url.search}`,
        },
      });
    },
  };
};

export { withCanonicalHost };
