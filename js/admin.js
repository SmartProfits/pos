// 添加调试日志
console.log("Admin page script loading");
console.log("Current path:", window.location.pathname);
console.log("Current URL:", window.location.href);

// 定义全局变量
let stores = {}; // 存储店铺数据
let products = {}; // 存储商品数据
let users = {}; // 存储用户数据
let onlineUsers = {}; // 存储在线用户数据
let selectedDate = getCurrentDate(); // 默认选择当前日期
let selectedStoreId = 'all'; // 默认选择所有店铺
let selectedStoreInDashboard = null; // 仪表盘中当前选择的店铺

// 添加数据缓存，避免重复请求
const dataCache = {
    sales: {}, // 按日期和店铺ID缓存销售数据: {date: {storeId: data}}
    stats: {}, // 按日期和店铺ID缓存统计数据: {date: {storeId: stats}}
    clearCache: function() { 
        this.sales = {};
        this.stats = {};
        console.log("数据缓存已清除");
    },
    // 保存销售数据到缓存
    cacheSalesData: function(date, storeId, data) {
        if (!this.sales[date]) this.sales[date] = {};
        this.sales[date][storeId] = data;
        console.log(`已缓存 ${date} 日期 ${storeId} 店铺的销售数据`);
    },
    // 获取缓存的销售数据
    getCachedSalesData: function(date, storeId) {
        return this.sales[date] && this.sales[date][storeId];
    },
    // 保存统计数据到缓存
    cacheStatsData: function(date, storeId, data) {
        if (!this.stats[date]) this.stats[date] = {};
        this.stats[date][storeId] = data;
    },
    // 获取缓存的统计数据
    getCachedStatsData: function(date, storeId) {
        return this.stats[date] && this.stats[date][storeId];
    }
};

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
const productSearch = document.getElementById('productSearch');
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
                        
                        // 检查是否是超级管理员，以决定是否显示特定功能
                        checkSuperAdminStatus(user.uid)
                            .then(isSuperAdmin => {
                                if (isSuperAdmin) {
                                    // 如果是超级管理员，添加特殊类以显示超级管理员专用功能
                                    document.body.classList.add('is-sadmin');
                                    console.log('超级管理员登录，启用特殊功能');
                                }
                            });
                        
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
    
    // 销售汇总相关事件监听器
    initSalesSummaryEventListeners();
    
    // 日期过滤器变化
    dateFilter.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        // 更改日期时清除缓存
        dataCache.clearCache();
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
    
    // 商品搜索框输入变化
    if (productSearch) {
        productSearch.addEventListener('input', loadProducts);
    }
    
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
    
    // 在线用户刷新按钮
    const refreshOnlineUsersBtn = document.getElementById('refreshOnlineUsersBtn');
    if (refreshOnlineUsersBtn) {
        refreshOnlineUsersBtn.addEventListener('click', loadOnlineUsers);
    }
}

