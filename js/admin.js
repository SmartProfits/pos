// 添加调试日志
console.log("Admin page script loading");
console.log("Current path:", window.location.pathname);
console.log("Current URL:", window.location.href);

// 定义全局变量
let stores = {}; // 存储店铺数据
let products = {}; // 存储商品数据
let users = {}; // 存储用户数据
let selectedDate = getCurrentDate(); // 默认选择当前日期

// DOM元素
const adminName = document.getElementById('adminName');
const currentDateTime = document.getElementById('currentDateTime');
const viewTitle = document.getElementById('viewTitle');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

// 统计面板DOM元素
const dateFilter = document.getElementById('dateFilter');
const storeFilter = document.getElementById('storeFilter');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');
const statsContainer = document.getElementById('statsContainer');
const saleDetailsBody = document.getElementById('saleDetailsBody');

// 店铺管理DOM元素
const addStoreBtn = document.getElementById('addStoreBtn');
const storesTableBody = document.getElementById('storesTableBody');
const addStoreModal = document.getElementById('addStoreModal');
const addStoreForm = document.getElementById('addStoreForm');

// 商品管理DOM元素
const addProductBtn = document.getElementById('addProductBtn');
const productStoreFilter = document.getElementById('productStoreFilter');
const productsTableBody = document.getElementById('productsTableBody');
const addProductModal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const productStoreId = document.getElementById('productStoreId');

// 用户管理DOM元素
const addUserBtn = document.getElementById('addUserBtn');
const usersTableBody = document.getElementById('usersTableBody');
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');
const userRole = document.getElementById('userRole');
const userStoreContainer = document.getElementById('userStoreContainer');
const userStoreId = document.getElementById('userStoreId');

// 模态框关闭按钮
const closeButtons = document.querySelectorAll('.close');

// 库存管理DOM元素
const inventoryStoreFilter = document.getElementById('inventoryStoreFilter');
const inventoryCategoryFilter = document.getElementById('inventoryCategoryFilter');
const inventoryStockFilter = document.getElementById('inventoryStockFilter');
const refreshInventoryBtn = document.getElementById('refreshInventoryBtn');
const bulkUpdateBtn = document.getElementById('bulkUpdateBtn');
const exportInventoryBtn = document.getElementById('exportInventoryBtn');
const importInventoryBtn = document.getElementById('importInventoryBtn');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const selectAllInventory = document.getElementById('selectAllInventory');
const updateStockModal = document.getElementById('updateStockModal');
const updateStockForm = document.getElementById('updateStockForm');
const bulkUpdateModal = document.getElementById('bulkUpdateModal');
const bulkUpdateForm = document.getElementById('bulkUpdateForm');

// 调试库存DOM元素
console.log("库存DOM元素检查:");
console.log("inventoryStoreFilter:", inventoryStoreFilter);
console.log("inventoryCategoryFilter:", inventoryCategoryFilter);
console.log("inventoryStockFilter:", inventoryStockFilter);
console.log("refreshInventoryBtn:", refreshInventoryBtn);
console.log("bulkUpdateBtn:", bulkUpdateBtn);
console.log("exportInventoryBtn:", exportInventoryBtn);
console.log("importInventoryBtn:", importInventoryBtn);
console.log("inventoryTableBody:", inventoryTableBody);
console.log("selectAllInventory:", selectAllInventory);
console.log("updateStockModal:", updateStockModal);
console.log("updateStockForm:", updateStockForm);
console.log("bulkUpdateModal:", bulkUpdateModal);
console.log("bulkUpdateForm:", bulkUpdateForm);

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM加载完成，初始化...");
    // 初始化Firebase
    initializeFirebase();
    
    // 检查用户登录状态
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // 已登录
            // 检查用户是否是管理员
            checkAdminStatus(user.uid)
                .then(isAdmin => {
                    if (isAdmin) {
                        console.log("管理员用户已登录:", user.email);
                        document.getElementById('adminName').textContent = `Admin: ${user.email}`;
                        
                        // 加载数据
                        init();
                    } else {
                        // 不是管理员，重定向到POS页面
                        window.location.href = 'pages/pos.html';
                    }
                });
        } else {
            // 未登录，重定向到登录页面
            window.location.href = 'index.html';
        }
    });
});

// 初始化事件监听器
function initEventListeners() {
    // 导航菜单切换视图
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;
            switchView(targetView);
        });
    });
    
    // 刷新统计按钮
    refreshStatsBtn.addEventListener('click', loadStats);
    
    // 日期过滤器变化
    dateFilter.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        loadStats();
    });
    
    // 店铺过滤器变化
    storeFilter.addEventListener('change', loadStats);
    
    // 添加店铺按钮
    addStoreBtn.addEventListener('click', () => showModal(addStoreModal));
    
    // 添加商品按钮
    addProductBtn.addEventListener('click', () => showModal(addProductModal));
    
    // 商品店铺过滤器变化
    productStoreFilter.addEventListener('change', loadProducts);
    
    // 添加用户按钮
    addUserBtn.addEventListener('click', () => showModal(addUserModal));
    
    // 用户角色变化
    userRole.addEventListener('change', toggleStoreSelection);
    
    // 添加店铺表单提交
    addStoreForm.addEventListener('submit', handleAddStore);
    
    // 添加商品表单提交
    addProductForm.addEventListener('submit', handleAddProduct);
    
    // 添加用户表单提交
    addUserForm.addEventListener('submit', handleAddUser);
    
    // 关闭模态框按钮
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            hideModal(modal);
        });
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', event => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });
    
    // 库存管理相关事件监听
    inventoryStoreFilter.addEventListener('change', loadInventory);
    inventoryCategoryFilter.addEventListener('change', loadInventory);
    inventoryStockFilter.addEventListener('change', loadInventory);
    refreshInventoryBtn.addEventListener('click', loadInventory);
    bulkUpdateBtn.addEventListener('click', showBulkUpdateModal);
    exportInventoryBtn.addEventListener('click', exportInventory);
    importInventoryBtn.addEventListener('click', () => alert('Import functionality will be implemented soon'));
    selectAllInventory.addEventListener('change', toggleSelectAllInventory);
    
    // 更新库存表单提交
    updateStockForm.addEventListener('submit', handleUpdateStock);
    
    // 批量更新库存表单提交
    bulkUpdateForm.addEventListener('submit', handleBulkUpdateStock);
    
    // 其他原因字段显示/隐藏
    document.getElementById('updateReason').addEventListener('change', toggleOtherReason);
    document.getElementById('bulkUpdateReason').addEventListener('change', toggleBulkOtherReason);
}

