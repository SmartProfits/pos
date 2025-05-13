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
const refreshSalesBtn = document.getElementById('refreshSalesBtn');
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
const editSaleBtn = document.getElementById('editSaleBtn');
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

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', () => {
    // 检查用户是否登录
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = localStorage.getItem('role');
    const userStoreId = localStorage.getItem('store_id');
    
    if (!user.uid || userRole !== 'staff' || !userStoreId) {
        // 如果用户未登录或不是店员，重定向到登录页面
        window.location.href = '../index.html';
        return;
    }
    
    // 显示店员信息
    staffName.textContent = `Staff: ${user.email}`;
    storeId.textContent = `Store ID: ${userStoreId}`;
    
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
});

// 加载店铺信息
function loadStoreInfo(storeId) {
    database.ref(`stores/${storeId}`).once('value')
        .then(snapshot => {
            const store = snapshot.val() || { name: 'Unknown Store' };
            storeData = store;
            storeName.textContent = store.name;
        })
        .catch(error => {
            console.error('Failed to load store information:', error);
            alert('Failed to load store information. Please refresh the page.');
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
        const query = searchQuery.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(([_, product]) => 
            product.name.toLowerCase().includes(query) || 
            (product.id && product.id.toLowerCase().includes(query))
        );
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
    
    filteredProducts.forEach(([productId, product]) => {
        // 获取库存，如果不存在则显示为"无库存"
        const stock = product.stock !== undefined ? product.stock : 'N/A';
        const stockClass = getStockStatusClass(stock);
        
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.dataset.id = productId;
        productElement.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category || 'Uncategorized'}</div>
            <div class="product-price">RM${product.price.toFixed(2)}</div>
            <div class="product-stock ${stockClass}">Stock: ${stock}</div>
        `;
        
        // 如果库存为0或不存在，禁用点击事件
        if (stock !== 'N/A' && stock <= 0) {
            productElement.classList.add('out-of-stock');
        } else {
            productElement.addEventListener('click', () => addToCart(productId));
        }
        
        productGrid.appendChild(productElement);
    });
}

// 获取库存状态的CSS类
function getStockStatusClass(stock) {
    if (stock === 'N/A') return 'stock-unknown';
    if (stock <= 0) return 'stock-out';
    if (stock < 5) return 'stock-low';
    return 'stock-available';
}

// 初始化事件监听器
function initEventListeners() {
    // 侧边栏切换
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // 商品搜索和过滤
    if (productSearch) {
        productSearch.addEventListener('input', filterProducts);
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
    
    // 销售历史
    dateFilter.addEventListener('change', () => {
        loadSalesHistory(dateFilter.value);
    });
    refreshSalesBtn.addEventListener('click', () => {
        loadSalesHistory(dateFilter.value || selectedDate);
    });
    
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
    
    // 结账成功模态框按钮
    printReceiptBtn.addEventListener('click', printReceipt);
    newSaleBtn.addEventListener('click', newSale);
    
    // 销售详情模态框按钮
    editSaleBtn.addEventListener('click', editSale);
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
            viewTitle.textContent = 'Sales History';
            // 加载销售历史
            loadSalesHistory(dateFilter.value || selectedDate);
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
function loadSalesHistory(date) {
    console.log("加载销售历史，日期:", date);
    const userStoreId = localStorage.getItem('store_id');
    if (!userStoreId) {
        console.error("加载销售历史失败: 未找到店铺ID");
        return;
    }

    // 获取选中的班次过滤条件
    const selectedShift = shiftFilter ? shiftFilter.value : 'all';
    
    // 显示加载中状态
    salesTableBody.innerHTML = '<tr><td colspan="9" class="loading-message">Loading sales data...</td></tr>';
    
    // 使用优化的函数获取按日期和班次过滤的销售记录
    getSalesByDateOptimized(userStoreId, date, selectedShift)
        .then(sales => {
            console.log(`获取到${Object.keys(sales).length}条销售记录`);
            // 存储销售数据到全局变量，这样删除功能可以正常工作
            salesData = sales;
            renderSalesTable(sales);
            
            // 加载每日销售汇总数据
            return getDailySalesSummary(userStoreId, date);
        })
        .then(summary => {
            updateSalesSummary(summary);
        })
        .catch(error => {
            console.error("加载销售历史失败:", error);
            salesTableBody.innerHTML = `<tr><td colspan="9" class="error-message">加载销售数据失败：${error.message}</td></tr>`;
        });
}

// 更新销售汇总信息显示
function updateSalesSummary(summary) {
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
    
    // 计算折扣销售信息（需查询销售记录以计算）
    getDailySalesDiscountInfo(localStorage.getItem('store_id'), selectedDate)
        .then(discountInfo => {
            document.getElementById('discountedSalesCount').textContent = discountInfo.count;
            document.getElementById('totalDiscountAmount').textContent = `RM${discountInfo.amount.toFixed(2)}`;
        })
        .catch(error => {
            console.error("加载折扣信息失败:", error);
        });
}

// 获取每日折扣销售信息
function getDailySalesDiscountInfo(storeId, date) {
    return new Promise((resolve, reject) => {
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
    });
}

// 渲染销售记录表格
function renderSalesTable(sales) {
    salesTableBody.innerHTML = '';
    
    if (Object.keys(sales).length === 0) {
        salesTableBody.innerHTML = '<tr><td colspan="9" class="no-data"><i class="material-icons">info</i> No sales data available for this date</td></tr>';
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
            <td>${saleId}</td>
            <td>${sale.timestamp}</td>
            <td>${cashierName}</td>
            <td>${cashierShift}</td>
            <td>${itemCount}</td>
            <td><span class="discount-badge ${discountBadgeClass}">${discountDisplay}</span></td>
            <td>RM${sale.total_amount.toFixed(2)}</td>
            <td>
                <button class="view-sale-btn" data-id="${saleId}"><i class="material-icons">visibility</i></button>
                <button class="edit-sale-btn" data-id="${saleId}"><i class="material-icons">edit</i></button>
                <button class="delete-sale-btn" data-id="${saleId}"><i class="material-icons">delete</i></button>
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
    
    document.querySelectorAll('.edit-sale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSaleId = btn.dataset.id;
            editSale();
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
                <p>Sale ID: ${currentSaleId}</p>
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
    
    // 添加购物车统计
    const cartStatsElement = document.createElement('div');
    cartStatsElement.className = 'cart-stats';
    cartStatsElement.innerHTML = `
        <div class="cart-stats-item">
            <div class="cart-stats-label">Products</div>
            <div class="cart-stats-value">${editingSale.items.length}</div>
        </div>
        <div class="cart-stats-item">
            <div class="cart-stats-label">Items</div>
            <div class="cart-stats-value items">${totalItems}</div>
        </div>
        <div class="cart-stats-item">
            <div class="cart-stats-label">Total</div>
            <div class="cart-stats-value total">RM${total.toFixed(2)}</div>
        </div>
    `;
    editCartItems.appendChild(cartStatsElement);
    
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
    
    const newTotal = newSubtotal - discountAmount;
    
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
    updateSaleRecord(storeId, selectedDate, currentSaleId, updatedSale)
        .then(() => {
            console.log('销售记录更新成功');
            
            // 刷新销售历史
            loadSalesHistory(selectedDate);
            
            // 隐藏编辑模态框
            hideModal(editSaleModal);
        })
        .catch(error => {
            console.error('销售记录更新失败:', error);
            alert('Failed to update sale record. Please try again.');
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
    if (!userStoreId) {
        alert('Store ID not found. Operation aborted.');
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
    
    // 删除销售记录并更新库存
    Promise.all([
        database.ref(`sales/${userStoreId}/${currentSaleId}`).remove(),
        database.ref().update(updates)
    ])
        .then(() => {
            alert('Sale deleted successfully and inventory restored!');
            hideModal(saleDetailModal);
            loadSalesHistory(selectedDate); // 重新加载销售记录
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
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'RM0.00';
        checkoutBtn.disabled = true;
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
    
    // 添加购物车统计
    const cartStatsElement = document.createElement('div');
    cartStatsElement.className = 'cart-stats';
    cartStatsElement.innerHTML = `
        <div class="cart-stats-item">
            <div class="cart-stats-label">Products</div>
            <div class="cart-stats-value">${cart.length}</div>
        </div>
        <div class="cart-stats-item">
            <div class="cart-stats-label">Items</div>
            <div class="cart-stats-value items">${totalItems}</div>
        </div>
        <div class="cart-stats-item">
            <div class="cart-stats-label">Subtotal</div>
            <div class="cart-stats-value total">RM${subtotal.toFixed(2)}</div>
        </div>
    `;
    cartItems.appendChild(cartStatsElement);
    
    // 添加购物车商品
    cart.forEach((item, index) => {
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
    
    // 添加折扣控制和显示
    const discountElement = document.createElement('div');
    discountElement.className = 'cart-discount';
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
    
    const total = subtotal - discountValue;
    
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
            <span>RM${total.toFixed(2)}</span>
        </div>
    `;
    cartItems.appendChild(summaryElement);
    
    cartTotal.textContent = `RM${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
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
    
    // 检查商品库存
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
            isFree: false
        });
    }
    
    // 更新购物车显示
    renderCart();
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
    
    // 禁用结账按钮，防止重复提交
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Processing...';
    
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
        
        let total = subtotal - discountValue;
        
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
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<i class="material-icons">payment</i> Checkout';
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
    const storeId = localStorage.getItem('store_id');
    const storeName = storeData.name || 'Unknown Store';
    const subtotal = saleData.subtotal;
    const discountType = saleData.discountType || 'percent';
    const discountPercent = saleData.discountPercent || 0;
    const discountAmount = saleData.discountAmount || 0;
    const totalAmount = saleData.total_amount;
    const currentTime = getCurrentDateTime();
    const billNumber = saleData.billNumber;
    
    let receiptHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h3>${storeName}</h3>
                <p>Store ID: ${storeId}</p>
                <p>Bill Number: ${billNumber}</p>
                <p>Sale ID: ${saleId}</p>
                <p>Time: ${currentTime}</p>
                <p>Cashier: ${cashierName}</p>
                <p>Shift: ${saleData.cashierShift || cashierShift}</p>
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
    
    saleData.items.forEach(item => {
        // 显示免费商品标签
        const freeLabel = item.isFree ? ' <span style="color:#3498db;font-weight:bold">(FREE)</span>' : '';
        // 如果是免费商品，小计显示为0
        const itemSubtotal = item.isFree ? 0 : item.subtotal;
        
        receiptHTML += `
            <tr>
                <td>${item.name}${freeLabel}</td>
                <td>RM${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>RM${itemSubtotal.toFixed(2)}</td>
            </tr>
        `;
    });
    
    receiptHTML += `
                    </tbody>
                </table>
            </div>
            <div class="receipt-summary">
                <div class="summary-row">
                    <p>Subtotal:</p>
                    <p>RM${subtotal.toFixed(2)}</p>
                </div>
    `;
    
    // 只有应用了折扣时才显示折扣信息
    if (discountAmount > 0) {
        const discountLabel = discountType === 'percent' ? `Discount (${discountPercent}%):` : 'Discount (Fixed):';
        receiptHTML += `
                <div class="summary-row discount">
                    <p>${discountLabel}</p>
                    <p>-RM${discountAmount.toFixed(2)}</p>
                </div>
        `;
    }
    
    receiptHTML += `
                <div class="summary-row total">
                    <p>Total:</p>
                    <p><strong>RM${totalAmount.toFixed(2)}</strong></p>
                </div>
            </div>
        </div>
    `;
    
    receiptDetails.innerHTML = receiptHTML;
    checkoutSuccessModal.style.display = 'block';
    
    // 重置结账按钮
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = '<i class="material-icons">payment</i> Checkout';
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
    clearCart();
    hideModal(checkoutSuccessModal);
}

// 清空购物车
function clearCart() {
    cart = [];
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
                totalQuantity: 0
            };
        }
        productQuantities[item.id].totalQuantity += item.quantity;
        
        console.log(`Counting item: ${item.name} (ID: ${item.id}), quantity: ${item.quantity}, isFree: ${item.isFree}`);
    });
    
    // 对每个产品进行一次性扣除
    Object.keys(productQuantities).forEach(productId => {
        const product = productQuantities[productId];
        const productPath = `store_products/${storeId}/${productId}`;
        
        // 更新库存数量
        updates[`${productPath}/stock`] = firebase.database.ServerValue.increment(-product.totalQuantity);
        
        console.log(`Reducing stock for ${product.name} by ${product.totalQuantity} units (total from all cart items)`);
    });
    
    // 执行批量更新
    return database.ref().update(updates)
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
            const filteredProducts = filterInventoryProducts(products, category, stockStatus);
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
function filterInventoryProducts(products, category, stockStatus) {
    return Object.entries(products).filter(([_, product]) => {
        // 过滤类别
        if (category !== 'all' && product.category !== category) {
            return false;
        }
        
        // 获取库存，如果不存在则默认为0
        const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        
        // 过滤库存状态
        if (stockStatus === 'low' && stock > 5) {
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
        } else if (stock <= 5) {
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
                    <button class="icon-button update-stock-btn" data-id="${productId}"><i class="material-icons">edit</i></button>
                    <button class="icon-button view-history-btn" data-id="${productId}"><i class="material-icons">history</i></button>
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
    document.getElementById('updateQuantity').value = 1;
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
    const quantity = parseInt(document.getElementById('updateQuantity').value);
    const reasonSelect = document.getElementById('updateReason');
    const reason = reasonSelect.value === 'other' ? document.getElementById('otherReason').value : reasonSelect.options[reasonSelect.selectedIndex].text;
    const notes = document.getElementById('updateNotes').value;
    
    if (!productId || isNaN(quantity) || quantity < 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    // 获取当前库存
    const product = products[productId];
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
    let newStock = currentStock;
    
    // 根据操作计算新库存
    switch (operation) {
        case 'add':
            newStock = currentStock + quantity;
            break;
        case 'subtract':
            newStock = Math.max(0, currentStock - quantity); // 不允许负库存
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
    
    // 更新库存
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
    
    const productId = productIdInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productQuantityInput.value) || 0;
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
    const searchTerm = productSearch ? productSearch.value.trim().toLowerCase() : '';
    
    // 如果有搜索词，先过滤当前显示的产品
    if (searchTerm) {
        const filteredProducts = {};
        
        // 从当前显示的产品中过滤
        Object.entries(products).forEach(([id, product]) => {
            if (product.name.toLowerCase().includes(searchTerm) || 
                product.id.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))) {
                filteredProducts[id] = product;
            }
        });
        
        // 临时替换产品列表并渲染
        const originalProducts = products;
        products = filteredProducts;
        renderProducts();
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
    
    return database.ref(`sales/${storeId}/${saleId}`).update(updatedSale)
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