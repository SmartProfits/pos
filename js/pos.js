// 添加调试日志
console.log("销售页面脚本开始加载");
console.log("当前路径:", window.location.pathname);
console.log("当前URL:", window.location.href);

// 定义全局变量
let products = {}; // 存储商品数据
let cart = []; // 购物车
let storeData = {}; // 存储店铺信息
let categories = []; // 存储所有分类
let currentCategory = 'all'; // 当前选中的分类
let selectedDate = getCurrentDate(); // 默认选择当前日期
let selectedShift = 'all'; // 当前选择的班次
let salesData = {}; // 存储销售记录
let currentSaleId = null; // 当前选中的销售记录
let editingSale = null; // 正在编辑的销售记录
let billNumberCounter = 0; // 账单号计数器
let cashierName = ''; // 收银员姓名
let cashierShift = ''; // 收银员班次
let cashierHistory = []; // 收银员历史记录，用于记录换班情况
let discountPercent = 0; // 折扣百分比，0表示无折扣
let discountAmount = 0; // 直接金额折扣
let discountType = 'percent'; // 折扣类型，percent表示百分比，amount表示金额
let sidebarCollapsed = false; // 侧边栏状态
let cachedSalesData = null; // 缓存的完整销售数据（所有班次）

/**
 * 将价格四舍五入到最接近的0.05
 * 例如: 1.01 -> 1.00, 1.03 -> 1.05, 1.06 -> 1.05, 1.08 -> 1.10
 * 
 * 已实现该功能在以下地方:
 * 1. 购物车总价显示 (renderCart)
 * 2. 结账时的总价计算 (checkout)
 * 3. 编辑销售记录时的总价计算 (renderEditSaleItems 和 updateSale)
 * 
 * @param {number} value - 需要四舍五入的价格
 * @return {number} - 已四舍五入的价格
 */
function roundToNearest005(value) {
    // 将价格乘以20，四舍五入到整数，然后除以20
    // 这样可以得到四舍五入到最接近的0.05的值
    return Math.round(value * 20) / 20;
}

// DOM元素
const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const categoryFilter = document.getElementById('categoryFilter');
const productSearch = document.getElementById('productSearch'); // 添加产品搜索输入框
const storeName = document.getElementById('storeName');
const storeId = document.getElementById('storeId');
const staffName = document.getElementById('staffName');
const currentDateTime = document.getElementById('currentDateTime');
const viewTitle = document.getElementById('viewTitle');
const navItems = document.querySelectorAll('.nav-item[data-view]');
const views = document.querySelectorAll('.view');
const dateFilter = document.getElementById('dateFilter');
const salesTableBody = document.getElementById('salesTableBody');
const checkoutSuccessModal = document.getElementById('checkoutSuccessModal');
const saleDetailModal = document.getElementById('saleDetailModal');
const editSaleModal = document.getElementById('editSaleModal');
const receiptDetails = document.getElementById('receiptDetails');
const saleDetailContent = document.getElementById('saleDetailContent');
const editSaleContent = document.getElementById('editSaleContent');
const editCartItems = document.getElementById('editCartItems');
const editCartTotal = document.getElementById('editCartTotal');
const printReceiptBtn = document.getElementById('printReceiptBtn');
const newSaleBtn = document.getElementById('newSaleBtn');
const deleteSaleBtn = document.getElementById('deleteSaleBtn');
const updateSaleBtn = document.getElementById('updateSaleBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const closeModalBtns = document.querySelectorAll('.close');
const cashierNameModal = document.getElementById('cashierNameModal');
const cashierNameForm = document.getElementById('cashierNameForm');
const cashierNameDisplay = document.getElementById('cashierNameDisplay');
const cashierShiftDisplay = document.getElementById('cashierShiftDisplay');
const cashierShiftSelect = document.getElementById('cashierShift');
const changeCashierBtn = document.getElementById('changeCashierBtn');
const viewCashierHistoryBtn = document.getElementById('viewCashierHistoryBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.getElementById('mainContent');
const toggleIcon = document.getElementById('toggleIcon');

// 库存管理DOM元素
const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
const inventoryStockFilter = document.getElementById('inventoryStockFilter');
const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const updateStockModal = document.getElementById('updateStockModal');
const updateStockForm = document.getElementById('updateStockForm');
const stockHistoryModal = document.getElementById('stockHistoryModal');
const stockHistoryContent = document.getElementById('stockHistoryContent');
const addProductBtn = document.getElementById('addProductBtn');
const addProductModal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const shiftFilter = document.getElementById('shiftFilter');
const inventorySearchInput = document.getElementById('inventorySearchInput'); // 添加库存搜索输入框

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
    // 应用购物车样式优化 - 增加可视项目数量
    const cartItemsStyle = document.createElement('style');
    cartItemsStyle.textContent = `
        .cart-items {
            max-height: 800px !important; /* 强制使用更大的高度 */
            height: auto !important;
        }
        .sidebar.collapsed ~ .content .cart-items {
            max-height: 900px !important;
        }
        .cart-container {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            display: flex !important;
            flex-direction: column !important;
        }
        /* 使购物车项目更紧凑 */
        .cart-item {
            flex-shrink: 0 !important;
            margin-bottom: 8px !important;
            padding: 8px !important;
        }
        .cart-item-header {
            margin-bottom: 4px !important;
            padding-bottom: 4px !important;
        }
        .cart-item-name {
            font-size: 14px !important;
        }
        .cart-item-price {
            font-size: 12px !important;
        }
        .cart-item-total {
            font-size: 14px !important;
        }
        /* 压缩购物车中的其他元素以便显示更多商品 */
        .cart-discount, .cart-summary {
            margin-top: 5px !important;
            padding: 5px !important;
        }
        /* 缩小折扣控制区域 */
        .discount-type-selector {
            gap: 5px !important;
            margin-bottom: 5px !important;
            flex-direction: row !important;
        }
        .discount-type-selector label {
            font-size: 12px !important;
            gap: 2px !important;
        }
        .discount-control {
            gap: 5px !important;
            margin: 3px 0 !important;
        }
        .discount-control label {
            font-size: 12px !important;
            flex: 0.8 !important;
        }
        .discount-control input {
            padding: 4px !important;
            font-size: 12px !important;
        }
        .discount-control button {
            padding: 4px 8px !important;
            font-size: 12px !important;
        }
        .discount-control button .material-icons {
            font-size: 14px !important;
        }
        /* 紧凑摘要区域 */
        .cart-summary {
            margin-top: 5px !important;
            border: none !important;
        }
        .summary-row {
            margin-bottom: 4px !important;
            padding-bottom: 4px !important;
            font-size: 13px !important;
        }
        .summary-row.total {
            padding-top: 4px !important;
            margin-top: 4px !important;
            font-size: 14px !important;
        }
        /* 全新和谐按钮样式 */
        .cart-actions {
            margin-top: 5px !important;
            gap: 8px !important;
            display: flex !important;
        }
        /* 清空购物车按钮 */
        #clearCartBtn {
            background-color: transparent !important;
            border: 1px solid #e0e0e0 !important;
            color: #555 !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            font-size: 13px !important;
            transition: all 0.2s ease !important;
            flex: 0.6 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
        }
        #clearCartBtn:hover {
            background-color: #f5f5f5 !important;
            border-color: #ddd !important;
            color: #e74c3c !important;
        }
        #clearCartBtn i {
            font-size: 16px !important;
        }
        /* 结账按钮 */
        .checkout-btn {
            background: linear-gradient(135deg, #26c6da, #00acc1) !important;
            color: white !important;
            border: none !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
            flex: 1 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        .checkout-btn:hover {
            background: linear-gradient(135deg, #00acc1, #0097a7) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        .checkout-btn i {
            font-size: 18px !important;
        }
        .checkout-btn:disabled {
            background: linear-gradient(135deg, #b2ebf2, #80deea) !important;
            color: rgba(255,255,255,0.8) !important;
            cursor: not-allowed !important;
            transform: none !important;
            box-shadow: none !important;
        }
        /* 缩小总计区域 */
        .cart-total {
            margin: 8px 0 !important;
            padding-top: 8px !important;
            font-size: 1em !important;
        }
        /* 折扣按钮样式 */
        .toggle-discount-btn {
            border-radius: 50% !important;
            width: 26px !important;
            height: 26px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background-color: #f5f5f5 !important;
            transition: all 0.2s ease !important;
        }
        .toggle-discount-btn:hover {
            background-color: #e0f7fa !important;
            transform: scale(1.1) !important;
        }
        .toggle-discount-btn i {
            color: #0097a7 !important;
        }
        .toggle-discount-btn.active i {
            color: #d81b60 !important;
        }
        @media (max-width: 1024px) and (min-width: 768px) {
            .cart-items {
                max-height: 700px !important;
            }
        }
    `;
    document.head.appendChild(cartItemsStyle);
    
    // 检查用户是否登录
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = localStorage.getItem('role');
    const userStoreId = localStorage.getItem('store_id');
    
    if (!user.uid || userRole !== 'staff' || !userStoreId) {
        // 如果用户未登录或不是店员，重定向到登录页面
        window.location.href = '../index.html';
        return;
    }
    
    // 获取并显示用户名
    getUserInfo(user.uid).then(userInfo => {
        if (userInfo && userInfo.name) {
            document.getElementById('userName').textContent = userInfo.name;
        } else {
            // 如果没有设置名字，使用邮箱名作为默认
            document.getElementById('userName').textContent = user.email.split('@')[0];
        }
    });
    
    // 加载店铺信息
    loadStoreInfo(userStoreId);
    
    // 加载商品数据
    loadProducts(userStoreId);
    
    // 加载最后一个账单号
    loadLastBillNumber();
    
    // 加载收银员历史记录
    loadCashierHistory();
    
    // 检查收银员姓名和班次是否已经设置
    cashierName = localStorage.getItem('cashierName');
    cashierShift = localStorage.getItem('cashierShift');
    
    if (cashierName) {
        cashierNameDisplay.textContent = cashierName;
    } else {
        cashierNameDisplay.textContent = 'Not set';
    }
    
    if (cashierShift) {
        cashierShiftDisplay.textContent = cashierShift;
    } else {
        cashierShiftDisplay.textContent = 'Not set';
    }
    
    if (!cashierName || !cashierShift) {
        // 如果没有设置，显示输入模态框
        showModal(cashierNameModal);
    }
    
    // 初始化事件监听器
    initEventListeners();
    
    // 更新当前时间
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // 恢复侧边栏状态
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState === 'true') {
        toggleSidebar();
    }
    
    // 检查简化模式状态
    checkSimpleModeOnLoad();
    
    // 恢复热销商品状态
    restoreHotItemsState();
});

// 获取用户信息
function getUserInfo(userId) {
    return database.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            return snapshot.val();
        })
        .catch(error => {
            console.error('获取用户信息出错:', error);
            return null;
        });
}

// 加载店铺信息
function loadStoreInfo(storeId) {
    database.ref(`stores/${storeId}`).once('value')
        .then(snapshot => {
            const store = snapshot.val() || { name: 'Unknown Store' };
            storeData = store;
            // 不再更新storeName元素，因为已在UI中移除
            document.title = `POS - ${store.name}`; // 仅更新页面标题
        })
        .catch(error => {
            console.error('Failed to load store information:', error);
            // 不再弹出警告，而是在控制台记录错误
        });
}

// 加载店铺商品
function loadProducts(storeId) {
    console.log("开始加载店铺商品，店铺ID:", storeId);
    
    // 显示加载中状态
    productGrid.innerHTML = '<div class="loading-indicator"><i class="material-icons">hourglass_empty</i> Loading products...</div>';
    
    // 使用优化的函数获取店铺产品
    getStoreProductsOptimized(storeId)
        .then(storeProducts => {
            console.log(`获取到${Object.keys(storeProducts).length}个商品`);
            products = storeProducts;
            
            // 提取所有唯一的类别
            extractCategories();
            
            // 填充类别过滤器
            populateCategoryFilter();
            
            // 如果有选择的类别且不是"全部"，使用按类别查询进一步优化
            if (currentCategory && currentCategory !== 'all') {
                return getProductsByCategory(storeId, currentCategory);
            } else {
                return products; // 返回所有商品
            }
        })
        .then(filteredProducts => {
            // 如果使用了按类别过滤，更新产品列表
            if (currentCategory && currentCategory !== 'all') {
                console.log(`按类别"${currentCategory}"过滤后剩余${Object.keys(filteredProducts).length}个商品`);
                products = filteredProducts;
            }
            
            // 渲染产品列表
            renderProducts();
            
            // 加载热销商品
            loadHotItems();
        })
        .catch(error => {
            console.error('加载商品失败:', error);
            productGrid.innerHTML = '<div class="error-message"><i class="material-icons">error</i> 加载商品失败，请刷新页面重试。</div>';
        });
}

// 提取所有唯一的类别
function extractCategories() {
    categories = ['all']; // 重置类别，始终包括"全部"选项
    
    Object.values(products).forEach(product => {
        if (product.category && !categories.includes(product.category)) {
            categories.push(product.category);
        }
    });
    
    console.log('Available categories:', categories);
}

// 填充类别过滤器下拉菜单
function populateCategoryFilter() {
    // 清空除了"All Categories"外的所有选项
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // 添加类别选项
    categories.forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });
}