// 切换视图
function switchView(viewName) {
    console.log("Switching to view:", viewName);
    
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
        case 'dashboard':
            viewTitle.textContent = 'Sales Dashboard';
            break;
        case 'stores':
            viewTitle.textContent = 'Store Management';
            break;
        case 'products':
            viewTitle.textContent = 'Product Management';
            break;
        case 'inventory':
            viewTitle.textContent = 'Inventory Management';
            // 确保库存视图的下拉菜单正确填充
            console.log("当前店铺数据:", stores);
            console.log("当前店铺选择器:", inventoryStoreFilter);
            if (inventoryStoreFilter && Object.keys(stores).length > 0) {
                // 重新填充库存管理的店铺下拉菜单
                while (inventoryStoreFilter.options.length > 1) {
                    inventoryStoreFilter.remove(1);
                }
                
                Object.keys(stores).forEach(storeId => {
                    const option = document.createElement('option');
                    option.value = storeId;
                    option.textContent = stores[storeId].name;
                    inventoryStoreFilter.appendChild(option);
                    console.log("添加店铺选项:", storeId, stores[storeId].name);
                });
            }
            break;
        case 'users':
            viewTitle.textContent = 'User Management';
            break;
    }
    
    // 显示对应的视图
    views.forEach(view => {
        if (view.id === `${viewName}View`) {
            view.classList.add('active');
            
            // 根据视图加载相应数据
            if (viewName === 'dashboard') {
                loadStats();
            } else if (viewName === 'stores') {
                loadStores();
            } else if (viewName === 'products') {
                loadProducts();
            } else if (viewName === 'inventory') {
                // 再次检查并确保下拉菜单已填充
                if (inventoryStoreFilter && inventoryStoreFilter.options.length <= 1) {
                    populateStoreDropdowns();
                }
                loadInventory();
            } else if (viewName === 'users') {
                loadUsers();
            }
        } else {
            view.classList.remove('active');
        }
    });
}

// 显示模态框
function showModal(modal) {
    modal.style.display = 'block';
    // 重置表单
    const form = modal.querySelector('form');
    if (form) form.reset();
}

// 隐藏模态框
function hideModal(modal) {
    modal.style.display = 'none';
}

// 切换用户角色时显示或隐藏店铺选择
function toggleStoreSelection() {
    if (userRole.value === 'admin') {
        userStoreContainer.style.display = 'none';
        userStoreId.required = false;
    } else {
        userStoreContainer.style.display = 'block';
        userStoreId.required = true;
    }
}

// 加载所有店铺
function loadStores() {
    getAllStores()
        .then(storeData => {
            stores = storeData;
            renderStores();
            populateStoreDropdowns();
        })
        .catch(error => {
            console.error('Failed to load stores:', error);
            alert('Failed to load stores. Please refresh the page and try again.');
        });
}

