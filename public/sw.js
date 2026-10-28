/* ════════════════════════════════════════════════════════════════
   StillYours service worker.

   Deliberately small. An owner opens this from another country on
   hotel wifi, so the shell and the icons are cached and a page that
   cannot be fetched falls back to a page that explains itself
   instead of the browser's dinosaur.

   Nothing that mutates is ever cached: POSTs and server actions go
   straight to the network, always.
   ════════════════════════════════════════════════════════════════ */

const VERSION = "sy-v2"; // v2: the round logo icons — bumping drops the old cached ones
const SHELL = `${VERSION}-shell`;
const OFFLINE = "/offline";

/* Registered as /sw.js?dev=1 by the dev server. Build output is only
   content-hashed in a production build, so caching it while you are editing
   hands you yesterday's CSS and no amount of reloading helps. */
const DEV = new URL(self.location.href).searchParams.get("dev") === "1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.addAll([OFFLINE, "/icons/icon-192.png", "/apple-touch-icon.png"])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first, so a signed-in owner never sees stale property
  // data — with the offline card as the floor.
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE)))
    );
    return;
  }

  // Build output and icons are content-hashed or static: cache first.
  if (DEV) return;
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons") || url.pathname.endsWith(".png") || url.pathname.endsWith(".webp")) {
    e.respondWith(
      caches.match(request).then((hit) =>
        hit || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(request, copy));
          return res;
        })
      )
    );
  }
});