// 渲染商品列表
function renderProducts(searchQuery = '') {
    console.log("渲染产品列表，搜索查询:", searchQuery); // 添加调试日志
    productGrid.innerHTML = '';
    
    if (Object.keys(products).length === 0) {
        productGrid.innerHTML = '<div class="no-products">No products available</div>';
        return;
    }
    
    // 先按类别筛选
    let filteredProducts = currentCategory === 'all' 
        ? Object.entries(products) 
        : Object.entries(products).filter(([_, product]) => product.category === currentCategory);
    
    // 如果有搜索查询，再按搜索条件筛选
    if (searchQuery && searchQuery.trim() !== '') {
        console.log("应用搜索过滤，过滤前产品数:", filteredProducts.length); // 添加调试日志
        const query = searchQuery.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(([id, product]) => 
            product.name.toLowerCase().includes(query) || 
            id.toLowerCase().includes(query) ||
            (product.description && product.description.toLowerCase().includes(query))
        );
        console.log("过滤后产品数:", filteredProducts.length); // 添加调试日志
    }
    
    if (filteredProducts.length === 0) {
        const noProductsMessage = document.createElement('div');
        noProductsMessage.className = 'no-products';
        noProductsMessage.innerHTML = `
            <i class="material-icons">search_off</i>
            <p>No products found</p>
            ${searchQuery ? '<p>Try a different search term or category</p>' : ''}
        `;
        productGrid.appendChild(noProductsMessage);
        return;
    }
    
    console.log(`准备渲染${filteredProducts.length}个产品`); // 添加调试日志
    
    filteredProducts.forEach(([productId, product]) => {
        // 获取库存，如果不存在则显示为"无库存"
        const stock = product.stock !== undefined ? product.stock : 'N/A';
        const stockClass = getStockStatusClass(stock);
        const saleUnit = product.saleUnit || 'piece';
        const isWeightSale = saleUnit === 'weight';
        
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        if (isWeightSale) {
            productElement.classList.add('weight-product');
        }
        productElement.dataset.id = productId;
        productElement.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category || 'Uncategorized'}</div>
            <div class="product-price">RM${product.price.toFixed(2)}</div>
            <div class="product-stock ${stockClass}">Stock: ${stock}${isWeightSale ? 'kg' : ''}</div>
        `;
        
        // 如果库存为0或不存在，禁用点击事件
        if (stock !== 'N/A' && stock <= 0) {
            productElement.classList.add('out-of-stock');
        } else {
            productElement.addEventListener('click', () => addToCart(productId));
        }
        
        productGrid.appendChild(productElement);
    });
    
    // 更新热销商品显示（确保库存状态正确）
    if (hotItems.length > 0) {
        renderHotItems();
    }
}

// 获取库存状态的CSS类
function getStockStatusClass(stock) {
    if (stock === 'N/A') return 'stock-unknown';
    if (stock <= 0) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-available';
}

// 初始化事件监听器
function initEventListeners() {
    // 侧边栏切换
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 商品搜索和过滤
    if (productSearch) {
        console.log("找到搜索框元素:", productSearch); // 添加调试日志
        
        // 添加输入事件监听器
        productSearch.addEventListener('input', filterProducts);
        
        // 添加焦点事件监听器
        productSearch.addEventListener('focus', () => {
            productSearch.parentElement.classList.add('active');
        });
        
        // 添加失焦事件监听器
        productSearch.addEventListener('blur', () => {
            productSearch.parentElement.classList.remove('active');
        });
        
        // 添加点击搜索图标触发输入框焦点的效果
        const searchIcon = productSearch.parentElement.querySelector('.material-icons');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                productSearch.focus();
            });
        }
    } else {
        console.error("未找到搜索框元素!"); // 添加错误日志
    }
    
    // 类别过滤器事件
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            filterProductsByCategory(selectedCategory);
        });
    }
    
    // 导航菜单
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;
            switchView(targetView);
        });
    });
    
    // 购物车按钮
    clearCartBtn.addEventListener('click', clearCart);
    checkoutBtn.addEventListener('click', checkout);
    
    // 收银员相关
    cashierNameForm.addEventListener('submit', handleCashierNameSubmit);
    changeCashierBtn.addEventListener('click', () => showModal(cashierNameModal));
    viewCashierHistoryBtn.addEventListener('click', showCashierHistory);
    
    // 销售历史 - 移除日期过滤器事件，仅保留班次过滤
    if (shiftFilter) {
        shiftFilter.addEventListener('change', () => {
            selectedShift = shiftFilter.value;
            
            // 使用缓存的销售数据进行过滤，避免重新下载
            if (cachedSalesData) {
                console.log(`使用缓存的销售数据，按班次 "${selectedShift}" 过滤`);
                
                // 如果选择了特定班次，根据班次过滤数据
                if (selectedShift !== 'all') {
                    const filteredSales = {};
                    Object.keys(cachedSalesData).forEach(saleId => {
                        if (cachedSalesData[saleId].cashierShift === selectedShift) {
                            filteredSales[saleId] = cachedSalesData[saleId];
                        }
                    });
                    salesData = filteredSales;
                    renderSalesTable(filteredSales);
                } else {
                    // 如果选择"所有班次"，则显示所有数据
                    salesData = cachedSalesData;
                    renderSalesTable(cachedSalesData);
                }
                
                // 不需要重新获取日销售汇总，因为它包含所有班次的总计
                // summary已经包含了班次分项统计
            } else {
                // 如果没有缓存数据（例如首次加载），则正常加载
                loadSalesHistory();
            }
        });
    }
    
    // 模态框
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            hideModal(modal);
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', event => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });
    
    // 结账成功模态框按钮 - 简化为只有OK按钮（在showSuccessModal函数中动态创建）
    
    // 销售详情模态框按钮
    deleteSaleBtn.addEventListener('click', deleteSale);
    
    // 编辑销售模态框按钮
    updateSaleBtn.addEventListener('click', updateSale);
    cancelEditBtn.addEventListener('click', () => hideModal(editSaleModal));
    
    // 库存管理相关事件监听
    if (inventoryCategoryFilter) {
        inventoryCategoryFilter.addEventListener('change', loadInventory);
    }
    if (inventoryStockFilter) {
        inventoryStockFilter.addEventListener('change', loadInventory);
    }
    if (refreshInventoryBtn) {
        refreshInventoryBtn.addEventListener('click', loadInventory);
    }
    if (updateStockForm) {
        updateStockForm.addEventListener('submit', handleUpdateStock);
    }
    
    // 添加商品按钮事件监听
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            // 生成自动产品ID并显示模态框
            generateProductId().then(productId => {
                document.getElementById('productId').value = productId;
                showModal(addProductModal);
                // 确保正确设置库存输入框的step属性
                updateStockInputStep();
            });
        });
    }
    
    // 添加商品表单提交事件
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    // 班次过滤监听器
    if (shiftFilter) {
        shiftFilter.addEventListener('change', () => {
            selectedShift = shiftFilter.value;
            loadSalesHistory(selectedDate);
        });
    }
    
    // 添加拆分免费按钮事件监听
    document.querySelectorAll('.split-quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showSplitFreeDialog(index);
        });
    });
    
    // 添加编辑重量按钮事件监听
    document.querySelectorAll('.edit-weight-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showEditWeightDialog(index);
        });
    });
    
    // 简化模式按钮事件监听
    const simpleModeBtn = document.getElementById('simpleModeBtn');
    if (simpleModeBtn) {
        simpleModeBtn.addEventListener('click', toggleSimpleMode);
    }
    
    // 热销商品相关事件监听
    const hotItemsToggle = document.getElementById('hotItemsToggle');
    if (hotItemsToggle) {
        hotItemsToggle.addEventListener('click', toggleHotItemsSection);
    }
    
    // 热销商品管理按钮
    const manageHotItemsBtn = document.getElementById('manageHotItemsBtn');
    if (manageHotItemsBtn) {
        manageHotItemsBtn.addEventListener('click', showHotItemsManageModal);
    }
    
    // 热销商品搜索
    const hotItemsSearch = document.getElementById('hotItemsSearch');
    if (hotItemsSearch) {
        hotItemsSearch.addEventListener('input', renderAvailableProducts);
    }
    
    // 保存热销商品设置按钮
    const saveHotItemsBtn = document.getElementById('saveHotItemsBtn');
    if (saveHotItemsBtn) {
        saveHotItemsBtn.addEventListener('click', saveHotItemsSettings);
    }
    
    // 关闭热销商品管理模态框
    const closeHotItemsManageBtn = document.getElementById('closeHotItemsManageBtn');
    if (closeHotItemsManageBtn) {
        closeHotItemsManageBtn.addEventListener('click', () => {
            hideModal(document.getElementById('hotItemsManageModal'));
        });
    }

    // 添加库存搜索框事件监听器
    if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', () => {
            loadInventory();
        });
    }
}

// 切换视图
function switchView(viewName) {
    // 更新导航菜单激活状态
    navItems.forEach(item => {
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 更新视图标题
    switch (viewName) {
        case 'sales':
            viewTitle.textContent = 'Sales System';
            break;
        case 'salesHistory':
            viewTitle.textContent = 'Today\'s Sales History';
            // 切换到销售历史视图时清除已缓存的数据，确保显示最新数据
            cachedSalesData = null;
            // 加载销售历史
            loadSalesHistory();
            break;
        case 'inventory':
            viewTitle.textContent = 'Inventory Management';
            // 加载库存数据
            loadInventory();
            break;
    }
    
    // 显示对应的视图
    views.forEach(view => {
        if (view.id === `${viewName}View`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

// 加载销售历史数据
function loadSalesHistory() {
    // 始终使用当前日期
    const currentDate = getCurrentDate();
    console.log("加载今日销售历史，日期:", currentDate);
    
    const userStoreId = localStorage.getItem('store_id');
    if (!userStoreId) {
        console.error("加载销售历史失败: 未找到店铺ID");
        return;
    }

    // 获取选中的班次过滤条件
    const selectedShift = shiftFilter ? shiftFilter.value : 'all';
    
    // 显示加载中状态
    salesTableBody.innerHTML = '<tr><td colspan="8" class="loading-message">Loading sales data...</td></tr>';
    
    // 使用优化的函数获取按日期的所有销售记录（无视班次过滤，获取全部数据）
    getSalesByDateOptimized(userStoreId, currentDate)
        .then(allSales => {
            console.log(`获取到${Object.keys(allSales).length}条销售记录`);
            
            // 缓存所有班次的完整销售数据
            cachedSalesData = allSales;
            
            // 根据选定的班次过滤销售数据
            let filteredSales = allSales;
            if (selectedShift !== 'all') {
                filteredSales = {};
                Object.keys(allSales).forEach(saleId => {
                    if (allSales[saleId].cashierShift === selectedShift) {
                        filteredSales[saleId] = allSales[saleId];
                    }
                });
            }
            
            // 存储过滤后的销售数据到全局变量
            salesData = filteredSales;
            
            // 渲染表格显示数据
            renderSalesTable(filteredSales);
            
            // 加载每日销售汇总数据，并将完整销售数据传递给它
            return getDailySalesSummary(userStoreId, currentDate)
                .then(summary => {
                    // 将已获取的销售数据传递给updateSalesSummary函数
                    updateSalesSummary(summary, allSales);
                    return null; // 避免链式返回
                });
        })
        .catch(error => {
            console.error("加载销售历史失败:", error);
            salesTableBody.innerHTML = `<tr><td colspan="8" class="error-message">加载销售数据失败：${error.message}</td></tr>`;
        });
}

// 更新销售汇总信息显示
function updateSalesSummary(summary, existingSales = null) {
    // 更新销售总额
    document.getElementById('totalSalesAmount').textContent = `RM${(summary.total_sales || 0).toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = summary.transaction_count || 0;
    
    // 更新班次销售额
    const firstShiftData = summary.shifts && summary.shifts['1st Shift'] ? summary.shifts['1st Shift'] : { total_sales: 0, transaction_count: 0 };
    const secondShiftData = summary.shifts && summary.shifts['2nd Shift'] ? summary.shifts['2nd Shift'] : { total_sales: 0, transaction_count: 0 };
    
    document.getElementById('firstShiftSalesAmount').textContent = `RM${(firstShiftData.total_sales || 0).toFixed(2)}`;
    document.getElementById('firstShiftTransactions').textContent = firstShiftData.transaction_count || 0;
    
    document.getElementById('secondShiftSalesAmount').textContent = `RM${(secondShiftData.total_sales || 0).toFixed(2)}`;
    document.getElementById('secondShiftTransactions').textContent = secondShiftData.transaction_count || 0;
    
    // 计算折扣销售信息（使用现有销售数据避免重复下载）
    const currentDate = getCurrentDate();
    getDailySalesDiscountInfo(localStorage.getItem('store_id'), currentDate, existingSales)
        .then(discountInfo => {
            document.getElementById('discountedSalesCount').textContent = discountInfo.count;
            document.getElementById('totalDiscountAmount').textContent = `RM${discountInfo.amount.toFixed(2)}`;
        })
        .catch(error => {
            console.error("加载折扣信息失败:", error);
        });
}

// 获取每日折扣销售信息
function getDailySalesDiscountInfo(storeId, date, existingSales = null) {
    return new Promise((resolve, reject) => {
        // 如果已有销售数据，直接使用，不再重复下载
        if (existingSales) {
            let discountCount = 0;
            let discountAmount = 0;
            
            Object.values(existingSales).forEach(sale => {
                // 如果有折扣
                if ((sale.discountPercent && sale.discountPercent > 0) || 
                    (sale.discountAmount && sale.discountAmount > 0)) {
                    discountCount++;
                    
                    // 计算折扣金额
                    if (sale.discountType === 'percent' && sale.discountPercent) {
                        const discount = (sale.subtotal * sale.discountPercent / 100);
                        discountAmount += discount;
                    } else if (sale.discountType === 'amount' && sale.discountAmount) {
                        discountAmount += sale.discountAmount;
                    }
                }
            });
            
            resolve({
                count: discountCount,
                amount: discountAmount
            });
        } else {
            // 如果没有现有数据，则需要重新下载
            getSalesByDateOptimized(storeId, date)
                .then(sales => {
                    let discountCount = 0;
                    let discountAmount = 0;
                    
                    Object.values(sales).forEach(sale => {
                        // 如果有折扣
                        if ((sale.discountPercent && sale.discountPercent > 0) || 
                            (sale.discountAmount && sale.discountAmount > 0)) {
                            discountCount++;
                            
                            // 计算折扣金额
                            if (sale.discountType === 'percent' && sale.discountPercent) {
                                const discount = (sale.subtotal * sale.discountPercent / 100);
                                discountAmount += discount;
                            } else if (sale.discountType === 'amount' && sale.discountAmount) {
                                discountAmount += sale.discountAmount;
                            }
                        }
                    });
                    
                    resolve({
                        count: discountCount,
                        amount: discountAmount
                    });
                })
                .catch(error => reject(error));
        }
    });
}

// 渲染销售记录表格
function renderSalesTable(sales) {
    // 添加样式确保操作按钮水平排列
    if (!document.getElementById('action-buttons-style')) {
        const style = document.createElement('style');
        style.id = 'action-buttons-style';
        style.textContent = `
            .action-buttons {
                display: flex;
                flex-direction: row;
                justify-content: center;
                gap: 8px;
            }
            .action-buttons button {
                margin: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    salesTableBody.innerHTML = '';
    
    if (Object.keys(sales).length === 0) {
        salesTableBody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="material-icons">info</i> No sales data available for this date</td></tr>';
        // 清空总销售额显示
        document.getElementById('totalSalesAmount').textContent = 'RM0.00';
        document.getElementById('totalTransactions').textContent = '0';
        document.getElementById('discountedSalesCount').textContent = '0';
        document.getElementById('totalDiscountAmount').textContent = 'RM0.00';
        document.getElementById('firstShiftSalesAmount').textContent = 'RM0.00';
        document.getElementById('firstShiftTransactions').textContent = '0';
        document.getElementById('secondShiftSalesAmount').textContent = 'RM0.00';
        document.getElementById('secondShiftTransactions').textContent = '0';
        return;
    }
    
    // 按时间排序，最新的在前面
    const sortedSales = Object.keys(sales).sort((a, b) => {
        return sales[b].timestamp.localeCompare(sales[a].timestamp);
    });
    
    // 根据班次筛选
    let filteredSales = sortedSales;
    if (selectedShift !== 'all') {
        filteredSales = sortedSales.filter(saleId => {
            const sale = sales[saleId];
            return sale.cashierShift === selectedShift;
        });
    }
    
    // 计算总销售额和折扣统计
    let totalAmount = 0;
    let transactionCount = filteredSales.length;
    let discountedSalesCount = 0;
    let totalDiscountAmount = 0;
    
    // 班次销售统计
    let firstShiftAmount = 0;
    let firstShiftCount = 0;
    let secondShiftAmount = 0;
    let secondShiftCount = 0;
    
    // 先计算全部销售数据（不受当前筛选影响）
    sortedSales.forEach(saleId => {
        const sale = sales[saleId];
        
        // 按班次统计
        if (sale.cashierShift === '1st Shift') {
            firstShiftAmount += sale.total_amount;
            firstShiftCount++;
        } else if (sale.cashierShift === '2nd Shift') {
            secondShiftAmount += sale.total_amount;
            secondShiftCount++;
        }
    });
    
    // 更新班次统计显示
    document.getElementById('firstShiftSalesAmount').textContent = `RM${firstShiftAmount.toFixed(2)}`;
    document.getElementById('firstShiftTransactions').textContent = firstShiftCount;
    document.getElementById('secondShiftSalesAmount').textContent = `RM${secondShiftAmount.toFixed(2)}`;
    document.getElementById('secondShiftTransactions').textContent = secondShiftCount;
    
    // 计算筛选后的销售数据
    filteredSales.forEach(saleId => {
        const sale = sales[saleId];
        totalAmount += sale.total_amount;
        const itemCount = sale.items ? sale.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        const cashierName = sale.cashierName || 'N/A';
        const cashierShift = sale.cashierShift || 'N/A';
        
        // 检查是否有折扣
        let discountDisplay = 'None';
        let discountBadgeClass = 'discount-none';
        
        if (sale.discountAmount > 0) {
            discountedSalesCount++;
            totalDiscountAmount += sale.discountAmount;
            
            const discountType = sale.discountType || 'percent';
            
            if (discountType === 'percent') {
                discountDisplay = `${sale.discountPercent}%`;
                discountBadgeClass = 'discount-percent';
            } else {
                discountDisplay = `RM${sale.discountAmount.toFixed(2)}`;
                discountBadgeClass = 'discount-fixed';
            }
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.billNumber || 'N/A'}</td>
            <td>${sale.timestamp}</td>
            <td>${cashierName}</td>
            <td>${cashierShift}</td>
            <td>${itemCount}</td>
            <td><span class="discount-badge ${discountBadgeClass}">${discountDisplay}</span></td>
            <td>RM${sale.total_amount.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                <button class="view-sale-btn" data-id="${saleId}"><i class="material-icons">visibility</i></button>
                <button class="delete-sale-btn" data-id="${saleId}"><i class="material-icons">delete</i></button>
                </div>
            </td>
        `;
        
        salesTableBody.appendChild(row);
    });
    
    // 更新总销售额显示 - 仅显示筛选后的数据
    document.getElementById('totalSalesAmount').textContent = `RM${totalAmount.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = transactionCount;
    document.getElementById('discountedSalesCount').textContent = discountedSalesCount;
    document.getElementById('totalDiscountAmount').textContent = `RM${totalDiscountAmount.toFixed(2)}`;
    
    // 添加事件监听器到按钮
    document.querySelectorAll('.view-sale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSaleId = btn.dataset.id;
            viewSaleDetails(sales[currentSaleId]);
        });
    });
    
    document.querySelectorAll('.delete-sale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSaleId = btn.dataset.id;
            deleteSale();
        });
    });
}

// 查看销售详情
function viewSaleDetails(sale) {
    let detailsHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h3>${storeData.name}</h3>
                <p>Bill Number: ${sale.billNumber || 'N/A'}</p>
                <p>Time: ${sale.timestamp}</p>
                <p>Cashier: ${sale.cashierName || 'N/A'}</p>
                <p>Shift: ${sale.cashierShift || 'N/A'}</p>
                ${sale.shiftInfo ? `<p>Shift started at: ${sale.shiftInfo.shiftTime || 'N/A'}</p>` : ''}
            </div>
            <div class="receipt-items">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sale.items.forEach(item => {
        detailsHTML += `
            <tr>
                <td>${item.name}</td>
                <td>RM${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>RM${item.subtotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    detailsHTML += `
                    </tbody>
                </table>
            </div>
            <div class="receipt-summary">
    `;
    
    // 检查是否有小计和折扣字段（兼容旧数据）
    if (sale.subtotal !== undefined) {
        detailsHTML += `
            <div class="summary-row">
                <p>Subtotal:</p>
                <p>RM${sale.subtotal.toFixed(2)}</p>
            </div>
        `;
        
        // 如果应用了折扣，显示折扣信息
        if (sale.discountAmount > 0) {
            const discountType = sale.discountType || 'percent';
            const discountLabel = discountType === 'percent' ? `Discount (${sale.discountPercent}%):` : 'Discount (Fixed):';
            
            detailsHTML += `
                <div class="summary-row discount">
                    <p>${discountLabel}</p>
                    <p>-RM${sale.discountAmount.toFixed(2)}</p>
                </div>
            `;
        }
    }
    
    detailsHTML += `
                <div class="summary-row total">
                    <p>Total:</p>
                    <p><strong>RM${sale.total_amount.toFixed(2)}</strong></p>
                </div>
            </div>
        </div>
    `;
    
    saleDetailContent.innerHTML = detailsHTML;
    showModal(saleDetailModal);
}

// 编辑销售记录
function editSale() {
    if (!currentSaleId || !salesData[currentSaleId]) return;
    
    editingSale = { ...salesData[currentSaleId] };
    
    // 准备编辑界面
    renderEditSaleItems();
    
    // 关闭查看详情模态框
    hideModal(saleDetailModal);
    
    // 显示编辑模态框
    showModal(editSaleModal);
}

// 渲染编辑销售的项目
function renderEditSaleItems() {
    editCartItems.innerHTML = '';
    
    if (!editingSale || !editingSale.items || editingSale.items.length === 0) {
        editCartItems.innerHTML = '<div class="empty-cart">No items</div>';
        editCartTotal.textContent = 'RM0.00';
        return;
    }
    
    // 移除可能存在的对话框
    const existingDialog = document.querySelector('.split-free-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    const existingBackdrop = document.querySelector('.dialog-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    
    let total = 0;
    let totalItems = 0;
    
    // 确保每个商品项都有isFree属性
    editingSale.items.forEach(item => {
        if (item.isFree === undefined) {
            item.isFree = false;
        }
    });
    
    // 计算总商品数量和总金额
    editingSale.items.forEach(item => {
        // 只有非免费商品才计入总金额
        if (!item.isFree) {
            total += item.price * item.quantity;
        }
        totalItems += item.quantity;
    });
    
    editingSale.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        
        // 如果是免费商品，添加免费类
        if (item.isFree) {
            cartItemElement.classList.add('free');
        }
        
        cartItemElement.innerHTML = `
            <div class="cart-item-header">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-actions">
                    ${item.quantity > 1 ? 
                        `<button class="split-quantity-btn edit-split" data-index="${index}">
                            <i class="material-icons" style="font-size: 14px;">call_split</i> Split Free
                        </button>` : 
                        `<button class="free-item-btn ${item.isFree ? 'active' : ''}" data-index="${index}">
                            <i class="material-icons" style="font-size: 14px;">card_giftcard</i> ${item.isFree ? 'Free' : 'Mark Free'}
                        </button>`
                    }
                    <button class="remove-btn" data-index="${index}">×</button>
                </div>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-price-qty">
                    <span class="cart-item-price">RM${item.price.toFixed(2)}</span>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus" data-index="${index}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus" data-index="${index}">+</button>
                    </div>
                </div>
                <div class="cart-item-total">RM${itemTotal.toFixed(2)}</div>
            </div>
        `;
        
        editCartItems.appendChild(cartItemElement);
    });
    
    // 添加事件监听器到购物车项目按钮
    editCartItems.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            updateEditItemQuantity(index, editingSale.items[index].quantity - 1);
        });
    });
    
    editCartItems.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            updateEditItemQuantity(index, editingSale.items[index].quantity + 1);
        });
    });
    
    editCartItems.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeEditItem(index);
        });
    });
    
    // 添加免费按钮事件监听
    editCartItems.querySelectorAll('.free-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            toggleEditItemFree(index);
        });
    });
    
    // 添加拆分免费按钮事件监听
    editCartItems.querySelectorAll('.edit-split').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showEditSplitFreeDialog(index);
        });
    });
    
    // 应用四舍五入到最接近的0.05规则
    total = roundToNearest005(total);
    editCartTotal.textContent = `RM${total.toFixed(2)}`;
    editingSale.total_amount = total;
}

