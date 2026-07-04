// ETHOS service worker
const CACHE_NAME = "ethos-v4";
const ADMIN_CACHE = "ethos-admin-v4";
const OFFLINE_QUEUE = "ethos-offline-queue-v1";
const PRECACHE_URLS = ["/", "/services", "/cases", "/about", "/links", "/consult", "/offline.html", "/admin"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== ADMIN_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── IndexedDB helpers for background sync queue ─────────────────
function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_QUEUE, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("requests")) {
        db.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueRequest(request) {
  try {
    const db = await openQueueDb();
    const body = await request.clone().text();
    const record = {
      url: request.url,
      method: request.method,
      headers: [...request.headers.entries()],
      body,
      queuedAt: Date.now(),
    };
    await new Promise((resolve, reject) => {
      const tx = db.transaction("requests", "readwrite");
      tx.objectStore("requests").add(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if ("sync" in self.registration) {
      try { await self.registration.sync.register("ethos-replay-queue"); } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

async function replayQueue() {
  try {
    const db = await openQueueDb();
    const items = await new Promise((resolve, reject) => {
      const tx = db.transaction("requests", "readonly");
      const req = tx.objectStore("requests").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: new Headers(item.headers),
          body: item.body || undefined,
        });
        if (res.ok) {
          await new Promise((resolve, reject) => {
            const tx = db.transaction("requests", "readwrite");
            tx.objectStore("requests").delete(item.id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });
        }
      } catch { /* keep in queue */ }
    }
  } catch {}
}

self.addEventListener("sync", (event) => {
  if (event.tag === "ethos-replay-queue") {
    event.waitUntil(replayQueue());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "REPLAY_QUEUE") {
    event.waitUntil(replayQueue());
  }
});

// ── Fetch handler ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Queue mutating admin requests when offline (background sync)
  if (req.method !== "GET" && url.pathname.startsWith("/admin")) {
    event.respondWith(
      fetch(req.clone()).catch(async () => {
        const queued = await enqueueRequest(req);
        return new Response(
          JSON.stringify({ queued, offline: true, message: "네트워크 복구 시 자동 재전송됩니다." }),
          { status: 202, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  if (req.method !== "GET") return;

  // Network-first for API
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || Response.error()))
    );
    return;
  }

  // Network-first for /admin navigation (fresh data preferred, cache fallback)
  if (url.pathname.startsWith("/admin") && req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(ADMIN_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((m) => m || caches.match("/admin") || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Network-first for HTML navigation → offline fallback if all fails
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((m) => m || caches.match("/offline.html") || caches.match("/links"))
        )
    );
    return;
  }

  // Stale-while-revalidate for app shell assets (CSS, JS)
  const ext = url.pathname.split(".").pop();
  if (ext === "css" || ext === "js") {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached || caches.match("/offline.html"));
        return cached || networkFetch;
      })
    );
    return;
  }

  // Cache-first for other static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match("/offline.html") || caches.match("/"));
    })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "ETHOS 알림";
  const options = {
    body: data.body || "새로운 알림이 있습니다.",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    tag: data.tag || "ethos-notification",
    data: { url: data.url || "/admin" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
