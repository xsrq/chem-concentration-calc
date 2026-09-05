/* 化学试剂浓度计算器 - Service Worker（离线缓存 v3.2） */
const CACHE = 'chemcalc-v3-2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-256.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* 缓存优先，失败回源并更新缓存 */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* 联网查询（PubChem / AI API）不缓存，直接走网络 */
  if (url.hostname.includes('pubchem') || url.hostname.includes('openai') ||
      url.hostname.includes('deepseek') || url.hostname.includes('moonshot') ||
      url.hostname.includes('ollama') || url.hostname.includes('miaoda')) {
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && url.protocol.startsWith('http')) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