// 切换编辑中的商品免费状态
function toggleEditItemFree(index) {
    if (index >= 0 && index < editingSale.items.length) {
        // 切换免费状态
        editingSale.items[index].isFree = !editingSale.items[index].isFree;
        // 更新小计
        const itemPrice = editingSale.items[index].price;
        const itemQuantity = editingSale.items[index].quantity;
        editingSale.items[index].subtotal = editingSale.items[index].isFree ? 0 : itemPrice * itemQuantity;
        
        // 重新渲染编辑购物车
        renderEditSaleItems();
    }
}

// 更新编辑中的项目数量
function updateEditItemQuantity(index, quantity) {
    if (index >= 0 && index < editingSale.items.length) {
        if (quantity <= 0) {
            removeEditItem(index);
        } else {
            editingSale.items[index].quantity = quantity;
            // 如果是免费商品，小计为0，否则正常计算
            editingSale.items[index].subtotal = editingSale.items[index].isFree ? 
                0 : 
                editingSale.items[index].price * quantity;
            renderEditSaleItems();
        }
    }
}

// 移除编辑中的项目
function removeEditItem(index) {
    if (index >= 0 && index < editingSale.items.length) {
        editingSale.items.splice(index, 1);
        renderEditSaleItems();
    }
}

// 更新销售记录
function updateSale() {
    if (!editingSale) return;
    
    // 获取编辑后的购物车项目
    const editedItems = [];
    for (let i = 0; i < editCartItems.children.length; i++) {
        const item = editCartItems.children[i];
        const productId = item.dataset.id;
        const name = item.querySelector('.item-name').textContent;
        const price = parseFloat(item.dataset.price);
        const quantity = parseInt(item.querySelector('.item-quantity').textContent);
        const isFree = item.classList.contains('free-item');
        
        editedItems.push({
            id: productId,
            name: name,
            price: price,
            quantity: quantity,
            subtotal: isFree ? 0 : price * quantity,
            isFree: isFree
        });
    }
    
    // 计算新的小计和总计
    const newSubtotal = editedItems.reduce((sum, item) => sum + (item.isFree ? 0 : item.price * item.quantity), 0);
    
    // 保留原有的折扣设置
    const discountType = editingSale.discountType || 'percent';
    let discountAmount = 0;
    
    if (discountType === 'percent') {
        const discountPercent = editingSale.discountPercent || 0;
        discountAmount = newSubtotal * (discountPercent / 100);
    } else {
        discountAmount = Math.min(editingSale.discountAmount || 0, newSubtotal);
    }
    
    // 应用四舍五入到最接近的0.05规则
    const newTotal = roundToNearest005(newSubtotal - discountAmount);
    
    // 更新编辑后的销售记录
    const updatedSale = {
        ...editingSale,
        items: editedItems,
        subtotal: newSubtotal,
        discountAmount: discountAmount,
        total_amount: newTotal,
        // 保留原有的收银员信息和班次信息
        cashierName: editingSale.cashierName || cashierName,
        cashierShift: editingSale.cashierShift || cashierShift
    };
    
    // 更新数据库中的销售记录
    const storeId = localStorage.getItem('store_id');
    const saleDate = editingSale.date; // 使用销售记录本身的日期
    
    if (!storeId || !saleDate) {
        console.error('销售记录更新失败: 未找到店铺ID或销售日期');
        alert('Failed to update sale record. Missing store ID or sale date.');
        return;
    }
    
    updateSaleRecord(storeId, saleDate, currentSaleId, updatedSale)
        .then(() => {
            console.log('销售记录更新成功');
            
            // 清除销售数据缓存，确保下次显示最新数据
            cachedSalesData = null;
            
            // 刷新销售历史
            loadSalesHistory();
            
            // 隐藏编辑模态框
            hideModal(editSaleModal);
        })
        .catch(error => {
            console.error('销售记录更新失败:', error);
            alert('Failed to update sale record. Please try again.');
        })
        .finally(() => {
            // 确保按钮恢复正常状态
            const checkoutButton = document.getElementById('checkoutBtn');
            if (checkoutButton) {
                checkoutButton.disabled = false;
                checkoutButton.innerHTML = '<i class="material-icons">payment</i><span>Checkout</span>';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<i class="material-icons">payment</i> Checkout';
            }
        });
}

// 删除销售记录
function deleteSale() {
    if (!currentSaleId) return;
    
    if (!confirm(`Are you sure you want to delete this sale?`)) {
        return;
    }
    
    deleteSaleBtn.disabled = true;
    deleteSaleBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Deleting...';
    
    // 获取销售记录的完整信息以便恢复库存
    const sale = salesData[currentSaleId];
    if (!sale || !sale.items || sale.items.length === 0) {
        alert('Cannot retrieve sale details. Operation aborted.');
        deleteSaleBtn.disabled = false;
        deleteSaleBtn.innerHTML = '<i class="material-icons">delete</i> Delete';
        return;
    }
    
    const userStoreId = localStorage.getItem('store_id');
    const saleDate = sale.date; // 获取销售记录的日期，用于构建新的路径
    const cashierShift = sale.cashierShift || '1st Shift';
    const saleAmount = sale.total_amount || 0;
    
    if (!userStoreId || !saleDate) {
        alert('Store ID or sale date not found. Operation aborted.');
        deleteSaleBtn.disabled = false;
        deleteSaleBtn.innerHTML = '<i class="material-icons">delete</i> Delete';
        return;
    }
    
    // 准备库存更新
    const updates = {};
    
    // 首先按产品ID合并所有数量，确保同一商品只更新一次
    const productQuantities = {};
    
    // 为每个商品恢复库存
    sale.items.forEach(item => {
        if (!item.id || isNaN(item.quantity)) return;
        
        // 累加同一产品的数量（无论免费与否）
        if (!productQuantities[item.id]) {
            productQuantities[item.id] = {
                name: item.name || 'Unknown Product',
                totalQuantity: 0
            };
        }
        productQuantities[item.id].totalQuantity += item.quantity;
        
        console.log(`Counting product for restoration: ${item.name} (ID: ${item.id}), quantity: ${item.quantity}, isFree: ${item.isFree}`);
    });
    
    // 对每个产品进行一次性库存恢复
    Object.keys(productQuantities).forEach(productId => {
        const product = productQuantities[productId];
        const totalQuantity = product.totalQuantity;
        
        updates[`store_products/${userStoreId}/${productId}/stock`] = firebase.database.ServerValue.increment(totalQuantity);
        
        // 为每个恢复的商品添加库存记录
        const historyEntry = {
            timestamp: getCurrentDateTime(),
            previous_stock: products[productId] ? (products[productId].stock || 0) : 0,
            new_stock: products[productId] ? (products[productId].stock || 0) + totalQuantity : totalQuantity,
            operation: 'add',
            quantity: totalQuantity,
            reason: 'Sale Deleted',
            notes: `Automatic inventory restoration from deleted sale ${currentSaleId}`,
            cashier: cashierName || 'Unknown',
            user_id: JSON.parse(localStorage.getItem('user') || '{}').uid || 'unknown'
        };
        
        // 生成唯一ID
        const historyId = database.ref().child(`stock_history/${userStoreId}/${productId}`).push().key;
        updates[`stock_history/${userStoreId}/${productId}/${historyId}`] = historyEntry;
        
        console.log(`Restoring stock for ${product.name} by ${totalQuantity} units`);
    });
    
    // 获取当前的每日销售统计并更新
    database.ref(`daily_sales/${userStoreId}/${saleDate}`).once('value')
        .then(snapshot => {
            const dailyData = snapshot.val() || { 
                total_sales: 0, 
                transaction_count: 0,
                shifts: {
                    '1st Shift': { total_sales: 0, transaction_count: 0 },
                    '2nd Shift': { total_sales: 0, transaction_count: 0 }
                }
            };
            
            // 确保shifts对象存在
            if (!dailyData.shifts) {
                dailyData.shifts = {
                    '1st Shift': { total_sales: 0, transaction_count: 0 },
                    '2nd Shift': { total_sales: 0, transaction_count: 0 }
                };
            }
            
            // 确保班次统计数据存在
            if (!dailyData.shifts[cashierShift]) {
                dailyData.shifts[cashierShift] = { total_sales: 0, transaction_count: 0 };
            }
            
            // 更新每日销售统计 - 减去被删除的销售金额
            const updatedTotalSales = Math.max(0, Number(dailyData.total_sales || 0) - Number(saleAmount || 0));
            const updatedTransactionCount = Math.max(0, Number(dailyData.transaction_count || 0) - 1);
            
            // 更新班次销售统计
            const updatedShiftSales = Math.max(0, Number(dailyData.shifts[cashierShift].total_sales || 0) - Number(saleAmount || 0));
            const updatedShiftTransactions = Math.max(0, Number(dailyData.shifts[cashierShift].transaction_count || 0) - 1);
            
            // 创建更新对象
            updates[`daily_sales/${userStoreId}/${saleDate}/total_sales`] = updatedTotalSales;
            updates[`daily_sales/${userStoreId}/${saleDate}/transaction_count`] = updatedTransactionCount;
            updates[`daily_sales/${userStoreId}/${saleDate}/shifts/${cashierShift}/total_sales`] = updatedShiftSales;
            updates[`daily_sales/${userStoreId}/${saleDate}/shifts/${cashierShift}/transaction_count`] = updatedShiftTransactions;
            
            // 删除销售记录并更新库存和每日统计 - 使用按日期组织的路径
            return Promise.all([
        database.ref(`sales/${userStoreId}/${saleDate}/${currentSaleId}`).remove(),
        database.ref().update(updates)
            ]);
        })
        .then(() => {
            alert('Sale deleted successfully and inventory restored!');
            hideModal(saleDetailModal);
            // 清除销售数据缓存，确保下次显示最新数据
            cachedSalesData = null;
            loadSalesHistory(); // 重新加载销售记录
            loadProducts(userStoreId); // 重新加载产品数据以更新库存显示
        })
        .catch(error => {
            console.error('Failed to delete sale:', error);
            alert('Failed to delete sale. Please try again.');
        })
        .finally(() => {
            deleteSaleBtn.disabled = false;
            deleteSaleBtn.innerHTML = '<i class="material-icons">delete</i> Delete';
        });
}

