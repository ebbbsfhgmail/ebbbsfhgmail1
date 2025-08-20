const CACHE_NAME = 'mhrcod-pwa-v2'; // غير هذا الاسم عند كل تحديث جذري
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // أيقونات PWA (تأكد من وجودها في مجلد icons)
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // أيقونات الاختصارات (إذا أضفتها)
    // '/icons/shortcut-new-file.png',
    // '/icons/shortcut-open-folder.png',

    // المكتبات الخارجية من CDN
    'https://unpkg.com/dexie@3.2.4/dist/dexie.min.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js',
    // Monaco Editor dependencies - هذه القائمة يجب أن تكون شاملة قدر الإمكان
    // قد تحتاج لتحديثها يدوياً أو استخدام Workbox لبناءها تلقائياً
    // لكن لمشروع ملف واحد، هذه محاولة لcache الأشياء الأساسية
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.main.css',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/html/html.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/css/css.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/javascript/javascript.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/java/java.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/cpp/cpp.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/csharp/csharp.js', // C# is often included with C/C++
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/python/python.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/json/json.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/basic-languages/xml/xml.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/html/html.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/css/css.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/json/json.worker.js',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js', // JavaScript/TypeScript worker
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/browser/ui/codicon/codicon.ttf', // الخط المستخدم للأيقونات داخل المحرر
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/browser/ui/actionbar/actionbar.css',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/browser/ui/button/button.css',
    'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/base/browser/ui/menu/menu.css',
    // ... يمكن إضافة المزيد من ملفات Monaco الأساسية إذا واجهت مشاكل في وضع عدم الاتصال
];

self.addEventListener('install', event => {
    self.skipWaiting(); // لتنشيط Service Worker الجديد فوراً
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Opened cache');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Service Worker: Failed to cache some URLs:', error);
                });
            })
    );
});

self.addEventListener('fetch', event => {
    // حاول تقديم الطلبات من الكاش أولاً
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا كان الطلب في الكاش، قم بإرجاع الاستجابة المخبأة
                if (response) {
                    return response;
                }
                // إذا لم يكن في الكاش، قم بجلبه من الشبكة
                return fetch(event.request).then(
                    response => {
                        // تحقق مما إذا كانت الاستجابة صالحة
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // استنساخ الاستجابة لتخزينها في الكاش ولتمريرها إلى المتصفح
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // لا تخبئ طلبات النطاق (range requests) أو غير GET (مثل POST)
                                if (event.request.method === 'GET' && !event.request.url.includes('range=')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });
                        return response;
                    }
                ).catch(error => {
                    console.warn('Service Worker: Fetch failed, and no item in cache.', error);
                    // يمكنك هنا تقديم صفحة "غير متصل" إذا كان الطلب فشل
                    // if (event.request.mode === 'navigate') {
                    //     return caches.match('/offline.html');
                    // }
                    throw error;
                });
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // المطالبة بالتحكم في العملاء على الفور
    self.clients.claim();
});