// 渲染店铺列表
function renderStores() {
    storesTableBody.innerHTML = '';
    
    if (Object.keys(stores).length === 0) {
        storesTableBody.innerHTML = '<tr><td colspan="4" class="no-data">No store data available</td></tr>';
        return;
    }
    
    Object.keys(stores).forEach(storeId => {
        const store = stores[storeId];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${storeId}</td>
            <td>${store.name}</td>
            <td>${store.address || '-'}</td>
            <td>
                <button class="edit-btn" data-id="${storeId}">Edit</button>
                <button class="delete-btn" data-id="${storeId}">Delete</button>
            </td>
        `;
        
        storesTableBody.appendChild(row);
    });
    
    // 添加事件监听器到按钮
    document.querySelectorAll('#storesTableBody .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editStore(btn.dataset.id));
    });
    
    document.querySelectorAll('#storesTableBody .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteStore(btn.dataset.id));
    });
}

// 填充店铺下拉菜单
能function populateStoreDropdowns() {
    // 清空并重新填充店铺过滤器
    const dropdowns = [storeFilter, productStoreFilter, productStoreId, userStoreId, inventoryStoreFilter];
    
    dropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        // 保存当前选择的值
        const selectedValue = dropdown.value;
        
        // 清空除了第一个选项外的所有选项
        while (dropdown.options.length > 1) {
            dropdown.remove(1);
        }
        
        // 添加店铺选项
        Object.keys(stores).forEach(storeId => {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = stores[storeId].name;
            dropdown.appendChild(option);
        });
        
        // 恢复之前选择的值
        if (selectedValue && selectedValue !== 'all') {
            dropdown.value = selectedValue;
        }
    });
    
    console.log("已填充所有下拉菜单，包括库存管理的下拉菜单");
}

// 加载销售统计数据
function loadStats() {
    const date = dateFilter.value || selectedDate;
    const storeId = storeFilter.value;
    
    // 显示加载状态
    statsContainer.innerHTML = '<div class="loading"><i class="material-icons">hourglass_empty</i> Loading...</div>';
    saleDetailsBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    if (storeId === 'all') {
        // 加载所有店铺的统计数据
        getAllStoresDailySales(date)
            .then(salesData => {
                renderStats(salesData, true);
                // 加载销售详情
                loadAllStoresSaleDetails(date);
            })
            .catch(error => {
                console.error('Failed to load statistics data:', error);
                statsContainer.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load statistics data</div>';
                saleDetailsBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
            });
    } else {
        // 加载特定店铺的统计数据
        getStoreDailySales(storeId, date)
            .then(salesData => {
                // 创建与getAllStoresDailySales相同格式的数据结构
                const formattedData = {};
                formattedData[storeId] = salesData;
                console.log("Single store data formatted:", formattedData);
                renderStats(formattedData, false);
                // 加载销售详情
                loadStoreSaleDetails(storeId, date);
            })
            .catch(error => {
                console.error('Failed to load statistics data:', error);
                statsContainer.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load statistics data</div>';
                saleDetailsBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
            });
    }
}

// 渲染统计数据
function renderStats(salesData, isAllStores) {
    statsContainer.innerHTML = '';
    console.log("Rendering stats with data:", salesData);
    
    if (!salesData || Object.keys(salesData).length === 0) {
        statsContainer.innerHTML = '<div class="no-data"><i class="material-icons">info</i> No sales data available</div>';
        return;
    }
    
    // 计算总销售额和总交易数
    let totalSales = 0;
    let totalTransactions = 0;
    
    Object.keys(salesData).forEach(storeId => {
        const storeData = salesData[storeId];
        if (storeData) {
            // 确保数值正确转换
            totalSales += parseFloat(storeData.total_sales) || 0;
            totalTransactions += parseInt(storeData.transaction_count) || 0;
        }
    });
    
    console.log("Total sales calculated:", totalSales, "from data:", salesData);
    
    // 创建总销售额统计卡片
    const totalSalesCard = document.createElement('div');
    totalSalesCard.className = 'stat-card';
    totalSalesCard.innerHTML = `
        <h3>Total Sales</h3>
        <div class="stat-value">RM${totalSales.toFixed(2)}</div>
    `;
    statsContainer.appendChild(totalSalesCard);
    
    // 创建总交易数统计卡片
    const totalTransactionsCard = document.createElement('div');
    totalTransactionsCard.className = 'stat-card';
    totalTransactionsCard.innerHTML = `
        <h3>Total Transactions</h3>
        <div class="stat-value">${totalTransactions}</div>
    `;
    statsContainer.appendChild(totalTransactionsCard);
    
    // 如果是查看所有店铺，还显示各店铺的销售额
    if (isAllStores) {
        Object.keys(salesData).forEach(storeId => {
            const storeData = salesData[storeId];
            if (storeData) {
                const storeName = stores[storeId]?.name || `Store ${storeId}`;
                
                const storeCard = document.createElement('div');
                storeCard.className = 'stat-card';
                storeCard.innerHTML = `
                    <h3>${storeName}</h3>
                    <div class="stat-value">RM${(parseFloat(storeData.total_sales) || 0).toFixed(2)}</div>
                    <div class="stat-subtitle">Transactions: ${parseInt(storeData.transaction_count) || 0}</div>
                `;
                statsContainer.appendChild(storeCard);
            }
        });
    }
}

// 加载所有店铺的销售详情
function loadAllStoresSaleDetails(date) {
    // 获取所有销售记录
    database.ref('sales').orderByChild('date').equalTo(date).once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            renderSaleDetails(sales);
        })
        .catch(error => {
            console.error('Failed to load sales details:', error);
            saleDetailsBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
        });
}

// 加载特定店铺的销售详情
function loadStoreSaleDetails(storeId, date) {
    getStoreSaleDetails(storeId, date)
        .then(sales => {
            renderSaleDetails(sales);
        })
        .catch(error => {
            console.error('Failed to load sales details:', error);
            saleDetailsBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
        });
}

// 渲染销售详情
function renderSaleDetails(sales) {
    saleDetailsBody.innerHTML = '';
    
    if (Object.keys(sales).length === 0) {
        saleDetailsBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">info</i> No sales data available</td></tr>';
        return;
    }
    
    // 按时间排序，最新的在前面
    const sortedSales = Object.keys(sales).sort((a, b) => {
        return sales[b].timestamp.localeCompare(sales[a].timestamp);
    });
    
    sortedSales.forEach(saleId => {
        const sale = sales[saleId];
        const storeName = stores[sale.store_id]?.name || sale.store_id;
        const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        const cashierName = sale.cashierName || 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.billNumber || 'N/A'}</td>
            <td>${storeName}</td>
            <td>${sale.timestamp}</td>
            <td>${cashierName}</td>
            <td>${itemCount}</td>
            <td>RM${sale.total_amount.toFixed(2)}</td>
            <td><button class="view-details-btn" data-id="${saleId}">View</button></td>
        `;
        
        saleDetailsBody.appendChild(row);
    });
    
    // 添加查看详情按钮事件
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const saleId = btn.dataset.id;
            showSaleDetails(sales[saleId]);
        });
    });
}

// 显示销售详情模态框
function showSaleDetails(sale) {
    const saleDetailModal = document.getElementById('saleDetailModal');
    const saleDetailContent = document.getElementById('saleDetailContent');
    
    const storeName = stores[sale.store_id]?.name || sale.store_id;
    const cashierName = sale.cashierName || 'N/A';
    
    let detailsHTML = `
        <div class="sale-detail-header">
            <p><strong>Bill Number:</strong> ${sale.billNumber || 'N/A'}</p>
            <p><strong>Store:</strong> ${storeName}</p>
            <p><strong>Time:</strong> ${sale.timestamp}</p>
            <p><strong>Cashier:</strong> ${cashierName}</p>
            ${sale.shiftInfo ? `<p><strong>Shift started at:</strong> ${sale.shiftInfo.shiftTime || 'N/A'}</p>` : ''}
            <p><strong>Total Amount:</strong> RM${sale.total_amount.toFixed(2)}</p>
        </div>
        <table class="sale-detail-table">
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
    `;
    
    saleDetailContent.innerHTML = detailsHTML;
    showModal(saleDetailModal);
}

// 处理添加店铺表单提交
function handleAddStore(e) {
    e.preventDefault();
    
    const storeIdInput = document.getElementById('storeId');
    const storeNameInput = document.getElementById('storeName');
    const storeAddressInput = document.getElementById('storeAddress');
    
    const storeId = storeIdInput.value.trim();
    const name = storeNameInput.value.trim();
    const address = storeAddressInput.value.trim();
    
    if (!storeId || !name) {
        alert('Please fill in store ID and name');
        return;
    }
    
    // 检查店铺ID是否已存在
    if (stores[storeId]) {
        alert('Store ID already exists');
        return;
    }
    
    // 添加店铺到数据库
    addStore(storeId, name, address)
        .then(() => {
            hideModal(addStoreModal);
            loadStores();
            alert('Store added successfully!');
        })
        .catch(error => {
            console.error('Failed to add store:', error);
            alert('Failed to add store. Please try again.');
        });
}