// 显示模态框
function showModal(modal) {
    modal.style.display = 'block';
}

// 隐藏模态框
function hideModal(modal) {
    modal.style.display = 'none';
}

// 渲染购物车
function renderCart() {
    // 确保购物车容器使用我们的紧凑样式
    document.querySelectorAll('.cart-items, .cart-container, .cart-discount, .cart-summary, .cart-actions').forEach(elem => {
        elem.style.cssText = 'transition: none !important;';
        // 触发重绘
        void elem.offsetHeight;
        elem.style.cssText = '';
    });

    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'RM0.00';
        checkoutBtn.disabled = true;
        
        // 优化结账和清空按钮
        const cartActionsContainer = document.querySelector('.cart-actions');
        if (cartActionsContainer) {
            // 清空现有按钮
            cartActionsContainer.innerHTML = '';
            
            // 添加清空购物车按钮
            const clearCartButton = document.createElement('button');
            clearCartButton.id = 'clearCartBtn';
            clearCartButton.innerHTML = '<i class="material-icons">delete_outline</i><span>Clear</span>';
            clearCartButton.disabled = true; // 空购物车时禁用清空按钮
            clearCartButton.addEventListener('click', clearCart);
            cartActionsContainer.appendChild(clearCartButton);
            
            // 添加结账按钮
            const checkoutButton = document.createElement('button');
            checkoutButton.id = 'checkoutBtn';
            checkoutButton.className = 'checkout-btn';
            checkoutButton.innerHTML = '<i class="material-icons">payment</i><span>Checkout</span>';
            checkoutButton.disabled = true; // 空购物车时禁用结账按钮
            checkoutButton.addEventListener('click', checkout);
            cartActionsContainer.appendChild(checkoutButton);
        }
        
        return;
    }
    
    // 移除可能存在的对话框
    const existingDialog = document.querySelector('.split-free-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    const existingBackdrop = document.querySelector('.dialog-backdrop');
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    
    let subtotal = 0;
    let totalItems = 0;
    
    // 计算总商品数量和小计
    cart.forEach(item => {
        // 只有非免费商品才计入小计
        if (!item.isFree) {
            subtotal += item.price * item.quantity;
        }
        totalItems += item.quantity;
    });
    
    // 添加购物车商品
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        
        // 如果是免费商品，添加免费类
        if (item.isFree) {
            cartItemElement.classList.add('free');
        }
        
        // 根据销售单位类型显示不同的界面
        const isWeightSale = item.saleUnit === 'weight';
        // 处理重量精度问题，确保显示最多3位小数
        const formattedQuantity = isWeightSale ? parseFloat(item.quantity.toFixed(3)) : item.quantity;
        const quantityDisplay = isWeightSale ? `${formattedQuantity}kg` : `${formattedQuantity}`;
        const pricePerUnit = isWeightSale ? `RM${item.price.toFixed(2)}/kg` : `RM${item.price.toFixed(2)}`;
        
        cartItemElement.innerHTML = `
            <div class="cart-item-header">
                <div class="cart-item-name">
                    ${item.name} 
                    ${isWeightSale ? '<span class="weight-indicator"><i class="material-icons">monitor_weight</i></span>' : ''}
                </div>
                <div class="cart-item-actions">
                    ${!isWeightSale && item.quantity > 1 ? 
                        `<button class="split-quantity-btn" data-index="${index}">
                            <i class="material-icons" style="font-size: 14px;">call_split</i> Split Free
                        </button>` : 
                        `<button class="free-item-btn ${item.isFree ? 'active' : ''}" data-index="${index}">
                            <i class="material-icons" style="font-size: 14px;">card_giftcard</i> ${item.isFree ? 'Free' : 'Mark Free'}
                        </button>`
                    }
                    <button class="remove-btn" data-index="${index}">×</button>
                </div>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-price-qty">
                    <span class="cart-item-price">${pricePerUnit}</span>
                    <div class="cart-item-quantity">
                        ${isWeightSale ? 
                            `<button class="edit-weight-btn" data-index="${index}">
                                <i class="material-icons">edit</i> ${quantityDisplay}
                            </button>` :
                            `<button class="quantity-btn minus" data-index="${index}">-</button>
                            <span class="quantity">${quantityDisplay}</span>
                            <button class="quantity-btn plus" data-index="${index}">+</button>`
                        }
                    </div>
                </div>
                <div class="cart-item-total">RM${itemTotal.toFixed(2)}</div>
            </div>
        `;
        
        cartItems.appendChild(cartItemElement);
    });
    
    // 添加事件监听器到购物车项目按钮
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            updateQuantity(index, cart[index].quantity - 1);
        });
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            updateQuantity(index, cart[index].quantity + 1);
        });
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            removeFromCart(index);
        });
    });
    
    // 添加免费按钮事件监听
    document.querySelectorAll('.free-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            toggleFreeItem(index);
        });
    });
    
    // 添加拆分免费按钮事件监听
    document.querySelectorAll('.split-quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showSplitFreeDialog(index);
        });
    });
    
    // 创建折扣元素，但默认隐藏
    const discountElement = document.createElement('div');
    discountElement.className = 'cart-discount';
    discountElement.style.display = 'none'; // 默认隐藏
    discountElement.id = 'discountPanel';
    discountElement.innerHTML = `
        <div class="discount-type-selector">
            <label>
                <input type="radio" name="discountType" value="percent" ${discountType === 'percent' ? 'checked' : ''}>
                Percentage Discount
            </label>
            <label>
                <input type="radio" name="discountType" value="amount" ${discountType === 'amount' ? 'checked' : ''}>
                Fixed Amount
            </label>
        </div>
        <div class="discount-control ${discountType === 'percent' ? '' : 'hidden'}" id="percentDiscountControl">
            <label for="discountPercent">Discount (%):</label>
            <input type="number" id="discountPercent" min="0" max="100" value="${discountPercent}" step="5">
            <button id="applyPercentDiscountBtn"><i class="material-icons">check</i> Apply</button>
        </div>
        <div class="discount-control ${discountType === 'amount' ? '' : 'hidden'}" id="amountDiscountControl">
            <label for="discountAmount">Discount (RM):</label>
            <input type="number" id="discountAmount" min="0" max="${subtotal}" value="${discountAmount.toFixed(2)}" step="1">
            <button id="applyAmountDiscountBtn"><i class="material-icons">check</i> Apply</button>
        </div>
    `;
    cartItems.appendChild(discountElement);
    
    // 添加折扣类型切换事件监听
    discountElement.querySelectorAll('input[name="discountType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            discountType = radio.value;
            document.getElementById('percentDiscountControl').classList.toggle('hidden', discountType !== 'percent');
            document.getElementById('amountDiscountControl').classList.toggle('hidden', discountType !== 'amount');
        });
    });
    
    // 添加折扣应用按钮事件监听
    document.getElementById('applyPercentDiscountBtn').addEventListener('click', applyPercentDiscount);
    document.getElementById('applyAmountDiscountBtn').addEventListener('click', applyAmountDiscount);
    
    // 计算折扣金额和总金额
    let discountValue = 0;
    
    if (discountType === 'percent') {
        discountValue = subtotal * (discountPercent / 100);
    } else {
        discountValue = Math.min(discountAmount, subtotal); // 确保折扣不超过小计
    }
    
    // 应用四舍五入到最接近的0.05规则
    const total = roundToNearest005(subtotal - discountValue);
    
    // 添加小计、折扣和总计显示
    const summaryElement = document.createElement('div');
    summaryElement.className = 'cart-summary';
    summaryElement.innerHTML = `
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>RM${subtotal.toFixed(2)}</span>
        </div>
        ${discountValue > 0 ? `
        <div class="summary-row discount">
            <span>Discount ${discountType === 'percent' ? `(${discountPercent}%)` : '(Fixed)'}:</span>
            <span>-RM${discountValue.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="summary-row total">
            <span>Total:</span>
            <span style="display: flex; align-items: center;">
                RM${total.toFixed(2)}
                <button id="toggleDiscountBtn" class="toggle-discount-btn" title="Apply discount" style="background: none; border: none; cursor: pointer; margin: 0 0 0 8px; padding: 0; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background-color: #f5f5f5;">
                    <i class="material-icons" style="color: #0097a7; font-size: 16px;">local_offer</i>
                </button>
            </span>
        </div>
    `;
    cartItems.appendChild(summaryElement);
    
    // 添加折扣切换按钮事件监听
    document.getElementById('toggleDiscountBtn').addEventListener('click', () => {
        const discountPanel = document.getElementById('discountPanel');
        const toggleBtn = document.getElementById('toggleDiscountBtn');
        
        if (discountPanel.style.display === 'none') {
            discountPanel.style.display = 'block';
            toggleBtn.classList.add('active');
            // 滚动到折扣面板位置
            discountPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            discountPanel.style.display = 'none';
            toggleBtn.classList.remove('active');
        }
    });
    
    cartTotal.textContent = `RM${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
    
    // 优化结账和清空按钮
    const cartActionsContainer = document.querySelector('.cart-actions');
    if (cartActionsContainer) {
        // 清空现有按钮
        cartActionsContainer.innerHTML = '';
        
        // 添加清空购物车按钮
        const clearCartButton = document.createElement('button');
        clearCartButton.id = 'clearCartBtn';
        clearCartButton.innerHTML = '<i class="material-icons">delete_outline</i><span>Clear</span>';
        clearCartButton.addEventListener('click', clearCart);
        cartActionsContainer.appendChild(clearCartButton);
        
        // 添加结账按钮
        const checkoutButton = document.createElement('button');
        checkoutButton.id = 'checkoutBtn';
        checkoutButton.className = 'checkout-btn';
        checkoutButton.innerHTML = '<i class="material-icons">payment</i><span>Checkout</span>';
        checkoutButton.disabled = cart.length === 0;
        checkoutButton.addEventListener('click', checkout);
        cartActionsContainer.appendChild(checkoutButton);
    }
    
    // 添加编辑重量按钮事件监听器（因为按钮是动态创建的）
    document.querySelectorAll('.edit-weight-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            showEditWeightDialog(index);
        });
    });
}

// 切换商品免费状态
function toggleFreeItem(index) {
    if (index >= 0 && index < cart.length) {
        // 切换免费状态
        cart[index].isFree = !cart[index].isFree;
        
        // 重新渲染购物车
        renderCart();
    }
}

// 添加商品到购物车
function addToCart(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 检查商品是否是按重量销售
    if (product.saleUnit === 'weight') {
        showWeightInputDialog(productId);
        return;
    }
    
    // 检查商品库存（按数量销售的商品）
    if (product.stock !== undefined) {
        // 计算当前购物车中该商品的数量
        const existingItemIndex = cart.findIndex(item => item.id === productId);
        const currentCartQuantity = existingItemIndex !== -1 ? cart[existingItemIndex].quantity : 0;
        
        // 检查库存是否足够
        if (product.stock <= 0) {
            alert('This product is out of stock');
            return;
        }
        
        // 检查是否超过可用库存
        if (currentCartQuantity >= product.stock) {
            alert(`Cannot add more. Only ${product.stock} items available in stock.`);
            return;
        }
    }
    
    // 检查购物车是否已存在该商品
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex !== -1) {
        // 如果已存在，增加数量
        cart[existingItemIndex].quantity += 1;
    } else {
        // 否则添加新项目，默认不是免费商品
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1,
            isFree: false,
            saleUnit: product.saleUnit || 'piece'
        });
    }
    
    // 更新购物车显示
    renderCart();
}

// 显示重量输入对话框
function showWeightInputDialog(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 创建背景
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'weight-input-dialog';
    dialog.innerHTML = `
        <h4>
            <span><i class="material-icons">monitor_weight</i> Enter Weight</span>
            <button class="close-dialog">&times;</button>
        </h4>
        <div class="product-info">
            <div class="product-name">${product.name}</div>
            <div class="product-price">RM${product.price.toFixed(2)} per kg</div>
        </div>
        <div class="input-count-buttons">
            <button class="count-btn active" data-count="1">1</button>
            <button class="count-btn" data-count="2">2</button>
            <button class="count-btn" data-count="3">3</button>
        </div>
        <div id="weightInputsContainer">
            <div class="weight-input-group">
                <label for="weightInput1">Weight 1 (kg):</label>
                <input type="number" id="weightInput1" class="weight-input" min="0.001" max="999" step="0.001" value="1.000" placeholder="Enter weight in kg">
            </div>
        </div>
        <div class="weight-total">
            Total: <span id="weightTotal">RM${product.price.toFixed(2)}</span>
        </div>
        <button class="add-to-cart-btn">
            <i class="material-icons">add_shopping_cart</i> Add to Cart
        </button>
    `;
    document.body.appendChild(dialog);
    
    let inputCount = 1;
    
    // 获取容器和按钮元素
    const inputsContainer = document.getElementById('weightInputsContainer');
    const weightTotal = document.getElementById('weightTotal');
    const addButton = dialog.querySelector('.add-to-cart-btn');
    const closeButton = dialog.querySelector('.close-dialog');
    const countButtons = dialog.querySelectorAll('.count-btn');
    
    // 更新总价函数
    const updateTotal = () => {
        let totalWeight = 0;
        const inputs = dialog.querySelectorAll('.weight-input');
        inputs.forEach(input => {
            const weight = parseFloat(input.value) || 0;
            totalWeight += weight;
        });
        // 处理浮点数精度问题，保留3位小数
        totalWeight = parseFloat(totalWeight.toFixed(3));
        const total = totalWeight * product.price;
        weightTotal.textContent = `RM${total.toFixed(2)}`;
        return totalWeight;
    };
    
    // 添加输入框函数
    const addWeightInput = (count) => {
        inputsContainer.innerHTML = '';
        inputCount = count;
        
        for (let i = 1; i <= count; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'weight-input-group';
            inputGroup.innerHTML = `
                <label for="weightInput${i}">Weight ${i} (kg):</label>
                <input type="number" id="weightInput${i}" class="weight-input" min="0.001" max="999" step="0.001" value="1.000" placeholder="Enter weight in kg">
            `;
            inputsContainer.appendChild(inputGroup);
        }
        
        // 为所有新输入框添加事件监听
        dialog.querySelectorAll('.weight-input').forEach(input => {
            input.addEventListener('input', updateTotal);
        });
        
        updateTotal();
        
        // 聚焦第一个输入框
        const firstInput = dialog.querySelector('.weight-input');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    };
    
    // 按钮点击事件
    countButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const count = parseInt(btn.dataset.count);
            
            // 更新按钮状态
            countButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 添加对应数量的输入框
            addWeightInput(count);
        });
    });
    
    // 初始化第一个输入框的事件
    dialog.querySelector('.weight-input').addEventListener('input', updateTotal);
    
    // 添加关闭事件
    const closeDialog = () => {
        dialog.remove();
        backdrop.remove();
    };
    
    closeButton.addEventListener('click', closeDialog);
    backdrop.addEventListener('click', closeDialog);
    
    // 添加到购物车按钮事件
    addButton.addEventListener('click', () => {
        const totalWeight = updateTotal();
        
        if (totalWeight <= 0) {
            alert('Please enter valid weights greater than 0');
            return;
        }
        
        // 检查库存（按重量销售的商品库存通常以kg为单位）
        if (product.stock !== undefined) {
            const existingItem = cart.find(item => item.id === productId);
            const currentCartWeight = existingItem ? existingItem.quantity : 0;
            
            if (product.stock <= 0) {
                alert('This product is out of stock');
                return;
            }
            
            if (currentCartWeight + totalWeight > product.stock) {
                alert(`Cannot add ${totalWeight.toFixed(3)}kg. Only ${(product.stock - currentCartWeight).toFixed(3)}kg available in stock.`);
                return;
            }
        }
        
        // 查找是否已存在该商品
        const existingItemIndex = cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex !== -1) {
            // 如果已存在，增加重量
            cart[existingItemIndex].quantity += totalWeight;
        } else {
            // 否则添加新项目
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: totalWeight,
                isFree: false,
                saleUnit: 'weight'
            });
        }
        
        // 关闭对话框
        closeDialog();
        
        // 更新购物车显示
        renderCart();
    });
    
    // 聚焦第一个输入框并选中文本
    const firstInput = dialog.querySelector('.weight-input');
    firstInput.focus();
    firstInput.select();
}

