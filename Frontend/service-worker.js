const CACHE_NAME = "trinetra-ai-v2";


// Install
self.addEventListener("install", function () {
    self.skipWaiting();
});


// Activate
self.addEventListener("activate", function (event) {

    event.waitUntil(

        caches.keys().then(function (cacheNames) {

            return Promise.all(

                cacheNames.map(function (name) {

                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }

                })

            );

        })

    );

    self.clients.claim();
});


// Always load latest file first
self.addEventListener("fetch", function (event) {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        fetch(event.request)

            .then(function (response) {

                let copy = response.clone();

                caches.open(CACHE_NAME)
                    .then(function (cache) {

                        cache.put(
                            event.request,
                            copy
                        );

                    });

                return response;
            })

            .catch(function () {

                return caches.match(event.request);

            })

    );

});