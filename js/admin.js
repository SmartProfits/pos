// 添加调试日志
console.log("Admin page script loading");
console.log("Current path:", window.location.pathname);
console.log("Current URL:", window.location.href);

// 定义全局变量
let stores = {}; // 存储店铺数据
let products = {}; // 存储商品数据
let users = {}; // 存储用户数据
let selectedDate = getCurrentDate(); // 默认选择当前日期
let selectedStoreId = 'all'; // 默认选择所有店铺
let selectedStoreInDashboard = null; // 仪表盘中当前选择的店铺

// DOM元素
const adminName = document.getElementById('adminName');
const currentDateTime = document.getElementById('currentDateTime');
const viewTitle = document.getElementById('viewTitle');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const storesSubmenu = document.getElementById('storesSubmenu');

// 统计面板DOM元素
const dateFilter = document.getElementById('dateFilter');
const storeButtons = document.getElementById('storeButtons');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');
const viewSalesSummaryBtn = document.getElementById('viewSalesSummaryBtn');
const statsContainer = document.getElementById('statsContainer');
const saleDetailsBody = document.getElementById('saleDetailsBody');
const salesSummaryModal = document.getElementById('salesSummaryModal');
const salesSummaryContent = document.getElementById('salesSummaryContent');
const summarySortBy = document.getElementById('summarySortBy');
const exportSummaryBtn = document.getElementById('exportSummaryBtn');
const screenshotSummaryBtn = document.getElementById('screenshotSummaryBtn');

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
            
            // 当点击dashboard菜单项时，切换子菜单的展开/折叠状态
            if (targetView === 'dashboard') {
                toggleStoresSubmenu();
            }
            
            switchView(targetView);
        });
    });
    
    // 刷新统计按钮
    refreshStatsBtn.addEventListener('click', loadStats);
    
    // 查看销售汇总按钮
    viewSalesSummaryBtn.addEventListener('click', showSalesSummary);
    
    // 销售汇总排序选择变化
    if (summarySortBy) {
        summarySortBy.addEventListener('change', () => {
            sortAndRenderSalesSummary();
        });
    }
    
    // 导出销售汇总按钮
    if (exportSummaryBtn) {
        exportSummaryBtn.addEventListener('click', exportSalesSummary);
    }
    
    // 截图销售汇总按钮
    if (screenshotSummaryBtn) {
        screenshotSummaryBtn.addEventListener('click', screenshotSalesSummary);
    }
    
    // 日期过滤器变化
    dateFilter.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        loadStats();
    });
    
    // 初始化默认的All Stores按钮点击事件
    const allStoresButton = storeButtons.querySelector('[data-store="all"]');
    if (allStoresButton) {
        allStoresButton.addEventListener('click', function() {
            // 更新选中状态
            document.querySelectorAll('.store-button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // 更新选中的店铺ID
            selectedStoreId = 'all';
            
            // 重新加载统计数据
            loadStats();
        });
    }
    
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
    
    // 销售详情模态框关闭按钮
    const saleDetailModal = document.getElementById('saleDetailModal');
    if (saleDetailModal) {
        const saleDetailCloseBtn = saleDetailModal.querySelector('.close');
        if (saleDetailCloseBtn) {
            saleDetailCloseBtn.addEventListener('click', () => {
                hideModal(saleDetailModal);
            });
        }
    }
    
    // 库存管理相关事件监听
    inventoryStoreFilter.addEventListener('change', loadInventory);
    inventoryCategoryFilter.addEventListener('change', loadInventory);
    inventoryStockFilter.addEventListener('change', loadInventory);
    refreshInventoryBtn.addEventListener('click', loadInventory);
    bulkUpdateBtn.addEventListener('click', showBulkUpdateModal);
    
    // 确保导出和导入按钮在下拉菜单中仍然可以工作
    document.querySelectorAll('.dropdown-item').forEach(item => {
        if (item.id === 'exportInventoryBtn') {
            item.addEventListener('click', exportInventory);
        } else if (item.id === 'importInventoryBtn') {
            item.addEventListener('click', () => alert('Import functionality will be implemented soon'));
        }
    });
    
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
    
    // 检查是否有权限访问该视图
    const user = firebase.auth().currentUser;
    if (user) {
        getUserRole(user.uid).then(role => {
            if (role === 'admin' && (viewName === 'stores' || viewName === 'users')) {
                console.log("当前用户无权限访问该视图");
                alert("您没有访问此功能的权限");
                return;
            }
            
            // 执行视图切换
            performViewSwitch(viewName);
        });
    } else {
        // 默认执行视图切换
        performViewSwitch(viewName);
    }
}