// 显示编辑重量对话框
function showEditWeightDialog(index) {
    if (index < 0 || index >= cart.length) return;
    
    const item = cart[index];
    if (item.saleUnit !== 'weight') return;
    
    const product = products[item.id];
    if (!product) return;
    
    // 创建背景
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'weight-input-dialog';
    dialog.innerHTML = `
        <h4>
            <span><i class="material-icons">edit</i> Edit Weight</span>
            <button class="close-dialog">&times;</button>
        </h4>
        <div class="product-info">
            <div class="product-name">${item.name}</div>
            <div class="product-price">RM${item.price.toFixed(2)} per kg</div>
            <div class="current-weight">Current: ${item.quantity.toFixed(3)}kg</div>
        </div>
        <div class="weight-input-group">
            <label for="editWeightInput">New Weight (kg):</label>
            <input type="number" id="editWeightInput" class="weight-input" min="0.001" max="999" step="0.001" value="${item.quantity.toFixed(3)}" placeholder="Enter weight in kg">
        </div>
        <div class="weight-total">
            Total: <span id="editWeightTotal">RM${(item.quantity * item.price).toFixed(2)}</span>
        </div>
        <button class="update-weight-btn">
            <i class="material-icons">save</i> Update Weight
        </button>
    `;
    document.body.appendChild(dialog);
    
    // 获取输入和按钮元素
    const weightInput = document.getElementById('editWeightInput');
    const weightTotal = document.getElementById('editWeightTotal');
    const updateButton = dialog.querySelector('.update-weight-btn');
    const closeButton = dialog.querySelector('.close-dialog');
    
    // 更新总价函数
    const updateTotal = () => {
        let weight = parseFloat(weightInput.value) || 0;
        // 处理浮点数精度问题，保留3位小数
        weight = parseFloat(weight.toFixed(3));
        const total = weight * item.price;
        weightTotal.textContent = `RM${total.toFixed(2)}`;
    };
    
    // 输入框变化时更新总价
    weightInput.addEventListener('input', updateTotal);
    
    // 添加关闭事件
    const closeDialog = () => {
        dialog.remove();
        backdrop.remove();
    };
    
    closeButton.addEventListener('click', closeDialog);
    backdrop.addEventListener('click', closeDialog);
    
    // 更新重量按钮事件
    updateButton.addEventListener('click', () => {
        const newWeight = parseFloat(weightInput.value);
        
        if (isNaN(newWeight) || newWeight <= 0) {
            alert('Please enter a valid weight greater than 0');
            return;
        }
        
        // 检查库存
        if (product.stock !== undefined) {
            const otherCartWeight = cart.reduce((total, cartItem, cartIndex) => {
                if (cartIndex !== index && cartItem.id === item.id) {
                    return total + cartItem.quantity;
                }
                return total;
            }, 0);
            
            if (product.stock <= 0) {
                alert('This product is out of stock');
                return;
            }
            
            if (otherCartWeight + newWeight > product.stock) {
                alert(`Cannot set weight to ${newWeight}kg. Only ${(product.stock - otherCartWeight).toFixed(3)}kg available in stock.`);
                return;
            }
        }
        
        // 更新购物车中的重量，处理精度问题
        cart[index].quantity = parseFloat(newWeight.toFixed(3));
        
        // 关闭对话框
        closeDialog();
        
        // 更新购物车显示
        renderCart();
    });
    
    // 聚焦输入框并选中文本
    weightInput.focus();
    weightInput.select();
}

// 结账
function checkout() {
    if (cart.length === 0) return;
    
    // 检查收银员姓名是否已设置
    if (!cashierName) {
        alert('Please enter the cashier name first');
        showModal(cashierNameModal);
        return;
    }
    
    // 查找新的结账按钮
    const checkoutButton = document.getElementById('checkoutBtn');
    
    // 禁用结账按钮，防止重复提交
    if (checkoutButton) {
        checkoutButton.disabled = true;
        checkoutButton.innerHTML = '<i class="material-icons">hourglass_empty</i><span>Processing...</span>';
    } else {
        // 兼容旧的按钮
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Processing...';
    }
    
    try {
        // 生成账单号
        let billNumber = generateBillNumber();
        
        // 计算小计、折扣和总计
        let subtotal = cart.reduce((sum, item) => sum + (item.isFree ? 0 : item.price * item.quantity), 0);
        
        // 根据折扣类型计算折扣金额
        let discountValue = 0;
        if (discountType === 'percent') {
            discountValue = subtotal * (discountPercent / 100);
        } else {
            discountValue = Math.min(discountAmount, subtotal); // 确保折扣不超过小计
        }
        
        // 应用舍入规则：Nearest 0.05
        let total = roundToNearest005(subtotal - discountValue);
        
        // 保存当前购物车的副本，以便在处理过程中避免被修改
        let cartCopy = cart.map(item => ({...item}));
        
        // 准备销售数据
        let saleData = {
            billNumber: billNumber,
            items: cartCopy.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.isFree ? 0 : item.price * item.quantity,
                isFree: item.isFree
            })),
            subtotal: subtotal,
            discountType: discountType,
            discountPercent: discountType === 'percent' ? discountPercent : 0,
            discountAmount: discountValue,
            total_amount: total,
            cashierName: cashierName, // 添加收银员姓名
            cashierShift: cashierShift, // 添加收银员班次
            shiftInfo: {
                cashierName: cashierName,
                cashierShift: cashierShift,
                shiftTime: getCurrentDateTime()
            }
        };
        
        console.log("准备提交的销售数据:", saleData);
        
        // 获取店铺ID
        let storeId = localStorage.getItem('store_id');
        
        // 清空购物车 - 在开始处理前就清空，避免任何可能的引用问题
        let oldCart = [...cart];
        cart = [];
        renderCart();
        
        // 更新商品库存
        updateProductInventory(storeId, oldCart)
            .then(() => {
                console.log("商品库存更新成功，正在添加销售记录...");
                // 添加销售记录到数据库
                return addSaleRecord(saleData);
            })
            .then(saleId => {
                console.log('销售记录添加成功，ID:', saleId);
                // 清除销售数据缓存，确保销售历史页显示最新数据
                cachedSalesData = null;
                // 显示成功模态框
                showSuccessModal(saleData, saleId);
            })
            .catch(error => {
                console.error('结账处理失败:', error);
                // 显示更详细的错误信息
                let errorMsg = 'Checkout failed';
                
                if (error) {
                    if (error.message) {
                        errorMsg += `: ${error.message}`;
                    } else if (typeof error === 'string') {
                        errorMsg += `: ${error}`;
                    } else {
                        errorMsg += '. Check console for details.';
                    }
                }
                
                alert(errorMsg + '. Please try again.');
                
                // 尽管出错，仍然显示成功模态框，但提示用户数据可能未完全保存
                let saleId = "ERROR-" + new Date().getTime();
                showSuccessModal(saleData, saleId);
                alert("注意: 销售记录可能未完全保存到数据库，但收据已生成。请保存收据以备参考。");
            })
            .finally(() => {
                // 确保按钮恢复正常状态
                const checkoutButton = document.getElementById('checkoutBtn');
                if (checkoutButton) {
                    checkoutButton.disabled = false;
                    checkoutButton.innerHTML = '<i class="material-icons">payment</i><span>Checkout</span>';
                } else {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<i class="material-icons">payment</i> Checkout';
                }
            });
    } catch (error) {
        console.error('结账过程中发生异常:', error);
        alert(`An unexpected error occurred: ${error.message || 'Unknown error'}. Please try again.`);
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="material-icons">payment</i> Checkout';
    }
}

// 显示结账成功模态框
function showSuccessModal(saleData, saleId) {
    // 确保显示的总金额是按照Nearest 0.05规则舍入的
    const totalAmount = saleData.total_amount;
    
    // 创建简化的成功提示
    let successHTML = `
        <div class="success-message">
            <div class="success-icon">
                <i class="material-icons">check_circle</i>
            </div>
            <div class="success-total">
                <div class="total-label">Total Amount</div>
                <div class="total-value">RM${totalAmount.toFixed(2)}</div>
            </div>
        </div>
    `;
    
    receiptDetails.innerHTML = successHTML;
    
    // 添加简约风格和动画效果
    const style = document.createElement('style');
    style.textContent = `
        .success-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            text-align: center;
        }
        .success-icon {
            margin-bottom: 20px;
        }
        .success-icon i {
            font-size: 64px;
            color: #4CAF50;
            animation: successAnimation 1.2s ease-in-out;
        }
        @keyframes successAnimation {
            0% { 
                transform: scale(0); 
                opacity: 0; 
            }
            40% { 
                transform: scale(1.2); 
                opacity: 1; 
            }
            60% { 
                transform: scale(0.9); 
            }
            80% { 
                transform: scale(1.1); 
            }
            100% { 
                transform: scale(1); 
            }
        }
        .success-total {
            margin-bottom: 15px;
            animation: fadeInUp 0.6s ease-out 0.3s both;
        }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .total-label {
            font-size: 16px;
            color: #666;
            margin-bottom: 5px;
        }
        .total-value {
            font-size: 42px;
            font-weight: bold;
            color: #333;
        }
        #checkoutSuccessModal .modal-content {
            max-width: 350px;
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .success-actions {
            margin-top: 25px;
            width: 100%;
            animation: fadeIn 0.5s ease-out 0.6s both;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        #okBtn {
            background: linear-gradient(135deg, #26c6da, #00acc1);
            color: white;
            border: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            width: 100%;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        #okBtn:hover {
            background: linear-gradient(135deg, #00acc1, #0097a7);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        #okBtn:active {
            transform: translateY(0);
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
        #okBtn i {
            font-size: 20px;
        }
    `;
    document.head.appendChild(style);
    
    // 更新按钮容器
    const successActionsDiv = document.createElement('div');
    successActionsDiv.className = 'success-actions';
    
    // 创建"OK"按钮
    const okBtn = document.createElement('button');
    okBtn.id = 'okBtn';
    okBtn.innerHTML = '<i class="material-icons">done</i> OK';
    okBtn.addEventListener('click', newSale);
    
    // 添加按钮到容器
    successActionsDiv.appendChild(okBtn);
    receiptDetails.appendChild(successActionsDiv);
    
    // 移除旧的按钮元素（如果存在）
    const oldPrintBtn = document.getElementById('printReceiptBtn');
    const oldNewSaleBtn = document.getElementById('newSaleBtn');
    if (oldPrintBtn) oldPrintBtn.remove();
    if (oldNewSaleBtn) oldNewSaleBtn.remove();
    
    // 显示模态框
    checkoutSuccessModal.style.display = 'block';
    
    // 重置结账按钮
    const checkoutButton = document.getElementById('checkoutBtn');
    if (checkoutButton) {
        checkoutButton.disabled = false;
        checkoutButton.innerHTML = '<i class="material-icons">payment</i><span>Checkout</span>';
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="material-icons">payment</i> Checkout';
    }
}

// 打印小票
function printReceipt() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>销售小票</title>');
    
    // 添加打印样式
    printWindow.document.write(`
        <style>
            body { font-family: Arial, sans-serif; }
            .receipt { width: 300px; margin: 0 auto; }
            .receipt-header { text-align: center; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 5px; }
            .receipt-total { margin-top: 10px; text-align: right; }
        </style>
    `);
    
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptDetails.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// 开始新交易
function newSale() {
    // 清空购物车
    clearCart();
    // 隐藏成功模态框
    hideModal(checkoutSuccessModal);
}

// 清空购物车
function clearCart() {
    cart = [];
    // 重置折扣值，解决结账后折扣仍然存在的问题
    discountPercent = 0;
    discountAmount = 0;
    discountType = 'percent';
    renderCart();
}

// 更新当前日期时间
function updateDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // 转换为12小时制
    
    // 获取星期几
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekday = weekdays[now.getDay()];
    
    // 创建HTML结构
    currentDateTime.innerHTML = `
        <div class="datetime-container">
            <div class="date-display">
                <span class="calendar-icon">📅</span>
                <span class="date">${day}/${month}/${year}</span>
                <span class="weekday">${weekday}</span>
            </div>
            <div class="time-display">
                <span class="clock-icon">🕒</span>
                <span class="time">${hours12}:${minutes}<span class="seconds">:${seconds}</span></span>
                <span class="ampm">${ampm}</span>
            </div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    if (!document.querySelector('style#datetime-style')) {
        style.id = 'datetime-style';
        style.textContent = `
            .datetime-container {
                display: flex;
                flex-direction: column;
                background: linear-gradient(135deg, #1a237e, #311b92);
                padding: 10px;
                border-radius: 10px;
                color: white;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                min-width: 200px;
            }
            .date-display, .time-display {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 5px 0;
            }
            .calendar-icon, .clock-icon {
                margin-right: 8px;
                font-size: 1.1em;
            }
            .date, .time {
                font-size: 1.1em;
                font-weight: 600;
                margin-right: 8px;
            }
            .weekday, .ampm {
                font-size: 0.9em;
                opacity: 0.9;
                background-color: rgba(255, 255, 255, 0.2);
                padding: 2px 6px;
                border-radius: 4px;
            }
            .seconds {
                font-size: 0.8em;
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 每秒更新秒数
    if (!window.secondsInterval) {
        window.secondsInterval = setInterval(() => {
            const secondsElement = document.querySelector('.seconds');
            if (secondsElement) {
                const now = new Date();
                secondsElement.textContent = `:${String(now.getSeconds()).padStart(2, '0')}`;
            }
        }, 1000);
    }
}

// 退出登录
function logout() {
    firebase.auth().signOut()
        .then(() => {
            // 清除本地存储的用户信息
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            localStorage.removeItem('store_id');
            // 重定向到登录页面
            window.location.href = '../index.html';
        })
        .catch(error => {
            console.error('Failed to logout:', error);
            alert('Failed to logout. Please try again.');
        });
}

// 显示收银员历史
function showCashierHistory() {
    let historyHtml = `
        <div class="cashier-history">
            <h3>Cashier Shift History</h3>
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Cashier</th>
                        <th>Shift</th>
                        <th>Shift Start Time</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (cashierHistory.length === 0) {
        historyHtml += '<tr><td colspan="3" class="no-data">No shift records available</td></tr>';
    } else {
        // 倒序显示，最新的在最上面
        for (let i = cashierHistory.length - 1; i >= 0; i--) {
            const record = cashierHistory[i];
            historyHtml += `
                <tr>
                    <td>${record.cashierName}</td>
                    <td>${record.shift || 'N/A'}</td>
                    <td>${record.shiftTime || record.startTime || 'N/A'}</td>
                </tr>
            `;
        }
    }
    
    historyHtml += `
                </tbody>
            </table>
        </div>
    `;
    
    // 创建一个新的模态框显示历史记录
    const historyModal = document.createElement('div');
    historyModal.className = 'modal';
    historyModal.id = 'cashierHistoryModal';
    historyModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2><i class="material-icons">history</i> Cashier History</h2>
            ${historyHtml}
        </div>
    `;
    
    // 添加到DOM
    document.body.appendChild(historyModal);
    
    // 显示模态框
    historyModal.style.display = 'block';
    
    // 添加关闭按钮事件
    const closeBtn = historyModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        historyModal.style.display = 'none';
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(historyModal);
        }, 300);
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', event => {
        if (event.target === historyModal) {
            historyModal.style.display = 'none';
            // 移除模态框
            setTimeout(() => {
                document.body.removeChild(historyModal);
            }, 300);
        }
    });
}