// 切换视图
function switchView(viewName) {
    console.log("Switching to view:", viewName);
    
    // 检查是否有权限访问该视图
    const user = firebase.auth().currentUser;
    if (user) {
        getUserRole(user.uid).then(role => {
            // 对于 admin 角色，限制访问 stores 和 users 视图
            if (role === 'admin' && (viewName === 'stores' || viewName === 'users')) {
                console.log("当前用户无权限访问该视图:", viewName);
                alert("您没有访问此功能的权限");
                
                // 自动切换回 dashboard
                performViewSwitch('dashboard');
                
                // 更新导航菜单激活状态
                navItems.forEach(item => {
                    if (item.dataset.view === 'dashboard') {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
                
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
                <div class="action-buttons">
                    <button class="edit-btn icon-button" data-id="${storeId}" title="Edit"><i class="material-icons">edit</i></button>
                    <button class="delete-btn icon-button" data-id="${storeId}" title="Delete"><i class="material-icons">delete</i></button>
                </div>
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
        loadAllStoresData(date);
    } else {
        // 加载特定店铺的统计数据
        loadSingleStoreData(storeId, date);
    }
}

// 加载所有店铺数据（统计和详情）
function loadAllStoresData(date) {
    // 先检查是否有所有所需店铺的缓存数据
    const cachedAllStores = checkAllStoresCached(date);
    if (cachedAllStores.allCached) {
        // 如果所有店铺都有缓存，直接使用缓存数据
        console.log("使用缓存的所有店铺数据");
        renderStats(cachedAllStores.stats, true);
        renderSaleDetails(cachedAllStores.sales);
        return;
    }
    
    // 获取所有店铺列表
    getAllStores()
        .then(storeList => {
            const storeIds = Object.keys(storeList);
            const promises = [];
            
            // 对每个店铺获取销售记录 - 只获取特定日期的数据
            storeIds.forEach(storeId => {
                // 检查缓存
                const cachedSalesData = dataCache.getCachedSalesData(date, storeId);
                if (cachedSalesData) {
                    console.log(`使用缓存的 ${storeId} 店铺数据`);
                    promises.push(Promise.resolve({
                        storeId,
                        sales: cachedSalesData,
                        stats: calculateStatsFromSales(cachedSalesData)
                    }));
                } else {
                    // 没有缓存，需要从数据库获取
                    promises.push(
                        database.ref(`sales/${storeId}/${date}`).once('value')
                            .then(snapshot => {
                                const sales = snapshot.val() || {};
                                
                                // 计算统计数据
                                const stats = calculateStatsFromSales(sales);
                                
                                // 缓存数据
                                dataCache.cacheSalesData(date, storeId, sales);
                                dataCache.cacheStatsData(date, storeId, stats);
                                
                                return {
                                    storeId,
                                    sales: sales,
                                    stats: stats
                                };
                            })
                    );
                }
            });
            
            // 合并所有店铺的销售记录和统计
            return Promise.all(promises)
                .then(results => {
                    const allSales = {};
                    const allStats = {};
                    
                    results.forEach(result => {
                        // 处理销售数据 - 加入store_id
                        const salesWithStoreId = {};
                        Object.keys(result.sales).forEach(saleId => {
                            if (result.sales[saleId]) {
                                salesWithStoreId[saleId] = {
                                    ...result.sales[saleId],
                                    store_id: result.sales[saleId].store_id || result.storeId
                                };
                            }
                        });
                        
                        // 合并到总销售数据中
                        Object.assign(allSales, salesWithStoreId);
                        
                        // 合并统计数据
                        if (result.storeId) {
                            allStats[result.storeId] = result.stats;
                        }
                    });
                    
                    // 渲染数据
                    renderStats(allStats, true);
                    renderSaleDetails(allSales);
                });
            })
            .catch(error => {
                console.error('Failed to load statistics data:', error);
                statsContainer.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load statistics data</div>';
                saleDetailsBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
            });
}

// 加载单个店铺数据
function loadSingleStoreData(storeId, date) {
    // 检查缓存
    const cachedSalesData = dataCache.getCachedSalesData(date, storeId);
    const cachedStatsData = dataCache.getCachedStatsData(date, storeId);
    
    if (cachedSalesData && cachedStatsData) {
        console.log(`使用缓存的 ${storeId} 店铺数据`);
        // 使用缓存数据
        const formattedStats = {};
        formattedStats[storeId] = cachedStatsData;
        renderStats(formattedStats, false);
        renderSaleDetails(cachedSalesData);
        return;
    }
    
    // 没有缓存，需要从数据库获取
    database.ref(`sales/${storeId}/${date}`).once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            
            // 计算统计数据
            const stats = calculateStatsFromSales(sales);
            
            // 缓存数据
            dataCache.cacheSalesData(date, storeId, sales);
            dataCache.cacheStatsData(date, storeId, stats);
            
            // 格式化统计数据
            const formattedStats = {};
            formattedStats[storeId] = stats;
            
            // 确保销售记录有store_id
            const salesWithStoreId = {};
            Object.keys(sales).forEach(saleId => {
                if (sales[saleId]) {
                    salesWithStoreId[saleId] = {
                        ...sales[saleId],
                        store_id: sales[saleId].store_id || storeId
                    };
                }
            });
            
            // 渲染数据
            renderStats(formattedStats, false);
            renderSaleDetails(salesWithStoreId);
            })
            .catch(error => {
                console.error('Failed to load statistics data:', error);
                statsContainer.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load statistics data</div>';
                saleDetailsBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
            });
    }

// 计算销售统计
function calculateStatsFromSales(sales) {
    let totalSales = 0;
    let transactionCount = 0;
    
    // 计算总销售额和交易数
    Object.keys(sales).forEach(saleId => {
        if (sales[saleId]) {
            totalSales += Number(sales[saleId].total_amount || 0);
            transactionCount++;
        }
    });
    
    return {
        total_sales: totalSales,
        transaction_count: transactionCount
    };
}

// 检查所有店铺是否都有缓存数据
function checkAllStoresCached(date) {
    let allStats = {};
    let allSales = {};
    let allCached = true;
    
    // 假设stores全局变量已经加载完成
    Object.keys(stores).forEach(storeId => {
        const cachedSales = dataCache.getCachedSalesData(date, storeId);
        const cachedStats = dataCache.getCachedStatsData(date, storeId);
        
        if (cachedSales && cachedStats) {
            // 如果有缓存，添加到结果
            allStats[storeId] = cachedStats;
            
            // 处理销售数据 - 加入store_id
            Object.keys(cachedSales).forEach(saleId => {
                if (cachedSales[saleId]) {
                    allSales[saleId] = {
                        ...cachedSales[saleId],
                        store_id: cachedSales[saleId].store_id || storeId
                    };
                }
            });
        } else {
            // 如果任一店铺没有缓存，标记为未完全缓存
            allCached = false;
        }
    });
    
    return {
        allCached,
        stats: allStats,
        sales: allSales
    };
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
            
            // 对每个店铺获取销售记录 - 只获取特定日期的数据
            storeIds.forEach(storeId => {
                promises.push(
                    database.ref(`sales/${storeId}/${date}`).once('value')
                        .then(snapshot => {
                            const sales = snapshot.val() || {};
                            // 将店铺ID添加到每个销售记录中
                            const salesWithStoreId = {};
                            Object.keys(sales).forEach(saleId => {
                                // 确保销售记录有 store_id
                                if (sales[saleId]) {
                                    salesWithStoreId[saleId] = {
                                        ...sales[saleId],
                                        store_id: sales[saleId].store_id || storeId
                                    };
                                }
                            });
                            return salesWithStoreId;
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
    const searchQuery = productSearch ? productSearch.value.trim().toLowerCase() : '';
    
    // 显示加载状态
    productsTableBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    if (storeId === 'all') {
        // 加载所有商品
        getAllProducts()
            .then(productData => {
                products = productData;
                renderProducts(searchQuery);
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
                renderProducts(searchQuery);
            })
            .catch(error => {
                console.error('Failed to load products:', error);
                productsTableBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load products</td></tr>';
            });
    }
}

// 渲染商品列表
function renderProducts(searchQuery = '') {
    productsTableBody.innerHTML = '';
    
    if (Object.keys(products).length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">info</i> No product data available</td></tr>';
        return;
    }
    
    // 过滤商品
    const filteredProducts = Object.keys(products).filter(productId => {
        const product = products[productId];
        const storeName = stores[product.store_id]?.name || product.store_id;
        
        if (!searchQuery) return true;
        
        // 搜索匹配（商品ID、名称、类别或店铺名）
        return productId.toLowerCase().includes(searchQuery) || 
               product.name.toLowerCase().includes(searchQuery) || 
               (product.category || '').toLowerCase().includes(searchQuery) ||
               storeName.toLowerCase().includes(searchQuery);
    });
    
    if (filteredProducts.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">search</i> No products match your search</td></tr>';
        return;
    }
    
    filteredProducts.forEach(productId => {
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
                <div class="inventory-action-buttons">
                    <button class="icon-button update-stock-btn" title="Update Stock" data-id="${productId}"><i class="material-icons">edit</i></button>
                    <button class="icon-button view-history-btn" title="Stock History" data-id="${productId}"><i class="material-icons">history</i></button>
                    <button class="icon-button add-stock-btn" title="Add Stock" data-id="${productId}"><i class="material-icons">add_box</i></button>
                    <button class="icon-button tester-btn" title="Test (-1)" data-id="${productId}"><i class="material-icons">restaurant</i></button>
                </div>
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
                <div class="action-buttons">
                    <button class="reset-pwd-btn icon-button" data-id="${userId}" title="Reset Password"><i class="material-icons">lock_reset</i></button>
                    <button class="delete-btn icon-button" data-id="${userId}" title="Delete"><i class="material-icons">delete</i></button>
                </div>
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
                        // 明确地将store_id添加到每个产品对象
                        allProducts[productId] = {
                            ...product,
                            store_id: storeId
                        };
                        console.log(`Added product ${productId} from store ${storeId}`);
                    });
                }
            });
            
            console.log(`Loaded ${Object.keys(allProducts).length} products from all stores`);
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
                // 明确地将store_id添加到每个产品对象
                products[productId].store_id = storeId;
                console.log(`Added store_id ${storeId} to product ${productId}`);
            });
            
            console.log(`Loaded ${Object.keys(products).length} products for store ${storeId}`);
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
    console.log(`Getting sales from transactions for store ${storeId} on date ${date}`);
    
    return database.ref(`sales/${storeId}/${date}`).once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            let totalSales = 0;
            let transactionCount = 0;
            
            // 计算总销售额和交易数
            Object.keys(sales).forEach(saleId => {
                if (sales[saleId]) {
                    totalSales += Number(sales[saleId].total_amount || 0);
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
            
            // 对每个店铺获取销售记录 - 只获取特定日期的数据
            storeIds.forEach(storeId => {
                promises.push(
                    database.ref(`sales/${storeId}/${date}`).once('value')
                        .then(snapshot => {
                            const sales = snapshot.val() || {};
                            let totalSales = 0;
                            let transactionCount = 0;
                            
                            // 计算总销售额和交易数
                            Object.keys(sales).forEach(saleId => {
                                if (sales[saleId]) {
                                    totalSales += Number(sales[saleId].total_amount || 0);
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
    return database.ref(`sales/${storeId}/${date}`)
        .once('value')
        .then(snapshot => {
            const sales = snapshot.val() || {};
            
            // 确保每个销售记录都有 store_id
            const salesWithStoreId = {};
            Object.keys(sales).forEach(saleId => {
                if (sales[saleId]) {
                    salesWithStoreId[saleId] = {
                        ...sales[saleId],
                        store_id: sales[saleId].store_id || storeId
                    };
                }
            });
            
            return salesWithStoreId;
        });
}

// 加载库存数据
function loadInventory() {
    const storeId = inventoryStoreFilter.value;
    const category = inventoryCategoryFilter.value;
    const stockStatus = inventoryStockFilter.value;
    
    console.log(`开始加载库存数据，店铺ID: ${storeId}，类别: ${category}，库存状态: ${stockStatus}`);
    
    // 显示加载状态
    inventoryTableBody.innerHTML = '<tr><td colspan="9" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    // 加载产品数据
    loadProductsForInventory(storeId)
        .then(productsData => {
            console.log(`成功加载 ${Object.keys(productsData).length} 个产品`);
            
            // 检查每个产品是否包含store_id
            let missingStoreIdCount = 0;
            Object.entries(productsData).forEach(([productId, product]) => {
                if (!product.store_id) {
                    missingStoreIdCount++;
                    
                    // 为缺少store_id的产品添加store_id
                    // 如果选择了特定商店，则使用该商店ID，否则标记为unknown
                    if (storeId !== 'all') {
                        console.log(`为产品 ${productId} 添加缺失的 store_id: ${storeId}`);
                        productsData[productId].store_id = storeId;
                    } else {
                        console.error(`产品 ${productId} 缺少 store_id，但当前选择了"所有商店"`);
                        // 将产品标记为未知商店，以便可以在界面上显示警告
                        productsData[productId].store_id = 'unknown';
                    }
                }
            });
            
            if (missingStoreIdCount > 0) {
                console.warn(`发现 ${missingStoreIdCount} 个产品缺少 store_id 属性`);
            }
            
            // 过滤产品
            const filteredProducts = filterInventoryProducts(productsData, category, stockStatus);
            
            // 更新全局products对象
            products = productsData;
            
            // 渲染库存表格
            renderInventory(filteredProducts);
            
            // 更新类别过滤器
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
    // 检查products是否为有效对象
    if (!products || typeof products !== 'object') {
        console.error('无效的产品数据:', products);
        return [];
    }
    
    const result = Object.entries(products).filter(([productId, product]) => {
        // 检查product是否有store_id
        if (!product.store_id) {
            console.warn(`Product ${productId} has no store_id`, product);
        }
        
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
    
    console.log(`过滤后剩余 ${result.length} 个产品`);
    return result;
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
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    // 确保product.store_id存在
    if (!product.store_id) {
        console.error('Product has no store_id:', productId, product);
        alert('无法加载库存历史：找不到商品所属店铺');
        return;
    }
    
    console.log('Viewing stock history for product:', productId, 'in store:', product.store_id);
    
    // 创建模态框
    const historyModal = document.createElement('div');
    historyModal.className = 'modal';
    historyModal.id = 'stockHistoryModal';
    
    // 初始内容
    historyModal.innerHTML = `
        <div class="modal-content" style="width: 80%;">
            <span class="close">&times;</span>
            <h2><i class="material-icons">history</i> Stock History: ${product.name}</h2>
            <div class="store-info">Store: ${stores[product.store_id]?.name || product.store_id}</div>
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
                    <div class="store-info">Store: ${stores[product.store_id]?.name || product.store_id}</div>
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
                    <div class="store-info">Store: ${stores[product.store_id]?.name || product.store_id}</div>
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
                <div class="store-info">Store: ${stores[product.store_id]?.name || product.store_id}</div>
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
    console.log(`Loading stock history for store ${storeId}, product ${productId}`);
    
    // 确保storeId参数有值
    if (!storeId) {
        console.error('Missing storeId for stock history lookup');
        return Promise.resolve({});
    }
    
    return database.ref(`stock_history/${storeId}/${productId}`).once('value')
        .then(snapshot => {
            const historyData = snapshot.val() || {};
            console.log(`Found ${Object.keys(historyData).length} history records for store ${storeId}, product ${productId}`);
            return historyData;
        })
        .catch(error => {
            console.error(`Error loading stock history for store ${storeId}, product ${productId}:`, error);
            return {};
        });
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
    console.log("初始化应用...");
    
    // 更新时间
    updateDateTime();
    setInterval(updateDateTime, 60000); // 每分钟更新一次
    
    // 获取当前用户并设置权限
    const user = firebase.auth().currentUser;
    if (user) {
        getUserRole(user.uid).then(role => {
            // 根据用户角色设置菜单项可见性
            if (role === 'admin') {
                // 对于普通管理员，隐藏 stores 和 users 菜单
                const storesNavItem = document.querySelector('.nav-item[data-view="stores"]');
                const usersNavItem = document.querySelector('.nav-item[data-view="users"]');
                
                if (storesNavItem) storesNavItem.style.display = 'none';
                if (usersNavItem) usersNavItem.style.display = 'none';
                
                console.log('已为 admin 角色隐藏 stores 和 users 菜单项');
            }
        });
    }
    
    // 初始化事件监听器
    initEventListeners();
    
    // 设置默认日期为今天
    selectedDate = getCurrentDate();
    document.getElementById('dateFilter').value = selectedDate;
    
    // 加载数据
    loadStores().then(() => {
        // 加载商品数据
        loadProducts();
        
        // 加载销售统计数据
        loadStats();
        
        // 渲染店铺数据
        renderStores();
        
        // 如果是超级管理员，加载在线用户数据
        if (document.body.classList.contains('is-sadmin')) {
            // 仅对超级管理员加载在线用户
            loadOnlineUsers();
        }
    });
    
    // 加载用户数据
    loadUsers();
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

// 新的销售汇总功能
let currentSalesSummary = []; // 存储当前销售汇总数据
let currentSalesData = {}; // 存储原始销售数据
let summaryChart = null; // Chart.js 实例
let currentViewMode = 'table'; // 当前视图模式

// 显示销售汇总
function showSalesSummary() {
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    
    // 显示模态框
    showModal(salesSummaryModal);
    
    // 显示加载状态
    showSummaryLoadingState(true);
    
    // 获取销售数据
    let salesPromise;
    if (storeId === 'all') {
        // 对于所有店铺，我们需要获取所有店铺的销售数据
        salesPromise = loadAllStoresSalesForSummary(date);
    } else {
        salesPromise = getStoreSaleDetails(storeId, date);
    }
    
    salesPromise
        .then(sales => {
            console.log('Sales data loaded for summary:', sales);
            
            // 如果没有真实数据，生成示例数据用于演示
            if (Object.keys(sales).length === 0 && storeId === 'all') {
                console.log('No real sales data found, generating sample data for demonstration');
                sales = generateSampleSalesData();
            }
            
            currentSalesData = sales;
            // 生成销售汇总
            generateSalesSummary(sales);
            showSummaryLoadingState(false);
        })
        .catch(error => {
            console.error('Failed to load sales data for summary:', error);
            showSummaryLoadingState(false);
            
            // 如果加载失败且是All Stores，显示示例数据
            if (storeId === 'all') {
                console.log('Loading failed, showing sample data for All Stores');
                const sampleSales = generateSampleSalesData();
                currentSalesData = sampleSales;
                generateSalesSummary(sampleSales);
                showSummaryLoadingState(false);
            } else {
                showSummaryError('加载销售汇总数据失败');
            }
        });
}

// 显示/隐藏加载状态
function showSummaryLoadingState(show) {
    const loadingState = document.getElementById('summaryLoadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'flex' : 'none';
    }
}

// 显示错误信息
function showSummaryError(message) {
    const contentArea = document.querySelector('.summary-content-area');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="error-state">
                <i class="material-icons">error</i>
                <p>${message}</p>
            </div>
        `;
    }
}

// 生成销售汇总
function generateSalesSummary(sales) {
    // 如果没有销售数据
    if (Object.keys(sales).length === 0) {
        currentSalesSummary = [];
        updateSummaryStats();
        renderCurrentView();
        
        // 显示友好的无数据提示
        const contentArea = document.querySelector('.summary-content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="no-data-state">
                    <div class="no-data-icon">
                        <i class="material-icons">assessment</i>
                    </div>
                    <div class="no-data-title">暂无销售数据</div>
                    <div class="no-data-message">
                        <p>当前日期没有找到销售记录。</p>
                        <p>请尝试：</p>
                        <ul>
                            <li>选择其他日期</li>
                            <li>确认已有销售交易</li>
                            <li>检查网络连接</li>
                        </ul>
                    </div>
                    <div class="no-data-actions">
                        <button onclick="location.reload()" class="action-button">
                            <i class="material-icons">refresh</i>
                            <span>刷新页面</span>
                        </button>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // 按产品汇总销售数据
    const productSummary = {};
    const categories = new Set();
    
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
            const category = item.category && item.category.trim() !== '' ? item.category : 'Uncategorized';
            
            // 如果产品ID为空，则跳过
            if (!productId) return;
            
            categories.add(category);
            
            // 如果产品尚未在汇总中，初始化它
            if (!productSummary[productId]) {
                productSummary[productId] = {
                    id: productId,
                    name: productName,
                    category: category,
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
            
            // 更新价格为最新价格
            if (productSummary[productId].unitPrice !== unitPrice) {
                productSummary[productId].unitPrice = unitPrice;
            }
        });
    });
    
    // 转换为数组以便排序
    currentSalesSummary = Object.values(productSummary);
    
    // 更新分类选择器
    updateCategoryFilter(Array.from(categories));
    
    // 更新统计数据
    updateSummaryStats();
    
    // 渲染当前视图
    renderCurrentView();
}

// Update category filter
function updateCategoryFilter(categories) {
    const categorySelect = document.getElementById('summaryCategory');
    if (categorySelect) {
        // Save current selection
        const currentValue = categorySelect.value;
        
        // Clear and repopulate options
        categorySelect.innerHTML = '<option value="all">All Categories</option>';
        
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        
        // Restore selection
        if (currentValue && categories.includes(currentValue)) {
            categorySelect.value = currentValue;
        }
    }
}

// 更新统计卡片 - 已移除统计卡片显示
function updateSummaryStats() {
    // 统计卡片已移除，此函数保留以避免错误
}

// 获取筛选后的汇总数据
function getFilteredSummary() {
    const categoryFilter = document.getElementById('summaryCategory')?.value || 'all';
    const minQuantityFilter = parseInt(document.getElementById('summaryMinQuantity')?.value || '0');
    
    return currentSalesSummary.filter(product => {
        const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
        const quantityMatch = product.totalQuantity >= minQuantityFilter;
        return categoryMatch && quantityMatch;
    });
}

// 获取排序后的汇总数据
function getSortedSummary() {
    const sortBy = document.getElementById('summarySortBy')?.value || 'quantity';
    const filteredSummary = getFilteredSummary();
    
    return [...filteredSummary].sort((a, b) => {
    switch (sortBy) {
        case 'quantity':
                return b.totalQuantity - a.totalQuantity;
        case 'revenue':
                return b.totalRevenue - a.totalRevenue;
        case 'name':
                return a.name.localeCompare(b.name);
            case 'profit':
                // 简单的利润计算（假设成本为售价的70%）
                const profitA = a.totalRevenue * 0.3;
                const profitB = b.totalRevenue * 0.3;
                return profitB - profitA;
        default:
                return b.totalQuantity - a.totalQuantity;
        }
    });
}

// 渲染当前视图
function renderCurrentView() {
    switch (currentViewMode) {
        case 'table':
            renderTableView();
            break;
        case 'heatmap':
            renderHeatmapView();
            break;
        case 'chart':
            renderChartView();
            break;
    }
}

// 渲染表格视图
function renderTableView() {
    const sortedSummary = getSortedSummary();
    const tableBody = document.getElementById('summaryTableBody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (sortedSummary.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No data matching the criteria</td></tr>';
        return;
    }
    
    const totalRevenue = sortedSummary.reduce((sum, product) => sum + product.totalRevenue, 0);
    
    sortedSummary.forEach(product => {
        const percentage = totalRevenue > 0 ? (product.totalRevenue / totalRevenue * 100).toFixed(1) : '0.0';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>RM${product.unitPrice.toFixed(2)}</td>
            <td>${product.totalQuantity}</td>
            <td>RM${product.totalRevenue.toFixed(2)}</td>
            <td>${product.saleCount}</td>
            <td>${percentage}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// 渲染热力图视图
function renderHeatmapView() {
    const sortedSummary = getSortedSummary();
    const heatmapContainer = document.getElementById('heatmapGrid');
    
    if (!heatmapContainer) return;
    
    heatmapContainer.innerHTML = '';
    
    if (sortedSummary.length === 0) {
        heatmapContainer.innerHTML = '<div class="no-data">No data matching the criteria</div>';
        return;
    }
    
    // 计算热力图强度级别
    const maxQuantity = Math.max(...sortedSummary.map(p => p.totalQuantity));
    const maxRevenue = Math.max(...sortedSummary.map(p => p.totalRevenue));
    
    sortedSummary.forEach(product => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        // 根据销售数量和收入计算热力强度
        const quantityRatio = product.totalQuantity / maxQuantity;
        const revenueRatio = product.totalRevenue / maxRevenue;
        const intensity = (quantityRatio + revenueRatio) / 2;
        
        // 设置热力强度等级
        let intensityClass = '';
        if (intensity >= 0.75) {
            intensityClass = 'intensity-high';
        } else if (intensity >= 0.5) {
            intensityClass = 'intensity-medium-high';
        } else if (intensity >= 0.25) {
            intensityClass = 'intensity-medium-low';
        } else {
            intensityClass = 'intensity-low';
        }
        
        cell.classList.add(intensityClass);
        
        cell.innerHTML = `
            <div class="heatmap-cell-content">
                <div class="heatmap-cell-header">
                    <div class="heatmap-cell-title">${product.name}</div>
                    <div class="heatmap-cell-id">${product.id}</div>
                </div>
                <div class="heatmap-cell-stats">
                    <div class="heatmap-cell-stat">
                        <div class="heatmap-cell-stat-value">${product.totalQuantity}</div>
                        <div class="heatmap-cell-stat-label">Quantity</div>
                    </div>
                    <div class="heatmap-cell-stat">
                        <div class="heatmap-cell-stat-value">${product.saleCount}</div>
                        <div class="heatmap-cell-stat-label">Sales Count</div>
                    </div>
                </div>
                <div class="heatmap-cell-revenue">
                    <div class="heatmap-cell-revenue-value">RM${product.totalRevenue.toFixed(2)}</div>
                    <div class="heatmap-cell-revenue-label">Total Revenue</div>
                </div>
            </div>
        `;
        
        // 添加点击事件显示详细信息
        cell.addEventListener('click', () => {
            showProductHeatmapDetails(product);
        });
        
        heatmapContainer.appendChild(cell);
    });
}

// 渲染图表视图
function renderChartView() {
    const canvas = document.getElementById('summaryChart');
    if (!canvas) return;
    
    // 销毁现有图表
    if (summaryChart) {
        summaryChart.destroy();
    }
    
    const sortedSummary = getSortedSummary().slice(0, 10); // 只显示前10个
    const activeTab = document.querySelector('.chart-tab.active')?.dataset.chart || 'bar';
    
    renderChart(canvas, sortedSummary, activeTab);
}

// 渲染具体图表
function renderChart(canvas, data, chartType) {
    const ctx = canvas.getContext('2d');
    
    const labels = data.map(product => product.name);
    const quantities = data.map(product => product.totalQuantity);
    const revenues = data.map(product => product.totalRevenue);
    
    let chartConfig = {};
    
    switch (chartType) {
        case 'bar':
            chartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '销售数量',
                        data: quantities,
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            };
            break;
            
        case 'pie':
            chartConfig = {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: revenues,
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                            '#4BC0C0', '#FF6384'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            };
            break;
            
        case 'line':
            chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '销售收入',
                        data: revenues,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            };
            break;
    }
    
    summaryChart = new Chart(ctx, chartConfig);
}

// 初始化销售汇总事件监听器
function initSalesSummaryEventListeners() {
    // 视图模式切换按钮
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新按钮状态
            document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 切换视图模式
            currentViewMode = btn.dataset.mode;
            switchSummaryView(currentViewMode);
        });
    });
    
    // 排序选择变化
    const sortSelect = document.getElementById('summarySortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            updateSummaryStats();
            renderCurrentView();
        });
    }
    
    // 筛选条件变化
    const categorySelect = document.getElementById('summaryCategory');
    const minQuantitySelect = document.getElementById('summaryMinQuantity');
    
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            updateSummaryStats();
            renderCurrentView();
        });
    }
    
    if (minQuantitySelect) {
        minQuantitySelect.addEventListener('change', () => {
            updateSummaryStats();
            renderCurrentView();
        });
    }
    
    // 操作按钮事件
    const screenshotBtn = document.getElementById('screenshotSummaryBtn');
    const exportBtn = document.getElementById('exportSummaryBtn');
    const printBtn = document.getElementById('printSummaryBtn');
    
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', screenshotSalesSummary);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSalesSummary);
    }
    
    if (printBtn) {
        printBtn.addEventListener('click', printSalesSummary);
    }
    
    // 图表标签切换
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 更新标签状态
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 重新渲染图表
            if (currentViewMode === 'chart') {
                renderChartView();
            }
        });
    });
}

// 切换汇总视图
function switchSummaryView(viewMode) {
    // 隐藏所有视图
    document.querySelectorAll('.summary-view').forEach(view => {
        view.classList.remove('active');
    });
    
    // 显示选中的视图
    let targetViewId = '';
    if (viewMode === 'heatmap') {
        targetViewId = 'summaryHeatmapView';
    } else {
        targetViewId = `summary${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}View`;
    }
    
    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // 渲染当前视图
    renderCurrentView();
}

// Print sales summary
function printSalesSummary() {
    if (currentSalesSummary.length === 0) {
        alert('No data to print');
        return;
    }
    
    // Create print content
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    const storeName = storeId === 'all' ? 'All Stores' : (stores[storeId]?.name || storeId);
    
    const sortedSummary = getSortedSummary();
    const totalQuantity = sortedSummary.reduce((sum, product) => sum + product.totalQuantity, 0);
    const totalRevenue = sortedSummary.reduce((sum, product) => sum + product.totalRevenue, 0);
    
    let printContent = `
        <html>
        <head>
            <title>Sales Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .info { margin-bottom: 20px; }
                .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
                .stat-item { text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total-row { font-weight: bold; background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sales Summary Report</h1>
                <p>Date: ${date} | Store: ${storeName}</p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <h3>${sortedSummary.length}</h3>
                    <p>Product Types</p>
            </div>
                <div class="stat-item">
                    <h3>${totalQuantity}</h3>
                    <p>Total Quantity Sold</p>
        </div>
                <div class="stat-item">
                    <h3>RM${totalRevenue.toFixed(2)}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>
            
            <table>
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Unit Price</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                    <th>Sales Count</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedSummary.forEach(product => {
        printContent += `
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
    
    printContent += `
            </tbody>
        </table>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>Report Generated: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;
    
    // 打开新窗口并打印
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Export sales summary as CSV
function exportSalesSummary() {
    if (currentSalesSummary.length === 0) {
        alert('No data to export');
        return;
    }
    
    const sortedSummary = getSortedSummary();
    
    // 构建CSV内容
    let csvContent = 'Product ID,Product Name,Unit Price,Quantity Sold,Total Revenue,Sale Count,Percentage\n';
    
    const totalRevenue = sortedSummary.reduce((sum, product) => sum + product.totalRevenue, 0);
    
    sortedSummary.forEach(product => {
        const percentage = totalRevenue > 0 ? (product.totalRevenue / totalRevenue * 100).toFixed(1) : '0.0';
        const row = [
            `"${product.id}"`,
            `"${product.name.replace(/"/g, '""')}"`,
            product.unitPrice.toFixed(2),
            product.totalQuantity,
            product.totalRevenue.toFixed(2),
            product.saleCount,
            percentage
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

// Sales summary screenshot function
function screenshotSalesSummary() {
    if (currentSalesSummary.length === 0) {
        alert('No data to screenshot');
        return;
    }
    
    // Get current modal content
    const modalContent = document.querySelector('.sales-summary-modal');
    if (!modalContent) {
        alert('Cannot find summary content');
        return;
    }
    
    // 创建截图容器
    const screenshotContainer = document.createElement('div');
    screenshotContainer.style.position = 'fixed';
    screenshotContainer.style.top = '0';
    screenshotContainer.style.left = '0';
    screenshotContainer.style.width = '100vw';
    screenshotContainer.style.height = '100vh';
    screenshotContainer.style.backgroundColor = 'white';
    screenshotContainer.style.zIndex = '10000';
    screenshotContainer.style.padding = '20px';
    screenshotContainer.style.boxSizing = 'border-box';
    screenshotContainer.style.overflow = 'auto';
    
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    const storeName = storeId === 'all' ? 'All Stores' : (stores[storeId]?.name || storeId);
    
    // 创建截图内容
    const sortedSummary = getSortedSummary();
    const totalQuantity = sortedSummary.reduce((sum, product) => sum + product.totalQuantity, 0);
    const totalRevenue = sortedSummary.reduce((sum, product) => sum + product.totalRevenue, 0);
    
    screenshotContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; border-radius: 10px;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">Sales Summary Report</h1>
            <p style="margin: 0; font-size: 16px;">Date: ${date} | Store: ${storeName}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold;">${sortedSummary.length}</div>
                <div style="font-size: 14px; opacity: 0.9;">Product Types</div>
            </div>
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold;">${totalQuantity}</div>
                <div style="font-size: 14px; opacity: 0.9;">Total Quantity Sold</div>
            </div>
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold;">RM${totalRevenue.toFixed(2)}</div>
                <div style="font-size: 14px; opacity: 0.9;">Total Revenue</div>
            </div>
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold;">RM${totalQuantity > 0 ? (totalRevenue / totalQuantity).toFixed(2) : '0.00'}</div>
                <div style="font-size: 14px; opacity: 0.9;">Average Price</div>
            </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%); color: white;">
                    <th style="padding: 15px; text-align: left;">Product ID</th>
                    <th style="padding: 15px; text-align: left;">Product Name</th>
                    <th style="padding: 15px; text-align: left;">Unit Price</th>
                    <th style="padding: 15px; text-align: left;">Quantity Sold</th>
                    <th style="padding: 15px; text-align: left;">Revenue</th>
                    <th style="padding: 15px; text-align: left;">Sales Count</th>
                    <th style="padding: 15px; text-align: left;">Percentage</th>
                </tr>
            </thead>
            <tbody>
                ${sortedSummary.map((product, index) => {
                    const percentage = totalRevenue > 0 ? (product.totalRevenue / totalRevenue * 100).toFixed(1) : '0.0';
                    const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                    return `
                        <tr style="background-color: ${bgColor};">
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${product.id}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${product.name}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">RM${product.unitPrice.toFixed(2)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${product.totalQuantity}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">RM${product.totalRevenue.toFixed(2)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${product.saleCount}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${percentage}%</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>Report Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <button id="closeSummaryScreenshot" style="position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 18px; z-index: 10001;">×</button>
    `;
    
    // 添加到文档
    document.body.appendChild(screenshotContainer);
    
    // 添加关闭按钮事件
    document.getElementById('closeSummaryScreenshot').addEventListener('click', () => {
        document.body.removeChild(screenshotContainer);
    });
    
    // 延迟截图以确保渲染完成
    setTimeout(() => {
        html2canvas(screenshotContainer, {
            scale: 2,
            logging: false,
            allowTaint: true,
            useCORS: true,
            backgroundColor: 'white'
        }).then(canvas => {
            // 转换为图片并下载
            const imageData = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            const filename = `Sales_Summary_${storeName.replace(/\s+/g, '_')}_${date}.png`;
            
            downloadLink.href = imageData;
            downloadLink.download = filename;
            downloadLink.click();
            
            // 自动关闭截图视图
            setTimeout(() => {
                if (document.body.contains(screenshotContainer)) {
                    document.body.removeChild(screenshotContainer);
                }
            }, 1000);
        }).catch(error => {
            console.error('Screenshot failed:', error);
            alert('Screenshot failed, please try again');
            if (document.body.contains(screenshotContainer)) {
                document.body.removeChild(screenshotContainer);
            }
        });
    }, 1000);
}

// 获取在线用户
function loadOnlineUsers() {
    // 显示加载中状态
    const onlineUsersTableBody = document.getElementById('onlineUsersTableBody');
    onlineUsersTableBody.innerHTML = '<tr><td colspan="5" class="loading-message">Loading online users data...</td></tr>';
    
    // 查询用户状态数据
    database.ref('user_status').once('value')
        .then(snapshot => {
            onlineUsers = {};
            const now = Date.now();
            const userStatusData = snapshot.val() || {};
            
            // 检查每个用户的状态
            Object.keys(userStatusData).forEach(userId => {
                const userStatus = userStatusData[userId];
                // 只保留24小时内活动的用户，增加时间范围以显示更多用户的最后在线时间
                const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
                if (userStatus.last_changed > twentyFourHoursAgo || userStatus.last_online > twentyFourHoursAgo) {
                    onlineUsers[userId] = userStatus;
                }
            });
            
            renderOnlineUsers();
        })
        .catch(error => {
            console.error('Failed to get online users data:', error);
            onlineUsersTableBody.innerHTML = '<tr><td colspan="5" class="error-message">Failed to get online users data</td></tr>';
        });
}

// 渲染在线用户列表
function renderOnlineUsers() {
    const onlineUsersTableBody = document.getElementById('onlineUsersTableBody');
    
    // 清空现有内容
    onlineUsersTableBody.innerHTML = '';
    
    if (Object.keys(onlineUsers).length === 0) {
        onlineUsersTableBody.innerHTML = '<tr><td colspan="5" class="empty-message">No online users at the moment</td></tr>';
        return;
    }
    
    // 排序：先在线的，再按角色排序
    const sortedUsers = Object.entries(onlineUsers).sort((a, b) => {
        // 先按状态排序（在线 > 离线）
        if (a[1].state === 'online' && b[1].state !== 'online') return -1;
        if (a[1].state !== 'online' && b[1].state === 'online') return 1;
        
        // 再按最后在线时间排序（最近的优先）
        if (a[1].last_online && b[1].last_online) {
            return b[1].last_online - a[1].last_online;
        }
        
        // 再按角色排序
        const roleOrder = { 'sadmin': 1, 'admin': 2, 'staff': 3, 'unknown': 4 };
        const roleA = roleOrder[a[1].role] || 4;
        const roleB = roleOrder[b[1].role] || 4;
        return roleA - roleB;
    });
    
    // 创建每一行用户数据
    sortedUsers.forEach(([userId, userStatus]) => {
        const row = document.createElement('tr');
        
        // 用户名/邮箱
        const displayNameCell = document.createElement('td');
        displayNameCell.textContent = userStatus.display_name || 'Unknown User';
        row.appendChild(displayNameCell);
        
        // 用户角色
        const roleCell = document.createElement('td');
        const roleMap = {
            'sadmin': 'Super Admin',
            'admin': 'Admin',
            'staff': 'Cashier',
            'unknown': 'Unknown Role'
        };
        roleCell.textContent = roleMap[userStatus.role] || 'Unknown Role';
        row.appendChild(roleCell);
        
        // 用户状态
        const stateCell = document.createElement('td');
        const isOnline = userStatus.state === 'online';
        stateCell.innerHTML = `<span class="user-status ${isOnline ? 'online' : 'offline'}">${isOnline ? 'Online' : 'Offline'}</span>`;
        row.appendChild(stateCell);
        
        // 当前活动时间 - 显示最近状态变化时间
        const lastChangedCell = document.createElement('td');
        if (userStatus.last_changed) {
            const lastChangeDate = new Date(userStatus.last_changed);
            lastChangedCell.textContent = formatDateTime(lastChangeDate);
        } else {
            lastChangedCell.textContent = 'Unknown';
        }
        row.appendChild(lastChangedCell);
        
        // 最后在线时间 - 显示用户最后一次在线的时间
        const lastOnlineCell = document.createElement('td');
        if (userStatus.last_online) {
            const lastOnlineDate = new Date(userStatus.last_online);
            lastOnlineCell.textContent = formatDateTime(lastOnlineDate);
            
            // 计算离现在多久
            const timeAgo = getTimeAgo(lastOnlineDate);
            if (timeAgo) {
                lastOnlineCell.innerHTML += `<br><span class="time-ago">(${timeAgo})</span>`;
            }
        } else {
            lastOnlineCell.textContent = 'Unknown';
        }
        row.appendChild(lastOnlineCell);
        
        onlineUsersTableBody.appendChild(row);
    });
}

// 格式化日期时间
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 获取时间间隔的友好显示
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    }
    if (diffHour > 0) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    }
    if (diffMin > 0) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    }
    if (diffSec > 0) {
        return diffSec === 1 ? '1 second ago' : `${diffSec} seconds ago`;
    }
    return 'just now';
}

// 检查用户是否是超级管理员
function checkSuperAdminStatus(userId) {
    return new Promise((resolve, reject) => {
        firebase.database().ref(`users/${userId}`).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                resolve(userData && userData.role === 'sadmin');
            })
            .catch(error => {
                console.error('检查超级管理员状态失败:', error);
                resolve(false);
            });
    });
}