// 编辑店铺
function editStore(storeId) {
    // 此处简化为提示，实际应该显示编辑模态框
    alert(`Edit store ${storeId} functionality has not been implemented yet`);
}

// 删除店铺
function deleteStore(storeId) {
    if (!confirm(`Are you sure you want to delete store ${storeId}?`)) {
        return;
    }
    
    // 删除数据库中的店铺
    removeStore(storeId)
        .then(() => {
            loadStores();
            alert('Store deleted successfully!');
        })
        .catch(error => {
            console.error('Failed to delete store:', error);
            alert('Failed to delete store. Please try again.');
        });
}

// 加载商品
function loadProducts() {
    const storeId = productStoreFilter.value;
    
    // 显示加载状态
    productsTableBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    if (storeId === 'all') {
        // 加载所有商品
        getAllProducts()
            .then(productData => {
                products = productData;
                renderProducts();
            })
            .catch(error => {
                console.error('Failed to load products:', error);
                productsTableBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load products</td></tr>';
            });
    } else {
        // 加载特定店铺的商品
        getStoreProducts(storeId)
            .then(productData => {
                products = productData;
                renderProducts();
            })
            .catch(error => {
                console.error('Failed to load products:', error);
                productsTableBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load products</td></tr>';
            });
    }
}

// 渲染商品列表
function renderProducts() {
    productsTableBody.innerHTML = '';
    
    if (Object.keys(products).length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">info</i> No product data available</td></tr>';
        return;
    }
    
    Object.keys(products).forEach(productId => {
        const product = products[productId];
        const storeName = stores[product.store_id]?.name || product.store_id;
        // 使用stock值，如果不存在则使用quantity，确保兼容旧数据
        const stockDisplay = product.stock !== undefined ? product.stock : (product.quantity || 0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${productId}</td>
            <td>${product.name}</td>
            <td>RM${product.price.toFixed(2)}</td>
            <td>${stockDisplay}</td>
            <td>${product.category || '-'}</td>
            <td>${storeName}</td>
            <td>
                <button class="edit-btn" data-id="${productId}">Edit</button>
                <button class="delete-btn" data-id="${productId}">Delete</button>
            </td>
        `;
        
        productsTableBody.appendChild(row);
    });
    
    // 添加事件监听器到按钮
    document.querySelectorAll('#productsTableBody .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editProduct(btn.dataset.id));
    });
    
    document.querySelectorAll('#productsTableBody .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
    });
}

// 处理添加商品表单提交
function handleAddProduct(e) {
    e.preventDefault();
    
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productQuantityInput = document.getElementById('productQuantity');
    const productCategoryInput = document.getElementById('productCategory');
    const productStoreIdInput = document.getElementById('productStoreId');
    
    const productId = productIdInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseInt(productQuantityInput.value) || 0; // 更名为stock
    const category = productCategoryInput.value.trim();
    const storeId = productStoreIdInput.value;
    
    if (!productId || !name || isNaN(price) || !storeId) {
        alert('Please fill in all required fields');
        return;
    }
    
    // 添加商品到数据库
    addProduct(productId, name, price, stock, category, storeId)
        .then(() => {
            hideModal(addProductModal);
            loadProducts();
            alert('Product added successfully!');
        })
        .catch(error => {
            console.error('Failed to add product:', error);
            alert('Failed to add product. Please try again.');
        });
}

// 编辑商品
function editProduct(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 创建编辑模态框
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editProductModal';
    
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2><i class="material-icons">edit</i> Edit Product</h2>
            <form id="editProductForm">
                <div class="form-group">
                    <label for="editProductId"><i class="material-icons">tag</i> Product ID:</label>
                    <input type="text" id="editProductId" value="${productId}" readonly>
                </div>
                <div class="form-group">
                    <label for="editProductName"><i class="material-icons">inventory</i> Product Name:</label>
                    <input type="text" id="editProductName" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label for="editProductPrice"><i class="material-icons">attach_money</i> Price:</label>
                    <input type="number" id="editProductPrice" value="${product.price}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="editProductStock"><i class="material-icons">inventory_2</i> Stock:</label>
                    <input type="number" id="editProductStock" value="${product.stock !== undefined ? product.stock : (product.quantity || 0)}" min="0" required>
                </div>
                <div class="form-group">
                    <label for="editProductCategory"><i class="material-icons">category</i> Category:</label>
                    <input type="text" id="editProductCategory" value="${product.category || ''}">
                </div>
                <div class="form-group">
                    <label for="editProductStoreId"><i class="material-icons">store</i> Store:</label>
                    <select id="editProductStoreId" required>
                        ${Object.keys(stores).map(id => `<option value="${id}" ${id === product.store_id ? 'selected' : ''}>${stores[id].name}</option>`).join('')}
                    </select>
                </div>
                <button type="submit"><i class="material-icons">save</i> Update</button>
            </form>
        </div>
    `;
    
    // 添加到DOM
    document.body.appendChild(editModal);
    
    // 显示模态框
    showModal(editModal);
    
    // 添加关闭按钮事件
    const closeBtn = editModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        hideModal(editModal);
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(editModal);
        }, 300);
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', event => {
        if (event.target === editModal) {
            hideModal(editModal);
            // 移除模态框
            setTimeout(() => {
                document.body.removeChild(editModal);
            }, 300);
        }
    });
    
    // 处理表单提交
    const editForm = document.getElementById('editProductForm');
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('editProductName').value.trim();
        const newPrice = parseFloat(document.getElementById('editProductPrice').value);
        const newStock = parseInt(document.getElementById('editProductStock').value) || 0;
        const newCategory = document.getElementById('editProductCategory').value.trim();
        const newStoreId = document.getElementById('editProductStoreId').value;
        
        if (!newName || isNaN(newPrice) || !newStoreId) {
            alert('Please fill in all required fields');
            return;
        }
        
        // 更新商品
        updateProduct(productId, newName, newPrice, newStock, newCategory, newStoreId, product.store_id)
            .then(() => {
                hideModal(editModal);
                // 移除模态框
                setTimeout(() => {
                    document.body.removeChild(editModal);
                }, 300);
                loadProducts();
                alert('Product updated successfully!');
            })
            .catch(error => {
                console.error('Failed to update product:', error);
                alert('Failed to update product. Please try again.');
            });
    });
}