// 更新商品库存
function updateProductInventory(storeId, cartItems) {
    if (!storeId || !cartItems || cartItems.length === 0) {
        return Promise.resolve();
    }
    
    console.log('Updating product inventory');
    
    // 创建一个批量更新对象
    const updates = {};
    
    // 首先按产品ID合并所有数量，确保同一商品只更新一次
    const productQuantities = {};
    
    // 处理每个购物车商品
    cartItems.forEach(item => {
        if (!item.id || isNaN(item.quantity)) return;
        
        // 累加同一产品的数量（无论免费与否）
        if (!productQuantities[item.id]) {
            productQuantities[item.id] = {
                name: item.name,
                totalQuantity: 0,
                saleUnit: item.saleUnit || 'piece'
            };
        }
        productQuantities[item.id].totalQuantity += item.quantity;
        
        console.log(`Counting item: ${item.name} (ID: ${item.id}), quantity: ${item.quantity}, isFree: ${item.isFree}`);
    });
    
    // 对每个产品进行一次性扣除 - 使用读取后写入的方式避免浮点数精度问题
    const updatePromises = Object.keys(productQuantities).map(productId => {
        const productQuantity = productQuantities[productId];
        const productPath = `store_products/${storeId}/${productId}`;
        let totalQty = productQuantity.totalQuantity;
        
        // 如果是重量单位，则处理浮点数精度问题
        if (productQuantity.saleUnit === 'weight') {
            totalQty = parseFloat(totalQty.toFixed(3));
        }

        console.log(`Reducing stock for ${productQuantity.name} by ${totalQty} units (total from all cart items)`);
        
        // 对于重量单位的产品，先读取当前值，在客户端计算后再写入整个值
        if (productQuantity.saleUnit === 'weight') {
            return database.ref(productPath).once('value')
                .then(snapshot => {
                    const currentData = snapshot.val() || {};
                    const currentStock = currentData.stock || 0;
                    // 进行精确计算并保留3位小数
                    const newStock = parseFloat((currentStock - totalQty).toFixed(3));
                    
                    // 更新对象
                    updates[`${productPath}/stock`] = newStock;
                    updates[`${productPath}/quantity`] = newStock; // 兼容性更新
                    
                    return Promise.resolve();
                });
        } else {
            // 非重量单位的产品继续使用increment操作
            updates[`${productPath}/stock`] = firebase.database.ServerValue.increment(-totalQty);
            updates[`${productPath}/quantity`] = firebase.database.ServerValue.increment(-totalQty); // 兼容性更新
            return Promise.resolve();
        }
    });
    
    // 等待所有读取操作完成，然后执行批量更新
    return Promise.all(updatePromises)
        .then(() => {
            // 执行批量更新
            return database.ref().update(updates);
        })
        .then(() => {
            console.log('Product inventory updated successfully');
            // 重新加载产品数据以更新显示
            return loadProducts(storeId);
        })
        .catch(error => {
            console.error('Product inventory update failed:', error);
            // 返回错误以便上层函数处理
            throw error;
        });
}

// 处理收银员姓名表单提交
function handleCashierNameSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('cashierName');
    const shiftInput = document.getElementById('cashierShift');
    const newCashierName = nameInput.value.trim();
    const newCashierShift = shiftInput.value;
    
    if (newCashierName) {
        // 记录收银员换班
        recordCashierShift(newCashierName, newCashierShift);
        
        // 更新当前收银员信息
        cashierName = newCashierName;
        cashierShift = newCashierShift;
        cashierNameDisplay.textContent = cashierName;
        cashierShiftDisplay.textContent = cashierShift;
        
        // 应用班次样式
        cashierNameDisplay.classList.remove('first-shift-name', 'second-shift-name');
        if (newCashierShift === '1st Shift') {
            cashierNameDisplay.classList.add('first-shift-name');
        } else if (newCashierShift === '2nd Shift') {
            cashierNameDisplay.classList.add('second-shift-name');
        }
        
        // 保存到本地存储
        localStorage.setItem('cashierName', cashierName);
        localStorage.setItem('cashierShift', cashierShift);
        
        // 隐藏模态框
        hideModal(cashierNameModal);
    }
}

// 加载库存数据
function loadInventory() {
    const category = inventoryCategoryFilter ? inventoryCategoryFilter.value : 'all';
    const stockStatus = inventoryStockFilter ? inventoryStockFilter.value : 'all';
    const searchTerm = inventorySearchInput ? inventorySearchInput.value.trim().toLowerCase() : '';
    const userStoreId = localStorage.getItem('store_id');
    
    if (!userStoreId) return;
    
    // 显示加载状态
    inventoryTableBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    // 加载产品数据
    getStoreProducts(userStoreId)
        .then(storeProducts => {
            products = storeProducts;
            
            // 填充库存类别过滤器
            populateInventoryCategoryFilter();
            
            // 过滤产品
            const filteredProducts = filterInventoryProducts(products, category, stockStatus, searchTerm);
            renderInventory(filteredProducts);
        })
        .catch(error => {
            console.error('Failed to load inventory:', error);
            inventoryTableBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load inventory data</td></tr>';
        });
}

// 填充库存类别过滤器
function populateInventoryCategoryFilter() {
    if (!inventoryCategoryFilter) return;
    
    // 获取所有唯一的类别
    const categories = ['all'];
    
    Object.values(products).forEach(product => {
        if (product.category && !categories.includes(product.category)) {
            categories.push(product.category);
        }
    });
    
    // 保存当前选择的值
    const selectedValue = inventoryCategoryFilter.value;
    
    // 清空除了第一个选项外的所有选项
    while (inventoryCategoryFilter.options.length > 1) {
        inventoryCategoryFilter.remove(1);
    }
    
    // 添加类别选项
    categories.forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            inventoryCategoryFilter.appendChild(option);
        }
    });
    
    // 恢复之前选择的值
    if (selectedValue && selectedValue !== 'all' && categories.includes(selectedValue)) {
        inventoryCategoryFilter.value = selectedValue;
    }
}

// 过滤库存产品
function filterInventoryProducts(products, category, stockStatus, searchTerm = '') {
    return Object.entries(products).filter(([productId, product]) => {
        // 过滤搜索词
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
            !productId.toLowerCase().includes(searchTerm) && 
            !(product.category && product.category.toLowerCase().includes(searchTerm))) {
            return false;
        }

        // 过滤类别
        if (category !== 'all' && product.category !== category) {
            return false;
        }
        
        // 获取库存，如果不存在则默认为0
        const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        
        // 过滤库存状态
        if (stockStatus === 'low' && stock > 10) {
            return false;
        }
        if (stockStatus === 'out' && stock > 0) {
            return false;
        }
        
        return true;
    });
}

// 渲染库存列表
function renderInventory(productsEntries) {
    inventoryTableBody.innerHTML = '';
    
    if (productsEntries.length === 0) {
        inventoryTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">info</i> No inventory data available</td></tr>';
        return;
    }
    
    productsEntries.forEach(([productId, product]) => {
        // 获取库存，如果不存在则使用quantity，确保兼容旧数据
        const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        
        // 确定库存状态
        let statusClass, statusText;
        if (stock <= 0) {
            statusClass = 'status-out';
            statusText = 'Out of Stock';
        } else if (stock <= 10) {
            statusClass = 'status-low';
            statusText = 'Low Stock';
        } else {
            statusClass = 'status-good';
            statusText = 'In Stock';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${productId}</td>
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>RM${product.price.toFixed(2)}</td>
            <td>${stock}</td>
            <td><span class="stock-status ${statusClass}">${statusText}</span></td>
            <td>
                <div class="inventory-action-buttons">
                    <button class="icon-button update-stock-btn" title="Update Stock" data-id="${productId}"><i class="material-icons">edit</i></button>
                    <button class="icon-button view-history-btn" title="Stock History" data-id="${productId}"><i class="material-icons">history</i></button>
                    <button class="icon-button add-stock-btn" title="Add Stock" data-id="${productId}"><i class="material-icons">add_box</i></button>
                    <button class="icon-button tester-btn" title="Test (-1)" data-id="${productId}"><i class="material-icons">restaurant</i></button>
                </div>
            </td>
        `;
        
        inventoryTableBody.appendChild(row);
    });
    
    // 添加更新库存按钮事件
    document.querySelectorAll('.update-stock-btn').forEach(btn => {
        btn.addEventListener('click', () => showUpdateStockModal(btn.dataset.id));
    });
    
    // 添加查看历史按钮事件
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => showStockHistory(btn.dataset.id));
    });
    
    // 添加快速增加库存按钮事件
    document.querySelectorAll('.add-stock-btn').forEach(btn => {
        btn.addEventListener('click', () => showAddStockModal(btn.dataset.id));
    });
    
    // 添加测试按钮事件
    document.querySelectorAll('.tester-btn').forEach(btn => {
        btn.addEventListener('click', () => handleTesterAction(btn.dataset.id));
    });
}

// 显示更新库存模态框
function showUpdateStockModal(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 填充表单字段
    document.getElementById('updateProductId').value = productId;
    document.getElementById('updateProductName').value = product.name;
    document.getElementById('updateCurrentStock').value = product.stock !== undefined ? product.stock : (product.quantity || 0);
    
    // 重置表单
    document.getElementById('updateOperation').value = 'add';
    
    const updateQuantityInput = document.getElementById('updateQuantity');
    updateQuantityInput.value = 1;
    
    // 根据商品的销售单位类型调整数量输入框
    const isWeightProduct = product.saleUnit === 'weight';
    if (isWeightProduct) {
        updateQuantityInput.step = '0.001'; // 允许输入三位小数
        updateQuantityInput.min = '0.001'; // 最小输入值
    } else {
        updateQuantityInput.step = '1'; // 整数步进
        updateQuantityInput.min = '1'; // 最小值为1
    }
    
    document.getElementById('updateReason').value = 'new_stock';
    document.getElementById('otherReason').value = '';
    document.getElementById('otherReasonContainer').style.display = 'none';
    document.getElementById('updateNotes').value = '';
    
    // 显示模态框
    showModal(updateStockModal);
}

// 处理更新库存表单提交
function handleUpdateStock(e) {
    e.preventDefault();
    
    const productId = document.getElementById('updateProductId').value;
    const operation = document.getElementById('updateOperation').value;
    const currentProduct = products[productId];
    
    if (!currentProduct) {
        alert('Product not found');
        return;
    }
    
    // 根据产品的销售单位确定数量类型
    let quantity;
    if (currentProduct.saleUnit === 'weight') {
        // 如果是按重量销售，使用parseFloat并精确保留3位小数
        const rawValue = document.getElementById('updateQuantity').value;
        quantity = parseFloat(Number(rawValue).toFixed(3));
    } else {
        // 否则使用整数
        quantity = parseInt(document.getElementById('updateQuantity').value);
    }
    
    const reasonSelect = document.getElementById('updateReason');
    const reason = reasonSelect.value === 'other' ? document.getElementById('otherReason').value : reasonSelect.options[reasonSelect.selectedIndex].text;
    const notes = document.getElementById('updateNotes').value;
    
    if (!productId || isNaN(quantity) || quantity < 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    const currentStock = currentProduct.stock !== undefined ? currentProduct.stock : (currentProduct.quantity || 0);
    let newStock = currentStock;
    
    // 根据操作计算新库存
    switch (operation) {
        case 'add':
            if (currentProduct.saleUnit === 'weight') {
                // 重量单位产品，保留3位小数，使用Number()来确保浮点精度问题
                newStock = parseFloat(Number(currentStock + quantity).toFixed(3));
            } else {
                newStock = currentStock + quantity;
            }
            break;
        case 'subtract':
            if (currentProduct.saleUnit === 'weight') {
                // 重量单位产品，保留3位小数并防止负库存
                newStock = parseFloat(Number(Math.max(0, currentStock - quantity)).toFixed(3));
            } else {
                newStock = Math.max(0, currentStock - quantity); // 不允许负库存
            }
            break;
    }
    
    // 更新库存记录
    const userStoreId = localStorage.getItem('store_id');
    updateProductStock(userStoreId, productId, newStock, operation, quantity, reason, notes)
        .then(() => {
            hideModal(updateStockModal);
            loadInventory(); // 重新加载库存
            alert('Stock updated successfully!');
        })
        .catch(error => {
            console.error('Failed to update stock:', error);
            alert('Failed to update stock. Please try again.');
        });
}

// 更新产品库存
function updateProductStock(storeId, productId, newStock, operation, quantity, reason, notes) {
    // 创建更新对象
    const updates = {};
    
    // 检查是否为重量单位的产品
    const product = products[productId];
    const isWeightProduct = product && product.saleUnit === 'weight';
    
    // 更新库存 - 如果是重量单位，使用toFixed(3)保留3位小数精度
    if (isWeightProduct) {
        // 解决浮点数计算精度问题，确保小数点后只保留3位
        newStock = parseFloat(Number(newStock).toFixed(3));
    }
    
    updates[`store_products/${storeId}/${productId}/stock`] = newStock;
    updates[`store_products/${storeId}/${productId}/quantity`] = newStock; // 为了兼容性也更新quantity
    
    // 记录库存变更历史
    const historyEntry = {
        timestamp: getCurrentDateTime(),
        previous_stock: products[productId].stock !== undefined ? products[productId].stock : (products[productId].quantity || 0),
        new_stock: newStock,
        operation,
        quantity,
        reason,
        notes,
        cashier: cashierName || 'Unknown',
        user_id: JSON.parse(localStorage.getItem('user') || '{}').uid || 'unknown'
    };
    
    // 生成唯一ID
    const historyId = database.ref().child(`stock_history/${storeId}/${productId}`).push().key;
    updates[`stock_history/${storeId}/${productId}/${historyId}`] = historyEntry;
    
    // 执行批量更新
    return database.ref().update(updates);
}

// 切换其他原因输入框的显示
function toggleOtherReason() {
    const reasonSelect = document.getElementById('updateReason');
    const otherReasonContainer = document.getElementById('otherReasonContainer');
    
    if (reasonSelect.value === 'other') {
        otherReasonContainer.style.display = 'block';
    } else {
        otherReasonContainer.style.display = 'none';
    }
}

// 显示库存历史记录
function showStockHistory(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 显示模态框
    showModal(stockHistoryModal);
    
    // 更新标题
    stockHistoryModal.querySelector('h2').innerHTML = `<i class="material-icons">history</i> Stock History: ${product.name}`;
    
    // 显示加载状态
    stockHistoryContent.innerHTML = '<div class="loading"><i class="material-icons">hourglass_empty</i> Loading history...</div>';
    
    // 加载历史数据
    const userStoreId = localStorage.getItem('store_id');
    loadStockHistory(userStoreId, productId)
        .then(history => {
            if (!history || Object.keys(history).length === 0) {
                stockHistoryContent.innerHTML = '<div class="no-data"><i class="material-icons">info</i> No history records available</div>';
                return;
            }
            
            // 排序历史记录，最新的在前面
            const sortedHistory = Object.entries(history).sort(([_, a], [__, b]) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            let historyHTML = `
                <table class="inventory-history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Operation</th>
                            <th>Previous Stock</th>
                            <th>New Stock</th>
                            <th>Quantity</th>
                            <th>Reason</th>
                            <th>Cashier</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            sortedHistory.forEach(([_, record]) => {
                // 格式化操作名称
                let operationText;
                switch (record.operation) {
                    case 'add':
                        operationText = 'Added Stock';
                        break;
                    case 'subtract':
                        operationText = 'Removed Stock';
                        break;
                    default:
                        operationText = record.operation;
                }
                
                historyHTML += `
                    <tr>
                        <td>${record.timestamp}</td>
                        <td>${operationText}</td>
                        <td>${record.previous_stock}</td>
                        <td>${record.new_stock}</td>
                        <td>${record.quantity}</td>
                        <td>${record.reason || '-'}</td>
                        <td>${record.cashier || '-'}</td>
                        <td>${record.notes || '-'}</td>
                    </tr>
                `;
            });
            
            historyHTML += `
                    </tbody>
                </table>
            `;
            
            stockHistoryContent.innerHTML = historyHTML;
        })
        .catch(error => {
            console.error('Failed to load stock history:', error);
            stockHistoryContent.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load history data</div>';
        });
}

// 加载库存历史记录
function loadStockHistory(storeId, productId) {
    return database.ref(`stock_history/${storeId}/${productId}`).once('value')
        .then(snapshot => snapshot.val() || {});
}

// 辅助函数：获取当前日期时间字符串
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取上一个产品ID序列号并生成新的产品ID
function generateProductId() {
    const userStoreId = localStorage.getItem('store_id');
    if (!userStoreId) {
        return Promise.reject('Store ID not found');
    }
    
    // 获取店铺前缀
    let storePrefix = storeData.name || userStoreId;
    // 移除空格并转为大写
    storePrefix = storePrefix.replace(/\s+/g, '').toUpperCase();
    // 不再限制名称长度，使用完整的店铺名称
    
    // 获取当前最高序列号
    return database.ref(`product_sequences/${userStoreId}`).once('value')
        .then(snapshot => {
            let sequence = 1; // 默认从1开始
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                sequence = (data.last_sequence || 0) + 1;
            }
            
            // 更新序列号
            database.ref(`product_sequences/${userStoreId}`).set({
                last_sequence: sequence,
                last_updated: getCurrentDateTime()
            });
            
            // 生成5位数序列号，左填充0
            const sequenceStr = sequence.toString().padStart(5, '0');
            
            // 返回完整的产品ID
            return `${storePrefix}${sequenceStr}`;
        });
}

