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
let salesData = {}; // 存储销售记录
let currentSaleId = null; // 当前选中的销售记录
let editingSale = null; // 正在编辑的销售记录
let billNumberCounter = 0; // 账单号计数器
let cashierName = ''; // 收银员姓名
let cashierHistory = []; // 收银员历史记录，用于记录换班情况
let discount = {
    type: 'none', // 'none', 'percentage', 'fixed'
    value: 0,     // 折扣值
    amount: 0     // 折扣金额
};

// DOM元素
const productGrid = document.getElementById('productGrid');
const cartItems = document.getElementById('cartItems');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const categoryFilter = document.getElementById('categoryFilter');
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
const changeCashierBtn = document.getElementById('changeCashierBtn');
const viewCashierHistoryBtn = document.getElementById('viewCashierHistoryBtn');

// 折扣功能相关DOM元素
const discountToggleBtn = document.getElementById('discountToggleBtn');
const discountOptions = document.getElementById('discountOptions');
const discountTypeSelect = document.getElementById('discountType');
const discountValueInput = document.getElementById('discountValue');
const applyDiscountBtn = document.getElementById('applyDiscountBtn');
const removeDiscountBtn = document.getElementById('removeDiscountBtn');
const discountLine = document.getElementById('discountLine');
const discountAmount = document.getElementById('discountAmount');

