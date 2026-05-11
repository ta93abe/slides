// Workers Static Assets entry.
// Per-route handlers live here; the rest falls through to env.ASSETS.fetch().

const REDIRECTS = {
  "/": "https://ta93abe.com/slides",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const target = REDIRECTS[url.pathname];
    if (target) {
      return Response.redirect(target, 302);
    }

    return env.ASSETS.fetch(request);
  },
};
