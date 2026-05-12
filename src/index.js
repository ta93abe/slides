// Workers Static Assets entry.
// Per-route handlers live here; the rest falls through to env.ASSETS.fetch().

const REDIRECTS = {
  "/": "https://ta93abe.com/slides",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    console.log({
      msg: "request",
      method: request.method,
      pathname: url.pathname,
      search: url.search || null,
      cf_ray: request.headers.get("cf-ray"),
      colo: request.cf?.colo ?? null,
      country: request.cf?.country ?? null,
    });

    const target = REDIRECTS[url.pathname];
    if (target) {
      console.log({ msg: "redirect", from: url.pathname, to: target });
      return Response.redirect(target, 302);
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      console.log({ msg: "asset", pathname: url.pathname, status: response.status });
      return response;
    }

    // SPA fallback: each slide is a Slidev SPA under /<slide-id>/. Paths like
    // /<slide-id>/2 or /<slide-id>/presenter need to be served by the slide's
    // root index.html so the client-side router can handle them.
    const slideMatch = url.pathname.match(/^\/([^/]+)\/.+$/);
    if (slideMatch) {
      const slideRoot = new URL(`/${slideMatch[1]}/`, url);
      console.log({
        msg: "spa-fallback",
        from: url.pathname,
        served: slideRoot.pathname,
        slide_id: slideMatch[1],
      });
      return env.ASSETS.fetch(new Request(slideRoot, request));
    }

    console.log({ msg: "not-found", pathname: url.pathname });
    return response;
  },
};