// 库存管理DOM元素
const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
const inventoryStockFilter = document.getElementById('inventoryStockFilter');
const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const updateStockModal = document.getElementById('updateStockModal');
const updateStockForm = document.getElementById('updateStockForm');
const stockHistoryModal = document.getElementById('stockHistoryModal');
const stockHistoryContent = document.getElementById('stockHistoryContent');

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
    
    // 检查收银员姓名是否已经设置
    cashierName = localStorage.getItem('cashierName');
    if (cashierName) {
        cashierNameDisplay.textContent = cashierName;
    } else {
        // 如果没有设置，显示输入模态框
        showModal(cashierNameModal);
    }
    
    // 初始化事件监听器
    initEventListeners();
    
    // 更新当前时间
    updateDateTime();
    setInterval(updateDateTime, 1000);
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
    getStoreProducts(storeId)
        .then(storeProducts => {
            products = storeProducts;
            
            // 提取所有唯一的类别
            extractCategories();
            
            // 填充类别过滤器
            populateCategoryFilter();
            
            // 渲染产品列表
            renderProducts();
        })
        .catch(error => {
            console.error('Failed to load products:', error);
            alert('Failed to load products. Please refresh the page.');
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

// 根据类别过滤产品
function filterProductsByCategory() {
    currentCategory = categoryFilter.value;
    renderProducts();
}

// 渲染商品列表
function renderProducts() {
    productGrid.innerHTML = '';
    
    if (Object.keys(products).length === 0) {
        productGrid.innerHTML = '<div class="no-products">No products available</div>';
        return;
    }
    
    const filteredProducts = currentCategory === 'all' 
        ? Object.entries(products) 
        : Object.entries(products).filter(([_, product]) => product.category === currentCategory);
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<div class="no-products">No products in this category</div>';
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
    // 商品类别选择
    categoryFilter.addEventListener('change', filterProductsByCategory);
    
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
    
    // 折扣功能相关事件
    if (discountToggleBtn) {
        discountToggleBtn.addEventListener('click', toggleDiscountOptions);
    }
    if (applyDiscountBtn) {
        applyDiscountBtn.addEventListener('click', applyDiscount);
    }
    if (removeDiscountBtn) {
        removeDiscountBtn.addEventListener('click', removeDiscount);
    }
    
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

// 加载销售记录历史
function loadSalesHistory(date) {
    selectedDate = date || getCurrentDate();
    const storeId = localStorage.getItem('store_id');
    
    // 显示加载状态
    salesTableBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    // 从数据库加载销售记录
    getStoreSaleDetails(storeId, selectedDate)
        .then(sales => {
            salesData = sales;
            renderSalesTable(sales);
        })
        .catch(error => {
            console.error('Failed to load sales data:', error);
            salesTableBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales data</td></tr>';
        });
}

// 渲染销售记录表格
function renderSalesTable(sales) {
    salesTableBody.innerHTML = '';
    
    if (Object.keys(sales).length === 0) {
        salesTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">info</i> No sales data available for this date</td></tr>';
        return;
    }
    
    // 按时间排序，最新的在前面
    const sortedSales = Object.keys(sales).sort((a, b) => {
        return sales[b].timestamp.localeCompare(sales[a].timestamp);
    });
    
    sortedSales.forEach(saleId => {
        const sale = sales[saleId];
        const itemCount = sale.items ? sale.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        const cashierName = sale.cashierName || 'N/A';
        
        // 计算折扣信息
        const hasDiscount = sale.discount && sale.discount.amount > 0;
        const discountInfo = hasDiscount ? 
            `${sale.discount.type === 'percentage' ? sale.discount.value + '%' : 'RM' + sale.discount.value.toFixed(2)}` 
            : 'None';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.billNumber || 'N/A'}</td>
            <td>${saleId}</td>
            <td>${sale.timestamp}</td>
            <td>${cashierName}</td>
            <td>${itemCount}</td>
            <td>${hasDiscount ? `<span class="discount-applied">-${discountInfo}</span>` : 'None'}</td>
            <td>RM${sale.total_amount.toFixed(2)}</td>
            <td>
                <button class="view-sale-btn" data-id="${saleId}"><i class="material-icons">visibility</i></button>
                <button class="edit-sale-btn" data-id="${saleId}"><i class="material-icons">edit</i></button>
                <button class="delete-sale-btn" data-id="${saleId}"><i class="material-icons">delete</i></button>
            </td>
        `;
        
        salesTableBody.appendChild(row);
    });
    
    // 添加事件监听器到按钮
    document.querySelectorAll('.view-sale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSaleId = btn.dataset.id;
            showSaleDetail(salesData[currentSaleId], currentSaleId);
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

// 显示销售详情
function showSaleDetail(sale, saleId) {
    if (!sale) return;
    
    // 设置当前销售记录ID
    currentSaleId = saleId;
    
    // 清除旧内容
    saleDetailContent.innerHTML = '';
    
    // 添加销售基本信息
    const saleInfo = document.createElement('div');
    saleInfo.className = 'sale-info';
    saleInfo.innerHTML = `
        <div><strong>Sale ID:</strong> ${saleId}</div>
        <div><strong>Bill Number:</strong> ${sale.billNumber || 'N/A'}</div>
        <div><strong>Date/Time:</strong> ${sale.timestamp}</div>
        <div><strong>Cashier:</strong> ${sale.cashierName || 'N/A'}</div>
    `;
    saleDetailContent.appendChild(saleInfo);
    
    // 添加商品列表
    const itemsTable = document.createElement('table');
    itemsTable.className = 'sale-items-table';
    itemsTable.innerHTML = `
        <thead>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody id="saleItemsList"></tbody>
        <tfoot>
            <tr class="subtotal-row">
                <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                <td>RM${sale.subtotal ? sale.subtotal.toFixed(2) : (sale.total_amount || 0).toFixed(2)}</td>
            </tr>
            ${sale.discount && sale.discount.amount > 0 ? 
                `<tr class="discount-row">
                    <td colspan="3" class="text-right"><strong>Discount (${sale.discount.type === 'percentage' ? 
                        sale.discount.value + '%' : 'RM' + sale.discount.value}):</strong></td>
                    <td>-RM${sale.discount.amount.toFixed(2)}</td>
                </tr>` : ''}
            <tr class="total-row">
                <td colspan="3" class="text-right"><strong>Total:</strong></td>
                <td>RM${sale.total_amount.toFixed(2)}</td>
            </tr>
        </tfoot>
    `;
    saleDetailContent.appendChild(itemsTable);
    
    const itemsList = document.getElementById('saleItemsList');
    if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
            const row = document.createElement('tr');
            const itemTotal = item.total || (item.price * item.quantity);
            row.innerHTML = `
                <td>${item.name}</td>
                <td>RM${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>RM${itemTotal.toFixed(2)}</td>
            `;
            itemsList.appendChild(row);
        });
    } else {
        itemsList.innerHTML = '<tr><td colspan="4" class="no-data">No items found</td></tr>';
    }
    
    // 显示模态框
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
    
    let total = 0;
    
    editingSale.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">RM${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="quantity-btn minus" data-index="${index}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-index="${index}">+</button>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
            <div class="cart-item-total">RM${itemTotal.toFixed(2)}</div>
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
    
    editCartTotal.textContent = `RM${total.toFixed(2)}`;
    editingSale.total_amount = total;
}

// 更新编辑中的项目数量
function updateEditItemQuantity(index, quantity) {
    if (index >= 0 && index < editingSale.items.length) {
        if (quantity <= 0) {
            removeEditItem(index);
        } else {
            editingSale.items[index].quantity = quantity;
            editingSale.items[index].subtotal = editingSale.items[index].price * quantity;
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
    if (!currentSaleId || !editingSale) return;
    
    // 禁用按钮防止重复提交
    updateSaleBtn.disabled = true;
    updateSaleBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Updating...';
    
    // 计算总金额
    const total = editingSale.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    editingSale.total_amount = total;
    
    // 更新数据库
    database.ref(`sales/${currentSaleId}`).update({
        items: editingSale.items,
        total_amount: total
    })
    .then(() => {
        alert('Sale updated successfully!');
        hideModal(editSaleModal);
        loadSalesHistory(selectedDate); // 重新加载销售记录
    })
    .catch(error => {
        console.error('Failed to update sale:', error);
        alert('Failed to update sale. Please try again.');
    })
    .finally(() => {
        updateSaleBtn.disabled = false;
        updateSaleBtn.innerHTML = '<i class="material-icons">save</i> Update Sale';
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
    
    // 从数据库删除销售记录
    database.ref(`sales/${currentSaleId}`).remove()
        .then(() => {
            alert('Sale deleted successfully!');
            hideModal(saleDetailModal);
            loadSalesHistory(selectedDate); // 重新加载销售记录
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
        // 否则添加新项目
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    // 更新购物车显示
    renderCart();
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

// 渲染购物车
function renderCart() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'RM0.00';
        checkoutBtn.disabled = true;
        
        // 清除折扣
        removeDiscount();
        return;
    }
    
    let subtotal = calculateSubtotal();
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">RM${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="quantity-btn minus" data-index="${index}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-index="${index}">+</button>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
            <div class="cart-item-total">RM${itemTotal.toFixed(2)}</div>
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
    
    // 计算折扣后的总额
    const total = subtotal - discount.amount;
    
    cartTotal.textContent = `RM${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// 加载最后一个账单号
function loadLastBillNumber() {
    const userStoreId = localStorage.getItem('store_id');
    
    database.ref(`bill_numbers/${userStoreId}`).once('value')
        .then(snapshot => {
            const data = snapshot.val() || { counter: 0 };
            billNumberCounter = data.counter;
            console.log("Loaded last bill number:", billNumberCounter);
        })
        .catch(error => {
            console.error('Failed to load last bill number:', error);
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
    
    // 增加计数器
    billNumberCounter++;
    
    // 存储最新的计数器值
    database.ref(`bill_numbers/${userStoreId}`).set({
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
function recordCashierShift(newCashierName) {
    const currentTime = getCurrentDateTime();
    cashierHistory.push({
        cashierName: newCashierName,
        startTime: currentTime
    });
    
    // 只保留最近的20条记录
    if (cashierHistory.length > 20) {
        cashierHistory = cashierHistory.slice(-20);
    }
    
    saveCashierHistory();
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
    
    // 生成账单号
    const billNumber = generateBillNumber();
    
    // 准备销售数据
    const subtotal = calculateSubtotal();
    const total = subtotal - discount.amount;
    const saleData = {
        billNumber: billNumber,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
        })),
        subtotal: subtotal,
        discount: {
            type: discount.type,
            value: discount.value,
            amount: discount.amount
        },
        total_amount: total,
        timestamp: getCurrentDateTime(),
        cashierName: cashierName
    };
    
    // 保存销售记录到数据库
    saveSaleToDatabase(saleData)
        .then(saleId => {
            console.log('Sale record saved successfully:', saleId);
            
            // 更新商品库存
            updateProductInventory(cart)
                .then(() => {
                    console.log('Product inventory updated successfully');
                })
                .catch(error => {
                    console.error('Failed to update product inventory:', error);
                });
            
            // 显示收据
            showReceipt(saleData, saleId);
            
            // 清空购物车
            cart = [];
            renderCart();
            
            // 重置结账按钮
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="material-icons">shopping_cart_checkout</i> Checkout';
        })
        .catch(error => {
            console.error('Failed to save sale record:', error);
            alert('Failed to process the sale. Please try again.');
            
            // 重置结账按钮
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="material-icons">shopping_cart_checkout</i> Checkout';
        });
}

// 显示收据
function showReceipt(sale, saleId) {
    // 准备收据内容
    let receiptHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h3>${storeData.name || 'Store'}</h3>
                <p>Bill Number: ${sale.billNumber || 'N/A'}</p>
                <p>Sale ID: ${saleId}</p>
                <p>Time: ${sale.timestamp}</p>
                <p>Cashier: ${sale.cashierName}</p>
            </div>
            <div class="receipt-items">
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // 添加购物车项目
    sale.items.forEach(item => {
        receiptHTML += `
            <tr>
                <td>${item.name}</td>
                <td>RM${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>RM${item.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    // 添加小计和总计信息
    receiptHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="subtotal-row">
                            <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                            <td>RM${sale.subtotal.toFixed(2)}</td>
                        </tr>
    `;
    
    // 如果有折扣，显示折扣信息
    if (sale.discount && sale.discount.amount > 0) {
        const discountText = sale.discount.type === 'percentage' ? 
            `${sale.discount.value}%` : `RM${sale.discount.value.toFixed(2)}`;
        
        receiptHTML += `
                        <tr class="discount-row">
                            <td colspan="3" class="text-right"><strong>Discount (${discountText}):</strong></td>
                            <td>-RM${sale.discount.amount.toFixed(2)}</td>
                        </tr>
        `;
    }
    
    // 添加总计金额
    receiptHTML += `
                        <tr class="total-row">
                            <td colspan="3" class="text-right"><strong>Total:</strong></td>
                            <td>RM${sale.total_amount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="receipt-footer">
                <p>Thank you for your purchase!</p>
                <p>Please come again</p>
            </div>
        </div>
    `;
    
    receiptDetails.innerHTML = receiptHTML;
    showModal(checkoutSuccessModal);
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
    
    // 重置折扣
    removeDiscount();
}

// 更新当前日期时间
function updateDateTime() {
    const now = new Date();
    currentDateTime.textContent = now.toLocaleString('zh-CN');
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
                        <th>Shift Start Time</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (cashierHistory.length === 0) {
        historyHtml += '<tr><td colspan="2" class="no-data">No shift records available</td></tr>';
    } else {
        // 倒序显示，最新的在最上面
        for (let i = cashierHistory.length - 1; i >= 0; i--) {
            const record = cashierHistory[i];
            historyHtml += `
                <tr>
                    <td>${record.cashierName}</td>
                    <td>${record.startTime}</td>
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
    
    // 处理每个购物车商品
    cartItems.forEach(item => {
        // 获取当前商品的引用路径
        const productPath = `store_products/${storeId}/${item.id}`;
        
        // 更新商品库存，减去购物车中的实际数量
        updates[`${productPath}/stock`] = firebase.database.ServerValue.increment(-item.quantity);
        
        console.log(`Reducing stock for ${item.name} by ${item.quantity} units`);
    });
    
    // 执行批量更新
    return database.ref().update(updates)
        .then(() => {
            console.log('Product inventory updated successfully');
            // 重新加载产品数据以更新显示
            return loadProducts(storeId);
        });
}

// 处理收银员姓名表单提交
function handleCashierNameSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('cashierName');
    const newCashierName = nameInput.value.trim();
    
    if (newCashierName) {
        // 记录收银员换班
        recordCashierShift(newCashierName);
        
        // 更新当前收银员
        cashierName = newCashierName;
        cashierNameDisplay.textContent = cashierName;
        
        // 保存到本地存储
        localStorage.setItem('cashierName', cashierName);
        
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
                <button class="update-stock-btn" data-id="${productId}"><i class="material-icons">edit</i></button>
                <button class="view-history-btn" data-id="${productId}"><i class="material-icons">history</i></button>
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

// 显示/隐藏折扣选项
function toggleDiscountOptions() {
    if (discountOptions.style.display === 'none' || discountOptions.style.display === '') {
        discountOptions.style.display = 'block';
        discountToggleBtn.innerHTML = '<i class="material-icons">remove</i> Hide Discount';
    } else {
        discountOptions.style.display = 'none';
        discountToggleBtn.innerHTML = '<i class="material-icons">add</i> Add Discount';
    }
}

// 应用折扣
function applyDiscount() {
    const type = discountTypeSelect.value;
    const value = parseFloat(discountValueInput.value);
    
    // 验证输入
    if (isNaN(value) || value <= 0) {
        alert('Please enter a valid discount value greater than 0');
        return;
    }
    
    // 计算购物车总额（不含折扣）
    const subtotal = calculateSubtotal();
    
    // 根据折扣类型计算折扣金额
    let discountValue = 0;
    
    if (type === 'percentage') {
        // 百分比折扣
        if (value > 100) {
            alert('Percentage discount cannot exceed 100%');
            return;
        }
        
        discountValue = (subtotal * value) / 100;
    } else if (type === 'fixed') {
        // 固定金额折扣
        if (value > subtotal) {
            alert('Fixed discount cannot exceed the subtotal');
            return;
        }
        
        discountValue = value;
    }
    
    // 更新折扣对象
    discount = {
        type: type,
        value: value,
        amount: discountValue
    };
    
    // 更新UI
    discountLine.style.display = 'flex';
    discountAmount.textContent = `RM${discountValue.toFixed(2)}`;
    
    // 重新渲染购物车以更新总额
    renderCart();
}

// 移除折扣
function removeDiscount() {
    // 重置折扣对象
    discount = {
        type: 'none',
        value: 0,
        amount: 0
    };
    
    // 更新UI
    discountLine.style.display = 'none';
    discountAmount.textContent = 'RM0.00';
    
    // 重新渲染购物车以更新总额
    renderCart();
    
    // 重置输入字段
    discountTypeSelect.value = 'percentage';
    discountValueInput.value = '';
}

// 计算购物车小计（不含折扣）
function calculateSubtotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 更新小计显示（如果元素存在）
    if (cartSubtotal) {
        cartSubtotal.textContent = `RM${subtotal.toFixed(2)}`;
    }
    
    return subtotal;
}

// 保存销售记录到数据库
function saveSaleToDatabase(saleData) {
    const storeId = localStorage.getItem('store_id');
    const dateString = getFormattedDate(new Date());
    const saleRef = database.ref(`sales/${storeId}/${dateString}`).push();
    
    return saleRef.set(saleData)
        .then(() => {
            console.log('Sale record saved with ID:', saleRef.key);
            return saleRef.key;
        });
} 