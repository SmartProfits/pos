const CACHE_NAME = 'pos-system-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/admin.html',
  '/pages/pos.html',
  '/css/styles.css',
  '/js/auth.js',
  '/js/admin.js',
  '/js/pos.js',
  '/js/database.js',
  '/js/firebase-config.js',
  '/icons/pos-512x512.png'
];

// 安装 service worker 并缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已打开缓存: ' + CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
  );
  // 强制新的service worker立即激活，不等待旧service worker终止
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 删除不在白名单中的缓存
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('删除旧缓存: ' + cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 确保service worker立即控制所有客户端页面
      console.log('新版本已激活: ' + CACHE_NAME);
      return self.clients.claim();
    })
  );
});

// 当网络请求发送时，尝试从缓存中获取，否则发送网络请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果找到了缓存的响应，则返回它
        if (response) {
          return response;
        }
        
        // 克隆请求，因为请求只能使用一次
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          response => {
            // 检查是否有效的响应
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应是流，只能使用一次
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
  );
}); 