// 更新商品
function updateProduct(productId, name, price, stock, category, newStoreId, oldStoreId) {
    const productData = {
        name,
        price,
        quantity: stock,
        category: category || '',
        store_id: newStoreId,
        stock: stock // 确保更新stock字段
    };
    
    // 如果店铺改变，需要删除旧店铺中的商品并在新店铺中添加
    if (newStoreId !== oldStoreId) {
        return database.ref(`store_products/${oldStoreId}/${productId}`).remove()
            .then(() => database.ref(`store_products/${newStoreId}/${productId}`).set(productData));
    }
    
    // 否则直接更新
    return database.ref(`store_products/${newStoreId}/${productId}`).update(productData);
}

// 删除商品
function deleteProduct(productId) {
    const product = products[productId];
    if (!product) return;
    
    if (!confirm(`Are you sure you want to delete product ${productId}?`)) {
        return;
    }
    
    // 删除数据库中的商品
    removeProduct(productId)
        .then(() => {
            loadProducts();
            alert('Product deleted successfully!');
        })
        .catch(error => {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product. Please try again.');
        });
}

// 加载用户
function loadUsers() {
    getAllUsers()
        .then(userData => {
            users = userData;
            renderUsers();
        })
        .catch(error => {
            console.error('Failed to load users:', error);
            usersTableBody.innerHTML = '<tr><td colspan="5" class="error"><i class="material-icons">error</i> Failed to load users</td></tr>';
        });
}

// 渲染用户列表
function renderUsers() {
    usersTableBody.innerHTML = '';
    
    if (Object.keys(users).length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="material-icons">info</i> No user data available</td></tr>';
        return;
    }
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        const storeName = user.store_id ? (stores[user.store_id]?.name || user.store_id) : '-';
        const roleName = user.role === 'admin' ? 'Admin' : 'Staff';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${userId}</td>
            <td>${user.email}</td>
            <td>${roleName}</td>
            <td>${storeName}</td>
            <td>
                <button class="reset-pwd-btn" data-id="${userId}">Reset Password</button>
                <button class="delete-btn" data-id="${userId}">Delete</button>
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
    
    // 添加事件监听器到按钮
    document.querySelectorAll('#usersTableBody .reset-pwd-btn').forEach(btn => {
        btn.addEventListener('click', () => resetUserPassword(btn.dataset.id));
    });
    
    document.querySelectorAll('#usersTableBody .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteUser(btn.dataset.id));
    });
}

// 处理添加用户表单提交
function handleAddUser(e) {
    e.preventDefault();
    
    const emailInput = document.getElementById('userEmail');
    const passwordInput = document.getElementById('userPassword');
    const roleSelect = document.getElementById('userRole');
    const storeIdSelect = document.getElementById('userStoreId');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const role = roleSelect.value;
    const storeId = role === 'staff' ? storeIdSelect.value : '';
    
    if (!email || !password || !role || (role === 'staff' && !storeId)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // 创建用户
    // 注意：在实际应用中，应该使用 Firebase Admin SDK 或后端API创建用户
    // 此处简化为前端直接创建用户，不推荐在生产环境中使用
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const userId = userCredential.user.uid;
            
            // 保存用户角色和店铺信息
            return database.ref(`users/${userId}`).set({
                email,
                role,
                store_id: storeId
            });
        })
        .then(() => {
            hideModal(addUserModal);
            loadUsers();
            alert('User created successfully!');
        })
        .catch(error => {
            console.error('Failed to create user:', error);
            alert(`Failed to create user: ${error.message}`);
        });
}

// 重置用户密码
function resetUserPassword(userId) {
    const user = users[userId];
    if (!user) return;
    
    const newPassword = prompt(`Please enter a new password for ${user.email}:`);
    if (!newPassword) return;
    
    // 注意：在实际应用中，应该使用 Firebase Admin SDK 或后端API重置密码
    // 此处简化为提示，不推荐在生产环境中使用
    alert(`Reset password functionality needs to be implemented on the backend, this is just a demo.`);
}

// 删除用户
function deleteUser(userId) {
    const user = users[userId];
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) {
        return;
    }
    
    // 注意：在实际应用中，应该使用 Firebase Admin SDK 或后端API删除用户
    // 此处简化为只删除数据库中的用户记录，不删除Auth中的用户
    database.ref(`users/${userId}`).remove()
        .then(() => {
            loadUsers();
            alert('User deleted successfully!');
        })
        .catch(error => {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user. Please try again.');
        });
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

// 数据库操作函数
// 添加商店
function addStore(storeId, name, address) {
    return database.ref(`stores/${storeId}`).set({
        name,
        address
    });
}

// 删除商店
function removeStore(storeId) {
    return database.ref(`stores/${storeId}`).remove();
}

// 获取所有商店
function getAllStores() {
    return database.ref('stores').once('value')
        .then(snapshot => snapshot.val() || {});
}

// 添加商品
function addProduct(productId, name, price, quantity, category, storeId) {
    const productData = {
        name,
        price,
        quantity: quantity || 0,
        category: category || '',
        store_id: storeId,
        stock: quantity || 0 // 添加stock字段，与POS页面保持一致
    };
    return database.ref(`store_products/${storeId}/${productId}`).set(productData);
}

// 删除商品
function removeProduct(productId) {
    const product = products[productId];
    if (!product) return Promise.reject(new Error('Product not found'));
    return database.ref(`store_products/${product.store_id}/${productId}`).remove();
}

// 获取所有商品
function getAllProducts() {
    return database.ref('store_products').once('value')
        .then(snapshot => {
            const storeProducts = snapshot.val() || {};
            let allProducts = {};
            
            // 合并所有店铺的商品，并添加store_id到每个产品
            Object.entries(storeProducts).forEach(([storeId, storeProductList]) => {
                if (storeProductList) {
                    Object.entries(storeProductList).forEach(([productId, product]) => {
                        allProducts[productId] = {
                            ...product,
                            store_id: storeId
                        };
                    });
                }
            });
            
            return allProducts;
        });
}

