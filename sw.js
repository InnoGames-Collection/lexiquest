/* LexiQuest service worker — network-first with offline cache fallback. */
const CACHE = "lexiquest-v3";
const ASSETS = [
  ".",
  "index.html",
  "manifest.json",
  "css/style.css",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/core.js",
  "js/data/words.js",
  "js/data/petals.js",
  "js/data/quizbank.js",
  "js/data/brainbank.js",
  "js/games/quiz-engine.js",
  "js/games/guess.js",
  "js/games/petals.js",
  "js/games/missing.js",
  "js/games/vocab.js",
  "js/games/thing.js",
  "js/games/spell.js",
  "js/games/truefalse.js",
  "js/games/rhyme.js",
  "js/games/trek.js",
  "js/games/eqgrid.js",
  "js/games/sequence.js",
  "js/games/target24.js",
  "js/games/sprint.js",
  "js/games/sudoku.js",
  "js/games/crosssum.js",
  "js/games/fractions.js",
  "js/games/primes.js",
  "js/games/codebreak.js",
  "js/games/memory.js",
  "js/games/oddone.js",
  "js/games/patterns.js",
  "js/games/logic.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first: players always get the newest code; the cache only serves
   when offline. Prevents stale-mix breakage after deployments. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