// 处理添加商品表单提交
function handleAddProduct(e) {
    e.preventDefault();
    
    const userStoreId = localStorage.getItem('store_id');
    if (!userStoreId) {
        alert('Store ID not found. Please refresh the page.');
        return;
    }
    
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productQuantityInput = document.getElementById('productQuantity');
    const productCategoryInput = document.getElementById('productCategory');
    const saleUnitInput = document.getElementById('saleUnit');
    
    const productId = productIdInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const saleUnit = saleUnitInput.value || 'piece';
    // 当销售单位为重量时，允许小数点的库存值，否则使用整数
    const stock = saleUnit === 'weight' ? parseFloat(productQuantityInput.value) || 0 : parseInt(productQuantityInput.value) || 0;
    const category = productCategoryInput.value.trim();
    
    if (!productId || !name || isNaN(price)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // 添加商品到数据库
    const productData = {
        name,
        price,
        stock,
        category: category || '',
        saleUnit: saleUnit,
        store_id: userStoreId
    };
    
    database.ref(`store_products/${userStoreId}/${productId}`).set(productData)
        .then(() => {
            hideModal(addProductModal);
            // 重置表单
            addProductForm.reset();
            // 刷新商品列表
            loadProducts(userStoreId);
            alert('Product added successfully!');
        })
        .catch(error => {
            console.error('Failed to add product:', error);
            alert('Failed to add product. Please try again.');
        });
}

// 切换侧边栏
function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    
    if (sidebarCollapsed) {
        toggleIcon.textContent = 'chevron_right';
    } else {
        toggleIcon.textContent = 'chevron_left';
    }
    
    // 保存侧边栏状态
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    
    // 通知窗口大小变化，使布局重新计算
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 300);
}

// 应用百分比折扣
function applyPercentDiscount() {
    const input = document.getElementById('discountPercent');
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 0 || value > 100) {
        alert('Please enter a valid discount percentage (0-100)');
        input.value = discountPercent;
        return;
    }
    
    discountPercent = value;
    discountType = 'percent';
    
    // 隐藏折扣面板
    const discountPanel = document.getElementById('discountPanel');
    if (discountPanel) {
        discountPanel.style.display = 'none';
        const toggleBtn = document.getElementById('toggleDiscountBtn');
        if (toggleBtn) toggleBtn.classList.remove('active');
    }
    
    renderCart();
}

// 应用金额折扣
function applyAmountDiscount() {
    const input = document.getElementById('discountAmount');
    const value = parseFloat(input.value);
    
    if (isNaN(value) || value < 0) {
        alert('Please enter a valid discount amount');
        input.value = discountAmount.toFixed(2);
        return;
    }
    
    // 计算小计以确保折扣不超过小计
    const subtotal = cart.reduce((sum, item) => sum + (item.isFree ? 0 : item.price * item.quantity), 0);
    
    if (value > subtotal) {
        alert(`Discount cannot exceed subtotal (RM${subtotal.toFixed(2)})`);
        input.value = Math.min(discountAmount, subtotal).toFixed(2);
        return;
    }
    
    discountAmount = value;
    discountType = 'amount';
    
    // 隐藏折扣面板
    const discountPanel = document.getElementById('discountPanel');
    if (discountPanel) {
        discountPanel.style.display = 'none';
        const toggleBtn = document.getElementById('toggleDiscountBtn');
        if (toggleBtn) toggleBtn.classList.remove('active');
    }
    
    renderCart();
}

// 加载最后一个账单号
function loadLastBillNumber() {
    const userStoreId = localStorage.getItem('store_id');
    const today = getCurrentDate(); // 获取当前日期
    
    database.ref(`bill_numbers/${userStoreId}/${today}`).once('value')
        .then(snapshot => {
            const data = snapshot.val() || { counter: 0 };
            billNumberCounter = data.counter;
            console.log(`Loaded last bill number for ${today}:`, billNumberCounter);
        })
        .catch(error => {
            console.error(`Failed to load bill number for ${today}:`, error);
            // 如果加载失败，使用默认值0
            billNumberCounter = 0;
        });
}