// 获取特定店铺的商品
function getStoreProducts(storeId) {
    return database.ref(`store_products/${storeId}`).once('value')
        .then(snapshot => {
            const products = snapshot.val() || {};
            
            // 添加store_id到每个产品
            Object.keys(products).forEach(productId => {
                products[productId].store_id = storeId;
            });
            
            return products;
        });
}

// 获取所有用户
function getAllUsers() {
    return database.ref('users').once('value')
        .then(snapshot => snapshot.val() || {});
}

// 辅助函数：获取当前日期字符串 (yyyy-mm-dd)
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// 获取特定店铺的特定日期销售统计
function getStoreDailySales(storeId, date) {
    console.log(`Getting daily sales for store ${storeId} on date ${date}`);
    
    // 先尝试从sales_stats表获取
    return database.ref(`sales_stats/${storeId}/${date}`).once('value')
        .then(snapshot => {
            const statsData = snapshot.val();
            console.log("Retrieved stats data:", statsData);
            
            // 如果有数据，直接返回
            if (statsData && (statsData.total_sales > 0 || statsData.transaction_count > 0)) {
                return statsData;
            }
            
            // 否则从sales表计算
            console.log("No stats data found, calculating from sales");
            return loadStoreSalesFromTransactions(storeId, date);
        });
}

// 从transactions表计算特定店铺的销售统计
function loadStoreSalesFromTransactions(storeId, date) {
    return database.ref('sales')
        .orderByChild('store_id')
        .equalTo(storeId)
        .once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            let totalSales = 0;
            let transactionCount = 0;
            
            Object.keys(sales).forEach(saleId => {
                const sale = sales[saleId];
                if (sale.date === date) {
                    totalSales += parseFloat(sale.total_amount) || 0;
                    transactionCount++;
                }
            });
            
            console.log(`Calculated from transactions: store ${storeId}, date ${date}, total: ${totalSales}, count: ${transactionCount}`);
            
            return {
                total_sales: totalSales,
                transaction_count: transactionCount
            };
        });
}

// 获取所有店铺的特定日期销售统计
function getAllStoresDailySales(date) {
    return database.ref('sales_stats').once('value')
        .then(snapshot => {
            const allStoresStats = snapshot.val() || {};
            const result = {};
            
            Object.keys(allStoresStats).forEach(storeId => {
                const storeStats = allStoresStats[storeId] || {};
                result[storeId] = storeStats[date] || { total_sales: 0, transaction_count: 0 };
            });
            
            // 如果没有销售数据，尝试直接从sales表计算
            if (Object.keys(result).length === 0) {
                return loadSalesFromTransactions(date);
            }
            
            return result;
        });
}

// 从transactions表直接计算销售统计数据
function loadSalesFromTransactions(date) {
    return database.ref('sales').orderByChild('date').equalTo(date).once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            const result = {};
            
            // 按店铺分组并计算统计数据
            Object.keys(sales).forEach(saleId => {
                const sale = sales[saleId];
                const storeId = sale.store_id;
                
                if (!result[storeId]) {
                    result[storeId] = {
                        total_sales: 0,
                        transaction_count: 0
                    };
                }
                
                result[storeId].total_sales += parseFloat(sale.total_amount) || 0;
                result[storeId].transaction_count += 1;
            });
            
            return result;
        });
}

// 获取特定店铺的特定日期销售详情
function getStoreSaleDetails(storeId, date) {
    return database.ref('sales')
        .orderByChild('store_id')
        .equalTo(storeId)
        .once('value')
        .then(snapshot => {
            const allSales = snapshot.val() || {};
            const filteredSales = {};
            
            Object.keys(allSales).forEach(saleId => {
                const sale = allSales[saleId];
                if (sale.date === date) {
                    filteredSales[saleId] = sale;
                }
            });
            
            return filteredSales;
        });
}

// 加载库存数据
function loadInventory() {
    const storeId = inventoryStoreFilter.value;
    const category = inventoryCategoryFilter.value;
    const stockStatus = inventoryStockFilter.value;
    
    // 显示加载状态
    inventoryTableBody.innerHTML = '<tr><td colspan="9" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    // 加载产品数据
    loadProductsForInventory(storeId)
        .then(productsData => {
            // 过滤产品
            const filteredProducts = filterInventoryProducts(productsData, category, stockStatus);
            renderInventory(filteredProducts);
            populateInventoryCategories(productsData);
        })
        .catch(error => {
            console.error('Failed to load inventory:', error);
            inventoryTableBody.innerHTML = '<tr><td colspan="9" class="error"><i class="material-icons">error</i> Failed to load inventory data</td></tr>';
        });
}

// 加载用于库存管理的产品数据
function loadProductsForInventory(storeId) {
    if (storeId === 'all') {
        return getAllProducts();
    } else {
        return getStoreProducts(storeId);
    }
}

