const CACHE_NAME = 'budget-tracker-cache-v1';
const DATA_CACHE_NAME = 'budget-tracker-data-cache-v1';

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/js/idb.js',
    '/assets/js/index.js',
    '/assets/css/styles.css',
    '/assets/images/icons/icon-72x72.png',
    '/assets/images/icons/icon-96x96.png',
    '/assets/images/icons/icon-128x128.png',
    '/assets/images/icons/icon-144x144.png',
    '/assets/images/icons/icon-152x152.png',
    '/assets/images/icons/icon-192x192.png',
    '/assets/images/icons/icon-384x384.png',
    '/assets/images/icons/icon-512x512.png',
];

self.addEventListener('install', function (e) 
{
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
        {
            console.log('Your files were pre-cached successfully!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', function (e)
{
    e.waitUntil(
        caches.keys().then(function (keyList)
        {
            return Promise.all(
                keyList.map(key =>
                {
                    if (key != CACHE_NAME && key != DATA_CACHE_NAME)
                    {
                        console.log('Deleting cache : ', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener('fetch', function (e)
{
    if (e.request.url.includes('/api/'))
    {
        e.respondWith(
            caches.open(DATA_CACHE_NAME)
                .then(cache => 
                {
                    return fetch(e.request)
                        .then(response =>
                        {
                            if (response.status == 200)
                            {
                                cache.put(e.request.url, response.clone());
                            }
                            return response;
                        })
                        .catch(err =>
                        {
                            return cache.match(e.request);
                        });
                })
                .catch(err => console.log(err))
        );
    }
    else
    {
        e.respondWith(
            fetch(e.request)
                .catch(function () 
                {
                    return caches.match(e.request)
                        .then(function (response)
                        {
                            if (response)
                                return response;
                            else if (e.request.headers.get('accept').includes('text.html'))
                                return caches.match('/index.html');
                        });
                })
        );
    }
});