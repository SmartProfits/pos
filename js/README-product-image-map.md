# 产品图片映射系统 Product Image Mapping System

## 📁 文件结构 File Structure

```
js/
├── product-image-map.js           # 主要的产品图片映射文件
├── product-image-usage-example.js # 使用示例文件
└── README-product-image-map.md    # 这个说明文件
```

## 🚀 快速开始 Quick Start

### 1. 在HTML中引入文件
```html
<!-- 在其他JS文件之前引入 -->
<script src="js/product-image-map.js"></script>
<script src="your-main-script.js"></script>
```

### 2. 基本使用
```javascript
// 获取产品图片
const imagePath = getProductImage('slipper lobster');
// 返回: '../product/Slipper Lobster.png' 或 '../icons/pos.png'

// 显示可用的图片映射
showAvailableImageMappings();

// 测试图片加载
testImageLoading();
```

## 📋 可用函数 Available Functions

### `getProductImage(productName)`
获取产品对应的图片路径
- **参数**: `productName` - 产品名称（字符串）
- **返回**: 图片路径（字符串）
- **说明**: 只进行精确匹配，不区分大小写

```javascript
const image1 = getProductImage('slipper lobster');    // ✅ 匹配成功
const image2 = getProductImage('Slipper Lobster');    // ✅ 匹配成功 
const image3 = getProductImage('lobster');            // ❌ 不匹配，返回默认图标
```

### `showAvailableImageMappings()`
在控制台显示所有可用的图片映射
```javascript
showAvailableImageMappings();
// 控制台输出所有可用的产品名称和对应的图片路径
```

### `testImageLoading()`
测试图片加载功能
```javascript
testImageLoading();
// 在控制台显示测试图片的加载结果
```

## 🎯 完整使用示例 Complete Usage Examples

### 在产品列表中使用
```javascript
function displayProducts(products) {
    const container = document.getElementById('products');
    
    products.forEach(product => {
        const productDiv = document.createElement('div');
        const productImage = getProductImage(product.name);
        
        productDiv.innerHTML = `
            <img src="${productImage}" alt="${product.name}" 
                 onerror="this.src='../icons/pos.png'">
            <h3>${product.name}</h3>
            <p>RM ${product.price}</p>
        `;
        
        container.appendChild(productDiv);
    });
}
```

### 在POS系统中使用
```javascript
function addToCart(productName, price) {
    const cartItem = {
        name: productName,
        price: price,
        image: getProductImage(productName)
    };
    
    // 显示在购物车中
    displayCartItem(cartItem);
}
```

### 检查产品图片状态
```javascript
const productNames = ['slipper lobster', 'unknown product', 'bh durian cookies'];
const results = checkProductImages(productNames);

console.log('有图片:', results.withImages);
console.log('无图片:', results.withoutImages);
```

## 📝 精确匹配规则 Exact Matching Rules

产品名称必须**完全匹配**映射表中的键值才会显示图片：

### ✅ 正确的匹配示例
```javascript
// 这些都会匹配成功并显示图片
'slipper lobster'              → '../product/Slipper Lobster.png'
'SLIPPER LOBSTER'              → '../product/Slipper Lobster.png'
'bh durian cookies'            → '../product/BH Durian Cookies.png'
'sabah tea small (25pax)'      → '../product/sabah tea small.png'
```

### ❌ 不匹配的示例
```javascript
// 这些不会匹配，将显示默认图标
'lobster'                      → '../icons/pos.png' (不完整)
'slipper'                      → '../icons/pos.png' (不完整)
'BH Durian Cookie'             → '../icons/pos.png' (单复数不同)
'sabah tea small'              → '../icons/pos.png' (缺少规格)
```

## 🔧 在其他页面中使用 Using in Other Pages

### 1. 在admin页面中使用
```html
<!-- pages/admin.html -->
<script src="../js/product-image-map.js"></script>
<script src="../js/admin.js"></script>
```

### 2. 在POS页面中使用
```html
<!-- pages/pos.html -->
<script src="../js/product-image-map.js"></script>
<script src="../js/pos.js"></script>
```

### 3. 在产品目录页面中使用
```html
<!-- pages/product_catalog.html -->
<script src="../js/product-image-map.js"></script>
<script src="../js/catalog.js"></script>
```

## 🎨 CSS样式建议 Recommended CSS Styles

```css
.product-image-container {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    background: #f5f5f5;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-image-large {
    max-width: 200px;
    max-height: 200px;
    border-radius: 12px;
}
```

## 📂 产品分类 Product Categories

当前映射包含以下产品分类：

- **Ban Heang (BH)**: 万香饼家产品
- **Hoe Hup (HH)**: 和合饼家产品  
- **AD Chocolate**: AD巧克力系列
- **Sabah Tea**: 沙巴茶系列
- **Seafood**: 海鲜产品
- **Spritzer**: 矿泉水
- **Office**: 办公室零食
- **Other**: 其他产品

## ⚠️ 注意事项 Important Notes

1. **加载顺序**: 必须在使用前先引入 `product-image-map.js`
2. **精确匹配**: 产品名称必须完全匹配，包括空格和标点符号
3. **大小写**: 不区分大小写，但其他字符必须完全一致
4. **默认图标**: 未匹配的产品将显示 `../icons/pos.png`
5. **路径相对性**: 图片路径是相对于HTML文件的位置

## 🔄 更新产品映射 Updating Product Mappings

要添加新的产品图片映射，请编辑 `js/product-image-map.js` 文件：

```javascript
// 在 productImageMap 对象中添加新的映射
const productImageMap = {
    // 现有映射...
    
    // 添加新产品
    'new product name': '../product/New Product Image.png',
    'another product': '../product/Another Product.jpg',
};
```

## 🐛 调试技巧 Debugging Tips

1. **查看控制台输出**: 每次调用都会在控制台显示匹配结果
2. **使用映射列表**: 调用 `showAvailableImageMappings()` 查看所有可用映射
3. **测试图片加载**: 使用 `testImageLoading()` 验证图片路径
4. **检查产品名称**: 确保产品名称与映射表中的键值完全一致

## 📞 技术支持 Technical Support

如果遇到问题，请检查：
1. 是否正确引入了 `product-image-map.js` 文件
2. 产品名称是否与映射表完全匹配
3. 图片文件是否存在于指定路径
4. 控制台是否有错误信息