// 填充库存类别过滤器
function populateInventoryCategories(products) {
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
        inventoryTableBody.innerHTML = '<tr><td colspan="9" class="no-data"><i class="material-icons">info</i> No inventory data available</td></tr>';
        return;
    }
    
    productsEntries.forEach(([productId, product]) => {
        const storeName = stores[product.store_id]?.name || product.store_id;
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
            <td><input type="checkbox" class="inventory-select" data-id="${productId}"></td>
            <td>${productId}</td>
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>RM${product.price.toFixed(2)}</td>
            <td>${stock}</td>
            <td><span class="stock-status ${statusClass}">${statusText}</span></td>
            <td>${storeName}</td>
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
        case 'set':
            newStock = Math.max(0, quantity); // 不允许负库存
            break;
    }
    
    // 更新库存记录
    updateProductStock(productId, newStock, operation, quantity, reason, notes)
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

// 切换批量更新其他原因输入框的显示
function toggleBulkOtherReason() {
    const reasonSelect = document.getElementById('bulkUpdateReason');
    const otherReasonContainer = document.getElementById('bulkOtherReasonContainer');
    
    if (reasonSelect.value === 'other') {
        otherReasonContainer.style.display = 'block';
    } else {
        otherReasonContainer.style.display = 'none';
    }
}

// 更新产品库存
function updateProductStock(productId, newStock, operation, quantity, reason, notes) {
    const product = products[productId];
    if (!product) return Promise.reject(new Error('Product not found'));
    
    // 创建更新对象
    const updates = {};
    
    // 更新库存
    updates[`store_products/${product.store_id}/${productId}/stock`] = newStock;
    updates[`store_products/${product.store_id}/${productId}/quantity`] = newStock; // 为了兼容性也更新quantity
    
    // 记录库存变更历史
    const historyEntry = {
        timestamp: getCurrentDateTime(),
        previous_stock: product.stock !== undefined ? product.stock : (product.quantity || 0),
        new_stock: newStock,
        operation,
        quantity,
        reason,
        notes,
        user_id: JSON.parse(localStorage.getItem('user') || '{}').uid || 'unknown'
    };
    
    // 生成唯一ID
    const historyId = database.ref().child(`stock_history/${product.store_id}/${productId}`).push().key;
    updates[`stock_history/${product.store_id}/${productId}/${historyId}`] = historyEntry;
    
    // 执行批量更新
    return database.ref().update(updates);
}

// 显示批量更新模态框
function showBulkUpdateModal() {
    // 获取选中的产品
    const selectedProducts = getSelectedProducts();
    
    if (selectedProducts.length === 0) {
        alert('Please select at least one product');
        return;
    }
    
    // 更新选中产品数量
    document.getElementById('selectedProductsCount').textContent = selectedProducts.length;
    
    // 显示选中产品列表
    const selectedProductsList = document.getElementById('selectedProductsList');
    selectedProductsList.innerHTML = '';
    
    selectedProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'selected-product-item';
        item.innerHTML = `
            <span>${product.name}</span>
            <span>Current Stock: ${product.stock !== undefined ? product.stock : (product.quantity || 0)}</span>
        `;
        selectedProductsList.appendChild(item);
    });
    
    // 重置表单
    document.getElementById('bulkUpdateOperation').value = 'add';
    document.getElementById('bulkUpdateQuantity').value = 1;
    document.getElementById('bulkUpdateReason').value = 'new_stock';
    document.getElementById('bulkOtherReason').value = '';
    document.getElementById('bulkOtherReasonContainer').style.display = 'none';
    document.getElementById('bulkUpdateNotes').value = '';
    
    // 显示模态框
    showModal(bulkUpdateModal);
}

// 获取选中的产品
function getSelectedProducts() {
    const selectedProducts = [];
    
    document.querySelectorAll('.inventory-select:checked').forEach(checkbox => {
        const productId = checkbox.dataset.id;
        const product = products[productId];
        
        if (product) {
            selectedProducts.push({
                id: productId,
                ...product
            });
        }
    });
    
    return selectedProducts;
}

// 切换全选/取消全选
function toggleSelectAllInventory() {
    if (!selectAllInventory) return;
    
    const isChecked = selectAllInventory.checked;
    console.log("全选/取消全选库存项:", isChecked);
    
    document.querySelectorAll('.inventory-select').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// 处理批量更新库存表单提交
function handleBulkUpdateStock(e) {
    e.preventDefault();
    
    const operation = document.getElementById('bulkUpdateOperation').value;
    const quantityValue = parseFloat(document.getElementById('bulkUpdateQuantity').value);
    const reasonSelect = document.getElementById('bulkUpdateReason');
    const reason = reasonSelect.value === 'other' ? document.getElementById('bulkOtherReason').value : reasonSelect.options[reasonSelect.selectedIndex].text;
    const notes = document.getElementById('bulkUpdateNotes').value;
    
    if (isNaN(quantityValue) || quantityValue <= 0) {
        alert('Please enter a valid quantity/percentage');
        return;
    }
    
    // 获取选中的产品
    const selectedProducts = getSelectedProducts();
    
    if (selectedProducts.length === 0) {
        alert('No products selected');
        return;
    }
    
    // 批量更新库存
    bulkUpdateProductStock(selectedProducts, operation, quantityValue, reason, notes)
        .then(() => {
            hideModal(bulkUpdateModal);
            loadInventory(); // 重新加载库存
            alert('Stock updated successfully!');
        })
        .catch(error => {
            console.error('Failed to update stock:', error);
            alert('Failed to update stock. Please try again.');
        });
}

// 批量更新产品库存
function bulkUpdateProductStock(selectedProducts, operation, quantityValue, reason, notes) {
    // 创建更新对象
    const updates = {};
    const userId = JSON.parse(localStorage.getItem('user') || '{}').uid || 'unknown';
    const timestamp = getCurrentDateTime();
    
    // 处理每个选中的产品
    selectedProducts.forEach(product => {
        const productId = product.id;
        const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        let newStock = currentStock;
        let actualQuantity = quantityValue;
        
        // 根据操作计算新库存
        switch (operation) {
            case 'add':
                newStock = currentStock + quantityValue;
                break;
            case 'subtract':
                newStock = Math.max(0, currentStock - quantityValue);
                actualQuantity = currentStock - newStock; // 实际减少的数量
                break;
            case 'percentage':
                // 百分比调整，正数为增加，负数为减少
                const changeAmount = Math.round(currentStock * (quantityValue / 100));
                newStock = Math.max(0, currentStock + changeAmount);
                actualQuantity = newStock - currentStock; // 实际变化的数量
                break;
        }
        
        // 更新库存
        updates[`store_products/${product.store_id}/${productId}/stock`] = newStock;
        updates[`store_products/${product.store_id}/${productId}/quantity`] = newStock; // 为了兼容性也更新quantity
        
        // 记录库存变更历史
        const historyEntry = {
            timestamp,
            previous_stock: currentStock,
            new_stock: newStock,
            operation: operation === 'percentage' ? 'percentage_adjustment' : operation,
            quantity: actualQuantity,
            reason,
            notes: `${notes} (Bulk update)`,
            user_id: userId
        };
        
        // 生成唯一ID
        const historyId = database.ref().child(`stock_history/${product.store_id}/${productId}`).push().key;
        updates[`stock_history/${product.store_id}/${productId}/${historyId}`] = historyEntry;
    });
    
    // 执行批量更新
    return database.ref().update(updates);
}

// 显示库存历史记录
function showStockHistory(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 创建模态框
    const historyModal = document.createElement('div');
    historyModal.className = 'modal';
    historyModal.id = 'stockHistoryModal';
    
    // 初始内容
    historyModal.innerHTML = `
        <div class="modal-content" style="width: 80%;">
            <span class="close">&times;</span>
            <h2><i class="material-icons">history</i> Stock History: ${product.name}</h2>
            <div class="loading"><i class="material-icons">hourglass_empty</i> Loading history...</div>
        </div>
    `;
    
    // 添加到DOM
    document.body.appendChild(historyModal);
    
    // 显示模态框
    showModal(historyModal);
    
    // 添加关闭按钮事件
    const closeBtn = historyModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        hideModal(historyModal);
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(historyModal);
        }, 300);
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', event => {
        if (event.target === historyModal) {
            hideModal(historyModal);
            // 移除模态框
            setTimeout(() => {
                document.body.removeChild(historyModal);
            }, 300);
        }
    });
    
    // 加载历史数据
    loadStockHistory(product.store_id, productId)
        .then(history => {
            // 更新模态框内容
            const modalContent = historyModal.querySelector('.modal-content');
            
            if (!history || Object.keys(history).length === 0) {
                modalContent.innerHTML = `
                    <span class="close">&times;</span>
                    <h2><i class="material-icons">history</i> Stock History: ${product.name}</h2>
                    <div class="no-data"><i class="material-icons">info</i> No history records available</div>
                `;
            } else {
                // 排序历史记录，最新的在前面
                const sortedHistory = Object.entries(history).sort(([_, a], [__, b]) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                
                let historyHTML = `
                    <span class="close">&times;</span>
                    <h2><i class="material-icons">history</i> Stock History: ${product.name}</h2>
                    <table class="inventory-history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Operation</th>
                                <th>Previous Stock</th>
                                <th>New Stock</th>
                                <th>Quantity</th>
                                <th>Reason</th>
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
                        case 'set':
                            operationText = 'Set Stock';
                            break;
                        case 'percentage_adjustment':
                            operationText = 'Percentage Adjustment';
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
                            <td>${record.notes || '-'}</td>
                        </tr>
                    `;
                });
                
                historyHTML += `
                        </tbody>
                    </table>
                `;
                
                modalContent.innerHTML = historyHTML;
            }
            
            // 重新添加关闭按钮事件
            modalContent.querySelector('.close').addEventListener('click', () => {
                hideModal(historyModal);
                // 移除模态框
                setTimeout(() => {
                    document.body.removeChild(historyModal);
                }, 300);
            });
        })
        .catch(error => {
            console.error('Failed to load stock history:', error);
            historyModal.querySelector('.modal-content').innerHTML = `
                <span class="close">&times;</span>
                <h2><i class="material-icons">history</i> Stock History: ${product.name}</h2>
                <div class="error"><i class="material-icons">error</i> Failed to load history data</div>
            `;
            
            // 重新添加关闭按钮事件
            historyModal.querySelector('.close').addEventListener('click', () => {
                hideModal(historyModal);
                // 移除模态框
                setTimeout(() => {
                    document.body.removeChild(historyModal);
                }, 300);
            });
        });
}

