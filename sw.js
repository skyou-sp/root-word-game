// 오프라인 저장: 한 번 열어 본 뒤에는 인터넷 없이도 실행된다.
// 파일을 고쳐서 다시 올릴 때는 아래 CACHE 이름의 숫자를 올려 주세요.
const CACHE = "root-defense-v1";
const FILES = [
  "./", "index.html", "style.css", "manifest.webmanifest",
  "data/words.js", "data/words2.js", "data/trans.js",
  "js/speech.js", "js/storage.js", "js/srs.js", "js/game.js", "js/app.js", "js/install.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 인터넷이 되면 최신 파일을 받고(그래서 업데이트가 바로 반영됨), 안 되면 저장된 파일을 쓴다.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match("index.html")))
  );
});