// 显示快速增加库存模态框
function showAddStockModal(productId) {
    const product = products[productId];
    if (!product) return;
    
    const quantity = prompt(`Add stock for "${product.name}"\nCurrent stock: ${product.stock !== undefined ? product.stock : (product.quantity || 0)}\n\nEnter quantity to add:`);
    
    if (quantity === null) return; // 用户取消
    
    const quantityNumber = parseInt(quantity);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
        alert('Please enter a valid positive number');
        return;
    }
    
    // 获取当前库存
    const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
    const newStock = currentStock + quantityNumber;
    
    // 更新库存记录
    updateProductStock(productId, newStock, 'add', quantityNumber, 'Quick add stock', 'Added via quick add button')
        .then(() => {
            loadInventory(); // 重新加载库存
            alert(`Successfully added ${quantityNumber} items to ${product.name}!\nNew stock: ${newStock}`);
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
    updateProductStock(productId, newStock, 'subtract', 1, 'Product testing', 'Tested via tester button')
        .then(() => {
            loadInventory(); // 重新加载库存
            alert(`Successfully tested ${product.name}!\nStock reduced by 1. New stock: ${newStock}`);
        })
        .catch(error => {
            console.error('Failed to test product:', error);
            alert('Failed to test product. Please try again.');
        });
}

// 为Sales Summary加载所有店铺的销售数据
function loadAllStoresSalesForSummary(date) {
    return new Promise((resolve, reject) => {
        // 先获取所有店铺列表
        getAllStores()
            .then(storeList => {
                const storeIds = Object.keys(storeList);
                const promises = [];
                
                // 对每个店铺获取销售记录
                storeIds.forEach(storeId => {
                    promises.push(
                        database.ref(`sales/${storeId}/${date}`).once('value')
                            .then(snapshot => {
                                const sales = snapshot.val() || {};
                                // 将店铺ID添加到每个销售记录中
                                const salesWithStoreId = {};
                                Object.keys(sales).forEach(saleId => {
                                    if (sales[saleId]) {
                                        salesWithStoreId[saleId] = {
                                            ...sales[saleId],
                                            store_id: sales[saleId].store_id || storeId
                                        };
                                    }
                                });
                                return salesWithStoreId;
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
                resolve(sales);
            })
            .catch(error => {
                console.error('Failed to load all stores sales for summary:', error);
                reject(error);
            });
    });
}

// 生成示例销售数据用于演示
function generateSampleSalesData() {
    console.log('Generating sample sales data for demonstration');
    
    const sampleProducts = [
        { id: 'P001', name: 'Coca Cola 330ml', price: 2.50, category: 'Beverages' },
        { id: 'P002', name: 'Pepsi 330ml', price: 2.50, category: 'Beverages' },
        { id: 'P003', name: 'Mineral Water 500ml', price: 1.50, category: 'Beverages' },
        { id: 'P004', name: 'Instant Noodles', price: 3.20, category: 'Food' },
        { id: 'P005', name: 'Bread Loaf', price: 4.50, category: 'Food' },
        { id: 'P006', name: 'Milk 1L', price: 6.80, category: 'Dairy' },
        { id: 'P007', name: 'Eggs (12pcs)', price: 8.90, category: 'Dairy' },
        { id: 'P008', name: 'Rice 5kg', price: 15.50, category: 'Food' },
        { id: 'P009', name: 'Cooking Oil 1L', price: 7.20, category: 'Food' },
        { id: 'P010', name: 'Shampoo 400ml', price: 12.90, category: 'Personal Care' }
    ];
    
    const sampleSales = {};
    const currentDate = getCurrentDate();
    const currentTime = new Date();
    
    // 生成10个示例销售记录
    for (let i = 1; i <= 10; i++) {
        const saleId = `SAMPLE_SALE_${i}`;
        const billNumber = `BILL${String(i).padStart(4, '0')}`;
        
        // 随机选择1-4个产品
        const numItems = Math.floor(Math.random() * 4) + 1;
        const items = [];
        let totalAmount = 0;
        
        for (let j = 0; j < numItems; j++) {
            const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3个
            const subtotal = product.price * quantity;
            
            items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: subtotal,
                category: product.category
            });
            
            totalAmount += subtotal;
        }
        
        // 随机添加一些折扣
        let discountAmount = 0;
        let discountPercent = 0;
        let discountType = 'percent';
        
        if (Math.random() < 0.3) { // 30%的概率有折扣
            if (Math.random() < 0.5) {
                // 百分比折扣
                discountPercent = Math.floor(Math.random() * 15) + 5; // 5-20%
                discountAmount = totalAmount * (discountPercent / 100);
                discountType = 'percent';
            } else {
                // 固定金额折扣
                discountAmount = Math.floor(Math.random() * 5) + 1; // RM1-5
                discountType = 'amount';
            }
            totalAmount -= discountAmount;
        }
        
        // 生成时间戳（当天的不同时间）
        const saleTime = new Date(currentTime);
        saleTime.setHours(Math.floor(Math.random() * 12) + 8); // 8AM-8PM
        saleTime.setMinutes(Math.floor(Math.random() * 60));
        saleTime.setSeconds(Math.floor(Math.random() * 60));
        
        const timestamp = saleTime.toISOString().slice(0, 19).replace('T', ' ');
        
        sampleSales[saleId] = {
            billNumber: billNumber,
            store_id: 'SAMPLE_STORE',
            items: items,
            total_amount: totalAmount,
            subtotal: totalAmount + discountAmount,
            discountType: discountType,
            discountPercent: discountPercent,
            discountAmount: discountAmount,
            date: currentDate,
            timestamp: timestamp,
            staff_id: 'SAMPLE_STAFF',
            cashierName: `Cashier ${i}`,
            cashierShift: Math.random() < 0.7 ? '1st Shift' : '2nd Shift'
        };
    }
    
    console.log('Generated sample sales data:', sampleSales);
    return sampleSales;
}

// 显示产品热力图详细信息
function showProductHeatmapDetails(product) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // 计算产品收入占总收入的百分比
    const totalRevenue = currentSalesSummary.reduce((sum, p) => sum + p.totalRevenue, 0);
    const percentage = totalRevenue > 0 ? (product.totalRevenue / totalRevenue * 100).toFixed(1) : '0.0';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close">&times;</span>
            <h2><i class="material-icons">info</i> Product Details</h2>
            <div class="product-detail-container">
                <div class="product-detail-header">
                    <h3>${product.name}</h3>
                    <p><strong>Product ID:</strong> ${product.id}</p>
                    <p><strong>Unit Price:</strong> RM${product.unitPrice.toFixed(2)}</p>
                </div>
                <div class="product-detail-stats">
                    <div class="detail-stat-grid">
                        <div class="detail-stat-item">
                            <div class="detail-stat-value">${product.totalQuantity}</div>
                            <div class="detail-stat-label">Total Quantity Sold</div>
                        </div>
                        <div class="detail-stat-item">
                            <div class="detail-stat-value">${product.saleCount}</div>
                            <div class="detail-stat-label">Sales Count</div>
                        </div>
                        <div class="detail-stat-item">
                            <div class="detail-stat-value">RM${product.totalRevenue.toFixed(2)}</div>
                            <div class="detail-stat-label">Total Revenue</div>
                        </div>
                        <div class="detail-stat-item">
                            <div class="detail-stat-value">${percentage}%</div>
                            <div class="detail-stat-label">Revenue Percentage</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}