// 执行视图切换
function performViewSwitch(viewName) {
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
            if (selectedStoreInDashboard) {
                viewTitle.textContent = `Sales Dashboard - ${stores[selectedStoreInDashboard].name}`;
            } else {
                viewTitle.textContent = 'Sales Dashboard - All Stores';
            }
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

// 切换店铺子菜单的展开/折叠状态
function toggleStoresSubmenu() {
    storesSubmenu.classList.toggle('expanded');
}

// 加载所有店铺
function loadStores() {
    getAllStores()
        .then(storeData => {
            stores = storeData;
            renderStores();
            populateStoreDropdowns();
            populateStoresSubmenu(); // 填充店铺子菜单
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
function populateStoreDropdowns() {
    // 清空并重新填充店铺过滤器
    const dropdowns = [productStoreFilter, productStoreId, userStoreId, inventoryStoreFilter];
    
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
    
    // 为销售仪表板添加店铺按钮
    populateStoreButtons();
    
    // 填充店铺子菜单
    populateStoresSubmenu();
    
    console.log("已填充所有下拉菜单、店铺按钮和子菜单");
}

// 填充店铺按钮
function populateStoreButtons() {
    // 清空除了"All Stores"按钮外的所有按钮
    const allStoresButton = storeButtons.querySelector('[data-store="all"]');
    storeButtons.innerHTML = '';
    storeButtons.appendChild(allStoresButton);
    
    // 添加店铺按钮
    Object.keys(stores).forEach(storeId => {
        const button = document.createElement('button');
        button.className = 'store-button';
        button.setAttribute('data-store', storeId);
        button.textContent = stores[storeId].name;
        
        // 设置点击事件
        button.addEventListener('click', function() {
            // 更新选中状态
            document.querySelectorAll('.store-button').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // 更新选中的店铺ID
            selectedStoreId = this.getAttribute('data-store');
            
            // 重新加载统计数据
            loadStats();
        });
        
        storeButtons.appendChild(button);
    });
    
    // 设置当前选中的按钮
    const currentButton = storeButtons.querySelector(`[data-store="${selectedStoreId}"]`);
    if (currentButton) {
        document.querySelectorAll('.store-button').forEach(btn => {
            btn.classList.remove('active');
        });
        currentButton.classList.add('active');
    }
}

// 填充店铺子菜单
function populateStoresSubmenu() {
    // 清空子菜单
    storesSubmenu.innerHTML = '';
    
    // 添加"All Stores"选项
    const allStoresItem = document.createElement('div');
    allStoresItem.className = 'submenu-item';
    if (selectedStoreInDashboard === null) {
        allStoresItem.classList.add('active');
    }
    allStoresItem.innerHTML = '<i class="material-icons">store</i> All Stores';
    allStoresItem.addEventListener('click', () => {
        // 移除所有子菜单项的active类
        document.querySelectorAll('.submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        // 为当前项添加active类
        allStoresItem.classList.add('active');
        
        // 更新当前选中的店铺
        selectedStoreInDashboard = null;
        selectedStoreId = 'all';
        
        // 更新页面标题并加载数据
        viewTitle.textContent = 'Sales Dashboard - All Stores';
        loadStats();
    });
    storesSubmenu.appendChild(allStoresItem);
    
    // 添加各个店铺选项
    Object.keys(stores).forEach(storeId => {
        const storeName = stores[storeId].name;
        const storeItem = document.createElement('div');
        storeItem.className = 'submenu-item';
        if (selectedStoreInDashboard === storeId) {
            storeItem.classList.add('active');
        }
        storeItem.innerHTML = `<i class="material-icons">storefront</i> ${storeName}`;
        storeItem.addEventListener('click', () => {
            // 移除所有子菜单项的active类
            document.querySelectorAll('.submenu-item').forEach(item => {
                item.classList.remove('active');
            });
            // 为当前项添加active类
            storeItem.classList.add('active');
            
            // 更新当前选中的店铺
            selectedStoreInDashboard = storeId;
            selectedStoreId = storeId;
            
            // 更新页面标题并加载数据
            viewTitle.textContent = `Sales Dashboard - ${storeName}`;
            loadStats();
        });
        storesSubmenu.appendChild(storeItem);
    });
    
    // 默认展开子菜单
    storesSubmenu.classList.add('expanded');
}

// 加载销售统计数据
function loadStats() {
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    
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
    // 先获取所有店铺列表
    getAllStores()
        .then(storeList => {
            const storeIds = Object.keys(storeList);
            const promises = [];
            
            // 对每个店铺获取销售记录
            storeIds.forEach(storeId => {
                promises.push(
                    database.ref(`sales/${storeId}`).once('value')
                        .then(snapshot => {
                            const sales = snapshot.val() || {};
                            // 筛选特定日期的销售记录
                            const filteredSales = {};
                            Object.keys(sales).forEach(saleId => {
                                if (sales[saleId].date === date) {
                                    filteredSales[saleId] = sales[saleId];
                                }
                            });
                            return filteredSales;
                        })
                );
            });
            
            // 合并所有店铺的销售记录
            return Promise.all(promises)
                .then(results => {
                    let allSales = {};
                    results.forEach(storeSales => {
                        allSales = { ...allSales, ...storeSales };
                    });
                    return allSales;
                });
        })
        .then(sales => {
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
        
        // 计算折扣信息的显示
        let discountInfo = '';
        if (sale.discountAmount > 0) {
            const discountType = sale.discountType || 'percent';
            const discountIcon = discountType === 'percent' ? '%' : '$';
            discountInfo = ` <span class="discount-info" title="${discountType === 'percent' ? `${sale.discountPercent}% discount` : 'Fixed discount'}">
                <i class="material-icons" style="font-size: 16px; color: #e53935;">local_offer</i>${discountIcon}
            </span>`;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.billNumber || 'N/A'}</td>
            <td>${storeName}</td>
            <td>${sale.timestamp}</td>
            <td>${cashierName}</td>
            <td>${itemCount}</td>
            <td>RM${sale.total_amount.toFixed(2)}${discountInfo}</td>
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

// 显示销售详情
function showSaleDetails(sale) {
    const storeName = stores[sale.store_id]?.name || sale.store_id;
    const saleDetailModal = document.getElementById('saleDetailModal');
    
    // 设置销售详情的基本信息
    document.getElementById('sale-detail-bill').textContent = sale.billNumber || 'N/A';
    document.getElementById('sale-detail-store').textContent = storeName;
    document.getElementById('sale-detail-date').textContent = sale.timestamp;
    document.getElementById('sale-detail-cashier').textContent = sale.cashierName || 'N/A';
    
    // 渲染商品列表
    const detailsBody = document.getElementById('sale-details-items');
    detailsBody.innerHTML = '';
    
    sale.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>RM${item.price.toFixed(2)}</td>
            <td>RM${(item.quantity * item.price).toFixed(2)}</td>
        `;
        detailsBody.appendChild(row);
    });
    
    // 显示总计、折扣和小计
    const summaryContainer = document.getElementById('sale-detail-footer');
    summaryContainer.innerHTML = '';
    
    // 创建小计、折扣和总计的容器
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'sale-detail-summary';
    
    // 如果有小计信息（为了向后兼容检查是否存在）
    if (sale.subtotal) {
        const subtotalP = document.createElement('p');
        subtotalP.innerHTML = `Subtotal: <strong>RM${sale.subtotal.toFixed(2)}</strong>`;
        summaryDiv.appendChild(subtotalP);
        
        // 如果有折扣信息
        if (sale.discountAmount > 0) {
            const discountP = document.createElement('p');
            if (sale.discountType === 'percent') {
                discountP.innerHTML = `Discount (${sale.discountPercent}%): <strong>-RM${sale.discountAmount.toFixed(2)}</strong>`;
            } else {
                discountP.innerHTML = `Discount (Fixed): <strong>-RM${sale.discountAmount.toFixed(2)}</strong>`;
            }
            summaryDiv.appendChild(discountP);
        }
    }
    
    // 总计信息
    const totalP = document.createElement('p');
    totalP.innerHTML = `<strong>Total: RM${sale.total_amount.toFixed(2)}</strong>`;
    summaryDiv.appendChild(totalP);
    
    summaryContainer.appendChild(summaryDiv);
    
    // 显示模态框
    showModal(saleDetailModal);
}

// 处理添加店铺表单提交
function handleAddStore(e) {
    e.preventDefault();
    
    const storeId = document.getElementById('storeId').value.trim();
    const storeName = document.getElementById('storeName').value.trim();
    const storeAddress = document.getElementById('storeAddress').value.trim();
    
    // 检查店铺ID是否已存在
    if (stores[storeId]) {
        alert('Store ID already exists. Please use a different Store ID.');
        return;
    }
    
    // 添加店铺
    addStore(storeId, storeName, storeAddress)
        .then(() => {
            // 隐藏模态框
            hideModal(document.getElementById('addStoreModal'));
            
            // 清空表单
            document.getElementById('storeId').value = '';
            document.getElementById('storeName').value = '';
            document.getElementById('storeAddress').value = '';
            
            // 重新加载店铺列表
            loadStores();
            
            // 向用户显示成功消息
            alert(`Store "${storeName}" has been added successfully.`);
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
    const storeName = stores[storeId].name;
    
    // 确认删除
    if (confirm(`Are you sure you want to delete store "${storeName}"?`)) {
        // 检查是否有关联商品
        const hasProducts = Object.values(products).some(product => product.storeId === storeId);
        
        if (hasProducts) {
            alert(`Cannot delete store "${storeName}" because it has associated products. Please delete or reassign the products first.`);
            return;
        }
        
        // 删除店铺
        removeStore(storeId)
            .then(() => {
                // 如果当前选中的店铺被删除，重置选中状态
                if (selectedStoreInDashboard === storeId) {
                    selectedStoreInDashboard = null;
                    selectedStoreId = 'all';
                    viewTitle.textContent = 'Sales Dashboard - All Stores';
                }
                
                // 重新加载店铺列表
                loadStores();
                
                // 向用户显示成功消息
                alert(`Store "${storeName}" has been deleted successfully.`);
            })
            .catch(error => {
                console.error('Failed to delete store:', error);
                alert('Failed to delete store. Please try again.');
            });
    }
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
        let roleName;
        if (user.role === 'admin') {
            roleName = 'Admin';
        } else if (user.role === 'sadmin') {
            roleName = 'Super Admin';
        } else {
            roleName = 'Staff';
        }
        
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
        alert('请填写所有必填字段');
        return;
    }
    
    // 检查当前用户角色，只有sadmin可以添加sadmin
    const user = firebase.auth().currentUser;
    if (user) {
        getUserRole(user.uid).then(currentUserRole => {
            if (role === 'sadmin' && currentUserRole !== 'sadmin') {
                alert('只有超级管理员可以添加超级管理员账户');
                return;
            }
            
            // 继续创建用户
            createNewUser(email, password, role, storeId);
        });
    } else {
        alert('您需要登录才能添加用户');
    }
}

// 创建新用户
function createNewUser(email, password, role, storeId) {
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
            alert('用户创建成功！');
        })
        .catch(error => {
            console.error('创建用户失败:', error);
            alert(`创建用户失败: ${error.message}`);
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
    return database.ref(`sales/${storeId}`).once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            let totalSales = 0;
            let transactionCount = 0;
            
            // 筛选特定日期的销售记录并计算总额
            Object.keys(sales).forEach(saleId => {
                const sale = sales[saleId];
                if (sale.date === date) {
                    totalSales += Number(sale.total_amount || 0);
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
    // 先获取所有店铺列表
    return getAllStores()
        .then(storeList => {
            const storeIds = Object.keys(storeList);
            const promises = [];
            
            // 对每个店铺获取销售记录
            storeIds.forEach(storeId => {
                promises.push(
                    database.ref(`sales/${storeId}`).once('value')
                        .then(snapshot => {
                            const sales = snapshot.val() || {};
                            let totalSales = 0;
                            let transactionCount = 0;
                            
                            // 筛选特定日期的销售记录并计算总额
                            Object.keys(sales).forEach(saleId => {
                                const sale = sales[saleId];
                                if (sale.date === date) {
                                    totalSales += Number(sale.total_amount || 0);
                                    transactionCount++;
                                }
                            });
                            
                            return {
                                storeId,
                                stats: {
                                    total_sales: totalSales,
                                    transaction_count: transactionCount
                                }
                            };
                        })
                );
            });
            
            // 合并所有店铺的销售统计
            return Promise.all(promises)
                .then(results => {
                    const allStats = {};
                    results.forEach(result => {
                        if (result && result.storeId) {
                            allStats[result.storeId] = result.stats;
                        }
                    });
                    return allStats;
                });
        });
}

// 获取特定店铺的特定日期销售详情
function getStoreSaleDetails(storeId, date) {
    return database.ref(`sales/${storeId}`)
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
                <div class="inventory-action-buttons">
                    <button class="update-stock-btn icon-button" title="Update Stock" data-id="${productId}"><i class="material-icons">edit</i></button>
                    <button class="view-history-btn icon-button" title="Stock History" data-id="${productId}"><i class="material-icons">history</i></button>
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
            return userData && (userData.role === 'admin' || userData.role === 'sadmin');
        })
        .catch(error => {
            console.error('检查管理员状态时出错:', error);
            return false;
        });
}

// 检查用户是否为超级管理员
function checkSuperAdminStatus(userId) {
    return database.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            return userData && userData.role === 'sadmin';
        })
        .catch(error => {
            console.error('检查超级管理员状态时出错:', error);
            return false;
        });
}

// 获取用户角色
function getUserRole(userId) {
    return database.ref(`users/${userId}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            return userData ? userData.role : null;
        })
        .catch(error => {
            console.error('获取用户角色时出错:', error);
            return null;
        });
}

// 初始化视图和数据
function init() {
    // 设置当前日期
    selectedDate = getCurrentDate();
    dateFilter.value = selectedDate;
    
    // 添加事件监听器
    initEventListeners();
    
    // 根据用户角色设置权限
    const user = firebase.auth().currentUser;
    if (user) {
        getUserRole(user.uid).then(role => {
            // 根据角色隐藏菜单项
            if (role === 'admin') {
                // 普通管理员看不到店铺管理和用户管理
                document.querySelector('.nav-item[data-view="stores"]').style.display = 'none';
                document.querySelector('.nav-item[data-view="users"]').style.display = 'none';
            }
            
            // 加载数据
            loadStores();
            
            // 初始显示仪表板视图
            switchView('dashboard');
        });
    } else {
        // 如果未登录，加载数据
        loadStores();
        
        // 初始显示仪表板视图
        switchView('dashboard');
    }
    
    // 定期更新当前日期时间
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
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

// 显示销售汇总
let currentSalesSummary = []; // Store the current sales summary data

function showSalesSummary() {
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    
    // 显示模态框
    showModal(salesSummaryModal);
    
    // 显示加载状态
    salesSummaryContent.innerHTML = '<div class="loading"><i class="material-icons">hourglass_empty</i> Loading sales summary...</div>';
    
    // 获取销售数据
    let salesPromise;
    if (storeId === 'all') {
        salesPromise = database.ref('sales').orderByChild('date').equalTo(date).once('value');
    } else {
        salesPromise = getStoreSaleDetails(storeId, date);
    }
    
    salesPromise
        .then(snapshot => {
            let sales;
            if (snapshot.val) {
                sales = snapshot.val() || {};
            } else {
                sales = snapshot || {};
            }
            
            // 生成销售汇总
            generateSalesSummary(sales);
        })
        .catch(error => {
            console.error('Failed to load sales data for summary:', error);
            salesSummaryContent.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load sales summary</div>';
        });
}

// 生成销售汇总
function generateSalesSummary(sales) {
    // 如果没有销售数据
    if (Object.keys(sales).length === 0) {
        salesSummaryContent.innerHTML = '<div class="no-data"><i class="material-icons">info</i> No sales data available for this date</div>';
        currentSalesSummary = [];
        return;
    }
    
    // 按产品汇总销售数据
    const productSummary = {};
    
    // 处理每个销售记录
    Object.values(sales).forEach(sale => {
        if (!sale.items || !Array.isArray(sale.items)) return;
        
        // 处理每个销售项目
        sale.items.forEach(item => {
            const productId = item.id;
            const productName = item.name;
            const quantity = item.quantity || 0;
            const unitPrice = item.price || 0;
            const subtotal = item.subtotal || (quantity * unitPrice);
            
            // 如果产品ID为空，则跳过
            if (!productId) return;
            
            // 如果产品尚未在汇总中，初始化它
            if (!productSummary[productId]) {
                productSummary[productId] = {
                    id: productId,
                    name: productName,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    unitPrice: unitPrice,
                    saleCount: 0
                };
            }
            
            // 累加数量和收入
            productSummary[productId].totalQuantity += quantity;
            productSummary[productId].totalRevenue += subtotal;
            productSummary[productId].saleCount += 1;
            
            // 如果价格与现有价格不同，取平均值
            if (productSummary[productId].unitPrice !== unitPrice) {
                // Update to the latest price
                productSummary[productId].unitPrice = unitPrice;
            }
        });
    });
    
    // 转换为数组以便排序
    currentSalesSummary = Object.values(productSummary);
    
    // 排序并渲染
    sortAndRenderSalesSummary();
}

// 排序并渲染销售汇总
function sortAndRenderSalesSummary() {
    const sortBy = summarySortBy.value;
    
    // 复制数组以避免修改原始数据
    const sortedSummary = [...currentSalesSummary];
    
    // 根据选择的字段排序
    switch (sortBy) {
        case 'quantity':
            sortedSummary.sort((a, b) => b.totalQuantity - a.totalQuantity);
            break;
        case 'revenue':
            sortedSummary.sort((a, b) => b.totalRevenue - a.totalRevenue);
            break;
        case 'name':
            sortedSummary.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            sortedSummary.sort((a, b) => b.totalQuantity - a.totalQuantity);
    }
    
    // 计算总计
    const totalQuantity = sortedSummary.reduce((sum, product) => sum + product.totalQuantity, 0);
    const totalRevenue = sortedSummary.reduce((sum, product) => sum + product.totalRevenue, 0);
    
    // 渲染表格
    let tableHTML = `
        <div class="summary-totals">
            <div class="summary-total-item">
                <span>Total Products Sold:</span>
                <strong>${totalQuantity}</strong>
            </div>
            <div class="summary-total-item">
                <span>Total Revenue:</span>
                <strong>RM${totalRevenue.toFixed(2)}</strong>
            </div>
        </div>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Unit Price</th>
                    <th>Quantity Sold</th>
                    <th>Total Revenue</th>
                    <th>Sale Count</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedSummary.forEach(product => {
        tableHTML += `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>RM${product.unitPrice.toFixed(2)}</td>
                <td>${product.totalQuantity}</td>
                <td>RM${product.totalRevenue.toFixed(2)}</td>
                <td>${product.saleCount}</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    salesSummaryContent.innerHTML = tableHTML;
}

// 导出销售汇总为CSV
function exportSalesSummary() {
    if (currentSalesSummary.length === 0) {
        alert('No data to export.');
        return;
    }
    
    // 构建CSV内容
    let csvContent = 'Product ID,Product Name,Unit Price,Quantity Sold,Total Revenue,Sale Count\n';
    
    currentSalesSummary.forEach(product => {
        const row = [
            `"${product.id}"`,
            `"${product.name.replace(/"/g, '""')}"`,
            product.unitPrice.toFixed(2),
            product.totalQuantity,
            product.totalRevenue.toFixed(2),
            product.saleCount
        ].join(',');
        
        csvContent += row + '\n';
    });
    
    // 创建下载链接
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    const storeName = storeId === 'all' ? 'All_Stores' : (stores[storeId]?.name || storeId).replace(/\s+/g, '_');
    const filename = `Sales_Summary_${storeName}_${date}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // 创建下载URL
    if (navigator.msSaveBlob) { // IE
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 销售汇总屏幕截图功能
function screenshotSalesSummary() {
    if (currentSalesSummary.length === 0) {
        alert('No data to screenshot.');
        return;
    }
    
    // 创建一个全屏视图用于截图
    const summaryContainer = document.createElement('div');
    summaryContainer.style.position = 'fixed';
    summaryContainer.style.top = '0';
    summaryContainer.style.left = '0';
    summaryContainer.style.width = '100%';
    summaryContainer.style.height = '100%';
    summaryContainer.style.backgroundColor = 'white';
    summaryContainer.style.zIndex = '9999';
    summaryContainer.style.padding = '20px';
    summaryContainer.style.boxSizing = 'border-box';
    summaryContainer.style.overflow = 'auto';
    
    // 创建顶部标题栏
    const headerBar = document.createElement('div');
    headerBar.style.display = 'flex';
    headerBar.style.justifyContent = 'space-between';
    headerBar.style.alignItems = 'center';
    headerBar.style.marginBottom = '20px';
    headerBar.style.padding = '10px';
    headerBar.style.backgroundColor = '#f5f5f5';
    headerBar.style.borderRadius = '5px';
    
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    const storeName = storeId === 'all' ? 'All Stores' : (stores[storeId]?.name || storeId);
    
    headerBar.innerHTML = `
        <div>
            <h1 style="margin: 0; color: #333; font-size: 24px;">Sales Summary Report</h1>
            <p style="margin: 5px 0 0 0; color: #666;">Date: ${date} | Store: ${storeName}</p>
        </div>
        <button id="closeSummaryScreenshot" style="background: #e74c3c; color: white; border: none; border-radius: 5px; padding: 8px 15px; cursor: pointer;">Close</button>
    `;
    
    // 复制销售汇总内容
    const summaryContent = document.createElement('div');
    summaryContent.id = 'summaryScreenshotContent';
    summaryContent.innerHTML = salesSummaryContent.innerHTML;
    
    // 添加到容器
    summaryContainer.appendChild(headerBar);
    summaryContainer.appendChild(summaryContent);
    
    // 添加到文档
    document.body.appendChild(summaryContainer);
    
    // 添加关闭按钮事件
    document.getElementById('closeSummaryScreenshot').addEventListener('click', () => {
        document.body.removeChild(summaryContainer);
    });
    
    // 一秒后截图，确保内容已经完全渲染
    setTimeout(() => {
        // 使用 html2canvas 进行截图
        html2canvas(summaryContainer, {
            scale: 2, // 提高分辨率
            logging: false,
            allowTaint: true,
            useCORS: true
        }).then(canvas => {
            // 转换为图片并下载
            const imageData = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            const filename = `Sales_Summary_${storeName.replace(/\s+/g, '_')}_${date}.png`;
            
            downloadLink.href = imageData;
            downloadLink.download = filename;
            downloadLink.click();
            
            // 下载完成后询问用户是否关闭全屏视图
            if (confirm('Screenshot downloaded. Close fullscreen view?')) {
                document.body.removeChild(summaryContainer);
            }
        }).catch(error => {
            console.error('Screenshot failed:', error);
            alert('Failed to create screenshot. Please try again.');
            document.body.removeChild(summaryContainer);
        });
    }, 1000);
} 