// 加载库存历史记录
function loadStockHistory(storeId, productId) {
    return database.ref(`stock_history/${storeId}/${productId}`).once('value')
        .then(snapshot => snapshot.val() || {});
}

// 导出库存数据
function exportInventory() {
    // 获取过滤后的产品数据
    const storeId = inventoryStoreFilter.value;
    const category = inventoryCategoryFilter.value;
    const stockStatus = inventoryStockFilter.value;
    
    // 加载产品数据
    loadProductsForInventory(storeId)
        .then(productsData => {
            // 过滤产品
            const filteredProducts = filterInventoryProducts(productsData, category, stockStatus);
            
            if (filteredProducts.length === 0) {
                alert('No inventory data to export');
                return;
            }
            
            // 准备CSV数据
            let csvContent = 'data:text/csv;charset=utf-8,';
            
            // 添加表头
            csvContent += 'Product ID,Product Name,Category,Price,Current Stock,Status,Store\n';
            
            // 添加产品数据
            filteredProducts.forEach(([productId, product]) => {
                const storeName = stores[product.store_id]?.name || product.store_id;
                const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
                
                // 确定库存状态
                let statusText;
                if (stock <= 0) {
                    statusText = 'Out of Stock';
                } else if (stock <= 5) {
                    statusText = 'Low Stock';
                } else {
                    statusText = 'In Stock';
                }
                
                csvContent += `${productId},"${product.name}","${product.category || ''}",${product.price},${stock},"${statusText}","${storeName}"\n`;
            });
            
            // 创建下载链接
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `inventory_${getCurrentDate()}.csv`);
            document.body.appendChild(link);
            
            // 触发下载
            link.click();
            
            // 清理
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error('Failed to export inventory:', error);
            alert('Failed to export inventory. Please try again.');
        });
}

// 辅助函数：获取当前日期时间字符串 (yyyy-mm-dd hh:mm:ss)
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

// 检查用户是否为管理员
function checkAdminStatus(userId) {
    return database.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            return userData && userData.role === 'admin';
        })
        .catch(error => {
            console.error('检查管理员状态时出错:', error);
            return false;
        });
}

// 初始化视图和数据
function init() {
    // 设置当前日期
    selectedDate = getCurrentDate();
    dateFilter.value = selectedDate;
    
    // 添加事件监听器
    initEventListeners();
    
    // 加载数据
    loadStores();
    
    // 初始显示仪表板视图
    switchView('dashboard');
    
    // 定期更新当前日期时间
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000);
    
    // 检查并填充店铺下拉菜单
    setTimeout(() => {
        if (inventoryStoreFilter && inventoryStoreFilter.options.length <= 1) {
            console.log("检测到库存店铺下拉菜单未填充，重新填充...");
            populateStoreDropdowns();
        }
    }, 2000);
}

// 初始化Firebase
function initializeFirebase() {
    // 如果已经初始化，则不再重复初始化
    if (firebase.apps.length) return;
    
    // 初始化Firebase
    firebase.initializeApp(firebaseConfig);
    
    // 获取数据库引用
    database = firebase.database();
} 