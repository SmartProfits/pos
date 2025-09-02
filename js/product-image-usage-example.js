/**
 * 使用产品图片映射的示例
 * Example of using product image mapping
 * 
 * 这个文件展示了如何在其他页面中使用产品图片映射
 * This file demonstrates how to use product image mapping in other pages
 */

// 确保在使用前先引入 product-image-map.js
// Make sure to include product-image-map.js before using these functions

// 示例1：在产品目录页面中使用
// Example 1: Using in product catalog page
function displayProductCatalog(products) {
    const catalogContainer = document.getElementById('catalog-container');
    
    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'catalog-item';
        
        // 获取产品图片
        const productImage = getProductImage(product.name);
        
        productDiv.innerHTML = `
            <div class="product-image-container">
                <img src="${productImage}" alt="${product.name}" 
                     onerror="this.src='../icons/pos.png'">
            </div>
            <h3>${product.name}</h3>
            <p>价格: RM ${product.price}</p>
        `;
        
        catalogContainer.appendChild(productDiv);
    });
}

// 示例2：在POS系统中使用
// Example 2: Using in POS system
function addProductToCart(productName, price, quantity) {
    const cartItem = {
        name: productName,
        price: price,
        quantity: quantity,
        image: getProductImage(productName) // 获取产品图片
    };
    
    // 在购物车中显示产品图片
    displayCartItem(cartItem);
}

function displayCartItem(item) {
    const cartContainer = document.getElementById('cart-items');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    
    itemDiv.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">RM ${item.price} × ${item.quantity}</span>
        </div>
    `;
    
    cartContainer.appendChild(itemDiv);
}

// 示例3：在搜索功能中使用
// Example 3: Using in search functionality
function searchProducts(searchTerm) {
    // 假设这是从数据库获取的产品数据
    const allProducts = [
        { name: 'slipper lobster', price: 25.00 },
        { name: 'bh durian cookies', price: 15.50 },
        { name: 'sabah tea small (25pax)', price: 12.00 }
    ];
    
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    displaySearchResults(filteredProducts);
}

function displaySearchResults(products) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (products.length === 0) {
        resultsContainer.innerHTML = '<p>没有找到匹配的产品</p>';
        return;
    }
    
    products.forEach(product => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result-item';
        
        const productImage = getProductImage(product.name);
        const hasImage = productImage !== '../icons/pos.png';
        
        resultDiv.innerHTML = `
            <img src="${productImage}" alt="${product.name}" class="result-image">
            <div class="result-details">
                <h4>${product.name}</h4>
                <p>RM ${product.price.toFixed(2)}</p>
                ${hasImage ? '<span class="has-image">✅ 有图片</span>' : '<span class="no-image">📷 无图片</span>'}
            </div>
        `;
        
        resultsContainer.appendChild(resultDiv);
    });
}

// 示例4：检查产品是否有对应图片
// Example 4: Check if product has corresponding image
function checkProductImages(productNames) {
    console.log('📊 产品图片检查报告:');
    console.log('====================');
    
    const results = {
        withImages: [],
        withoutImages: []
    };
    
    productNames.forEach(productName => {
        const imagePath = getProductImage(productName);
        const hasImage = imagePath !== '../icons/pos.png';
        
        if (hasImage) {
            results.withImages.push(productName);
        } else {
            results.withoutImages.push(productName);
        }
    });
    
    console.log(`✅ 有图片的产品 (${results.withImages.length}个):`);
    results.withImages.forEach(name => console.log(`  - ${name}`));
    
    console.log(`❌ 无图片的产品 (${results.withoutImages.length}个):`);
    results.withoutImages.forEach(name => console.log(`  - ${name}`));
    
    return results;
}

// 示例5：批量更新产品显示
// Example 5: Batch update product display
function updateAllProductImages() {
    const productElements = document.querySelectorAll('.product-item');
    
    productElements.forEach(element => {
        const productName = element.getAttribute('data-product-name') || 
                          element.querySelector('.product-name')?.textContent;
        
        if (productName) {
            const imgElement = element.querySelector('.product-image');
            if (imgElement) {
                const newImageSrc = getProductImage(productName);
                imgElement.src = newImageSrc;
                imgElement.onerror = function() {
                    this.src = '../icons/pos.png';
                };
            }
        }
    });
}

// 导出函数供其他模块使用
// Export functions for other modules
window.displayProductCatalog = displayProductCatalog;
window.addProductToCart = addProductToCart;
window.searchProducts = searchProducts;
window.checkProductImages = checkProductImages;
window.updateAllProductImages = updateAllProductImages;


