const { http, HttpResponse } = require("msw");
const globals = require("../config/globals");
const { withAuth } = require("./middleware");
const data = require("./_data.json");

exports.handlers = [
  http.get(
    globals.SPOTIFY_SAVED_TRACKS,
    withAuth(({ request }) => {
      const url = new URL(request.url);
      const offset = Number(url.searchParams.get("offset")) || 0;
      const limit = Number(url.searchParams.get("limit")) || 20;

      const items = data.slice(offset, offset + limit);
      let next;
      if (offset + limit > data.length) {
        next = null;
      } else {
        next = `${globals.SPOTIFY_SAVED_TRACKS}?offset=${
          offset + limit
        }&limit=${limit}`;
      }

      let previous;
      if (offset === 0) {
        previous = null;
      } else {
        previous = `${globals.SPOTIFY_SAVED_TRACKS}?offset=${
          offset - limit
        }&limit=${limit}`;
      }

      const total = data.length;

      return HttpResponse.json({ items, limit, next, offset, previous, total });
    })
  ),
];
