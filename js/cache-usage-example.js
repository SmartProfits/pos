// 图片缓存使用示例
// 这个文件展示了如何在你的代码中使用Service Worker图片缓存系统

// 示例1: 在adminp.js中自动缓存产品图片
// 在loadProducts函数中添加以下代码：

/*
async function loadProducts() {
    try {
        // ... 现有的产品加载代码 ...
        
        // 加载完产品后，自动缓存产品图片
        if (window.swImageCacheManager) {
            await window.swImageCacheManager.cacheImagesFromProducts(productsData);
        }
        
        // ... 其他代码 ...
    } catch (error) {
        console.error('Failed to load products data:', error);
    }
}
*/

// 示例2: 手动缓存特定图片
/*
// 缓存单个图片
async function cacheSingleImage(imageUrl) {
    if (window.swImageCacheManager) {
        await window.swImageCacheManager.cacheProductImages([imageUrl]);
    }
}

// 缓存多个图片
async function cacheMultipleImages(imageUrls) {
    if (window.swImageCacheManager) {
        await window.swImageCacheManager.cacheProductImages(imageUrls);
    }
}
*/

// 示例3: 检查图片是否已缓存
/*
async function checkImageCacheStatus(imageUrl) {
    if (window.swImageCacheManager) {
        const isCached = await window.swImageCacheManager.isImageCached(imageUrl);
        console.log(`图片 ${imageUrl} 缓存状态:`, isCached ? '已缓存' : '未缓存');
        return isCached;
    }
    return false;
}
*/

// 示例4: 获取缓存信息
/*
async function showCacheInfo() {
    if (window.swImageCacheManager) {
        const cacheInfo = await window.swImageCacheManager.getCacheInfo();
        console.log('缓存信息:', cacheInfo);
        
        // 显示缓存统计
        Object.entries(cacheInfo).forEach(([cacheName, info]) => {
            console.log(`${cacheName}: ${info.size} 个文件`);
        });
    }
}
*/

// 示例5: 在admin.js中缓存产品图片
/*
// 在loadProducts函数中添加：
async function loadProducts() {
    try {
        // ... 现有的产品加载代码 ...
        
        // 缓存产品图片
        if (window.swImageCacheManager) {
            await window.swImageCacheManager.cacheImagesFromProducts(products);
        }
        
        // ... 其他代码 ...
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}
*/

// 示例6: 预加载图片到内存（提高显示速度）
/*
function preloadProductImages(products) {
    const imageUrls = [];
    
    // 提取所有产品图片URL
    Object.values(products).forEach(product => {
        if (product.image) imageUrls.push(product.image);
        if (product.imageUrl) imageUrls.push(product.imageUrl);
        if (product.photo) imageUrls.push(product.photo);
    });
    
    // 去重
    const uniqueUrls = [...new Set(imageUrls)];
    
    // 预加载图片
    if (window.swImageCacheManager) {
        window.swImageCacheManager.preloadImages(uniqueUrls);
    }
}
*/

// 示例7: 在页面加载完成后自动缓存
/*
document.addEventListener('DOMContentLoaded', async () => {
    // 等待Service Worker初始化
    setTimeout(async () => {
        if (window.swImageCacheManager) {
            // 自动缓存店铺图片
            await window.swImageCacheManager.cacheShopImages();
            
            // 如果有产品数据，也缓存产品图片
            if (typeof productsData !== 'undefined' && productsData) {
                await window.swImageCacheManager.cacheImagesFromProducts(productsData);
            }
        }
    }, 3000);
});
*/

// 示例8: 缓存管理功能
/*
// 清理特定缓存
async function clearImageCache() {
    if (window.swImageCacheManager) {
        await window.swImageCacheManager.clearCache('pos-images-v3');
        console.log('图片缓存已清理');
    }
}

// 清理所有缓存
async function clearAllCaches() {
    if (window.swImageCacheManager) {
        await window.swImageCacheManager.clearAllCaches();
        console.log('所有缓存已清理');
    }
}

// 获取Service Worker状态
function getServiceWorkerStatus() {
    if (window.swImageCacheManager) {
        const status = window.swImageCacheManager.getSWStatus();
        console.log('Service Worker 状态:', status);
        return status;
    }
    return '未初始化';
}
*/

// 示例9: 在Firebase数据更新后自动缓存新图片
/*
// 监听产品数据变化
function listenToProductChanges() {
    const productsRef = firebase.database().ref('store_products');
    
    productsRef.on('child_changed', async (snapshot) => {
        const productData = snapshot.val();
        
        // 如果有新图片，自动缓存
        if (productData && (productData.image || productData.imageUrl || productData.photo)) {
            const imageUrls = [];
            if (productData.image) imageUrls.push(productData.image);
            if (productData.imageUrl) imageUrls.push(productData.imageUrl);
            if (productData.photo) imageUrls.push(productData.photo);
            
            if (imageUrls.length > 0 && window.swImageCacheManager) {
                await window.swImageCacheManager.cacheProductImages(imageUrls);
                console.log('新产品图片已缓存:', imageUrls);
            }
        }
    });
}
*/

// 示例10: 错误处理和重试机制
/*
async function cacheImagesWithRetry(imageUrls, maxRetries = 3) {
    if (!window.swImageCacheManager) {
        console.warn('图片缓存管理器未初始化');
        return;
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await window.swImageCacheManager.cacheProductImages(imageUrls);
            console.log('图片缓存成功');
            break;
        } catch (error) {
            console.error(`图片缓存尝试 ${attempt} 失败:`, error);
            
            if (attempt === maxRetries) {
                console.error('图片缓存最终失败，已达到最大重试次数');
            } else {
                // 等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
}
*/

console.log('图片缓存使用示例已加载');
console.log('使用 window.swImageCacheManager 来访问缓存功能');
console.log('可用的方法:');
console.log('- cacheProductImages(imageUrls)');
console.log('- cacheShopImages()');
console.log('- cacheImagesFromProducts(products)');
console.log('- isImageCached(imageUrl)');
console.log('- getCacheInfo()');
console.log('- clearCache(cacheName)');
console.log('- clearAllCaches()');
console.log('- preloadImages(imageUrls)');
console.log('- getSWStatus()');