// 生成新的账单号
function generateBillNumber() {
    const userStoreId = localStorage.getItem('store_id');
    const today = new Date();
    const year = today.getFullYear().toString(); // 使用完整年份
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`; // 格式化日期为 YYYY-MM-DD
    
    // 增加计数器
    billNumberCounter++;
    
    // 存储最新的计数器值到当天的记录中
    database.ref(`bill_numbers/${userStoreId}/${dateString}`).set({
        counter: billNumberCounter,
        last_updated: getCurrentDateTime()
    });
    
    // 格式: STORE-DDMMYYYY-COUNTER
    return `${userStoreId}-${day}${month}${year}-${billNumberCounter.toString().padStart(4, '0')}`;
}

// 加载收银员历史记录
function loadCashierHistory() {
    const storedHistory = localStorage.getItem('cashierHistory');
    if (storedHistory) {
        cashierHistory = JSON.parse(storedHistory);
    }
}

// 保存收银员历史记录
function saveCashierHistory() {
    localStorage.setItem('cashierHistory', JSON.stringify(cashierHistory));
}

// 记录收银员换班
function recordCashierShift(newCashierName, newCashierShift) {
    const shiftRecord = {
        cashierName: newCashierName,
        shift: newCashierShift,
        shiftTime: getCurrentDateTime() // 修改这里，从time改为shiftTime
    };
    
    cashierHistory.push(shiftRecord);
    saveCashierHistory();
    
    console.log(`收银员换班记录: ${newCashierName} (${newCashierShift}) 在 ${shiftRecord.shiftTime}`);
}

// 从购物车移除商品
function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        renderCart();
    }
}

// 更新购物车中商品数量
function updateQuantity(index, quantity) {
    if (index >= 0 && index < cart.length) {
        if (quantity <= 0) {
            // 如果数量小于等于0，从购物车中移除
            removeFromCart(index);
        } else {
            // 检查库存是否足够
            const product = products[cart[index].id];
            if (product && product.stock !== undefined && quantity > product.stock) {
                alert(`Cannot add more. Only ${product.stock} items available in stock.`);
                return;
            }
            
            cart[index].quantity = quantity;
            renderCart();
        }
    }
}

// 显示拆分免费商品对话框
function showSplitFreeDialog(index) {
    if (index < 0 || index >= cart.length) return;
    
    const item = cart[index];
    if (item.quantity <= 1) return;
    
    // 创建背景
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'split-free-dialog';
    dialog.innerHTML = `
        <h4>
            <span>Split Free Items</span>
            <button class="close-dialog">&times;</button>
        </h4>
        <label for="freeQuantity">How many items to mark as FREE? (Max: ${item.quantity})</label>
        <input type="number" id="freeQuantity" min="1" max="${item.quantity}" value="1">
        <button class="apply-free">
            <i class="material-icons">card_giftcard</i> Apply
        </button>
    `;
    document.body.appendChild(dialog);
    
    // 获取输入和按钮元素
    const freeQuantityInput = document.getElementById('freeQuantity');
    const applyButton = dialog.querySelector('.apply-free');
    const closeButton = dialog.querySelector('.close-dialog');
    
    // 添加关闭事件
    const closeDialog = () => {
        dialog.remove();
        backdrop.remove();
    };
    
    closeButton.addEventListener('click', closeDialog);
    backdrop.addEventListener('click', closeDialog);
    
    // 添加应用按钮事件
    applyButton.addEventListener('click', () => {
        const freeQuantity = parseInt(freeQuantityInput.value);
        
        if (isNaN(freeQuantity) || freeQuantity < 1 || freeQuantity > item.quantity) {
            alert(`Please enter a valid quantity between 1 and ${item.quantity}.`);
            return;
        }
        
        // 从原商品中减去要分离的部分
        item.quantity -= freeQuantity;
        
        // 创建新的免费商品
        const freeItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: freeQuantity,
            isFree: true
        };
        
        // 添加到购物车
        cart.push(freeItem);
        
        // 关闭对话框
        closeDialog();
        
        // 重新渲染购物车
        renderCart();
    });
}

// 显示编辑销售拆分免费商品对话框
function showEditSplitFreeDialog(index) {
    if (index < 0 || index >= editingSale.items.length) return;
    
    const item = editingSale.items[index];
    if (item.quantity <= 1) return;
    
    // 创建背景
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    document.body.appendChild(backdrop);
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'split-free-dialog';
    dialog.innerHTML = `
        <h4>
            <span>Split Free Items</span>
            <button class="close-dialog">&times;</button>
        </h4>
        <label for="editFreeQuantity">How many items to mark as FREE? (Max: ${item.quantity})</label>
        <input type="number" id="editFreeQuantity" min="1" max="${item.quantity}" value="1">
        <button class="apply-free">
            <i class="material-icons">card_giftcard</i> Apply
        </button>
    `;
    document.body.appendChild(dialog);
    
    // 获取输入和按钮元素
    const freeQuantityInput = document.getElementById('editFreeQuantity');
    const applyButton = dialog.querySelector('.apply-free');
    const closeButton = dialog.querySelector('.close-dialog');
    
    // 添加关闭事件
    const closeDialog = () => {
        dialog.remove();
        backdrop.remove();
    };
    
    closeButton.addEventListener('click', closeDialog);
    backdrop.addEventListener('click', closeDialog);
    
    // 添加应用按钮事件
    applyButton.addEventListener('click', () => {
        const freeQuantity = parseInt(freeQuantityInput.value);
        
        if (isNaN(freeQuantity) || freeQuantity < 1 || freeQuantity > item.quantity) {
            alert(`Please enter a valid quantity between 1 and ${item.quantity}.`);
            return;
        }
        
        // 从原商品中减去要分离的部分
        item.quantity -= freeQuantity;
        item.subtotal = item.isFree ? 0 : item.price * item.quantity;
        
        // 创建新的免费商品
        const freeItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: freeQuantity,
            isFree: true,
            subtotal: 0
        };
        
        // 添加到购物车
        editingSale.items.push(freeItem);
        
        // 关闭对话框
        closeDialog();
        
        // 重新渲染购物车
        renderEditSaleItems();
    });
}

// 搜索和筛选产品
function filterProducts() {
    console.log("执行搜索过滤..."); // 添加调试日志
    const searchTerm = productSearch ? productSearch.value.trim().toLowerCase() : '';
    console.log("搜索词:", searchTerm); // 添加调试日志
    
    // 如果有搜索词，先过滤当前显示的产品
    if (searchTerm) {
        const filteredProducts = {};
        
        // 从当前显示的产品中过滤
        Object.entries(products).forEach(([id, product]) => {
            if (product.name.toLowerCase().includes(searchTerm) || 
                id.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))) {
                filteredProducts[id] = product;
            }
        });
        
        console.log(`搜索结果: 找到${Object.keys(filteredProducts).length}个商品`); // 添加调试日志
        
        // 临时替换产品列表并渲染
        const originalProducts = {...products}; // 使用解构创建原始产品的副本
        products = filteredProducts;
        renderProducts(searchTerm); // 传入搜索词，以便正确渲染
        products = originalProducts; // 恢复原始产品列表
    } else {
        // 如果搜索框为空，根据当前类别重新加载产品
        filterProductsByCategory(currentCategory || 'all');
    }
}

// 更新销售记录
function updateSaleRecord(storeId, date, saleId, updatedSale) {
    // 禁用按钮防止重复提交
    updateSaleBtn.disabled = true;
    updateSaleBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Updating...';
    
    // 使用按日期组织的数据路径
    return database.ref(`sales/${storeId}/${date}/${saleId}`).update(updatedSale)
        .then(() => {
            console.log('Successfully updated sale record');
            return true;
        })
        .catch(error => {
            console.error('Error updating sale record:', error);
            throw error;
        })
        .finally(() => {
            // 恢复按钮状态
            updateSaleBtn.disabled = false;
            updateSaleBtn.innerHTML = '<i class="material-icons">save</i> Update Sale';
        });
} 

// 按类别过滤产品并重新渲染
function filterProductsByCategory(category) {
    currentCategory = category;
    console.log("按类别过滤产品:", category);
    
    const storeId = localStorage.getItem('store_id');
    if (!storeId) {
        console.error("过滤商品失败: 未找到店铺ID");
        return;
    }
    
    // 显示加载中状态
    productGrid.innerHTML = '<div class="loading-indicator"><i class="material-icons">hourglass_empty</i> Loading products...</div>';
    
    // 如果选择"all"类别，使用常规产品加载
    if (category === 'all') {
        getStoreProductsOptimized(storeId)
            .then(storeProducts => {
                products = storeProducts;
                renderProducts();
            })
            .catch(error => {
                console.error('加载所有商品失败:', error);
                productGrid.innerHTML = '<div class="error-message"><i class="material-icons">error</i> 加载商品失败，请刷新页面重试。</div>';
            });
    } else {
        // 否则使用按类别查询
        getProductsByCategory(storeId, category)
            .then(categoryProducts => {
                products = categoryProducts;
                renderProducts();
            })
            .catch(error => {
                console.error(`加载"${category}"类别商品失败:`, error);
                productGrid.innerHTML = '<div class="error-message"><i class="material-icons">error</i> 加载商品失败，请刷新页面重试。</div>';
            });
    }
}

// 显示快速增加库存模态框
function showAddStockModal(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 判断销售单位
    const isWeightSale = product.saleUnit === 'weight';
    const unit = isWeightSale ? 'kg' : 'items';
    
    const quantity = prompt(`Add stock for "${product.name}"\nCurrent stock: ${product.stock !== undefined ? product.stock : (product.quantity || 0)}${isWeightSale ? 'kg' : ''}\n\nEnter quantity to add${isWeightSale ? ' (kg)' : ''}:`);
    
    if (quantity === null) return; // 用户取消
    
    // 使用parseFloat代替parseInt以支持小数点，并控制小数位数
    let quantityNumber = parseFloat(quantity);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
        alert('Please enter a valid positive number');
        return;
    }
    
    // 如果是按重量销售的商品，精确控制小数位数
    if (isWeightSale) {
        quantityNumber = parseFloat(Number(quantityNumber).toFixed(3));
    }
    
    // 获取当前库存
    const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
    let newStock;
    
    // 控制小数位数
    if (isWeightSale) {
        newStock = parseFloat(Number(currentStock + quantityNumber).toFixed(3));
    } else {
        newStock = currentStock + quantityNumber;
    }
    
    // 更新库存记录
    const userStoreId = localStorage.getItem('store_id');
    updateProductStock(userStoreId, productId, newStock, 'add', quantityNumber, 'Quick add stock', 'Added via quick add button')
        .then(() => {
            loadInventory(); // 重新加载库存
            alert(`Successfully added ${quantityNumber} ${unit} to ${product.name}!\nNew stock: ${newStock}${isWeightSale ? 'kg' : ''}`);
        })
        .catch(error => {
            console.error('Failed to add stock:', error);
            alert('Failed to add stock. Please try again.');
        });
}

// 处理测试功能（减少1个库存）
function handleTesterAction(productId) {
    const product = products[productId];
    if (!product) return;
    
    const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
    
    if (currentStock <= 0) {
        alert(`Cannot test "${product.name}" - no stock available`);
        return;
    }
    
    if (!confirm(`Test product "${product.name}"?\nThis will reduce stock by 1 (from ${currentStock} to ${currentStock - 1})`)) {
        return;
    }
    
    const newStock = currentStock - 1;
    
    // 更新库存记录
    const userStoreId = localStorage.getItem('store_id');
    updateProductStock(userStoreId, productId, newStock, 'subtract', 1, 'Product testing', 'Tested via tester button')
        .then(() => {
            loadInventory(); // 重新加载库存
            alert(`Successfully tested ${product.name}!\nStock reduced by 1. New stock: ${newStock}`);
        })
        .catch(error => {
            console.error('Failed to test product:', error);
            alert('Failed to test product. Please try again.');
        });
}

// 切换简化模式
function toggleSimpleMode() {
    const body = document.body;
    const simpleModeBtn = document.getElementById('simpleModeBtn');
    const icon = simpleModeBtn.querySelector('.material-icons');
    
    // 关闭所有可能打开的模态窗口，防止它们被卡在后台
    const openModals = document.querySelectorAll('.modal[style*="display: block"]');
    openModals.forEach(modal => {
        hideModal(modal);
    });
    
    // 移除任何可能存在的背景遮罩
    const existingBackdrops = document.querySelectorAll('.dialog-backdrop');
    existingBackdrops.forEach(backdrop => {
        backdrop.remove();
    });
    
    // 切换简化模式类
    body.classList.toggle('simple-mode');
    
    // 更新按钮状态和图标
    if (body.classList.contains('simple-mode')) {
        simpleModeBtn.classList.add('active');
        icon.textContent = 'fullscreen_exit';
        simpleModeBtn.title = 'Exit Simple Mode';
        
        // 自动切换到销售视图
        switchView('sales');
        
        // 保存简化模式状态
        localStorage.setItem('simpleMode', 'true');
        
        console.log('Simple mode enabled');
    } else {
        simpleModeBtn.classList.remove('active');
        icon.textContent = 'fullscreen';
        simpleModeBtn.title = 'Enter Simple Mode';
        
        // 清除简化模式状态
        localStorage.setItem('simpleMode', 'false');
        
        console.log('Simple mode disabled');
    }
    
    // 触发窗口resize事件，确保布局正确调整
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
    
    // 确保所有模态对话框的z-index高于其他元素
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.style.zIndex = '2000';
    });
}

// 页面加载时检查简化模式状态
function checkSimpleModeOnLoad() {
    const savedSimpleMode = localStorage.getItem('simpleMode');
    if (savedSimpleMode === 'true') {
        toggleSimpleMode();
    }
}

// 热销商品管理
let hotItems = []; // 存储热销商品ID列表

// 切换热销商品区域显示/隐藏
function toggleHotItemsSection() {
    const section = document.getElementById('hotItemsSection');
    const toggle = document.getElementById('hotItemsToggle');
    
    section.classList.toggle('collapsed');
    
    // 保存折叠状态
    localStorage.setItem('hotItemsCollapsed', section.classList.contains('collapsed'));
}

// 加载热销商品
function loadHotItems() {
    const userStoreId = localStorage.getItem('store_id');
    if (!userStoreId) return;
    
    // 从localStorage加载热销商品配置
    const savedHotItems = localStorage.getItem(`hotItems_${userStoreId}`);
    if (savedHotItems) {
        hotItems = JSON.parse(savedHotItems);
    } else {
        // 如果没有保存的热销商品，则为空数组，需要手动添加
        hotItems = [];
    }
    
    renderHotItems();
}

// 渲染热销商品
function renderHotItems() {
    const container = document.getElementById('hotItemsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (hotItems.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">No hot items configured</div>';
        return;
    }
    
    hotItems.forEach((productId, index) => {
        const product = products[productId];
        if (!product) return;
        
        const stock = product.stock !== undefined ? product.stock : 0;
        const stockClass = stock <= 0 ? 'out-of-stock' : '';
        const isWeightSale = product.saleUnit === 'weight';
        
        const hotItemElement = document.createElement('div');
        hotItemElement.className = `hot-item ${stockClass}`;
        hotItemElement.dataset.id = productId;
        
        hotItemElement.innerHTML = `
            <div class="hot-item-name">${product.name}</div>
            <div class="hot-item-price">RM${product.price.toFixed(2)}${isWeightSale ? '/kg' : ''}</div>
            <div class="hot-item-stock">Stock: ${stock}${isWeightSale ? 'kg' : ''}</div>
        `;
        
        // 添加点击事件
        if (stock > 0) {
            hotItemElement.addEventListener('click', () => addToCart(productId));
        }
        
        container.appendChild(hotItemElement);
    });
}

// 设置热销商品（可供管理员使用）
function setHotItems(productIds) {
    const userStoreId = localStorage.getItem('store_id');
    if (!userStoreId) return;
    
    hotItems = productIds.slice(0, 10); // 最多10个热销商品
    localStorage.setItem(`hotItems_${userStoreId}`, JSON.stringify(hotItems));
    renderHotItems();
}

// 添加商品到热销列表
function addToHotItems(productId) {
    if (!hotItems.includes(productId)) {
        hotItems.unshift(productId); // 添加到开头
        if (hotItems.length > 10) {
            hotItems = hotItems.slice(0, 10); // 保持最多10个
        }
        
        const userStoreId = localStorage.getItem('store_id');
        if (userStoreId) {
            localStorage.setItem(`hotItems_${userStoreId}`, JSON.stringify(hotItems));
        }
        renderHotItems();
    }
}

// 从热销列表移除商品
function removeFromHotItems(productId) {
    const index = hotItems.indexOf(productId);
    if (index > -1) {
        hotItems.splice(index, 1);
        
        const userStoreId = localStorage.getItem('store_id');
        if (userStoreId) {
            localStorage.setItem(`hotItems_${userStoreId}`, JSON.stringify(hotItems));
        }
        renderHotItems();
    }
}

// 基于销售数据自动更新热销商品
function updateHotItemsBasedOnSales() {
    // 这个函数可以用于未来根据实际销售数据来分析和更新热销商品
    // 当前版本保持手动管理模式
    console.log('Hot items are managed manually');
}

// 恢复热销商品折叠状态
function restoreHotItemsState() {
    const collapsed = localStorage.getItem('hotItemsCollapsed');
    if (collapsed === 'true') {
        const section = document.getElementById('hotItemsSection');
        if (section) {
            section.classList.add('collapsed');
        }
    }
}

// 热销商品相关事件监听
const hotItemsToggle = document.getElementById('hotItemsToggle');
if (hotItemsToggle) {
    hotItemsToggle.addEventListener('click', toggleHotItemsSection);
}

// 热销商品管理界面
function showHotItemsManageModal() {
    const modal = document.getElementById('hotItemsManageModal');
    if (!modal) return;
    
    renderHotItemsManagement();
    showModal(modal);
}

function renderHotItemsManagement() {
    renderCurrentHotItems();
    renderAvailableProducts();
}

function renderCurrentHotItems() {
    const container = document.getElementById('currentHotItemsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (hotItems.length === 0) {
        container.innerHTML = '<div class="no-hot-items">No hot items configured. Please select from available products on the right.</div>';
        return;
    }
    
    hotItems.forEach((productId, index) => {
        const product = products[productId];
        if (!product) return;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'hot-item-manage current';
        itemElement.innerHTML = `
            <div class="hot-item-info">
                <div class="hot-item-name-manage">${product.name}</div>
                <div class="hot-item-price-manage">RM${product.price.toFixed(2)} | Stock: ${product.stock || 0}</div>
            </div>
            <div class="hot-item-actions">
                ${index > 0 ? `<button class="hot-item-action-btn" onclick="moveHotItemUp('${productId}')" title="Move Up">
                    <i class="material-icons">keyboard_arrow_up</i>
                </button>` : ''}
                ${index < hotItems.length - 1 ? `<button class="hot-item-action-btn" onclick="moveHotItemDown('${productId}')" title="Move Down">
                    <i class="material-icons">keyboard_arrow_down</i>
                </button>` : ''}
                <button class="hot-item-action-btn remove" onclick="removeFromHotItemsManage('${productId}')" title="Remove">
                    <i class="material-icons">remove</i>
                </button>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
}

function renderAvailableProducts() {
    const container = document.getElementById('availableProductsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const searchTerm = document.getElementById('hotItemsSearch')?.value?.toLowerCase() || '';
    
    Object.entries(products).forEach(([productId, product]) => {
        // 跳过已经在热销商品中的产品
        if (hotItems.includes(productId)) return;
        
        // 搜索过滤
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm)) return;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'hot-item-manage';
        itemElement.innerHTML = `
            <div class="hot-item-info">
                <div class="hot-item-name-manage">${product.name}</div>
                <div class="hot-item-price-manage">RM${product.price.toFixed(2)} | Stock: ${product.stock || 0}</div>
            </div>
            <div class="hot-item-actions">
                <button class="hot-item-action-btn add" onclick="addToHotItemsManage('${productId}')" title="Add">
                    <i class="material-icons">add</i>
                </button>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
}

function addToHotItemsManage(productId) {
    if (hotItems.length >= 10) {
        alert('Maximum 10 hot items allowed');
        return;
    }
    
    addToHotItems(productId);
    renderHotItemsManagement();
}

function removeFromHotItemsManage(productId) {
    removeFromHotItems(productId);
    renderHotItemsManagement();
}

function moveHotItemUp(productId) {
    const index = hotItems.indexOf(productId);
    if (index > 0) {
        // 交换位置
        [hotItems[index], hotItems[index - 1]] = [hotItems[index - 1], hotItems[index]];
        
        // 保存到localStorage
        const userStoreId = localStorage.getItem('store_id');
        if (userStoreId) {
            localStorage.setItem(`hotItems_${userStoreId}`, JSON.stringify(hotItems));
        }
        
        renderHotItemsManagement();
    }
}

function moveHotItemDown(productId) {
    const index = hotItems.indexOf(productId);
    if (index < hotItems.length - 1) {
        // 交换位置
        [hotItems[index], hotItems[index + 1]] = [hotItems[index + 1], hotItems[index]];
        
        // 保存到localStorage
        const userStoreId = localStorage.getItem('store_id');
        if (userStoreId) {
            localStorage.setItem(`hotItems_${userStoreId}`, JSON.stringify(hotItems));
        }
        
        renderHotItemsManagement();
    }
}

function saveHotItemsSettings() {
    const userStoreId = localStorage.getItem('store_id');
    if (userStoreId) {
        localStorage.setItem(`hotItems_${userStoreId}`, JSON.stringify(hotItems));
    }
    
    renderHotItems(); // 更新主界面显示
    hideModal(document.getElementById('hotItemsManageModal'));
    alert('Hot items settings saved successfully!');
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 初始化收银员名字样式
    const cashierNameDisplay = document.getElementById('cashierNameDisplay');
    const currentShift = localStorage.getItem('cashierShift');
    
    if (cashierNameDisplay && currentShift) {
        cashierNameDisplay.classList.remove('first-shift-name', 'second-shift-name');
        if (currentShift === '1st Shift') {
            cashierNameDisplay.classList.add('first-shift-name');
        } else if (currentShift === '2nd Shift') {
            cashierNameDisplay.classList.add('second-shift-name');
        }
    }
    
    // 热销商品管理按钮
    const manageHotItemsBtn = document.getElementById('manageHotItemsBtn');
    if (manageHotItemsBtn) {
        manageHotItemsBtn.addEventListener('click', showHotItemsManageModal);
    }
    
    // 热销商品搜索
    const hotItemsSearch = document.getElementById('hotItemsSearch');
    if (hotItemsSearch) {
        hotItemsSearch.addEventListener('input', renderAvailableProducts);
    }
    
    // 保存热销商品设置按钮
    const saveHotItemsBtn = document.getElementById('saveHotItemsBtn');
    if (saveHotItemsBtn) {
        saveHotItemsBtn.addEventListener('click', saveHotItemsSettings);
    }
    
    // 关闭热销商品管理模态框
    const closeHotItemsManageBtn = document.getElementById('closeHotItemsManageBtn');
    if (closeHotItemsManageBtn) {
        closeHotItemsManageBtn.addEventListener('click', () => {
            hideModal(document.getElementById('hotItemsManageModal'));
        });
    }
});

// 更新库存输入框的step属性
function updateStockInputStep() {
    const saleUnitInput = document.getElementById('saleUnit');
    const productQuantityInput = document.getElementById('productQuantity');
    
    if (saleUnitInput && productQuantityInput) {
        if (saleUnitInput.value === 'weight') {
            productQuantityInput.step = '0.001'; // 允许输入三位小数
        } else {
            productQuantityInput.step = '1';
        }
    }
}