const serviceWorkerDebug = false;

const cacheName = "voltaicbms-interface-iaa-v6.4";


const appShellFiles = [
    "index.html",
    "app.webmanifest",
    "fonts/Pervitina-Dex.ttf",
    "fonts/Pervitina-Dex-Monospace.ttf",
    "css/dynamic-style.css",
    "css/fixed-style.css",
    "css/fonts.css",
    "css/index-dark.css",
    "css/index-light.css",
    "css/settings.css",
    "css/colors.css",
    "css/tables.css",
    "css/libraries/coloris.css",
    "css/libraries/simplekeyboard.css",
    "dist/main.js",
    "img/icon/64x64.png",
    "img/icon/192x192.png",
    "img/icon/256x256.png",
    "img/icon/512x512.png",
    "img/icon/1024x1024.png",
    "img/icon/1500x1500.png",
    "img/off.jpg",
    "img/off-switch.png",
    "img/on-button.png",
    "img/on-switch.jpg",
];

// creates the "on install" install event, which saves the files to cache
// service worker is usually only installed once
self.addEventListener("install", (e) => {
    console.log("[Service Worker] Install");
    e.waitUntil(
        (async () => {
            const cache = await caches.open(cacheName);
            if(serviceWorkerDebug){
                console.log("[Service Worker] Caching all: app shell and content");
            }
            appShellFiles.forEach(file => {
                cache.add(file).catch(_ => console.error(`[Service Worker] can't load ${file} to cache`))
            });
        })()
    );
});

// respond to website's fetch events and fulfill them with cached items if available
self.addEventListener("fetch", (e) => {
    e.respondWith(
        (async () => {
            const r = await caches.match(e.request);
            if(serviceWorkerDebug){
                console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
            }
            if (r) {
                return r;
            }
            const response = await fetch(e.request);
            const cache = await caches.open(cacheName);
            if(serviceWorkerDebug){
                console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
            }
            await cache.put(e.request, response.clone());
            return response;
        })()
    );
});



// event is fired with activation of the serviceworker
self.addEventListener("activate", async () => {
    // claim control over all the existing clients (windows that are open during the update)
    await self.clients.claim();

    // clean the existing caches and delete potentially left behind data
    caches.keys().then((keyList) => {
        return Promise.all(
            keyList.map((key) => {
                if (key === cacheName) {
                    return;
                }
                return caches.delete(key);
            })
        );
    });
});


self.addEventListener('message', async (event) => {
    if (event.data === 'SKIP_WAITING') {
        await self.skipWaiting();
    }

    if (event.data === 'GET_VERSION') {
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            client.postMessage({
                msg: "version",
                version: cacheName,
            });
        }
    }
});
