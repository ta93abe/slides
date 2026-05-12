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

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    // SPA fallback: each slide is a Slidev SPA under /<slide-id>/. Paths like
    // /<slide-id>/2 or /<slide-id>/presenter need to be served by the slide's
    // root index.html so the client-side router can handle them.
    const slideMatch = url.pathname.match(/^\/([^/]+)\/.+$/);
    if (slideMatch) {
      const slideRoot = new URL(`/${slideMatch[1]}/`, url);
      return env.ASSETS.fetch(new Request(slideRoot, request));
    }

    return response;
  },
};
