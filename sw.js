const CACHE_NAME = 'pos-system-v3';
const STATIC_CACHE = 'pos-static-v3';
const IMAGES_CACHE = 'pos-images-v3';
const DATA_CACHE = 'pos-data-v3';

// 静态资源缓存列表
const staticUrlsToCache = [
  '/',
  '/index.html',
  '/pages/admin.html',
  '/pages/adminp.html',
  '/pages/pos.html',
  '/pages/product_catalog.html',
  '/css/styles.css',
  '/css/ios-style.css',
  '/js/auth.js',
  '/js/admin.js',
  '/js/adminp.js',
  '/js/pos.js',
  '/js/catalog.js',
  '/js/database.js',
  '/js/firebase-config.js',
  '/js/network-monitor.js',
  '/js/sw-update.js',
  '/js/update-notification.js',
  '/icons/pos-512x512.png',
  '/icons/pos.png'
];

// 店铺图片缓存列表
const shopImagesToCache = [
  '/shop/Aa.png',
  '/shop/dalam.png',
  '/shop/jkl.png',
  '/shop/ktsp.png',
  '/shop/left.png',
  '/shop/luar.png',
  '/shop/Mas.png',
  '/shop/som.png',
  '/shop/tawau.png',
  '/shop/tom.png',
  '/shop/wisma.png'
];

// 安装 service worker 并缓存静态资源
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('已打开静态资源缓存: ' + STATIC_CACHE);
        return cache.addAll(staticUrlsToCache);
      }),
      
      // 缓存店铺图片
      caches.open(IMAGES_CACHE).then(cache => {
        console.log('已打开图片缓存: ' + IMAGES_CACHE);
        return cache.addAll(shopImagesToCache);
      })
    ]).then(() => {
      console.log('所有资源缓存完成');
    })
  );
  
  // 强制新的service worker立即激活
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');
  
  const cacheWhitelist = [STATIC_CACHE, IMAGES_CACHE, DATA_CACHE];
  
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
      console.log('新版本已激活，缓存版本: ' + CACHE_NAME);
      return self.clients.claim();
    })
  );
});

// 智能缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过Firebase相关请求
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }
  
  // 静态资源缓存策略
  if (isStaticResource(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // 图片缓存策略
  if (isImage(request)) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
    return;
  }
  
  // 数据请求策略（网络优先，失败时使用缓存）
  if (isDataRequest(request)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }
  
  // 默认策略：网络优先
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

// 判断是否为静态资源
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|html|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// 判断是否为图片
function isImage(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/);
}

// 判断是否为数据请求
function isDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/') || 
         url.pathname.includes('/data/') || 
         url.hostname.includes('firebase');
}

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  try {
    // 先尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('从缓存返回:', request.url);
      return cachedResponse;
    }
    
    // 缓存中没有，从网络获取并缓存
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('已缓存新资源:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('缓存优先策略失败:', error);
    // 如果网络请求失败，尝试从缓存获取任何可能的响应
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 网络优先策略
async function networkFirst(request, cacheName) {
  try {
    // 先尝试从网络获取
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // 网络请求成功，缓存响应
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('网络优先 - 已缓存:', request.url);
      return networkResponse;
    }
    throw new Error('Network response was not ok');
  } catch (error) {
    console.log('网络请求失败，尝试从缓存获取:', request.url);
    
    // 网络请求失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('从缓存返回:', request.url);
      return cachedResponse;
    }
    
    // 缓存中也没有，返回错误
    throw error;
  }
}

// 预缓存产品图片（当产品数据更新时调用）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_PRODUCT_IMAGES') {
    const productImages = event.data.images;
    if (productImages && productImages.length > 0) {
      event.waitUntil(
        caches.open(IMAGES_CACHE).then(cache => {
          return Promise.all(
            productImages.map(imageUrl => {
              return cache.add(imageUrl).catch(error => {
                console.log('缓存产品图片失败:', imageUrl, error);
              });
            })
          );
        })
      );
    }
  }
});

// 清理过期缓存
async function cleanupExpiredCache() {
  try {
    const cacheNames = await caches.keys();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const responseDate = new Date(dateHeader).getTime();
            if (now - responseDate > maxAge) {
              await cache.delete(request);
              console.log('已删除过期缓存:', request.url);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('清理过期缓存失败:', error);
  }
}

// 定期清理过期缓存（每天执行一次）
setInterval(cleanupExpiredCache, 24 * 60 * 60 * 1000); 