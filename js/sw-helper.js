// Service Worker 辅助函数
// 用于管理图片缓存和与Service Worker通信

class SWImageCacheManager {
    constructor() {
        this.swRegistration = null;
        this.init();
    }

    // 初始化Service Worker
    async init() {
        try {
            if ('serviceWorker' in navigator) {
                this.swRegistration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker 注册成功:', this.swRegistration);
                
                // 监听Service Worker更新
                this.swRegistration.addEventListener('updatefound', () => {
                    const newWorker = this.swRegistration.installing;
                    console.log('Service Worker 更新发现:', newWorker);
                });
            }
        } catch (error) {
            console.error('Service Worker 注册失败:', error);
        }
    }

    // 预缓存产品图片
    async cacheProductImages(imageUrls) {
        if (!this.swRegistration || !this.swRegistration.active) {
            console.warn('Service Worker 未激活，无法缓存图片');
            return;
        }

        try {
            // 发送消息给Service Worker来缓存图片
            this.swRegistration.active.postMessage({
                type: 'CACHE_PRODUCT_IMAGES',
                images: imageUrls
            });
            
            console.log('已发送图片缓存请求:', imageUrls.length, '张图片');
        } catch (error) {
            console.error('发送图片缓存请求失败:', error);
        }
    }

    // 预缓存店铺图片
    async cacheShopImages() {
        const shopImages = [
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

        await this.cacheProductImages(shopImages);
    }

    // 从产品数据中提取图片URL并缓存
    async cacheImagesFromProducts(products) {
        if (!products || typeof products !== 'object') {
            console.warn('无效的产品数据');
            return;
        }

        const imageUrls = [];
        
        // 遍历产品数据，提取图片URL
        Object.values(products).forEach(product => {
            if (product.image && typeof product.image === 'string') {
                imageUrls.push(product.image);
            }
            if (product.imageUrl && typeof product.imageUrl === 'string') {
                imageUrls.push(product.imageUrl);
            }
            if (product.photo && typeof product.photo === 'string') {
                imageUrls.push(product.photo);
            }
        });

        // 去重
        const uniqueImageUrls = [...new Set(imageUrls)];
        
        if (uniqueImageUrls.length > 0) {
            console.log('发现产品图片:', uniqueImageUrls.length, '张');
            await this.cacheProductImages(uniqueImageUrls);
        } else {
            console.log('未发现产品图片');
        }
    }

    // 检查图片是否已缓存
    async isImageCached(imageUrl) {
        try {
            const cache = await caches.open('pos-images-v3');
            const response = await cache.match(imageUrl);
            return !!response;
        } catch (error) {
            console.error('检查图片缓存状态失败:', error);
            return false;
        }
    }

    // 获取缓存状态信息
    async getCacheInfo() {
        try {
            const cacheNames = await caches.keys();
            const cacheInfo = {};

            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();
                cacheInfo[cacheName] = {
                    name: cacheName,
                    size: keys.length,
                    urls: keys.map(req => req.url)
                };
            }

            return cacheInfo;
        } catch (error) {
            console.error('获取缓存信息失败:', error);
            return {};
        }
    }

    // 清理特定缓存
    async clearCache(cacheName) {
        try {
            await caches.delete(cacheName);
            console.log('已清理缓存:', cacheName);
            return true;
        } catch (error) {
            console.error('清理缓存失败:', error);
            return false;
        }
    }

    // 清理所有缓存
    async clearAllCaches() {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            console.log('已清理所有缓存');
            return true;
        } catch (error) {
            console.error('清理所有缓存失败:', error);
            return false;
        }
    }

    // 预加载图片到内存
    preloadImages(imageUrls) {
        if (!Array.isArray(imageUrls)) {
            console.warn('图片URL必须是数组');
            return;
        }

        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = () => console.log('图片预加载成功:', url);
            img.onerror = () => console.warn('图片预加载失败:', url);
        });
    }

    // 获取Service Worker状态
    getSWStatus() {
        if (!this.swRegistration) {
            return '未注册';
        }

        if (this.swRegistration.installing) {
            return '安装中';
        } else if (this.swRegistration.waiting) {
            return '等待中';
        } else if (this.swRegistration.active) {
            return '激活';
        } else {
            return '未知';
        }
    }
}

// 创建全局实例
const swImageCacheManager = new SWImageCacheManager();

// 导出到全局作用域
window.swImageCacheManager = swImageCacheManager;

// 自动缓存店铺图片
document.addEventListener('DOMContentLoaded', () => {
    // 延迟一下，确保Service Worker已经激活
    setTimeout(() => {
        swImageCacheManager.cacheShopImages();
    }, 2000);
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SWImageCacheManager;
}
