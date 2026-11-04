// 添加调试日志
console.log("Admin page script loading");
console.log("Current path:", window.location.pathname);
console.log("Current URL:", window.location.href);

// 定义全局变量
let stores = {}; // 存储店铺数据
let products = {}; // 存储商品数据
let users = {}; // 存储用户数据
let onlineUsers = {}; // 存储在线用户数据
let announcements = {}; // 存储公告数据
let currentAnnouncement = null; // 当前活跃的公告
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
const productCategoryFilter = document.getElementById('productCategoryFilter');
const productSearch = document.getElementById('productSearch');
const productPromotionFilter = document.getElementById('productPromotionFilter');
const productsTableBody = document.getElementById('productsTableBody');
const addProductModal = document.getElementById('addProductModal');
const addProductForm = document.getElementById('addProductForm');
const productStoreId = document.getElementById('productStoreId');
const addProductProBtn = document.getElementById('addProductProBtn');
const addProductProModal = document.getElementById('addProductProModal');
const addProductProForm = document.getElementById('addProductProForm');
const proStoreId = document.getElementById('proStoreId');
const proStartId = document.getElementById('proStartId');
const proAddRowBtn = document.getElementById('proAddRowBtn');
const proProductsTableBody = document.getElementById('proProductsTableBody');

// 用户管理DOM元素
const addUserBtn = document.getElementById('addUserBtn');
const usersTableBody = document.getElementById('usersTableBody');
const addUserModal = document.getElementById('addUserModal');
const addUserForm = document.getElementById('addUserForm');
const userRole = document.getElementById('userRole');
const userStoreContainer = document.getElementById('userStoreContainer');
const userStoreId = document.getElementById('userStoreId');

// 公告管理DOM元素
const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
const announcementGlobalToggle = document.getElementById('announcementGlobalToggle');
const announcementStatus = document.getElementById('announcementStatus');
const previewContent = document.getElementById('previewContent');
const announcementsTableBody = document.getElementById('announcementsTableBody');
const announcementModal = document.getElementById('announcementModal');
const announcementForm = document.getElementById('announcementForm');
const announcementText = document.getElementById('announcementText');
const announcementColor = document.getElementById('announcementColor');
const announcementColorText = document.getElementById('announcementColorText');
const announcementBackground = document.getElementById('announcementBackground');
const announcementBackgroundText = document.getElementById('announcementBackgroundText');
const announcementAnimation = document.getElementById('announcementAnimation');
const announcementScrollingPreview = document.getElementById('announcementScrollingPreview');
const previewAnnouncementBtn = document.getElementById('previewAnnouncementBtn');
const charCount = document.getElementById('charCount');

// 模态框Off按钮
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

// Stock History DOM元素
const stockHistoryStoreFilter = document.getElementById('stockHistoryStoreFilter');
const stockHistoryDatePicker = document.getElementById('stockHistoryDatePicker');
const refreshStockHistoryBtn = document.getElementById('refreshStockHistoryBtn');
const stockHistoryTableBody = document.getElementById('stockHistoryTableBody');
const stockHistoryTitle = document.getElementById('stockHistoryTitle');
const totalItemsReceived = document.getElementById('totalItemsReceived');
const totalQuantityReceived = document.getElementById('totalQuantityReceived');
const lastReceiptTime = document.getElementById('lastReceiptTime');

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
    // 初始化店铺支付方式编辑器（银行列表 / 启用开关）
    initStorePaymentEditors();
    // 初始化银行 logo 上传表单（纯 DOM 绑定，读库在登录后）
    initBankLogoEditors();
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
                        // 更新管理员信息显示
                        document.getElementById('adminEmail').textContent = user.email;
                        
                        // 获取并显示用户名
                        getUserInfo(user.uid).then(userInfo => {
                            if (userInfo && userInfo.name) {
                                document.getElementById('adminName').textContent = userInfo.name;
                            } else {
                                // 如果没有设置名字，使用邮箱名作为默认
                                document.getElementById('adminName').textContent = user.email.split('@')[0];
                            }
                        });
                        
                        // 获取角色并显示
                        getUserRole(user.uid).then(role => {
                            let roleDisplay = 'Admin';
                            if (role === 'sadmin') {
                                roleDisplay = 'Super Admin';
                                // 如果是超级管理员，添加特殊类以显示超级管理员专用功能
                                document.body.classList.add('is-sadmin');
                                console.log('超级管理员登录，启用特殊功能');
                                if (viewSalesSummaryBtn) {
                                    viewSalesSummaryBtn.style.display = 'flex';
                                }
                            } else {
                                document.body.classList.remove('is-sadmin');
                                if (viewSalesSummaryBtn) {
                                    viewSalesSummaryBtn.style.display = 'none';
                                }
                            }
                            document.getElementById('adminRole').textContent = roleDisplay;
                            
                            // 根据用户角色设置菜单项可见性
                            if (role === 'admin') {
                                // 对于普通管理员，隐藏 stores 和 users 菜单
                                const storesNavItem = document.querySelector('.nav-item[data-view="stores"]');
                                const usersNavItem = document.querySelector('.nav-item[data-view="users"]');
                                
                                if (storesNavItem) storesNavItem.style.display = 'none';
                                if (usersNavItem) usersNavItem.style.display = 'none';

                                // 普通管理员看不到 Settings 整组（仅超级管理员可见）
                                const settingsGroup = document.getElementById('settingsNavGroup');
                                if (settingsGroup) settingsGroup.style.display = 'none';
                                
                                console.log('已为 admin 角色隐藏 stores 和 users 菜单项');
                            } else if (role === 'sadmin') {
                                // 超级管理员：确保 Settings 分组可见
                                const settingsGroup = document.getElementById('settingsNavGroup');
                                if (settingsGroup) settingsGroup.style.display = '';
                            }
                        });
                        
                        // 获取当日总销售额并计算星级评分
                        const today = getCurrentDate();
                        getAllStoresDailySales(today)
                            .then(salesData => {
                                updateSalesRateStars(salesData);
                            })
                            .catch(error => {
                                console.error("获取销售数据失败:", error);
                                document.getElementById('adminSalesRate').textContent = "N/A";
                            });
                        
                        // 加载数据
                        init();
                    } else {
                        // 不是管理员，重定向到POS页面
                        window.location.href = getFullPath('pages/pos.html');
                    }
                });
        } else {
            // 未登录，重定向到登录页面
            window.location.href = getFullPath('index.html');
        }
    });
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

// 更新销售额星级评分
function updateSalesRateStars(salesData) {
    // 计算总销售额
    let totalSales = 0;
    
    // 遍历所有店铺的销售额
    Object.keys(salesData).forEach(storeId => {
        const storeStats = salesData[storeId] || {};
        totalSales += parseFloat(storeStats.total_sales) || 0;
    });
    
    // 计算星星数量（每10000销售额一颗星，最多5颗星）
    let starCount = Math.floor(totalSales / 10000);
    starCount = Math.min(Math.max(starCount, 0), 5); // 限制在0-5之间
    
    // 生成星星HTML，第一个星星前面添加一个空格
    let starsHtml = '&nbsp;'; // 添加空格
    
    for (let i = 0; i < starCount; i++) {
        starsHtml += '<i class="material-icons">star</i>';
    }
    
    // 如果没有星星，显示一个空星星
    if (starCount === 0) {
        starsHtml = '&nbsp;<i class="material-icons">star_border</i>';
    }
    
    // 更新显示
    document.getElementById('adminSalesRate').innerHTML = starsHtml;
}

// 显示刷新动画效果
function showRefreshAnimation() {
    const refreshAnimation = document.getElementById('refreshAnimation');
    if (refreshAnimation) {
        // 显示动画
        refreshAnimation.style.opacity = '1';
        refreshAnimation.style.pointerEvents = 'all';
        
        // 1.5秒后隐藏动画
        setTimeout(() => {
            refreshAnimation.style.opacity = '0';
            refreshAnimation.style.pointerEvents = 'none';
        }, 1500);
    }
}

// 侧边栏 Settings 分组的展开/收起
function initSettingsNavGroup() {
    const group = document.getElementById('settingsNavGroup');
    const header = document.getElementById('settingsNavHeader');
    if (!group || !header) return;

    // 默认展开，记住用户上次的选择
    let saved = null;
    try { saved = localStorage.getItem('adminSettingsNavOpen'); } catch (e) { /* 忽略隐私模式限制 */ }
    if (saved === 'false') group.classList.remove('open');
    header.setAttribute('aria-expanded', group.classList.contains('open') ? 'true' : 'false');

    const toggle = () => {
        const isOpen = group.classList.toggle('open');
        header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        try { localStorage.setItem('adminSettingsNavOpen', isOpen ? 'true' : 'false'); } catch (e) { /* 忽略 */ }
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });

    // 折叠状态下打开属于该分组的视图时，自动展开，避免看不到当前激活项
    const submenu = document.getElementById('settingsNavSubmenu');
    if (submenu) {
        submenu.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => {
                if (!group.classList.contains('open')) {
                    group.classList.add('open');
                    header.setAttribute('aria-expanded', 'true');
                    try { localStorage.setItem('adminSettingsNavOpen', 'true'); } catch (e) { /* 忽略 */ }
                }
            });
        });
    }
}

// 下拉框错误态：只有用户动过 / 提交校验失败才显示红框
function initSelectValidationStyling() {
    if (window.__adminSelectValidationBound) return;
    window.__adminSelectValidationBound = true;

    // invalid 事件不冒泡，用捕获阶段监听
    document.addEventListener('invalid', function (e) {
        if (e.target && e.target.tagName === 'SELECT') {
            e.target.classList.add('required-touched');
        }
    }, true);

    document.addEventListener('change', function (e) {
        if (e.target && e.target.tagName === 'SELECT') {
            e.target.classList.add('required-touched');
        }
    }, true);
}

// 初始化事件监听器
function initEventListeners() {
    // 下拉框错误态：只有用户交互过（或提交校验失败）才标红，避免一打开表单就红框
    initSelectValidationStyling();

    // 添加导航项点击事件处理
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.view) {
            item.addEventListener('click', () => {
                changeView(item.dataset.view);
            });
        }
    });
    
    // 导航菜单切换视图
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;
            switchView(targetView);
        });
    });

    // 侧边栏 Settings 分组折叠
    initSettingsNavGroup();
    
    // 刷新统计按钮
    refreshStatsBtn.addEventListener('click', () => {
        // 显示粒子动画效果
        showRefreshAnimation();
        
        // 添加按钮旋转效果
        refreshStatsBtn.classList.add('refreshing');
        
        // 先清除缓存，然后重新加载数据
        dataCache.clearCache();
        console.log("缓存已清除，正在从Firebase重新加载数据...");
        loadStats();
        
        // 1.5秒后移除按钮旋转效果
        setTimeout(() => {
            refreshStatsBtn.classList.remove('refreshing');
        }, 1500);
    });
    
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
    addProductBtn.addEventListener('click', () => {
        showModal(addProductModal);
        // 添加促销价格开关事件监听
        const promotionEnabledCheckbox = document.getElementById('productPromotionEnabled');
        const promotionPriceGroup = document.getElementById('productPromotionPriceGroup');
        if (promotionEnabledCheckbox && promotionPriceGroup) {
            // 移除旧的事件监听器（如果有）
            const newCheckbox = promotionEnabledCheckbox.cloneNode(true);
            promotionEnabledCheckbox.parentNode.replaceChild(newCheckbox, promotionEnabledCheckbox);
            
            newCheckbox.addEventListener('change', function() {
                promotionPriceGroup.style.display = this.checked ? 'block' : 'none';
            });
        }
        // 添加员工价格开关事件监听
        const staffEnabledCheckbox = document.getElementById('productStaffPriceEnabled');
        const staffPriceGroup = document.getElementById('productStaffPriceGroup');
        if (staffEnabledCheckbox && staffPriceGroup) {
            // 移除旧的事件监听器（如果有）
            const newCheckbox = staffEnabledCheckbox.cloneNode(true);
            staffEnabledCheckbox.parentNode.replaceChild(newCheckbox, staffEnabledCheckbox);
            
            newCheckbox.addEventListener('change', function() {
                staffPriceGroup.style.display = this.checked ? 'block' : 'none';
            });
        }
    });
    
    // 商品店铺过滤器变化
    productStoreFilter.addEventListener('change', loadProducts);
    
    // 商品类别过滤器变化
    if (productCategoryFilter) {
        productCategoryFilter.addEventListener('change', loadProducts);
    }
    
    // 商品搜索框输入变化
    if (productSearch) {
        productSearch.addEventListener('input', loadProducts);
    }
    
    // 商品促销过滤器变化
    if (productPromotionFilter) {
        productPromotionFilter.addEventListener('change', loadProducts);
    }
    
    // 添加用户按钮
    addUserBtn.addEventListener('click', () => showModal(addUserModal));
    
    // 用户角色变化
    userRole.addEventListener('change', toggleStoreSelection);
    
    // 维护模式切换按钮（仅超级管理员可见）
    const maintenanceToggle = document.getElementById('maintenanceToggle');
    if (maintenanceToggle) {
        maintenanceToggle.addEventListener('click', toggleMaintenanceMode);
    }
    
    // 公告管理事件监听器
    if (addAnnouncementBtn) {
        addAnnouncementBtn.addEventListener('click', () => showAnnouncementModal());
    }
    
    if (announcementGlobalToggle) {
        announcementGlobalToggle.addEventListener('change', toggleAnnouncementGlobal);
    }
    
    if (announcementText) {
        announcementText.addEventListener('input', updateCharCount);
        announcementText.addEventListener('input', updateAnnouncementPreview);
    }
    
    if (announcementColor) {
        announcementColor.addEventListener('change', syncColorInputs);
        announcementColor.addEventListener('change', updateAnnouncementPreview);
    }
    
    if (announcementColorText) {
        announcementColorText.addEventListener('input', syncColorInputs);
        announcementColorText.addEventListener('input', updateAnnouncementPreview);
    }
    
    if (announcementBackground) {
        announcementBackground.addEventListener('change', syncBackgroundInputs);
        announcementBackground.addEventListener('change', updateAnnouncementPreview);
    }
    
    if (announcementBackgroundText) {
        announcementBackgroundText.addEventListener('input', syncBackgroundInputs);
        announcementBackgroundText.addEventListener('input', updateAnnouncementPreview);
    }
    
    if (previewAnnouncementBtn) {
        previewAnnouncementBtn.addEventListener('click', updateAnnouncementPreview);
    }
    
    if (announcementAnimation) {
        announcementAnimation.addEventListener('change', updateAnnouncementPreview);
    }
    
    // 监听所有影响预览的字段
    ['announcementFont', 'announcementSize', 'announcementWeight', 'announcementSpeed'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', updateAnnouncementPreview);
        }
    });
    
    if (announcementForm) {
        announcementForm.addEventListener('submit', handleAnnouncementSubmit);
    }
    
    // 添加店铺表单提交
    addStoreForm.addEventListener('submit', handleAddStore);
    
    // 编辑店铺表单提交
    const editStoreForm = document.getElementById('editStoreForm');
    if (editStoreForm) {
        editStoreForm.addEventListener('submit', handleEditStore);
    }
    
    // 添加商品表单提交
    addProductForm.addEventListener('submit', handleAddProduct);
    
    // 批量添加商品相关事件
    if (addProductProBtn) {
        addProductProBtn.addEventListener('click', () => {
            // 重置表单
            addProductProForm.reset();
            // 清空列表
            proProductsTableBody.innerHTML = '';
            // 添加首行
            addProProductRow();
            // 显示模态框
            showModal(addProductProModal);
        });
    }

    if (proAddRowBtn) {
        proAddRowBtn.addEventListener('click', () => {
            addProProductRow();
        });
    }

    if (addProductProForm) {
        addProductProForm.addEventListener('submit', handleAddProductPro);
    }

    if (proStartId) {
        proStartId.addEventListener('input', () => {
            recalculateRowIds();
        });
    }

    const proSaleUnit = document.getElementById('proSaleUnit');
    if (proSaleUnit) {
        proSaleUnit.addEventListener('change', () => {
            const isInfinite = proSaleUnit.value === 'infinite';
            const rows = document.querySelectorAll('#proProductsTableBody tr');
            rows.forEach(row => {
                const stockInput = row.querySelector('.pro-stock-input');
                if (stockInput) {
                    if (isInfinite) {
                        stockInput.value = '999999';
                        stockInput.disabled = true;
                    } else {
                        stockInput.disabled = false;
                        if (stockInput.value === '999999') {
                            stockInput.value = '0';
                        }
                        if (proSaleUnit.value === 'weight') {
                            stockInput.step = '0.001';
                        } else {
                            stockInput.step = '1';
                        }
                    }
                }
            });
        });
    }
    
    // 添加用户表单提交
    addUserForm.addEventListener('submit', handleAddUser);
    
    // Off模态框按钮
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            hideModal(modal);
        });
    });
    
    // 点击模态框外部Off模态框
    window.addEventListener('click', event => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });
    
    // 销售详情模态框Off按钮
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
    refreshInventoryBtn.addEventListener('click', () => {
        // 显示粒子动画效果
        showRefreshAnimation();
        
        // 添加按钮旋转效果
        refreshInventoryBtn.classList.add('refreshing');
        
        // 执行库存刷新
        loadInventory();
        
        // 1.5秒后移除按钮旋转效果
        setTimeout(() => {
            refreshInventoryBtn.classList.remove('refreshing');
        }, 1500);
    });
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
    
    // Stock History 相关事件监听
    if (stockHistoryStoreFilter) {
        stockHistoryStoreFilter.addEventListener('change', loadStockHistoryView);
    }
    if (stockHistoryDatePicker) {
        stockHistoryDatePicker.addEventListener('change', loadStockHistoryView);
        // 设置默认日期为今天
        stockHistoryDatePicker.value = getCurrentDate();
    }
    if (refreshStockHistoryBtn) {
        refreshStockHistoryBtn.addEventListener('click', () => {
            // 显示粒子动画效果
            showRefreshAnimation();
            
            // 添加按钮旋转效果
            refreshStockHistoryBtn.classList.add('refreshing');
            
            // 执行刷新
            loadStockHistoryView();
            
            // 1.5秒后移除按钮旋转效果
            setTimeout(() => {
                refreshStockHistoryBtn.classList.remove('refreshing');
            }, 1500);
        });
    }
    
    // 在线用户刷新按钮
    const refreshOnlineUsersBtn = document.getElementById('refreshOnlineUsersBtn');
    if (refreshOnlineUsersBtn) {
        refreshOnlineUsersBtn.addEventListener('click', () => {
            // 显示粒子动画效果
            showRefreshAnimation();
            
            // 添加按钮旋转效果
            refreshOnlineUsersBtn.classList.add('refreshing');
            
            // 执行在线用户数据刷新
            loadOnlineUsers();
            
            // 1.5秒后移除按钮旋转效果
            setTimeout(() => {
                refreshOnlineUsersBtn.classList.remove('refreshing');
            }, 1500);
        });
    }
    
    // 添加编辑用户表单的提交事件处理
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }
    
    // 添加编辑用户角色变更时的店铺选择项切换
    const editUserRole = document.getElementById('editUserRole');
    if (editUserRole) {
        editUserRole.addEventListener('change', toggleEditStoreSelection);
    }
}

// 仅超级管理员 (sadmin) 可访问的视图
const SADMIN_ONLY_VIEWS = ['cashier-names', 'online-users', 'announcement'];

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
                alert("You do not have permission to access this feature");
                
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

            // Settings 分组内的视图仅超级管理员可访问
            if (role !== 'sadmin' && SADMIN_ONLY_VIEWS.indexOf(viewName) !== -1) {
                console.log("当前用户无权限访问 Settings 视图:", viewName);
                alert("You do not have permission to access Settings (Super Admin only)");

                performViewSwitch('dashboard');
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
        case 'online-users':
            viewTitle.textContent = 'Online Users';
            break;
        case 'announcement':
            viewTitle.textContent = 'Announcement Management';
            break;
        case 'stock-history':
            viewTitle.textContent = 'Stock History';
            // 确保商店下拉菜单已填充
            if (stockHistoryStoreFilter && Object.keys(stores).length > 0) {
                // 重新填充商店下拉菜单
                while (stockHistoryStoreFilter.options.length > 1) {
                    stockHistoryStoreFilter.remove(1);
                }
                
                Object.keys(stores).forEach(storeId => {
                    const option = document.createElement('option');
                    option.value = storeId;
                    option.textContent = stores[storeId].name;
                    stockHistoryStoreFilter.appendChild(option);
                });
            }
            break;
        case 'cashier-names':
            viewTitle.textContent = 'Cashier Name Cleanup';
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
            } else if (viewName === 'announcement') {
                loadAnnouncements();
            } else if (viewName === 'stock-history') {
                // 确保商店下拉菜单已填充
                if (stockHistoryStoreFilter && stockHistoryStoreFilter.options.length <= 1) {
                    populateStoreDropdowns();
                }
                loadStockHistoryView();
            } else if (viewName === 'cashier-names') {
                // 收银员名字批量整理工具（js/cashier-names.js）
                if (typeof window.loadCashierNamesView === 'function') {
                    window.loadCashierNamesView();
                }
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

// 之前的店铺子菜单切换函数已被移除

// 加载所有店铺
function loadStores() {
    // 必须 return：init 里用 loadStores().then(...) 串了后续加载（含 loadBankLogos）
    return getAllStores()
        .then(storeData => {
            stores = storeData;
            renderStores();
            populateStoreDropdowns();
            return storeData;
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
        storesTableBody.innerHTML = '<tr><td colspan="8" class="no-data"><i class="material-icons">storefront</i><strong>No stores yet</strong><small>Click “Add Store” to create your first outlet.</small></td></tr>';
        return;
    }
    
    Object.keys(stores).forEach(storeId => {
        const store = stores[storeId];
        const payTags = getStorePaymentTags(store);
        const paymentCell = payTags.length
            ? `<div class="store-pay-tags">${payTags.map(t => `<span class="store-pay-tag">${t.label}</span>`).join('')}</div>`
            : '<span class="store-pay-tag none">None</span>';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${storeId}</td>
            <td>${store.name}</td>
            <td>${store.address || '-'}</td>
            <td>
                <label class="switch" style="transform: scale(0.85); display: inline-block; vertical-align: middle;">
                    <input type="checkbox" class="store-layout-toggle" data-id="${storeId}" ${store.posLayout === 'food' ? 'checked' : ''}>
                    <span class="slider round"></span>
                </label>
            </td>
            <td>${store.shiftCount !== undefined ? store.shiftCount : 2}</td>
            <td>${store.taxRate !== undefined ? store.taxRate + '%' : '0%'}</td>
            <td>${paymentCell}</td>
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
    
    // 添加事件监听器到布局切换开关
    document.querySelectorAll('#storesTableBody .store-layout-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const isCategory = e.target.checked;
            const posLayout = isCategory ? 'food' : 'default';
            
            database.ref(`stores/${id}`).update({ posLayout })
                .then(() => {
                    console.log(`Successfully updated layout for store ${id} to ${posLayout}`);
                    if (stores[id]) {
                        stores[id].posLayout = posLayout;
                    }
                })
                .catch(error => {
                    console.error(`Failed to update layout for store ${id}:`, error);
                    alert('Failed to update layout: ' + error.message);
                    // Revert toggle state
                    e.target.checked = !isCategory;
                });
        });
    });
}

// 填充店铺下拉菜单
function populateStoreDropdowns() {
    // 清空并重新填充店铺过滤器
    const dropdowns = [productStoreFilter, productStoreId, userStoreId, inventoryStoreFilter, stockHistoryStoreFilter, proStoreId];
    
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
    
    console.log("已填充所有下拉菜单和店铺按钮");
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

// 店铺子菜单功能已被移除

// 加载销售统计数据
function loadStats() {
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    
    // 显示加载状态
    statsContainer.innerHTML = '<div class="loading"><i class="material-icons">hourglass_empty</i> Loading...</div>';
    saleDetailsBody.innerHTML = '<tr><td colspan="9" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
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
                    const datePath = getDatePathFromString(date);
                    promises.push(
                        database.ref(`sales/${storeId}/${datePath.path}`).once('value')
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
                        // 处理销售数据 - 加入store_id和cashierShift
                        const salesWithStoreId = {};
                        Object.keys(result.sales).forEach(saleId => {
                            if (result.sales[saleId]) {
                                salesWithStoreId[saleId] = {
                                    ...result.sales[saleId],
                                    store_id: result.sales[saleId].store_id || result.storeId,
                                    cashierShift: result.sales[saleId].cashierShift || "Unknown Shift"
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
                saleDetailsBody.innerHTML = '<tr><td colspan="9" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
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
    const datePath = getDatePathFromString(date);
    database.ref(`sales/${storeId}/${datePath.path}`).once('value')
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
            
            // 确保销售记录有store_id和cashierShift
            const salesWithStoreId = {};
            Object.keys(sales).forEach(saleId => {
                if (sales[saleId]) {
                    salesWithStoreId[saleId] = {
                        ...sales[saleId],
                        store_id: sales[saleId].store_id || storeId,
                        cashierShift: sales[saleId].cashierShift || "Unknown Shift"
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
            saleDetailsBody.innerHTML = '<tr><td colspan="9" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
            });
    }

// 计算销售统计
function calculateStatsFromSales(sales) {
    let totalSales = 0;
    let transactionCount = 0;
    let firstShiftSales = 0;
    let firstShiftTransactions = 0;
    let secondShiftSales = 0;
    let secondShiftTransactions = 0;
    
    // 计算总销售额和交易数，以及各班次销售数据
    Object.keys(sales).forEach(saleId => {
        if (sales[saleId]) {
            const saleAmount = Number(sales[saleId].total_amount || 0);
            totalSales += saleAmount;
            transactionCount++;
            
            // 根据班次统计数据
            const shift = sales[saleId].cashierShift || "";
            if (shift.includes("1st Shift")) {
                firstShiftSales += saleAmount;
                firstShiftTransactions++;
            } else if (shift.includes("2nd Shift")) {
                secondShiftSales += saleAmount;
                secondShiftTransactions++;
            }
        }
    });
    
    return {
        total_sales: totalSales,
        transaction_count: transactionCount,
        first_shift_sales: firstShiftSales,
        first_shift_transactions: firstShiftTransactions,
        second_shift_sales: secondShiftSales,
        second_shift_transactions: secondShiftTransactions
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

// Store ID 排序：数字部分按数值比较（ST2 排在 ST10 前面），其余按字符比较
function compareStoreId(a, b) {
    const sa = String(a == null ? '' : a);
    const sb = String(b == null ? '' : b);
    return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' });
}

// 渲染统计数据
function renderStats(salesData, isAllStores) {
    statsContainer.innerHTML = '';
    console.log("Rendering stats with data:", salesData);
    
    if (!salesData || Object.keys(salesData).length === 0) {
        statsContainer.innerHTML = '<div class="no-data"><i class="material-icons">bar_chart</i><strong>No sales data for this date</strong><small>Pick another date or store to see totals.</small></div>';
        return;
    }
    
    // 如果是所有店铺视图，更新销售评级
    if (isAllStores) {
        updateSalesRateStars(salesData);
    }
    
    // 计算总销售额和总交易数
    let totalSales = 0;
    let totalTransactions = 0;
    let firstShiftSales = 0;
    let firstShiftTransactions = 0;
    let secondShiftSales = 0;
    let secondShiftTransactions = 0;
    
    Object.keys(salesData).forEach(storeId => {
        const storeData = salesData[storeId];
        if (storeData) {
            // 确保数值正确转换
            totalSales += parseFloat(storeData.total_sales) || 0;
            totalTransactions += parseInt(storeData.transaction_count) || 0;
            
            // 如果有班次数据，累加班次销售额
            if (!isAllStores) {
                firstShiftSales += parseFloat(storeData.first_shift_sales) || 0;
                firstShiftTransactions += parseInt(storeData.first_shift_transactions) || 0;
                secondShiftSales += parseFloat(storeData.second_shift_sales) || 0;
                secondShiftTransactions += parseInt(storeData.second_shift_transactions) || 0;
            }
        }
    });
    
    console.log("Total sales calculated:", totalSales, "from data:", salesData);
    
    const fmtMoney = (v) => 'RM' + (Math.round(v * 100) / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ===== 1. 顶部 Hero 大卡：总计 =====
    const hero = document.createElement('div');
    hero.className = 'stat-hero';
    hero.innerHTML = `
        <div class="stat-hero-icon"><i class="material-icons">trending_up</i></div>
        <div class="stat-hero-body">
            <span class="stat-hero-label">Total Sales Today</span>
            <span class="stat-hero-value">${fmtMoney(totalSales)}</span>
        </div>
        <div class="stat-hero-meta">
            <span class="stat-hero-metric"><i class="material-icons">receipt_long</i> ${totalTransactions} transactions</span>
            <span class="stat-hero-metric"><i class="material-icons">store</i> ${Object.keys(salesData).length} store${Object.keys(salesData).length === 1 ? '' : 's'}</span>
        </div>
    `;
    statsContainer.appendChild(hero);

    // ===== 2. 班次卡（单店视图）=====
    if (!isAllStores) {
        const makeShiftCard = (title, icon, sales, txns, barClass) => `
            <div class="stat-card stat-card-shift">
                <div class="stat-card-top">
                    <span class="stat-card-icon ${barClass}"><i class="material-icons">${icon}</i></span>
                    <span class="stat-card-label">${title}</span>
                </div>
                <div class="stat-card-value">${fmtMoney(sales)}</div>
                <div class="stat-card-sub"><i class="material-icons">receipt_long</i> ${txns} transactions</div>
            </div>`;
        const shiftWrap = document.createElement('div');
        shiftWrap.className = 'stat-shift-row';
        shiftWrap.innerHTML =
            makeShiftCard('1st Shift', 'wb_sunny', firstShiftSales, firstShiftTransactions, 'shift-1') +
            makeShiftCard('2nd Shift', 'nights_stay', secondShiftSales, secondShiftTransactions, 'shift-2');
        statsContainer.appendChild(shiftWrap);
    }

    // ===== 3. 分店卡（所有店铺视图）：按 Store ID 升序，零销售额降灰 =====
    if (isAllStores) {
        const entries = Object.keys(salesData).map(storeId => {
            const d = salesData[storeId] || {};
            return {
                storeId,
                name: stores[storeId]?.name || `Store ${storeId}`,
                sales: parseFloat(d.total_sales) || 0,
                txns: parseInt(d.transaction_count) || 0
            };
        }).sort((a, b) => compareStoreId(a.storeId, b.storeId));

        if (entries.length) {
            // 进度条仍以「销售额最高的那家」为满格基准
            const maxSales = entries.reduce((m, e) => Math.max(m, e.sales), 0) || 1;
            const grid = document.createElement('div');
            grid.className = 'stat-store-grid';
            grid.innerHTML = entries.map(e => {
                const pct = maxSales > 0 ? Math.max(0, Math.round((e.sales / maxSales) * 100)) : 0;
                const isZero = e.sales <= 0;
                return `
                    <div class="stat-card stat-card-store ${isZero ? 'is-zero' : ''}">
                        <div class="stat-card-top">
                            <span class="stat-card-icon ${isZero ? '' : 'icon-store'}"><i class="material-icons">${isZero ? 'remove' : 'storefront'}</i></span>
                            <span class="stat-card-label" title="${e.name}">${e.name}</span>
                            ${isZero ? '<span class="stat-zero-badge">No sales</span>' : ''}
                        </div>
                        <div class="stat-card-value">${fmtMoney(e.sales)}</div>
                        <div class="stat-card-bar"><span style="width:${pct}%"></span></div>
                        <div class="stat-card-sub"><i class="material-icons">receipt_long</i> ${e.txns} transaction${e.txns === 1 ? '' : 's'}</div>
                    </div>`;
            }).join('');
            statsContainer.appendChild(grid);
        }
    }
}

// 加载所有店铺的销售详情
function loadAllStoresSaleDetails(date) {
    // 先获取所有店铺列表
    getAllStores()
        .then(storeList => {
            const storeIds = Object.keys(storeList);
            const promises = [];
            const datePath = getDatePathFromString(date);
            
            // 对每个店铺获取销售记录 - 只获取特定日期的数据
            storeIds.forEach(storeId => {
                promises.push(
                    database.ref(`sales/${storeId}/${datePath.path}`).once('value')
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
            saleDetailsBody.innerHTML = '<tr><td colspan="9" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
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
            saleDetailsBody.innerHTML = '<tr><td colspan="9" class="error"><i class="material-icons">error</i> Failed to load sales details</td></tr>';
        });
}

// 最近一次渲染的销售数据（logo 上传后重新渲染用）
let lastRenderedSales = null;

// 银行单元格：logo 在前、名字在后
function formatBankCell(bankName) {
    const name = String(bankName || '').trim();
    if (!name) return '<span class="bank-cell-none">–</span>';
    const logo = getBankLogo(name);
    const logoHtml = logo ? `<img class="bank-cell-logo" src="${logo}" alt="">` : '';
    return `<span class="bank-cell" title="${escapeHtml(name)}">${logoHtml}<span>${escapeHtml(name)}</span></span>`;
}

// 渲染销售详情
function renderSaleDetails(sales) {
    lastRenderedSales = sales || null;
    saleDetailsBody.innerHTML = '';
    
    if (Object.keys(sales).length === 0) {
                    saleDetailsBody.innerHTML = '<tr><td colspan="9" class="no-data"><i class="material-icons">receipt_long</i><strong>No sales on this date</strong><small>Try another date, or pick a different store.</small></td></tr>';
            return;
    }
    
    // 按时间排序，最新的在前面
    const sortedSales = Object.keys(sales).sort((a, b) => {
        return sales[b].timestamp.localeCompare(sales[a].timestamp);
    });
    
    sortedSales.forEach(saleId => {
        const sale = sales[saleId];
        const storeName = stores[sale.store_id]?.name || sale.store_id;
        const cashierName = sale.cashierName || 'N/A';
        const shiftName = sale.cashierShift || 'N/A';
        
        // 计算折扣信息的显示
        let discountInfo = '';
        if (sale.discountAmount > 0) {
            const discountType = sale.discountType || 'percent';
            const discountIcon = discountType === 'percent' ? '%' : '$';
            discountInfo = ` <span class="discount-info" title="${discountType === 'percent' ? `${sale.discountPercent}% discount` : 'Fixed discount'}">
                <i class="material-icons" style="font-size: 16px; color: #e53935;">local_offer</i>${discountIcon}
            </span>`;
        }
        const isStaffApplied = sale.isStaffPriceApplied || (sale.items && sale.items.some(item => item.isStaffPriceApplied));
        if (isStaffApplied) {
            discountInfo += ` <span class="discount-info staff-applied-info" title="Staff Price Applied" style="background-color: #e8f5e9; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: bold; color: #2e7d32; display: inline-flex; align-items: center; gap: 2px; vertical-align: middle; margin-left: 4px;">
                <i class="material-icons" style="font-size: 14px; color: #2e7d32;">badge</i>Staff
            </span>`;
        }
        
        // 确定班次样式类
        let shiftClass = 'shift-badge-unknown';
        if (shiftName.includes('1st Shift')) {
            shiftClass = 'shift-badge-1';
        } else if (shiftName.includes('2nd Shift')) {
            shiftClass = 'shift-badge-2';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.billNumber || 'N/A'}</td>
            <td>${storeName}</td>
            <td>${sale.timestamp}</td>
            <td>${cashierName}</td>
            <td><div class="shift-badge ${shiftClass}">${shiftName}</div></td>
            <td><span class="pay-inline"><i class="material-icons">${getAdminPaymentIcon(sale)}</i>${formatAdminPaymentLabel(sale)}</span></td>
            <td>${formatBankCell(sale.paymentBank)}</td>
            <td>RM${sale.total_amount.toFixed(2)}${discountInfo}</td>
            <td><button class="view-details-btn icon-button" data-id="${saleId}" title="查看详情"><i class="material-icons">visibility</i></button></td>
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
    // 添加班次信息
    const shiftName = sale.cashierShift || 'N/A';
    const shiftElement = document.getElementById('sale-detail-shift');
    
    // 确定班次样式类
    let shiftClass = 'shift-badge-unknown';
    if (shiftName.includes('1st Shift')) {
        shiftClass = 'shift-badge-1';
    } else if (shiftName.includes('2nd Shift')) {
        shiftClass = 'shift-badge-2';
    }
    
    // 应用样式并设置内容
    shiftElement.innerHTML = '';
    const shiftBadge = document.createElement('div');
    shiftBadge.className = `shift-badge ${shiftClass}`;
    shiftBadge.textContent = shiftName;
    shiftElement.appendChild(shiftBadge);
    
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

        // 如果有税额信息
        if (sale.taxAmount > 0) {
            const taxP = document.createElement('p');
            taxP.innerHTML = `Tax (${sale.taxRate}%): <strong>RM${sale.taxAmount.toFixed(2)}</strong>`;
            summaryDiv.appendChild(taxP);
        }
    }
    
    // 总计信息
    const totalP = document.createElement('p');
    totalP.innerHTML = `<strong>Total: RM${sale.total_amount.toFixed(2)}</strong>`;
    summaryDiv.appendChild(totalP);

    // 支付方式信息
    const paymentP = document.createElement('p');
    paymentP.innerHTML = `Payment: <strong>${formatAdminPaymentLabel(sale)}</strong>`;
    summaryDiv.appendChild(paymentP);

    // 分批付款：每一部分的金额
    const adminSplits = normalizeAdminPaymentSplits(sale.paymentSplits);
    adminSplits.forEach(s => {
        const p = document.createElement('p');
        const label = s.method === 'qr' ? 'QR' : s.method === 'card' ? 'Credit Card' : (s.label || 'Cash');
        const bank = s.bank ? ` (${escapeHtml(s.bank)})` : '';
        p.innerHTML = `${label}${bank}: <strong>RM${(Number(s.amount) || 0).toFixed(2)}</strong>`;
        summaryDiv.appendChild(p);
    });

    if (sale.paymentBank && adminSplits.length === 0) {
        const bankP = document.createElement('p');
        bankP.innerHTML = `Bank: ${formatBankCell(sale.paymentBank)}`;
        summaryDiv.appendChild(bankP);
    }

    if (sale.cashReceived !== null && sale.cashReceived !== undefined) {
        const cashP = document.createElement('p');
        cashP.innerHTML = `Cash Received: <strong>RM${Number(sale.cashReceived).toFixed(2)}</strong> · Change: <strong>RM${Number(sale.changeAmount || 0).toFixed(2)}</strong>`;
        summaryDiv.appendChild(cashP);
    }
    
    summaryContainer.appendChild(summaryDiv);
    
    // 显示模态框
    showModal(saleDetailModal);
}

// ===== 店铺支付方式配置（Payment Methods） =====
// 默认不预填任何银行：每家店由 Admin 自己选择要接受的银行
const ADMIN_DEFAULT_QR_BANKS = [];
const ADMIN_DEFAULT_CARD_BANKS = [];

const bankChipConfig = {
    add: {
        qr: { chips: 'storeQRBankChips', input: 'storeQRBankInput', button: 'storeQRBankAdd' },
        card: { chips: 'storeCardBankChips', input: 'storeCardBankInput', button: 'storeCardBankAdd' }
    },
    edit: {
        qr: { chips: 'editQRBankChips', input: 'editQRBankInput', button: 'editQRBankAdd' },
        card: { chips: 'editCardBankChips', input: 'editCardBankInput', button: 'editCardBankAdd' }
    }
};

const bankDrafts = {
    add: { qr: [], card: [] },
    edit: { qr: [], card: [] }
};

// ===== 银行 Logo =====
// 存 Realtime Database：bankLogos/<key> = { name, dataUrl, ts }
// key = 银行名规范化（小写、非字母数字转连字符），这样 "Maybank" / "maybank" 共用一个 logo
const bankLogoCache = {}; // key -> { name, dataUrl }
const BANK_LOGO_MAX_W = 160;
const BANK_LOGO_MAX_H = 96;
const BANK_LOGO_CACHE_KEY = 'adminBankLogos';

// 本地兜底：RTDB 读不到/断网时，至少还能显示上次加载到的 logo（否则刷新后全变回纯文字）
function restoreBankLogoCache() {
    try {
        const raw = localStorage.getItem(BANK_LOGO_CACHE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw) || {};
        Object.keys(data).forEach(key => {
            const item = data[key];
            if (item && item.dataUrl) bankLogoCache[key] = { name: item.name || key, dataUrl: item.dataUrl };
        });
    } catch (err) {
        console.warn('[BankLogos] cache read failed:', err);
    }
}

function persistBankLogoCache() {
    try {
        localStorage.setItem(BANK_LOGO_CACHE_KEY, JSON.stringify(bankLogoCache));
    } catch (err) {
        console.warn('[BankLogos] cache write failed:', err);
    }
}

// 页面初始化就先读本地缓存，保证首屏（刷新后）也能立刻看到 logo
restoreBankLogoCache();

function bankLogoKey(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// 名字 -> dataUrl（没有就返回空串）
function getBankLogo(name) {
    const key = bankLogoKey(name);
    return key && bankLogoCache[key] ? bankLogoCache[key].dataUrl : '';
}

// 把上传的图片压到合适尺寸再转 base64，避免 RTDB 里塞大图
function resizeBankLogoImage(file) {
    return new Promise((resolve, reject) => {
        if (!file || !/^image\//.test(file.type)) {
            reject(new Error('Please choose an image file.'));
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the file.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('Could not decode this image.'));
            img.onload = () => {
                let srcW = img.naturalWidth || img.width || BANK_LOGO_MAX_W;
                let srcH = img.naturalHeight || img.height || BANK_LOGO_MAX_H;
                const scale = Math.min(BANK_LOGO_MAX_W / srcW, BANK_LOGO_MAX_H / srcH, 1);
                const w = Math.max(1, Math.round(srcW * scale));
                const h = Math.max(1, Math.round(srcH * scale));

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, w, h);

                // 有透明通道的格式保留 PNG，其余走 JPEG 省体积
                const keepAlpha = /png|webp|svg|gif/i.test(file.type);
                const dataUrl = keepAlpha
                    ? canvas.toDataURL('image/png')
                    : canvas.toDataURL('image/jpeg', 0.88);
                resolve(dataUrl);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

// 读取所有 logo
function loadBankLogos() {
    if (typeof database === 'undefined' || !database) return Promise.resolve();
    return database.ref('bankLogos').once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            // 读到空（可能是还没数据，也可能是规则临时拒绝）时不要清空已有缓存
            if (Object.keys(data).length === 0 && Object.keys(bankLogoCache).length > 0) {
                console.warn('[BankLogos] empty snapshot — keeping cached logos');
                refreshBankLogoUIs();
                return;
            }
            Object.keys(bankLogoCache).forEach(k => delete bankLogoCache[k]);
            Object.keys(data).forEach(k => {
                const item = data[k];
                if (item && item.dataUrl) {
                    bankLogoCache[k] = { name: item.name || k, dataUrl: item.dataUrl };
                }
            });
            persistBankLogoCache();
            // 老店铺还没有镜像数据时，自动补一份（POS 端靠它显示）
            backfillStoreBankLogos();
            refreshBankLogoUIs();
        })
        .catch(err => {
            console.warn('[BankLogos] load failed (using local cache):', err);
            refreshBankLogoUIs();
        });
}

/* ---------- 把 logo 镜像到店铺节点 ----------
 * POS 端是 staff 身份，只保证能读 stores/<id>；全局 bankLogos 若被规则限制读不到，
 * 就从店铺节点的 paymentLogos 兜底。结构：stores/<id>/paymentLogos/<key> = dataUrl
 */
function bankLogoKeysOfStore(store) {
    const ps = (store && store.paymentSettings) || {};
    const keys = {};
    ['qr', 'card'].forEach(type => {
        const banks = (ps[type] && Array.isArray(ps[type].banks)) ? ps[type].banks : [];
        banks.forEach(name => {
            const key = bankLogoKey(name);
            if (key) keys[key] = true;
        });
    });
    return Object.keys(keys);
}

// 按店铺当前配置生成 paymentLogos（店铺里删掉的银行自然不在里面）
function storePaymentLogosPayload(store) {
    const payload = {};
    bankLogoKeysOfStore(store).forEach(key => {
        if (bankLogoCache[key] && bankLogoCache[key].dataUrl) {
            payload[key] = bankLogoCache[key].dataUrl;
        }
    });
    return payload;
}

function syncStorePaymentLogos(storeId, store) {
    if (!storeId || typeof database === 'undefined' || !database) return Promise.resolve();
    const payload = storePaymentLogosPayload(store);
    return database.ref(`stores/${storeId}/paymentLogos`).set(payload)
        .catch(err => console.warn('[BankLogos] store sync failed:', err));
}

// 某个 logo 变化后，同步到所有用到这家银行的店铺
function syncBankLogoToStores(key, dataUrl) {
    if (!key || typeof database === 'undefined' || !database) return;
    Object.keys(stores || {}).forEach(storeId => {
        if (bankLogoKeysOfStore(stores[storeId]).indexOf(key) === -1) return;
        const ref = database.ref(`stores/${storeId}/paymentLogos/${key}`);
        const task = dataUrl ? ref.set(dataUrl) : ref.remove();
        task.catch(err => console.warn('[BankLogos] store sync failed:', err));
    });
}

// 首次加载后补齐所有店铺的镜像
function backfillStoreBankLogos() {
    Object.keys(stores || {}).forEach(storeId => {
        const store = stores[storeId];
        const keys = bankLogoKeysOfStore(store);
        if (!keys.length) return;
        const current = store.paymentLogos || {};
        const needsSync = keys.some(key => bankLogoCache[key] && current[key] !== bankLogoCache[key].dataUrl);
        if (needsSync) syncStorePaymentLogos(storeId, store);
    });
}

// 上传 / 覆盖某个银行的 logo
function saveBankLogo(name, dataUrl) {
    const key = bankLogoKey(name);
    if (!key) return Promise.reject(new Error('Bank name must contain letters or numbers.'));
    return database.ref('bankLogos/' + key).set({
        name: name,
        dataUrl: dataUrl,
        ts: Date.now()
    }).then(() => {
        bankLogoCache[key] = { name: name, dataUrl: dataUrl };
        persistBankLogoCache();
        syncBankLogoToStores(key, dataUrl);
        refreshBankLogoUIs();
    });
}

function deleteBankLogo(key) {
    const item = bankLogoCache[key];
    if (!item) return;
    if (!confirm(`Remove the logo for "${item.name}"?`)) return;
    database.ref('bankLogos/' + key).remove()
        .then(() => {
            delete bankLogoCache[key];
            persistBankLogoCache();
            syncBankLogoToStores(key, '');
            refreshBankLogoUIs();
        })
        .catch(err => alert('Failed to remove logo: ' + (err && err.message ? err.message : err)));
}

// 渲染某个弹窗里的 logo 列表
function renderBankLogoPanel(scope) {
    const container = document.getElementById('bankLogoList_' + scope);
    if (!container) return;
    const keys = Object.keys(bankLogoCache)
        .sort((a, b) => String(bankLogoCache[a].name).localeCompare(String(bankLogoCache[b].name)));

    if (!keys.length) {
        container.innerHTML = '<span class="bank-logo-empty">No logo uploaded yet</span>';
        return;
    }

    container.innerHTML = keys.map(key => {
        const item = bankLogoCache[key];
        const safeName = escapeHtml(item.name);
        return `<div class="bank-logo-tile" title="${safeName}">
            <img src="${item.dataUrl}" alt="${safeName}">
            <button type="button" class="bank-logo-del" data-key="${key}" title="Remove logo">&times;</button>
        </div>`;
    }).join('');

    container.querySelectorAll('.bank-logo-del').forEach(btn => {
        btn.addEventListener('click', () => deleteBankLogo(btn.dataset.key));
    });
}

// logo 变化后刷新所有依赖它的界面
function refreshBankLogoUIs() {
    renderBankLogoPanel('add');
    renderBankLogoPanel('edit');
    ['add', 'edit'].forEach(scope => {
        ['qr', 'card'].forEach(type => renderBankChips(scope, type));
    });
    syncBankNameSuggestions();
    // 销售明细的 Bank 列重新渲染，让新 logo 立刻出现
    if (lastRenderedSales) {
        renderSaleDetails(lastRenderedSales);
    }
}

// 把已上传的银行名补进输入框的自动补全列表
function syncBankNameSuggestions() {
    const list = document.getElementById('bankNameSuggestions');
    if (!list) return;
    const existing = new Set(Array.prototype.map.call(list.options, o => o.value.toLowerCase()));
    Object.keys(bankLogoCache).forEach(key => {
        const name = bankLogoCache[key].name;
        if (!existing.has(String(name).toLowerCase())) {
            const opt = document.createElement('option');
            opt.value = name;
            list.appendChild(opt);
            existing.add(String(name).toLowerCase());
        }
    });
}

// 绑定上传表单（两个弹窗各一套，scope 区分）
function initBankLogoEditors() {
    ['add', 'edit'].forEach(scope => {
        const fileInput = document.getElementById('bankLogoFile_' + scope);
        const nameInput = document.getElementById('bankLogoName_' + scope);
        const fileNameEl = document.getElementById('bankLogoFileName_' + scope);
        const uploadBtn = document.getElementById('bankLogoUpload_' + scope);
        if (!fileInput || !uploadBtn) return;

        let pendingFile = null;

        fileInput.addEventListener('change', () => {
            pendingFile = (fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;
            if (fileNameEl) fileNameEl.textContent = pendingFile ? pendingFile.name : 'Choose image';
            // 名字留空时用文件名兜底，少打一次字
            if (pendingFile && nameInput && !nameInput.value.trim()) {
                nameInput.value = pendingFile.name
                    .replace(/\.[^.]+$/, '')
                    .replace(/[-_]+/g, ' ')
                    .trim();
            }
        });

        uploadBtn.addEventListener('click', () => {
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                alert('Please enter the bank name first.');
                if (nameInput) nameInput.focus();
                return;
            }
            if (!pendingFile) {
                alert('Please choose an image file.');
                return;
            }

            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';

            resizeBankLogoImage(pendingFile)
                .then(dataUrl => {
                    if (dataUrl.length > 400000) {
                        throw new Error('Image is too large even after compression. Try a smaller file.');
                    }
                    return saveBankLogo(name, dataUrl);
                })
                .then(() => {
                    if (nameInput) nameInput.value = '';
                    fileInput.value = '';
                    pendingFile = null;
                    if (fileNameEl) fileNameEl.textContent = 'Choose image';
                    uploadBtn.textContent = 'Upload';
                    uploadBtn.disabled = false;
                })
                .catch(err => {
                    console.error('[BankLogos] upload failed:', err);
                    alert('Upload failed: ' + (err && err.message ? err.message : err));
                    uploadBtn.textContent = 'Upload';
                    uploadBtn.disabled = false;
                });
        });
    });
}

// 渲染银行标签
function renderBankChips(scope, type) {
    const cfg = bankChipConfig[scope] && bankChipConfig[scope][type];
    if (!cfg) return;
    const container = document.getElementById(cfg.chips);
    if (!container) return;

    const list = bankDrafts[scope][type];
    if (!list.length) {
        container.innerHTML = '<span class="bank-empty">No bank added yet — type a bank name below and click Add.</span>';
        return;
    }

    container.innerHTML = list.map((bank, index) => {
        const safeName = escapeHtml(bank);
        const logo = getBankLogo(bank);
        const logoHtml = logo ? `<img class="bank-chip-logo" src="${logo}" alt="">` : '';
        return `
        <span class="bank-chip" title="${safeName}">${logoHtml}${safeName}<button type="button" data-scope="${scope}" data-type="${type}" data-index="${index}" title="Remove">&times;</button></span>
    `;
    }).join('');

    container.querySelectorAll('.bank-chip button').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.dataset.scope;
            const t = btn.dataset.type;
            const idx = parseInt(btn.dataset.index, 10);
            bankDrafts[s][t].splice(idx, 1);
            renderBankChips(s, t);
        });
    });
}

// 添加银行标签
function addBankChip(scope, type) {
    const cfg = bankChipConfig[scope] && bankChipConfig[scope][type];
    if (!cfg) return;
    const input = document.getElementById(cfg.input);
    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    // 如果这个银行已经上传过 logo，就用 logo 里登记的标准名字（大小写/空格统一）
    const logoEntry = bankLogoCache[bankLogoKey(value)];
    const finalName = logoEntry ? logoEntry.name : value;

    const list = bankDrafts[scope][type];
    if (list.some(bank => bank.toLowerCase() === finalName.toLowerCase())) {
        input.value = '';
        return;
    }

    list.push(finalName);
    input.value = '';
    renderBankChips(scope, type);
}

// 设置银行草稿数据
function setBankDrafts(scope, qrBanks, cardBanks) {
    bankDrafts[scope].qr = Array.isArray(qrBanks) ? [...qrBanks] : [];
    bankDrafts[scope].card = Array.isArray(cardBanks) ? [...cardBanks] : [];
    renderBankChips(scope, 'qr');
    renderBankChips(scope, 'card');
}

// 从表单读取支付配置
function readStorePaymentSettings(scope) {
    const prefix = scope === 'add' ? 'storePay' : 'editStorePay';
    const cashEl = document.getElementById(`${prefix}Cash`);
    const qrEl = document.getElementById(`${prefix}QR`);
    const cardEl = document.getElementById(`${prefix}Card`);

    return {
        cash: { enabled: cashEl ? cashEl.checked : true },
        qr: {
            enabled: qrEl ? qrEl.checked : true,
            banks: [...bankDrafts[scope].qr]
        },
        card: {
            enabled: cardEl ? cardEl.checked : true,
            banks: [...bankDrafts[scope].card]
        }
    };
}

// 初始化支付设置编辑器
function initStorePaymentEditors() {
    Object.keys(bankChipConfig).forEach(scope => {
        ['qr', 'card'].forEach(type => {
            const cfg = bankChipConfig[scope][type];
            const addBtn = document.getElementById(cfg.button);
            if (addBtn) {
                addBtn.addEventListener('click', () => addBankChip(scope, type));
            }
            const input = document.getElementById(cfg.input);
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addBankChip(scope, type);
                    }
                });
            }
        });
    });

    ['storePayCash', 'storePayQR', 'storePayCard', 'editStorePayCash', 'editStorePayQR', 'editStorePayCard'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (!checkbox) return;
        const label = checkbox.closest('.payment-toggle');
        const sync = () => {
            if (label) label.classList.toggle('active', checkbox.checked);
        };
        checkbox.addEventListener('change', sync);
        sync();
    });

    document.querySelectorAll('.bank-clear').forEach(btn => {
        btn.addEventListener('click', () => {
            const scope = btn.dataset.scope;
            const type = btn.dataset.type;
            if (!bankDrafts[scope] || !bankDrafts[scope][type]) return;
            if (bankDrafts[scope][type].length === 0) return;
            bankDrafts[scope][type] = [];
            renderBankChips(scope, type);
        });
    });

    setBankDrafts('add', ADMIN_DEFAULT_QR_BANKS, ADMIN_DEFAULT_CARD_BANKS);
    setBankDrafts('edit', ADMIN_DEFAULT_QR_BANKS, ADMIN_DEFAULT_CARD_BANKS);
}

// 重置“添加店铺”里的支付设置
function resetAddStorePaymentSettings() {
    const cashEl = document.getElementById('storePayCash');
    const qrEl = document.getElementById('storePayQR');
    const cardEl = document.getElementById('storePayCard');
    [cashEl, qrEl, cardEl].forEach(el => {
        if (!el) return;
        el.checked = true;
        const label = el.closest('.payment-toggle');
        if (label) label.classList.add('active');
    });
    const qrInput = document.getElementById('storeQRBankInput');
    const cardInput = document.getElementById('storeCardBankInput');
    if (qrInput) qrInput.value = '';
    if (cardInput) cardInput.value = '';
    setBankDrafts('add', ADMIN_DEFAULT_QR_BANKS, ADMIN_DEFAULT_CARD_BANKS);
}

// 分批付款明细：RTDB 里可能是数组，也可能变成 {0:..., 1:...}
function normalizeAdminPaymentSplits(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'object') {
        return Object.keys(raw)
            .sort((a, b) => (Number(a) || 0) - (Number(b) || 0))
            .map(k => raw[k])
            .filter(Boolean);
    }
    return [];
}

// 销售记录里的支付方式显示
function formatAdminPaymentLabel(sale) {
    if (!sale) return 'Cash';
    const method = sale.paymentMethod;

    // 分批付款：Cash + QR / Cash + Credit Card
    if (method === 'split') {
        const names = normalizeAdminPaymentSplits(sale.paymentSplits).map(s => {
            if (s.method === 'qr') return 'QR';
            if (s.method === 'card') return 'Credit Card';
            if (s.method === 'cash') return 'Cash';
            return s.label || '';
        }).filter(Boolean);
        if (names.length) return names.join(' + ');
        return sale.paymentMethodLabel || 'Split';
    }

    if (method === 'qr') return 'QR';
    if (method === 'card') return 'Credit Card';
    return 'Cash';
}

// 支付方式图标（与 POS Payment 面板按钮一致）
function getAdminPaymentIcon(sale) {
    const method = sale && sale.paymentMethod;
    if (method === 'split') return 'call_split';
    if (method === 'qr') return 'qr_code_2';
    if (method === 'card') return 'credit_card';
    return 'payments';
}

// 支付方式标签（用于店铺列表）
function getStorePaymentTags(store) {    const ps = (store && store.paymentSettings) || {};
    const tags = [];
    if (!ps.cash || ps.cash.enabled !== false) tags.push({ key: 'cash', label: 'Cash' });
    if (!ps.qr || ps.qr.enabled !== false) tags.push({ key: 'qr', label: 'QR' });
    if (!ps.card || ps.card.enabled !== false) tags.push({ key: 'card', label: 'Card' });
    return tags;
}

// 处理添加店铺表单提交
function handleAddStore(e) {
    e.preventDefault();
    
    const storeId = document.getElementById('storeId').value.trim();
    const storeName = document.getElementById('storeName').value.trim();
    const storeAddress = document.getElementById('storeAddress').value.trim();
    const storePosLayout = document.getElementById('storePosLayout') ? document.getElementById('storePosLayout').value : 'default';
    const storeTaxRate = parseFloat(document.getElementById('storeTaxRate') ? document.getElementById('storeTaxRate').value : 0) || 0;
    const storeShiftCount = parseInt(document.getElementById('storeShiftCount') ? document.getElementById('storeShiftCount').value : 2) || 2;
    const storePaymentSettings = readStorePaymentSettings('add');
    
    // 检查店铺ID是否已存在
    if (stores[storeId]) {
        alert('Store ID already exists. Please use a different Store ID.');
        return;
    }
    
    // 添加店铺
    addStore(storeId, storeName, storeAddress, storePosLayout, storeTaxRate, storeShiftCount, storePaymentSettings)
        .then(() => {
            // 隐藏模态框
            hideModal(document.getElementById('addStoreModal'));
            
            // 清空表单
            document.getElementById('storeId').value = '';
            document.getElementById('storeName').value = '';
            document.getElementById('storeAddress').value = '';
            if (document.getElementById('storePosLayout')) {
                document.getElementById('storePosLayout').value = 'default';
            }
            if (document.getElementById('storeTaxRate')) {
                document.getElementById('storeTaxRate').value = '0';
            }
            if (document.getElementById('storeShiftCount')) {
                document.getElementById('storeShiftCount').value = '2';
            }

            // 重置支付方式设置
            resetAddStorePaymentSettings();
            
            // 重新加载店铺列表
            loadStores();

            // 新店铺：把已上传的 logo 镜像到店铺节点（POS 端读这里）
            syncStorePaymentLogos(storeId, { paymentSettings: storePaymentSettings });

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
    const store = stores[storeId];
    if (!store) return;

    // 先显示模态框（会重置表单），再填充数据
    showModal(document.getElementById('editStoreModal'));

    document.getElementById('editStoreId').value = storeId;
    document.getElementById('editStoreName').value = store.name || '';
    document.getElementById('editStoreAddress').value = store.address || '';
    document.getElementById('editStorePosLayout').value = store.posLayout || 'default';
    if (document.getElementById('editStoreTaxRate')) {
        document.getElementById('editStoreTaxRate').value = store.taxRate !== undefined ? store.taxRate : 0;
    }
    if (document.getElementById('editStoreShiftCount')) {
        document.getElementById('editStoreShiftCount').value = store.shiftCount !== undefined ? store.shiftCount : 2;
    }

    // 填充支付方式设置
    const ps = store.paymentSettings || {};
    const cashEl = document.getElementById('editStorePayCash');
    const qrEl = document.getElementById('editStorePayQR');
    const cardEl = document.getElementById('editStorePayCard');

    [
        { el: cashEl, node: ps.cash },
        { el: qrEl, node: ps.qr },
        { el: cardEl, node: ps.card }
    ].forEach(({ el, node }) => {
        if (!el) return;
        el.checked = !node || node.enabled !== false;
        const label = el.closest('.payment-toggle');
        if (label) label.classList.toggle('active', el.checked);
    });

    const qrBanks = (ps.qr && Array.isArray(ps.qr.banks)) ? ps.qr.banks : [];
    const cardBanks = (ps.card && Array.isArray(ps.card.banks)) ? ps.card.banks : [];
    setBankDrafts('edit', qrBanks, cardBanks);

    document.getElementById('editQRBankInput').value = '';
    document.getElementById('editCardBankInput').value = '';
}

// 处理编辑店铺表单提交
function handleEditStore(e) {
    e.preventDefault();
    
    const storeId = document.getElementById('editStoreId').value;
    const name = document.getElementById('editStoreName').value.trim();
    const address = document.getElementById('editStoreAddress').value.trim();
    const posLayout = document.getElementById('editStorePosLayout').value;
    const taxRate = parseFloat(document.getElementById('editStoreTaxRate') ? document.getElementById('editStoreTaxRate').value : 0) || 0;
    const shiftCount = parseInt(document.getElementById('editStoreShiftCount') ? document.getElementById('editStoreShiftCount').value : 2) || 2;
    const paymentSettings = readStorePaymentSettings('edit');
    
    database.ref(`stores/${storeId}`).update({
        name,
        address,
        posLayout,
        taxRate,
        shiftCount,
        paymentSettings
    })
    .then(() => {
        hideModal(document.getElementById('editStoreModal'));
        loadStores();
        // 店铺改了银行列表：同步镜像（删掉的银行 logo 一起清掉）
        syncStorePaymentLogos(storeId, { paymentSettings });
        alert('Store updated successfully.');
    })
    .catch(error => {
        console.error('Failed to update store:', error);
        alert('Failed to update store. Please try again.');
    });
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
    const categoryFilter = productCategoryFilter ? productCategoryFilter.value : 'all';
    const searchQuery = productSearch ? productSearch.value.trim().toLowerCase() : '';
    const promotionFilter = productPromotionFilter ? productPromotionFilter.value : 'all';
    
    // 显示加载状态
    productsTableBody.innerHTML = '<tr><td colspan="7" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    if (storeId === 'all') {
        // 加载所有商品
        getAllProducts()
            .then(productData => {
                products = productData;
                populateProductCategories(productData);
                renderProducts(searchQuery, categoryFilter, promotionFilter);
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
                populateProductCategories(productData);
                renderProducts(searchQuery, categoryFilter, promotionFilter);
            })
            .catch(error => {
                console.error('Failed to load products:', error);
                productsTableBody.innerHTML = '<tr><td colspan="7" class="error"><i class="material-icons">error</i> Failed to load products</td></tr>';
            });
    }
}

// 渲染商品列表
function renderProducts(searchQuery = '', categoryFilter = 'all', promotionFilter = 'all') {
    productsTableBody.innerHTML = '';
    
    if (Object.keys(products).length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">inventory_2</i><strong>No products yet</strong><small>Add a product to start selling it at the till.</small></td></tr>';
        return;
    }
    
    // 过滤商品
    const filteredProducts = Object.keys(products).filter(productId => {
        const product = products[productId];
        const storeName = stores[product.store_id]?.name || product.store_id;
        
        // 类别过滤
        if (categoryFilter !== 'all' && product.category !== categoryFilter) {
            return false;
        }
        
        // 促销价格过滤
        if (promotionFilter !== 'all') {
            const hasPromotion = product.promotionEnabled && product.promotionPrice !== null && product.promotionPrice !== undefined;
            if (promotionFilter === 'promotion' && !hasPromotion) {
                return false;
            }
            if (promotionFilter === 'no-promotion' && hasPromotion) {
                return false;
            }
        }
        
        // 搜索过滤
        if (searchQuery) {
        const displayId = product.original_id || productId;
        const formerId = (product._migrated_from_id || '').toLowerCase();
        const formerName = (product._migrated_from_name || '').toLowerCase();
        // 搜索匹配（商品ID、原ID、名称、原名称、类别或店铺名）
        return displayId.toLowerCase().includes(searchQuery) || 
               product.name.toLowerCase().includes(searchQuery) || 
               formerId.includes(searchQuery) ||
               formerName.includes(searchQuery) ||
               (product.category || '').toLowerCase().includes(searchQuery) ||
               storeName.toLowerCase().includes(searchQuery);
        }
        
        return true;
    });
    
    if (filteredProducts.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="7" class="no-data"><i class="material-icons">search_off</i><strong>No products match your filters</strong><small>Clear the search box or pick “All Categories”.</small></td></tr>';
        return;
    }
    
    filteredProducts.forEach(productId => {
        const product = products[productId];
        const storeName = stores[product.store_id]?.name || product.store_id;
        // 使用stock值，如果不存在则使用quantity，确保兼容旧数据
        const isInfinite = product.saleUnit === 'infinite';
        const stockDisplay = isInfinite ? 'Unlimited' : (product.stock !== undefined ? product.stock : (product.quantity || 0));
        const displayId = product.original_id || productId;
        
        // 计算显示价格（如果启用促销价格则显示促销价格，否则显示正常价格）
        const displayPrice = (product.promotionEnabled && product.promotionPrice !== null && product.promotionPrice !== undefined) 
            ? product.promotionPrice 
            : product.price;
        let priceDisplay = product.promotionEnabled && product.promotionPrice !== null && product.promotionPrice !== undefined
            ? `<span style="text-decoration: line-through; color: #999; margin-right: 5px;">RM${product.price.toFixed(2)}</span><span style="color: #f44336; font-weight: bold;">RM${displayPrice.toFixed(2)}</span>`
            : `RM${displayPrice.toFixed(2)}`;
            
        const hasStaffPrice = product.staffPriceEnabled && product.staffPrice !== null && product.staffPrice !== undefined;
        if (hasStaffPrice) {
            priceDisplay += ` <span style="color: #4caf50; font-size: 0.85em; font-weight: bold; margin-left: 5px;" title="Staff Price: RM${product.staffPrice.toFixed(2)}"><i class="material-icons" style="font-size: 14px; vertical-align: middle;">badge</i>RM${product.staffPrice.toFixed(2)}</span>`;
        }
        
        // 如果是迁移过的商品，展示曾用名标记
        let formerlyTag = '';
        if (product._migrated_from_name || product._migrated_from_id) {
            const fName = product._migrated_from_name || '';
            const fId = product._migrated_from_id ? `[${product._migrated_from_id}] ` : '';
            formerlyTag = `<div style="font-size: 0.75rem; color: #d97706; margin-top: 2px;" title="Formerly ID: ${product._migrated_from_id || '-'}"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">history</i> Formerly: ${fId}${fName}</div>`;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${displayId}</td>
            <td>${product.name}${product.promotionEnabled ? ' <span style="color: #f44336; font-size: 0.85em;"><i class="material-icons" style="font-size: 14px; vertical-align: middle;">local_offer</i></span>' : ''}${hasStaffPrice ? ' <span style="color: #4caf50; font-size: 0.85em;"><i class="material-icons" style="font-size: 14px; vertical-align: middle;">badge</i></span>' : ''}${formerlyTag}</td>
            <td>${priceDisplay}</td>
            <td>${stockDisplay}</td>
            <td>${product.category || '-'}</td>
            <td>${storeName}</td>
            <td>
                <div class="inventory-action-buttons">
                    <button class="icon-button edit-btn" title="Edit Product" data-id="${productId}"><i class="material-icons">edit</i></button>
                    <button class="icon-button delete-btn" title="Delete Product" data-id="${productId}"><i class="material-icons">delete</i></button>
                    <button class="icon-button migrate-btn" title="Fix & Migrate Product/Sales" data-id="${productId}" style="color: #d97706;"><i class="material-icons">published_with_changes</i></button>
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

    document.querySelectorAll('#productsTableBody .migrate-btn').forEach(btn => {
        btn.addEventListener('click', () => openProductMigrationModal(btn.dataset.id));
    });
}

// 填充商品类别过滤器
function populateProductCategories(products) {
    if (!productCategoryFilter) return;
    
    // 获取所有唯一的类别
    const categories = ['all'];
    
    Object.values(products).forEach(product => {
        if (product.category && !categories.includes(product.category)) {
            categories.push(product.category);
        }
    });
    
    // 保存当前选择的值
    const selectedValue = productCategoryFilter.value;
    
    // 清空除了第一个选项外的所有选项
    while (productCategoryFilter.options.length > 1) {
        productCategoryFilter.remove(1);
    }
    
    // 添加类别选项
    categories.forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            productCategoryFilter.appendChild(option);
        }
    });
    
    // 恢复之前选择的值
    if (selectedValue && selectedValue !== 'all' && categories.includes(selectedValue)) {
        productCategoryFilter.value = selectedValue;
    }
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
    const productPromotionEnabledInput = document.getElementById('productPromotionEnabled');
    const productPromotionPriceInput = document.getElementById('productPromotionPrice');
    const productStaffPriceEnabledInput = document.getElementById('productStaffPriceEnabled');
    const productStaffPriceInput = document.getElementById('productStaffPrice');
    const productSaleUnitInput = document.getElementById('saleUnit');
    
    const productId = productIdInput.value.trim();
    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const stock = parseFloat(productQuantityInput.value) || 0; // 更名为stock
    const category = productCategoryInput.value.trim();
    const storeId = productStoreIdInput.value;
    const promotionEnabled = productPromotionEnabledInput ? productPromotionEnabledInput.checked : false;
    const promotionPrice = promotionEnabled && productPromotionPriceInput ? parseFloat(productPromotionPriceInput.value) : null;
    const staffPriceEnabled = productStaffPriceEnabledInput ? productStaffPriceEnabledInput.checked : false;
    const staffPrice = staffPriceEnabled && productStaffPriceInput ? parseFloat(productStaffPriceInput.value) : null;
    const saleUnit = productSaleUnitInput ? productSaleUnitInput.value : 'piece';
    
    if (!productId || !name || isNaN(price) || !storeId) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (promotionEnabled && (isNaN(promotionPrice) || promotionPrice < 0)) {
        alert('Please enter a valid promotion price');
        return;
    }

    if (staffPriceEnabled && (isNaN(staffPrice) || staffPrice < 0)) {
        alert('Please enter a valid staff price');
        return;
    }
    
    // 添加商品到数据库
    addProduct(productId, name, price, stock, category, storeId, promotionEnabled, promotionPrice, saleUnit, staffPriceEnabled, staffPrice)
        .then(() => {
            hideModal(addProductModal);
            
            // 重置表单的特殊扩展字段
            if (productStaffPriceEnabledInput) productStaffPriceEnabledInput.checked = false;
            const staffPriceGroup = document.getElementById('productStaffPriceGroup');
            if (staffPriceGroup) staffPriceGroup.style.display = 'none';
            if (productStaffPriceInput) productStaffPriceInput.value = '';

            loadProducts();
            alert('Product added successfully!');
        })
        .catch(error => {
            console.error('Failed to add product:', error);
            alert('Failed to add product. Please try again.');
        });
}

// 批量添加商品相关辅助函数
function incrementProductId(idStr) {
    if (!idStr) return '';
    const match = idStr.match(/^(.*?)(\d+)$/);
    if (!match) {
        return idStr + "1";
    }
    const prefix = match[1];
    const numStr = match[2];
    const nextNum = parseInt(numStr, 10) + 1;
    const paddedNum = String(nextNum).padStart(numStr.length, '0');
    return prefix + paddedNum;
}

function recalculateRowIds() {
    const startIdInput = document.getElementById('proStartId');
    if (!startIdInput) return;
    let currentId = startIdInput.value.trim();
    const rows = document.querySelectorAll('#proProductsTableBody tr');
    rows.forEach((row, index) => {
        const idSpan = row.querySelector('.pro-row-id');
        if (idSpan) {
            idSpan.textContent = currentId;
            row.dataset.productId = currentId;
        }
        currentId = incrementProductId(currentId);
    });
}

function addProProductRow() {
    const startIdInput = document.getElementById('proStartId');
    let nextId = startIdInput.value.trim();
    
    const lastRow = proProductsTableBody.querySelector('tr:last-child');
    if (lastRow) {
        const lastId = lastRow.dataset.productId;
        nextId = incrementProductId(lastId);
    } else if (!nextId) {
        nextId = 'BF001';
        startIdInput.value = nextId;
    }
    
    const row = document.createElement('tr');
    row.dataset.productId = nextId;
    row.innerHTML = `
        <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;"><span class="pro-row-id">${nextId}</span></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><input type="text" class="pro-name-input" placeholder="Product Name" required style="width: 100%; box-sizing: border-box; padding: 6px;"></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><input type="number" class="pro-price-input" placeholder="Price" step="0.01" min="0" required style="width: 100%; box-sizing: border-box; padding: 6px;"></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><input type="number" class="pro-stock-input" placeholder="Stock" step="0.001" min="0" value="0" required style="width: 100%; box-sizing: border-box; padding: 6px;"></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
            <button type="button" class="pro-delete-row-btn" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;">
                <i class="material-icons">delete_forever</i>
            </button>
        </td>
    `;
    
    row.querySelector('.pro-delete-row-btn').addEventListener('click', () => {
        row.remove();
        recalculateRowIds();
    });

    const proSaleUnit = document.getElementById('proSaleUnit');
    if (proSaleUnit && proSaleUnit.value === 'infinite') {
        const stockInput = row.querySelector('.pro-stock-input');
        if (stockInput) {
            stockInput.value = '999999';
            stockInput.disabled = true;
        }
    }
    
    proProductsTableBody.appendChild(row);
}

function handleAddProductPro(e) {
    e.preventDefault();
    
    const startIdInput = document.getElementById('proStartId');
    const categoryInput = document.getElementById('proCategory');
    const saleUnitInput = document.getElementById('proSaleUnit');
    const storeIdInput = document.getElementById('proStoreId');
    
    const startId = startIdInput.value.trim();
    const category = categoryInput.value.trim();
    const saleUnit = saleUnitInput.value;
    const storeId = storeIdInput.value;
    
    if (!startId || !storeId) {
        alert('Please specify the starting ID and Store');
        return;
    }
    
    const rows = document.querySelectorAll('#proProductsTableBody tr');
    if (rows.length === 0) {
        alert('Please add at least one product row');
        return;
    }
    
    const productsToAdd = [];
    let isValid = true;
    
    rows.forEach((row, index) => {
        const productId = row.dataset.productId;
        const nameInput = row.querySelector('.pro-name-input');
        const priceInput = row.querySelector('.pro-price-input');
        const stockInput = row.querySelector('.pro-stock-input');
        
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const stock = parseFloat(stockInput.value) || 0;
        
        if (!name || isNaN(price) || price < 0) {
            isValid = false;
            nameInput.style.borderColor = !name ? 'red' : '';
            priceInput.style.borderColor = isNaN(price) || price < 0 ? 'red' : '';
            return;
        }
        
        productsToAdd.push({
            productId,
            name,
            price,
            stock,
            category,
            storeId,
            saleUnit
        });
    });
    
    if (!isValid) {
        alert('Please fill in all product names and valid prices');
        return;
    }
    
    const promises = productsToAdd.map(p => {
        return addProduct(p.productId, p.name, p.price, p.stock, p.category, p.storeId, false, null, p.saleUnit);
    });
    
    Promise.all(promises)
        .then(() => {
            hideModal(addProductProModal);
            loadProducts();
            alert(`Successfully added ${productsToAdd.length} products!`);
        })
        .catch(error => {
            console.error('Failed to add batch products:', error);
            alert('Failed to add some products. Please check console for details.');
        });
}

// 编辑商品
function editProduct(productId) {
    const product = products[productId];
    if (!product) return;
    const actualProductId = product.original_id || productId;
    
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
                    <input type="text" id="editProductId" value="${actualProductId}" required>
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
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editProductPromotionEnabled" style="width: auto;" ${product.promotionEnabled ? 'checked' : ''}>
                        <span><i class="material-icons">local_offer</i> Enable Promotion Price</span>
                    </label>
                </div>
                <div class="form-group" id="editProductPromotionPriceGroup" style="display: ${product.promotionEnabled ? 'block' : 'none'};">
                    <label for="editProductPromotionPrice"><i class="material-icons">sell</i> Promotion Price:</label>
                    <input type="number" id="editProductPromotionPrice" value="${product.promotionPrice || ''}" step="0.01" min="0" placeholder="Enter promotion price">
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="editProductStaffPriceEnabled" style="width: auto;" ${product.staffPriceEnabled ? 'checked' : ''}>
                        <span><i class="material-icons">badge</i> Enable Staff Price</span>
                    </label>
                </div>
                <div class="form-group" id="editProductStaffPriceGroup" style="display: ${product.staffPriceEnabled ? 'block' : 'none'};">
                    <label for="editProductStaffPrice"><i class="material-icons">price_change</i> Staff Price:</label>
                    <input type="number" id="editProductStaffPrice" value="${product.staffPrice || ''}" step="0.01" min="0" placeholder="Enter staff price">
                </div>
                <div class="form-group">
                    <label for="editProductStock"><i class="material-icons">inventory_2</i> Stock:</label>
                    <input type="number" id="editProductStock" value="${product.stock !== undefined ? product.stock : (product.quantity || 0)}" min="0" step="0.001" required>
                </div>
                <div class="form-group">
                    <label for="editProductCategory"><i class="material-icons">category</i> Category:</label>
                    <input type="text" id="editProductCategory" value="${product.category || ''}">
                </div>
                <div class="form-group">
                    <label for="editSaleUnit"><i class="material-icons">straighten</i> Sale Unit:</label>
                    <select id="editSaleUnit" required onchange="updateAdminStockInputStep('editProductStock', 'editSaleUnit')">
                        <option value="piece" ${product.saleUnit === 'piece' ? 'selected' : ''}>By Piece/Quantity</option>
                        <option value="weight" ${product.saleUnit === 'weight' ? 'selected' : ''}>By Weight (kg)</option>
                        <option value="infinite" ${product.saleUnit === 'infinite' ? 'selected' : ''}>Infinite/No Stock Limit</option>
                    </select>
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
    
    // 添加Off按钮事件
    const closeBtn = editModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        hideModal(editModal);
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(editModal);
        }, 300);
    });
    
    // 点击模态框外部Off
    window.addEventListener('click', event => {
        if (event.target === editModal) {
            hideModal(editModal);
            // 移除模态框
            setTimeout(() => {
                document.body.removeChild(editModal);
            }, 300);
        }
    });
    
    // 添加促销价格开关事件监听
    const promotionEnabledCheckbox = document.getElementById('editProductPromotionEnabled');
    const promotionPriceGroup = document.getElementById('editProductPromotionPriceGroup');
    if (promotionEnabledCheckbox && promotionPriceGroup) {
        promotionEnabledCheckbox.addEventListener('change', function() {
            promotionPriceGroup.style.display = this.checked ? 'block' : 'none';
        });
    }

    // 添加员工价格开关事件监听
    const staffEnabledCheckbox = document.getElementById('editProductStaffPriceEnabled');
    const staffPriceGroup = document.getElementById('editProductStaffPriceGroup');
    if (staffEnabledCheckbox && staffPriceGroup) {
        staffEnabledCheckbox.addEventListener('change', function() {
            staffPriceGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // 处理表单提交
    const editForm = document.getElementById('editProductForm');
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newProductId = document.getElementById('editProductId').value.trim();
        const newName = document.getElementById('editProductName').value.trim();
        const newPrice = parseFloat(document.getElementById('editProductPrice').value);
        const newStock = parseFloat(document.getElementById('editProductStock').value) || 0;
        const newCategory = document.getElementById('editProductCategory').value.trim();
        const newStoreId = document.getElementById('editProductStoreId').value;
        const newPromotionEnabled = document.getElementById('editProductPromotionEnabled') ? document.getElementById('editProductPromotionEnabled').checked : false;
        const newPromotionPrice = newPromotionEnabled && document.getElementById('editProductPromotionPrice') ? parseFloat(document.getElementById('editProductPromotionPrice').value) : null;
        const newStaffPriceEnabled = document.getElementById('editProductStaffPriceEnabled') ? document.getElementById('editProductStaffPriceEnabled').checked : false;
        const newStaffPrice = newStaffPriceEnabled && document.getElementById('editProductStaffPrice') ? parseFloat(document.getElementById('editProductStaffPrice').value) : null;
        const newSaleUnit = document.getElementById('editSaleUnit') ? document.getElementById('editSaleUnit').value : 'piece';
        
        if (!newProductId || !newName || isNaN(newPrice) || !newStoreId) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (newPromotionEnabled && (isNaN(newPromotionPrice) || newPromotionPrice < 0)) {
            alert('Please enter a valid promotion price');
            return;
        }

        if (newStaffPriceEnabled && (isNaN(newStaffPrice) || newStaffPrice < 0)) {
            alert('Please enter a valid staff price');
            return;
        }
        
        // 检查新产品ID是否已存在（如果ID有变化）
        if (newProductId !== actualProductId && products[newProductId] && products[newProductId].store_id === newStoreId) {
            alert('Product ID already exists in that store. Please choose a different ID.');
            return;
        }
        
        // 更新商品
        updateProduct(actualProductId, newProductId, newName, newPrice, newStock, newCategory, newStoreId, product.store_id, newPromotionEnabled, newPromotionPrice, newSaleUnit, newStaffPriceEnabled, newStaffPrice)
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
function updateProduct(oldProductId, newProductId, name, price, stock, category, newStoreId, oldStoreId, promotionEnabled = false, promotionPrice = null, saleUnit = 'piece', staffPriceEnabled = false, staffPrice = null) {
    const productData = {
        name,
        price,
        quantity: stock,
        category: category || '',
        store_id: newStoreId,
        stock: stock, // 确保更新stock字段
        promotionEnabled: promotionEnabled || false,
        promotionPrice: promotionEnabled ? (promotionPrice || null) : null,
        staffPriceEnabled: staffPriceEnabled || false,
        staffPrice: staffPriceEnabled ? (staffPrice || null) : null,
        saleUnit: saleUnit || 'piece'
    };
    
    // 如果产品ID发生变化
    if (newProductId !== oldProductId) {
        // 删除旧产品，创建新产品
        return database.ref(`store_products/${oldStoreId}/${oldProductId}`).remove()
            .then(() => database.ref(`store_products/${newStoreId}/${newProductId}`).set(productData));
    }
    
    // 如果店铺改变但产品ID没变，需要删除旧店铺中的商品并在新店铺中添加
    if (newStoreId !== oldStoreId) {
        return database.ref(`store_products/${oldStoreId}/${oldProductId}`).remove()
            .then(() => database.ref(`store_products/${newStoreId}/${newProductId}`).set(productData));
    }
    
    // 否则直接更新
    return database.ref(`store_products/${newStoreId}/${newProductId}`).update(productData);
}

// 删除商品
function deleteProduct(productId) {
    const product = products[productId];
    if (!product) return;
    const actualProductId = product.original_id || productId;
    
    if (!confirm(`Are you sure you want to delete product ${actualProductId}?`)) {
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
            usersTableBody.innerHTML = '<tr><td colspan="6" class="no-data"><i class="material-icons">group_off</i><strong>No users yet</strong><small>Click “Add User” to invite a cashier or admin.</small></td></tr>';
        });
}

// 渲染用户列表
function renderUsers() {
    usersTableBody.innerHTML = '';
    
    if (Object.keys(users).length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="6" class="no-data"><i class="material-icons">group_off</i><strong>No users yet</strong><small>Click “Add User” to invite a cashier or admin.</small></td></tr>';
        return;
    }
    
    Object.keys(users).forEach(userId => {
        const user = users[userId];
        const userName = user.name || user.email.split('@')[0]; // 如果没有名字，使用邮箱名作为默认显示
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
            <td>${userName}</td>
            <td>${user.email}</td>
            <td>${roleName}</td>
            <td>${storeName}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-user-btn icon-button" data-id="${userId}" title="Edit User"><i class="material-icons">edit</i></button>
                    <button class="reset-pwd-btn icon-button" data-id="${userId}" title="Reset Password"><i class="material-icons">lock_reset</i></button>
                    <button class="delete-btn icon-button" data-id="${userId}" title="Delete"><i class="material-icons">delete</i></button>
                </div>
            </td>
        `;
        
        usersTableBody.appendChild(row);
    });
    
    // 添加事件监听器到按钮
    document.querySelectorAll('#usersTableBody .edit-user-btn').forEach(btn => {
        btn.addEventListener('click', () => editUser(btn.dataset.id));
    });
    
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
    const nameInput = document.getElementById('userName');
    const passwordInput = document.getElementById('userPassword');
    const roleSelect = document.getElementById('userRole');
    const storeIdSelect = document.getElementById('userStoreId');
    
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    const role = roleSelect.value;
    const storeId = role === 'staff' ? storeIdSelect.value : '';
    
    if (!email || !password || !role || (role === 'staff' && !storeId)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // 检查当前用户角色，只有sadmin可以添加sadmin
    const user = firebase.auth().currentUser;
    if (user) {
        getUserRole(user.uid).then(currentUserRole => {
            if (role === 'sadmin' && currentUserRole !== 'sadmin') {
                alert('Only Super Admin can add Super Admin accounts');
                return;
            }
            
            // 继续创建用户
            createNewUser(email, name, password, role, storeId);
        });
    } else {
        alert('You need to be logged in to add users');
    }
}

// 创建新用户
function createNewUser(email, name, password, role, storeId) {
    // 创建用户
    // 注意：在实际应用中，应该使用 Firebase Admin SDK 或后端API创建用户
    // 此处简化为前端直接创建用户，不推荐在生产环境中使用
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const userId = userCredential.user.uid;
            
            // 保存用户角色、姓名和店铺信息
            return database.ref(`users/${userId}`).set({
                email,
                name: name || email.split('@')[0], // 如果没有提供名字，使用邮箱名作为默认名字
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
        <div class="ios-datetime">
            <div class="ios-time">${hours12}:${minutes}<span class="seconds">:${seconds}</span> <span class="ampm">${ampm}</span></div>
            <div class="ios-date">${weekday}, ${day}/${month}/${year}</div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    if (!document.querySelector('style#ios-datetime-style')) {
        style.id = 'ios-datetime-style';
        style.textContent = `
            .ios-datetime { text-align:center; display:flex; flex-direction:column; gap:2px; }
            .ios-time { font-size:28px; font-weight:700; letter-spacing:0.5px; }
            .ios-time .seconds { font-size:16px; font-weight:400; }
            .ios-time .ampm { font-size:16px; font-weight:500; margin-left:4px; }
            .ios-date { font-size:13px; color: var(--ios-text-secondary); }
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
function addStore(storeId, name, address, posLayout = 'default', taxRate = 0, shiftCount = 2, paymentSettings = null) {
    return database.ref(`stores/${storeId}`).set({
        name,
        address,
        posLayout,
        taxRate,
        shiftCount,
        paymentSettings: paymentSettings || {
            cash: { enabled: true },
            qr: { enabled: true, banks: [] },
            card: { enabled: true, banks: [] }
        }
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
function addProduct(productId, name, price, quantity, category, storeId, promotionEnabled = false, promotionPrice = null, saleUnit = 'piece', staffPriceEnabled = false, staffPrice = null) {
    const productData = {
        name,
        price,
        quantity: quantity || 0,
        category: category || '',
        store_id: storeId,
        stock: quantity || 0, // 添加stock字段，与POS页面保持一致
        promotionEnabled: promotionEnabled || false,
        promotionPrice: promotionEnabled ? (promotionPrice || null) : null,
        staffPriceEnabled: staffPriceEnabled || false,
        staffPrice: staffPriceEnabled ? (staffPrice || null) : null,
        saleUnit: saleUnit || 'piece'
    };
    return database.ref(`store_products/${storeId}/${productId}`).set(productData);
}

// 更新库存输入框的step属性
function updateAdminStockInputStep(quantityId, saleUnitId) {
    const saleUnitInput = document.getElementById(saleUnitId);
    const productQuantityInput = document.getElementById(quantityId);

    if (saleUnitInput && productQuantityInput) {
        if (saleUnitInput.value === 'weight') {
            productQuantityInput.step = '0.001'; // 允许输入三位小数
            productQuantityInput.disabled = false;
            if (productQuantityInput.value === '999999') {
                productQuantityInput.value = '0';
            }
        } else if (saleUnitInput.value === 'infinite') {
            productQuantityInput.value = '999999'; // 设置为一个足够高数值
            productQuantityInput.disabled = true;  // 禁用输入
        } else {
            productQuantityInput.step = '1';
            productQuantityInput.disabled = false;
            if (productQuantityInput.value === '999999') {
                productQuantityInput.value = '0';
            }
        }
    }
}

// 删除商品
function removeProduct(productId) {
    const product = products[productId];
    if (!product) return Promise.reject(new Error('Product not found'));
    const actualProductId = product.original_id || productId;
    return database.ref(`store_products/${product.store_id}/${actualProductId}`).remove();
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
                        const compositeKey = `${storeId}_${productId}`;
                        allProducts[compositeKey] = {
                            ...product,
                            store_id: storeId,
                            original_id: productId
                        };
                        console.log(`Added product ${productId} from store ${storeId} as ${compositeKey}`);
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

// 获取分层的日期路径，格式为 year/month/day
function getDatePath(dateString = null) {
    const date = dateString ? new Date(dateString) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return { year, month, day, path: `${year}/${month}/${day}` };
}

// 从日期字符串获取分层路径
function getDatePathFromString(dateString) {
    if (!dateString) return getDatePath();
    const [year, month, day] = dateString.split('-');
    return { year, month, day, path: `${year}/${month}/${day}` };
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
    const datePath = getDatePathFromString(date);
    
    return database.ref(`sales/${storeId}/${datePath.path}`).once('value')
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
            const datePath = getDatePathFromString(date);
            
            // 对每个店铺获取销售记录 - 只获取特定日期的数据
            storeIds.forEach(storeId => {
                promises.push(
                    database.ref(`sales/${storeId}/${datePath.path}`).once('value')
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
    const datePath = getDatePathFromString(date);
    return database.ref(`sales/${storeId}/${datePath.path}`)
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
        if (stockStatus === 'low' && stock > 10) {
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
        inventoryTableBody.innerHTML = '<tr><td colspan="9" class="no-data"><i class="material-icons">inventory</i><strong>No inventory records</strong><small>Products added for your stores will show up here.</small></td></tr>';
        return;
    }
    
    // Clear card grid
    const cardGrid = document.getElementById('inventoryCardGrid');
    if (cardGrid) cardGrid.innerHTML = '';
    
    productsEntries.forEach(([productId, product]) => {
        const storeName = stores[product.store_id]?.name || product.store_id;
        const isInfinite = product.saleUnit === 'infinite';
        const stock = isInfinite ? 'Unlimited' : (product.stock !== undefined ? product.stock : (product.quantity || 0));
        const displayId = product.original_id || productId;
        let statusClass, statusText;
        if (isInfinite) {
            statusClass = 'status-good';
            statusText = 'Unlimited';
        } else if (stock <= 0) {
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
            <td><input type="checkbox" class="inventory-select" data-id="${productId}"></td>
            <td>${displayId}</td>
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

        // --- New Card creation for desktop ---
        if (cardGrid) {
            const card = document.createElement('div');
            card.className = 'inventory-card';
            card.innerHTML = `
                <div class="card-header">${product.name}</div>
                <div>Category: ${product.category || '-'}</div>
                <div>Price: RM${product.price.toFixed(2)}</div>
                <div>Current Stock: ${stock}</div>
                <div>Status: <span class="stock-status ${statusClass}">${statusText}</span></div>
                <div>Store: ${storeName}</div>
                <div class="inventory-action-buttons" style="margin-top:6px; display:flex; gap:6px;">
                    <button class="icon-button update-stock-btn" title="Update Stock" data-id="${productId}"><i class="material-icons">edit</i></button>
                    <button class="icon-button view-history-btn" title="Stock History" data-id="${productId}"><i class="material-icons">history</i></button>
                </div>
            `;
            cardGrid.appendChild(card);
        }
    });

    // 绑定表格中的action按钮事件监听器
    document.querySelectorAll('#inventoryTableBody .update-stock-btn').forEach(btn => {
        btn.addEventListener('click', () => showUpdateStockModal(btn.dataset.id));
    });
    
    document.querySelectorAll('#inventoryTableBody .view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => showStockHistory(btn.dataset.id));
    });
    
    document.querySelectorAll('#inventoryTableBody .add-stock-btn').forEach(btn => {
        btn.addEventListener('click', () => quickAddStock(btn.dataset.id));
    });
    
    document.querySelectorAll('#inventoryTableBody .tester-btn').forEach(btn => {
        btn.addEventListener('click', () => testerReduceStock(btn.dataset.id));
    });

    // After appending cards, re-bind listeners for buttons inside cards as well
    if (cardGrid) {
        cardGrid.querySelectorAll('.update-stock-btn').forEach(btn => {
        btn.addEventListener('click', () => showUpdateStockModal(btn.dataset.id));
    });
        cardGrid.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', () => showStockHistory(btn.dataset.id));
    });
    }
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

// 显示库存历史记录
function showStockHistory(productId) {
    const product = products[productId];
    if (!product) return;
    
    // 创建历史记录模态框
    const historyModal = document.createElement('div');
    historyModal.className = 'modal';
    historyModal.id = 'stockHistoryModal';
    
    historyModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2><i class="material-icons">history</i> Stock History - ${product.name}</h2>
            <div class="stock-history-container">
                <div class="loading"><i class="material-icons">hourglass_empty</i> Loading history...</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(historyModal);
    
    // 显示模态框
    showModal(historyModal);
    
    // 加载历史记录
    const actualProductId = product.original_id || productId;
    getStockHistory(product.store_id, actualProductId)
        .then(history => {
            const container = historyModal.querySelector('.stock-history-container');
            if (Object.keys(history).length === 0) {
                container.innerHTML = '<div class="no-data"><i class="material-icons">info</i> No history records found</div>';
                return;
            }
            
            // 转换为数组并按时间排序
            const historyArray = Object.entries(history).map(([id, record]) => ({
                id,
                ...record
            })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            let tableHTML = `
                <table class="stock-history-table">
                    <thead>
                        <tr>
                            <th>Date/Time</th>
                            <th>Operation</th>
                            <th>Previous Stock</th>
                            <th>New Stock</th>
                            <th>Change</th>
                            <th>Reason</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            historyArray.forEach(record => {
                const change = record.new_stock - record.previous_stock;
                const changeText = change > 0 ? `+${change}` : change.toString();
                const changeClass = change > 0 ? 'positive' : (change < 0 ? 'negative' : 'neutral');
                
                tableHTML += `
                    <tr>
                        <td>${record.timestamp}</td>
                        <td>${record.operation}</td>
                        <td>${record.previous_stock}</td>
                        <td>${record.new_stock}</td>
                        <td class="${changeClass}">${changeText}</td>
                        <td>${record.reason || '-'}</td>
                        <td>${record.notes || '-'}</td>
                    </tr>
                `;
            });
            
            tableHTML += '</tbody></table>';
            container.innerHTML = tableHTML;
        })
        .catch(error => {
            console.error('Failed to load stock history:', error);
            const container = historyModal.querySelector('.stock-history-container');
            container.innerHTML = '<div class="error"><i class="material-icons">error</i> Failed to load history</div>';
        });
    
    // 绑定Off按钮
    historyModal.querySelector('.close').addEventListener('click', () => {
        hideModal(historyModal);
        setTimeout(() => document.body.removeChild(historyModal), 300);
    });
}

// 快速添加库存
function quickAddStock(productId) {
    const product = products[productId];
    if (!product) return;
    
    const quantity = prompt(`Enter quantity to add to "${product.name}":`, '1');
    if (quantity === null || quantity === '') return;
    
    const addQuantity = parseFloat(quantity);
    if (isNaN(addQuantity) || addQuantity <= 0) {
        alert('Please enter a valid positive number');
        return;
    }
    
    const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
    const newStock = currentStock + addQuantity;
    
    updateProductStock(productId, newStock, 'add', addQuantity, 'Quick Add', `Quick add via action button`)
        .then(() => {
            loadInventory();
            alert(`Successfully added ${addQuantity} to ${product.name}`);
        })
        .catch(error => {
            console.error('Failed to add stock:', error);
            alert('Failed to add stock. Please try again.');
        });
}

// 测试减少库存（减1）
function testerReduceStock(productId) {
    const product = products[productId];
    if (!product) return;
    
    const currentStock = product.stock !== undefined ? product.stock : (product.quantity || 0);
    
    if (currentStock <= 0) {
        alert('No stock available to reduce');
        return;
    }
    
    if (!confirm(`Reduce stock of "${product.name}" by 1 for testing?`)) {
        return;
    }
    
    const newStock = Math.max(0, currentStock - 1);
    
    updateProductStock(productId, newStock, 'subtract', 1, 'Testing', 'Stock reduced for testing purposes')
        .then(() => {
            loadInventory();
            alert(`Successfully reduced ${product.name} stock by 1`);
        })
        .catch(error => {
            console.error('Failed to reduce stock:', error);
            alert('Failed to reduce stock. Please try again.');
        });
}

// 处理更新库存表单提交
function handleUpdateStock(e) {
    e.preventDefault();
    
    const productId = document.getElementById('updateProductId').value;
    const operation = document.getElementById('updateOperation').value;
    const quantity = parseFloat(document.getElementById('updateQuantity').value);
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
    const actualProductId = product.original_id || productId;
    
    // 创建更新对象
    const updates = {};
    
    // 更新库存
    updates[`store_products/${product.store_id}/${actualProductId}/stock`] = newStock;
    updates[`store_products/${product.store_id}/${actualProductId}/quantity`] = newStock; // 为了兼容性也更新quantity
    
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
    
    // 添加Off按钮事件
    const closeBtn = historyModal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        hideModal(historyModal);
        // 移除模态框
        setTimeout(() => {
            document.body.removeChild(historyModal);
        }, 300);
    });
    
    // 点击模态框外部Off
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
            
            // 重新添加Off按钮事件
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
            
            // 重新添加Off按钮事件
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

// 获取用户最后登录时间
function getLastLoginTime(userId) {
    return database.ref(`users/${userId}/last_login`).once('value')
        .then(snapshot => {
            return snapshot.val();
        })
        .catch(error => {
            console.error('获取最后登录时间出错:', error);
            return null;
        });
}

// 格式化时间为 HH:MM 格式
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 初始化视图和数据
function init() {
    console.log("初始化应用...");
    
    // 更新时间
    updateDateTime();
    setInterval(updateDateTime, 60000); // 每分钟更新一次
    
    // 初始化事件监听器
    initEventListeners();
    
    // 设置默认日期为今天
    selectedDate = getCurrentDate();
    document.getElementById('dateFilter').value = selectedDate;
    
    // 加载数据
    loadStores().then(() => {
        // 加载商品数据
        loadProducts();
        
        // 加载银行 logo（存 RTDB），拿到后会自动重渲染银行 chips 与销售明细
        loadBankLogos();
        
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
    
    // 初始化维护状态显示
    initializeMaintenanceStatus();
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
let currentSummaryActiveTab = 'crosstab'; // 'crosstab' (默认动态交叉报表), 'storesales' (每间店总销售) 或 'table' (标准汇总)
let currentCrossTabMatrix = {}; // 动态交叉报表矩阵数据
let currentActiveStores = []; // 当前选中的店铺列表 [{ id, name }]
let currentFilteredProducts = []; // 筛选/排序后的商品数据
let crosstabSearchFilter = ''; // 交叉报表实时快捷搜索关键字
let crosstabRawProductsList = []; // 所有可用商品列表，用于商品筛选下拉框
let currentStoreSalesData = null; // 每间店销售总览数据 { stores, grandSales, grandQty, grandOrders, overallAvgOrderValue }
let storeSalesSearchFilter = ''; // 每间店销售快捷搜索关键字

// 统一货币格式化 (RM 1,234.56)
function formatRM(amount) {
    const val = Number(amount) || 0;
    return 'RM ' + val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 统一数量格式化
function formatQty(qty) {
    const val = Number(qty) || 0;
    return Number.isInteger(val)
        ? val.toLocaleString('en-US')
        : val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 3 });
}

// HTML 转义辅助函数，防止特殊字符注入
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 通用 Blob 下载辅助函数
function downloadBlob(blob, filename) {
    if (window.navigator && window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// 获取两个日期之间的所有日期
function getDatesInRange(startDateStr, endDateStr) {
    const dates = [];
    let curr = new Date(startDateStr);
    let end = new Date(endDateStr);
    
    // 如果日期大小写反了，自动调换
    if (curr > end) {
        const temp = curr;
        curr = end;
        end = temp;
    }
    
    while (curr <= end) {
        const y = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, '0');
        const day = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${month}-${day}`);
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
}

// 带超时的通用 Promise 包装器，防止 Firebase 网络请求挂起或无响应导致界面一直处于 Loading 状态
function promiseWithTimeout(promise, ms = 4500, fallbackVal = {}) {
    let timeoutId;
    const timeoutPromise = new Promise(resolve => {
        timeoutId = setTimeout(() => {
            console.warn(`Query timed out after ${ms}ms, proceeding with fallback.`);
            resolve(fallbackVal);
        }, ms);
    });
    return Promise.race([
        promise.then(res => {
            clearTimeout(timeoutId);
            return res;
        }).catch(err => {
            clearTimeout(timeoutId);
            console.warn('Promise rejected or error:', err);
            return fallbackVal;
        }),
        timeoutPromise
    ]);
}

// 获取特定店铺在日期范围内的所有销售明细（使用复合key避免跨店铺/日期覆盖，单项加超时与错误保护）
function getStoreSaleDetailsForRange(storeId, startDateStr, endDateStr) {
    const dates = getDatesInRange(startDateStr, endDateStr);
    const promises = dates.map(date => {
        const query = getStoreSaleDetails(storeId, date)
            .catch(err => {
                console.warn(`Failed to fetch store sales for ${storeId} on ${date}:`, err);
                return {};
            });
        return promiseWithTimeout(query, 3500, {});
    });
    return Promise.all(promises).then(results => {
        let allSales = {};
        results.forEach((daySales, idx) => {
            const date = dates[idx];
            if (daySales && typeof daySales === 'object') {
                Object.keys(daySales).forEach(sid => {
                    allSales[`${storeId}__${date}__${sid}`] = {
                        ...daySales[sid],
                        sale_date: date,
                        store_id: daySales[sid]?.store_id || storeId
                    };
                });
            }
        });
        return allSales;
    }).catch(err => {
        console.warn(`getStoreSaleDetailsForRange error:`, err);
        return {};
    });
}

// 并发加载所有店铺在日期范围内的销售数据（使用复合key彻底避免ID冲突与数据重复，防止网络超时卡死）
function loadAllStoresSalesForSummaryRange(startDateStr, endDateStr) {
    // 优先使用内存中已加载的 stores 字典，无需重复通过网络请求 getAllStores
    const getStoreIdsPromise = (stores && Object.keys(stores).length > 0)
        ? Promise.resolve(Object.keys(stores))
        : getAllStores().then(storeList => Object.keys(storeList || {})).catch(() => []);

    return promiseWithTimeout(getStoreIdsPromise, 2500, []).then(storeIds => {
        // 如果没有店铺信息，尝试从当前已知店铺回退
        const activeIds = (storeIds && storeIds.length > 0) ? storeIds : Object.keys(stores || {});
        if (activeIds.length === 0) {
            return {};
        }

        const dates = getDatesInRange(startDateStr, endDateStr);
        const promises = [];
        
        activeIds.forEach(storeId => {
            dates.forEach(date => {
                const datePath = getDatePathFromString(date);
                const query = database.ref(`sales/${storeId}/${datePath.path}`).once('value')
                    .then(snapshot => {
                        const sales = snapshot.val() || {};
                        const salesWithStoreId = {};
                        Object.keys(sales).forEach(saleId => {
                            if (sales[saleId]) {
                                salesWithStoreId[`${storeId}__${date}__${saleId}`] = {
                                    ...sales[saleId],
                                    sale_date: date,
                                    store_id: sales[saleId].store_id || storeId
                                };
                            }
                        });
                        return salesWithStoreId;
                    })
                    .catch(err => {
                        console.warn(`Query failed for store ${storeId} on ${date}:`, err);
                        return {};
                    });

                promises.push(promiseWithTimeout(query, 3500, {}));
            });
        });
        
        return Promise.all(promises).then(results => {
            let allSales = {};
            results.forEach(storeDaySales => {
                if (storeDaySales && typeof storeDaySales === 'object') {
                    allSales = { ...allSales, ...storeDaySales };
                }
            });
            return allSales;
        });
    }).catch(err => {
        console.warn(`loadAllStoresSalesForSummaryRange error:`, err);
        return {};
    });
}

// 动态载入店铺列表至销售总结弹窗
// Update the dropdown trigger button label to reflect current selection
function updateStoreDropdownLabel() {
    const label = document.getElementById('storeDropdownLabel');
    if (!label) return;
    const allCb = document.getElementById('summaryStoreAll');
    if (allCb && allCb.checked) {
        label.textContent = 'All Stores';
        return;
    }
    const checked = document.querySelectorAll('#summaryStoreCheckboxList .store-checkbox-individual:checked');
    if (checked.length === 0) {
        label.textContent = 'None selected';
    } else if (checked.length === 1) {
        label.textContent = checked[0].parentElement.querySelector('.store-checkbox-label').textContent;
    } else {
        label.textContent = `${checked.length} stores`;
    }
}

// Populate store multi-select checkbox list
function populateSummaryStoreCheckboxes() {
    const list = document.getElementById('summaryStoreCheckboxList');
    const allCheckbox = document.getElementById('summaryStoreAll');
    const trigger = document.getElementById('storeDropdownTrigger');
    const popup = document.getElementById('storeDropdownPopup');
    if (!list) return;
    
    list.innerHTML = '';
    
    Object.keys(stores).forEach(storeId => {
        const label = document.createElement('label');
        label.className = 'store-checkbox-item';
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = storeId;
        cb.className = 'store-checkbox-individual';
        cb.checked = true;
        
        const span = document.createElement('span');
        span.className = 'store-checkbox-label';
        span.textContent = stores[storeId].name || storeId;
        
        label.appendChild(cb);
        label.appendChild(span);
        list.appendChild(label);
        
        cb.addEventListener('change', () => {
            const allCbs = list.querySelectorAll('.store-checkbox-individual');
            const checkedCbs = list.querySelectorAll('.store-checkbox-individual:checked');
            if (allCheckbox) {
                allCheckbox.checked = checkedCbs.length === allCbs.length;
                allCheckbox.indeterminate = checkedCbs.length > 0 && checkedCbs.length < allCbs.length;
            }
            updateStoreDropdownLabel();
        });
    });
    
    // "All Stores" master checkbox
    if (allCheckbox) {
        const newAllCb = allCheckbox.cloneNode(true);
        allCheckbox.parentNode.replaceChild(newAllCb, allCheckbox);
        newAllCb.addEventListener('change', () => {
            list.querySelectorAll('.store-checkbox-individual').forEach(cb => {
                cb.checked = newAllCb.checked;
            });
            updateStoreDropdownLabel();
        });
    }
    
    // Wire up the dropdown trigger button (only once)
    if (trigger && popup && !trigger.dataset.wired) {
        trigger.dataset.wired = '1';
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popup.classList.toggle('open');
            trigger.classList.toggle('open', isOpen);
            // Close product dropdown if open
            const prodPopup = document.getElementById('productDropdownPopup');
            const prodTrigger = document.getElementById('productDropdownTrigger');
            if (prodPopup) prodPopup.classList.remove('open');
            if (prodTrigger) prodTrigger.classList.remove('open');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !popup.contains(e.target)) {
                popup.classList.remove('open');
                trigger.classList.remove('open');
            }
        });
    }
    
    updateStoreDropdownLabel();
}

// 动态载入商品筛选下拉列表
function populateSummaryProductCheckboxes(productsList) {
    const list = document.getElementById('summaryProductCheckboxList');
    const allCheckbox = document.getElementById('summaryProductAll');
    const trigger = document.getElementById('productDropdownTrigger');
    const popup = document.getElementById('productDropdownPopup');
    const searchInput = document.getElementById('summaryProductSearchInput');
    const totalCountLabel = document.getElementById('productTotalCountLabel');
    const selectAllBtn = document.getElementById('productSelectAllBtn');
    const deselectAllBtn = document.getElementById('productDeselectAllBtn');

    if (!list) return;
    list.innerHTML = '';
    crosstabRawProductsList = productsList || [];

    if (totalCountLabel) totalCountLabel.textContent = crosstabRawProductsList.length;

    crosstabRawProductsList.forEach(prod => {
        const label = document.createElement('label');
        label.className = 'store-checkbox-item';
        label.dataset.name = (prod.name || '').toLowerCase();
        label.dataset.id = (prod.id || '').toLowerCase();

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = prod.key;
        cb.className = 'product-checkbox-individual';
        cb.checked = true;

        const span = document.createElement('span');
        span.className = 'store-checkbox-label';
        span.textContent = prod.name + (prod.id && prod.id !== '-' ? ` (${prod.id})` : '');

        label.appendChild(cb);
        label.appendChild(span);
        list.appendChild(label);

        cb.addEventListener('change', () => {
            const allCbs = list.querySelectorAll('.product-checkbox-individual');
            const checkedCbs = list.querySelectorAll('.product-checkbox-individual:checked');
            if (allCheckbox) {
                allCheckbox.checked = checkedCbs.length === allCbs.length;
                allCheckbox.indeterminate = checkedCbs.length > 0 && checkedCbs.length < allCbs.length;
            }
            updateProductDropdownLabel();
            renderCrossTabReport();
        });
    });

    if (allCheckbox) {
        const newAllCb = allCheckbox.cloneNode(true);
        allCheckbox.parentNode.replaceChild(newAllCb, allCheckbox);
        newAllCb.checked = true;
        newAllCb.addEventListener('change', () => {
            list.querySelectorAll('.product-checkbox-individual').forEach(cb => {
                cb.checked = newAllCb.checked;
            });
            updateProductDropdownLabel();
            renderCrossTabReport();
        });
    }

    if (selectAllBtn) {
        selectAllBtn.onclick = (e) => {
            e.preventDefault();
            list.querySelectorAll('.product-checkbox-individual').forEach(cb => { cb.checked = true; });
            const ac = document.getElementById('summaryProductAll');
            if (ac) { ac.checked = true; ac.indeterminate = false; }
            updateProductDropdownLabel();
            renderCrossTabReport();
        };
    }

    if (deselectAllBtn) {
        deselectAllBtn.onclick = (e) => {
            e.preventDefault();
            list.querySelectorAll('.product-checkbox-individual').forEach(cb => { cb.checked = false; });
            const ac = document.getElementById('summaryProductAll');
            if (ac) { ac.checked = false; ac.indeterminate = false; }
            updateProductDropdownLabel();
            renderCrossTabReport();
        };
    }

    if (searchInput) {
        searchInput.oninput = () => {
            const q = searchInput.value.toLowerCase().trim();
            list.querySelectorAll('.store-checkbox-item').forEach(item => {
                const match = !q || (item.dataset.name && item.dataset.name.includes(q)) || (item.dataset.id && item.dataset.id.includes(q));
                item.style.display = match ? 'flex' : 'none';
            });
        };
    }

    if (trigger && popup && !trigger.dataset.wired) {
        trigger.dataset.wired = '1';
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popup.classList.toggle('open');
            trigger.classList.toggle('open', isOpen);
            // Close store dropdown if open
            const storePopup = document.getElementById('storeDropdownPopup');
            const storeTrigger = document.getElementById('storeDropdownTrigger');
            if (storePopup) storePopup.classList.remove('open');
            if (storeTrigger) storeTrigger.classList.remove('open');
            if (isOpen && searchInput) {
                setTimeout(() => searchInput.focus(), 50);
            }
        });

        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target) && !popup.contains(e.target)) {
                popup.classList.remove('open');
                trigger.classList.remove('open');
            }
        });
    }

    updateProductDropdownLabel();
}

// 更新商品下拉框触发按钮文案
function updateProductDropdownLabel() {
    const label = document.getElementById('productDropdownLabel');
    if (!label) return;
    const allCb = document.getElementById('summaryProductAll');
    if (allCb && allCb.checked) {
        label.textContent = 'All Products';
        return;
    }
    const checked = document.querySelectorAll('#summaryProductCheckboxList .product-checkbox-individual:checked');
    if (checked.length === 0) {
        label.textContent = 'None selected';
    } else if (checked.length === 1) {
        label.textContent = checked[0].parentElement.querySelector('.store-checkbox-label').textContent;
    } else {
        label.textContent = `${checked.length} products`;
    }
}

// 获取已勾选的商品 Key 列表（空数组代表全部）
function getSelectedSummaryProducts() {
    const allCheckbox = document.getElementById('summaryProductAll');
    if (allCheckbox && allCheckbox.checked) {
        return []; // 全部商品
    }
    const checked = document.querySelectorAll('#summaryProductCheckboxList .product-checkbox-individual:checked');
    return Array.from(checked).map(cb => cb.value);
}

// Get array of selected store IDs from checkboxes (empty array = all stores)
function getSelectedSummaryStores() {
    const allCheckbox = document.getElementById('summaryStoreAll');
    if (allCheckbox && allCheckbox.checked) {
        return []; // means "all"
    }
    const checked = document.querySelectorAll('#summaryStoreCheckboxList .store-checkbox-individual:checked');
    return Array.from(checked).map(cb => cb.value);
}

// ============================================================
// 离线导入：用 Firebase RTDB 导出的 JSON 文件直接生成 Sales Summary
// 完全不联网，数据结构和 loadAllStoresSalesForSummaryRange() 保持一致
// 支持：①整库导出 ②只导 sales 节点 ③单店子树 ④多文件合并
//       ⑤下载被截断的半截文件（自动抢救已完整的部分）
// ============================================================
let importedSalesDb = null;        // { roots:[{root,fileName}], storesRoot, fileLabel, sizeBytes, partial, truncAt }
let importedMode = false;          // true 时 refreshSalesSummary 走本地 JSON
let importedStoresBackup = null;   // 导入时被覆盖的 stores 原值，用于恢复

function importToStr(v) {
    return (v === undefined || v === null) ? '' : String(v).trim();
}
function importPad2(v) {
    const s = String(v);
    return s.length < 2 ? ('0' + s) : s;
}
function importMb(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1);
}

// 判断单个 JSON 是「整库导出」还是「只有 sales 子树」还是「单店子树」
function detectRtdbShape(data) {
    if (!data || typeof data !== 'object') return { salesRoot: null, storesRoot: null };

    // 1) 标准整库导出：{ sales: {...}, stores: {...}, ... }
    //    注意：Firebase 导出时纯数字 key 的节点会变成数组（stores 0..14），
    //    所以这里不能排除 Array。
    if (data.sales && typeof data.sales === 'object') {
        return { salesRoot: data.sales, storesRoot: (data.stores && typeof data.stores === 'object') ? data.stores : null };
    }

    // 1b) 只导了 stores（用来补店铺名）：{ stores: {...} }
    if (data.stores && typeof data.stores === 'object') {
        return { salesRoot: null, storesRoot: data.stores };
    }

    const keys = Object.keys(data);

    // 2) 只导了 sales 节点：{ storeId: { "2026": { "01": { "01": {...} } } } }
    const looksLikeStoreMap = keys.some(k => {
        const v = data[k];
        return v && typeof v === 'object' && !Array.isArray(v) &&
            Object.keys(v).some(y => /^\d{4}$/.test(y));
    });
    if (looksLikeStoreMap) return { salesRoot: data, storesRoot: null };

    // 3) 只导了单间店的子树：{ "2026": { "01": { "01": {...} } } }
    const hasYear = keys.some(k => /^\d{4}$/.test(k));
    if (hasYear) return { salesRoot: { __single__: data }, storesRoot: null };

    // 4) 单间店里再细一层（只有某年某月）：{ "01": { "01": {...} } }
    const hasMonth = keys.some(k => /^\d{1,2}$/.test(k));
    if (hasMonth && keys.length <= 12) return { salesRoot: { __single__: { __partial__: data } }, storesRoot: null };

    return { salesRoot: null, storesRoot: null };
}

// 数一下文件里实际有几间店（跳过数组里的空槽）
function countImportStores(storesRoot) {
    if (!storesRoot || typeof storesRoot !== 'object') return 0;
    let n = 0;
    Object.keys(storesRoot).forEach(k => {
        const s = storesRoot[k];
        if (s && typeof s === 'object') n++;
    });
    return n;
}

// 遍历 salesRoot 里所有「年/月/日」节点，回调 (storeKey, y, m, d, dayNode)
function forEachImportDay(roots, cb) {
    (roots || []).forEach(entry => {
        const root = entry && entry.root ? entry.root : entry;
        if (!root || typeof root !== 'object') return;
        Object.keys(root).forEach(storeKey => {
            const storeNode = root[storeKey];
            if (!storeNode || typeof storeNode !== 'object') return;
            Object.keys(storeNode).forEach(y => {
                if (!/^\d{4}$/.test(y)) return;
                const yNode = storeNode[y];
                if (!yNode || typeof yNode !== 'object') return;
                Object.keys(yNode).forEach(m => {
                    if (!/^\d{1,2}$/.test(m)) return;
                    const mNode = yNode[m];
                    if (!mNode || typeof mNode !== 'object') return;
                    Object.keys(mNode).forEach(d => {
                        if (!/^\d{1,2}$/.test(d)) return;
                        const dayNode = mNode[d];
                        if (!dayNode || typeof dayNode !== 'object') return;
                        // 处理 __partial__ 包装（只导到月份这一层的情况）
                        cb(storeKey, y, m, d, dayNode);
                    });
                });
            });
        });
    });
}

// 只扫 年/月/日 的 key，得出文件覆盖的日期范围（不遍历订单，很快）
function getImportDateBounds(roots) {
    let min = null, max = null;
    forEachImportDay(roots, (storeKey, y, m, d) => {
        const ds = `${y}-${importPad2(m)}-${importPad2(d)}`;
        if (!min || ds < min) min = ds;
        if (!max || ds > max) max = ds;
    });
    return { min, max };
}

// 按日期范围 + 店铺筛选抽出订单，结构与 Firebase 版完全一致：
// { "storeId__YYYY-MM-DD__orderKey": { ...order, sale_date, store_id } }
function extractSalesFromImport(roots, startDate, endDate, selectedStoreIds) {
    const out = {};
    if (!startDate || !endDate) return { sales: out, orders: 0 };

    const sp = String(startDate).split('-');
    const ep = String(endDate).split('-');
    if (sp.length !== 3 || ep.length !== 3) return { sales: out, orders: 0 };

    const startNum = Number(sp[0] + importPad2(sp[1]) + importPad2(sp[2]));
    const endNum = Number(ep[0] + importPad2(ep[1]) + importPad2(ep[2]));

    const storeFilter = (selectedStoreIds && selectedStoreIds.length)
        ? new Set(selectedStoreIds.map(String))
        : null;

    let orders = 0;
    const rootList = (roots || []).map(e => (e && e.root) ? e.root : e);

    rootList.forEach(root => {
        if (!root || typeof root !== 'object') return;
        Object.keys(root).forEach(storeKey => {
            const isSingle = storeKey === '__single__';
            if (storeFilter && !isSingle && !storeFilter.has(String(storeKey))) return;

            const storeNode = root[storeKey];
            if (!storeNode || typeof storeNode !== 'object') return;

            Object.keys(storeNode).forEach(y => {
                if (!/^\d{4}$/.test(y)) return;
                if (Number(y) < Number(sp[0]) || Number(y) > Number(ep[0])) return;

                const yNode = storeNode[y];
                if (!yNode || typeof yNode !== 'object') return;

                Object.keys(yNode).forEach(m => {
                    const mNode = yNode[m];
                    if (!mNode || typeof mNode !== 'object') return;

                    Object.keys(mNode).forEach(d => {
                        const dNode = mNode[d];
                        if (!dNode || typeof dNode !== 'object') return;

                        const key = Number(y + importPad2(m) + importPad2(d));
                        if (key < startNum || key > endNum) return;

                        const dateStr = `${y}-${importPad2(m)}-${importPad2(d)}`;

                        Object.keys(dNode).forEach(saleKey => {
                            const sale = dNode[saleKey];
                            if (!sale || typeof sale !== 'object') return;
                            if (!sale.items && sale.total_amount === undefined && sale.totalAmount === undefined) return;

                            const sid = importToStr(sale.store_id || sale.storeId) || (isSingle ? 'imported' : importToStr(storeKey));
                            if (storeFilter && !storeFilter.has(sid)) return;

                            const merged = Object.assign({}, sale, { sale_date: dateStr, store_id: sid });
                            out[`${sid}__${dateStr}__${saleKey}`] = merged;
                            orders++;
                        });
                    });
                });
            });
        });
    });

    return { sales: out, orders };
}

// ---- 半截文件抢救：找到最后一个完整的 }，把还开着的括号补齐再解析 ----
function repairTruncatedJson(text) {
    if (typeof text !== 'string' || !text.length) return null;

    const stack = [];        // 'obj' | 'arr'
    let inStr = false, esc = false;
    let bestCut = -1, bestStack = null;
    const n = text.length;

    for (let i = 0; i < n; i++) {
        const c = text.charCodeAt(i);

        if (inStr) {
            if (esc) { esc = false; continue; }
            if (c === 92) { esc = true; continue; }      // 反斜杠
            if (c === 34) { inStr = false; }             // "
            continue;
        }

        if (c === 34) { inStr = true; continue; }        // "
        if (c === 123) { stack.push('obj'); continue; }  // {
        if (c === 91) { stack.push('arr'); continue; }   // [
        if (c === 125 || c === 93) {                     // }  ]
            if (!stack.length) return null;
            stack.pop();
            // 只要是一个完整的 } 后面，就能安全切断
            if (c === 125) { bestCut = i + 1; bestStack = stack.slice(); }
        }
    }

    if (bestCut < 0 || !bestStack) return null;

    let closers = '';
    for (let k = bestStack.length - 1; k >= 0; k--) {
        closers += (bestStack[k] === 'arr') ? ']' : '}';
    }

    try {
        const data = JSON.parse(text.slice(0, bestCut) + closers);
        return { data: data, cutAt: bestCut, totalBytes: n, lostBytes: n - bestCut };
    } catch (e) {
        return null;
    }
}

function setImportStatus(type, text) {
    const bar = document.getElementById('importJsonStatus');
    const textEl = document.getElementById('importJsonStatusText');
    if (!bar || !textEl) return;
    bar.style.display = 'flex';
    bar.classList.remove('is-busy', 'is-error', 'is-warn');
    if (type === 'busy') bar.classList.add('is-busy');
    if (type === 'error') bar.classList.add('is-error');
    if (type === 'warn') bar.classList.add('is-warn');
    textEl.textContent = text;
}

function renderImportStatus() {
    const bar = document.getElementById('importJsonStatus');
    const textEl = document.getElementById('importJsonStatusText');
    const btn = document.getElementById('importJsonBtn');
    if (!bar || !textEl) return;

    if (!importedMode || !importedSalesDb) {
        bar.style.display = 'none';
        bar.classList.remove('is-busy', 'is-error', 'is-warn');
        if (btn) btn.classList.remove('is-loaded');
        return;
    }

    const db = importedSalesDb;
    const bounds = getImportDateBounds(db.roots);
    const storeCount = countImportStores(db.storesRoot);
    const parts = [];

    if (db.partial) {
        parts.push('⚠ 文件被截断（读到 ' + importMb(db.sizeBytes) + ' MB 就断了），已抢救出完整部分');
    } else {
        parts.push('Offline data · ' + db.fileLabel + ' (' + importMb(db.sizeBytes) + ' MB)');
    }
    if (db.roots.length > 1) parts.push(db.roots.length + ' 个文件');
    if (storeCount) parts.push(storeCount + ' stores');
    if (bounds.min) parts.push(bounds.min + ' ~ ' + bounds.max);
    if (!storeCount) parts.push('店铺名显示为 ID（可再导一个 /stores 补名字）');
    parts.push('不连数据库');

    setImportStatus(db.partial ? 'warn' : 'ok', parts.join(' · '));
    if (btn) btn.classList.add('is-loaded');
}

function clearImportedData() {
    importedMode = false;
    importedSalesDb = null;

    if (importedStoresBackup) {
        Object.keys(stores).forEach(k => { if (!(k in importedStoresBackup)) delete stores[k]; });
        Object.keys(importedStoresBackup).forEach(k => { stores[k] = importedStoresBackup[k]; });
        importedStoresBackup = null;
    }

    const bar = document.getElementById('importJsonStatus');
    if (bar) bar.style.display = 'none';
    const btn = document.getElementById('importJsonBtn');
    if (btn) btn.classList.remove('is-loaded');
    const input = document.getElementById('importJsonInput');
    if (input) input.value = '';

    populateSummaryStoreCheckboxes();
    refreshSalesSummary();
}

// 单个文件解析（含截断抢救）
async function parseImportFile(file) {
    const text = await file.text();

    try {
        return { data: JSON.parse(text), partial: null, fileName: file.name, size: file.size };
    } catch (err) {
        const fixed = repairTruncatedJson(text);
        if (!fixed) {
            throw new Error('「' + file.name + '」不是合法 JSON，而且是坏的（无法抢救）：' + (err.message || err));
        }
        return { data: fixed.data, partial: fixed, fileName: file.name, size: file.size };
    }
}

// 支持一次选多个文件（分店导出后合并）
async function handleImportJsonFiles(fileList) {
    const files = Array.prototype.slice.call(fileList || []).filter(f => f);
    if (!files.length) return;

    const totalMb = files.reduce((a, f) => a + f.size, 0) / (1024 * 1024);
    if (totalMb > 600) {
        setImportStatus('error', '文件太大（' + totalMb.toFixed(0) + ' MB）。建议按店铺分开导出，每次选几个。');
        return;
    }

    setImportStatus('busy', '读取 ' + files.length + ' 个文件（' + totalMb.toFixed(1) + ' MB）...');

    try {
        const roots = [];
        let storesRoot = null;
        let partialInfo = null;
        let totalBytes = 0;
        const labels = [];

        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (files.length > 1) {
                setImportStatus('busy', '解析第 ' + (i + 1) + '/' + files.length + ' 个：' + f.name);
                await new Promise(r => setTimeout(r, 0));
            }

            const parsed = await parseImportFile(f);
            totalBytes += parsed.size;
            labels.push(parsed.fileName);

            const shape = detectRtdbShape(parsed.data);
            if (!shape.salesRoot && !shape.storesRoot) {
                throw new Error('「' + f.name + '」里找不到 sales / stores 节点。请确认导出的是 /sales 或 /stores 这一层。');
            }
            if (shape.salesRoot) roots.push({ root: shape.salesRoot, fileName: f.name });
            if (!storesRoot && shape.storesRoot) storesRoot = shape.storesRoot;

            if (parsed.partial && !partialInfo) {
                partialInfo = {
                    fileName: f.name,
                    cutAt: parsed.partial.cutAt,
                    totalBytes: parsed.partial.totalBytes
                };
            }
        }

        // 合并店铺信息（以文件为准），备份原值以便恢复
        if (!importedStoresBackup) importedStoresBackup = Object.assign({}, stores);
        if (storesRoot) {
            Object.keys(storesRoot).forEach(sid => {
                const s = storesRoot[sid];
                if (!s || typeof s !== 'object') return;
                stores[sid] = s;
            });
        }

        // 只导了 stores（没有 sales）→ 当作"补店铺名"，合并进当前导入，不覆盖已有数据
        if (!roots.length) {
            if (importedMode && importedSalesDb && storesRoot) {
                importedSalesDb.storesRoot = storesRoot;
                renderImportStatus();
                populateSummaryStoreCheckboxes();
                refreshSalesSummary();
                return;
            }
            throw new Error('这些文件里没有 sales 数据。请至少选择一个含 sales 节点的导出文件。');
        }

        importedSalesDb = {
            roots: roots,
            storesRoot: storesRoot || (importedMode && importedSalesDb ? importedSalesDb.storesRoot : null),
            fileLabel: labels.length > 1 ? (labels.length + ' files') : labels[0],
            fileNames: labels,
            sizeBytes: totalBytes,
            partial: partialInfo
        };
        importedMode = true;

        // 自动套用文件里的日期范围
        const bounds = getImportDateBounds(roots);
        const startEl = document.getElementById('summaryStartDate');
        const endEl = document.getElementById('summaryEndDate');
        if (bounds.min && startEl) startEl.value = bounds.min;
        if (bounds.max && endEl) endEl.value = bounds.max;

        populateSummaryStoreCheckboxes();
        renderImportStatus();

        if (!bounds.min) {
            setImportStatus('error', '文件里没有找到任何 sales/年/月/日 记录，请确认导出的是正确项目。');
            return;
        }

        refreshSalesSummary();
    } catch (err) {
        console.error('[Import JSON] failed:', err);
        importedMode = false;
        importedSalesDb = null;
        if (importedStoresBackup) {
            Object.keys(importedStoresBackup).forEach(k => { stores[k] = importedStoresBackup[k]; });
            importedStoresBackup = null;
        }
        setImportStatus('error', err.message || '导入失败');
    }
}

// 兼容单文件调用
function handleImportJsonFile(file) {
    return handleImportJsonFiles([file]);
}


// 把一批 sales 渲染进两个视图（联网 / 离线共用）
function applySalesToSummaryView(sales) {
    const salesCount = (sales && typeof sales === 'object') ? Object.keys(sales).length : 0;

    const existingTip = document.getElementById('sample-data-tip');
    if (existingTip) existingTip.remove();

    if (salesCount === 0) {
        const startDate = document.getElementById('summaryStartDate')?.value || '';
        const endDate = document.getElementById('summaryEndDate')?.value || '';
        const tipContainer = document.createElement('div');
        tipContainer.id = 'sample-data-tip';
        tipContainer.style = 'background:#eff6ff;border-left:4px solid #3b82f6;color:#1e40af;padding:12px 18px;font-size:13px;font-weight:500;border-radius:8px;margin:12px 24px 0;display:flex;align-items:center;gap:8px;';
        tipContainer.innerHTML = `<i class="material-icons" style="font-size:18px;color:#3b82f6;">info</i> <span>当前日期范围（<strong>${escapeHtml(startDate)}</strong> 至 <strong>${escapeHtml(endDate)}</strong>）内暂无销售订单记录。${importedMode ? '（数据来源：导入的 JSON 文件）' : '已为您列出店铺已登记的商品列表（销量显示为 0）。若需查看历史销售业绩，请在上方调整日期范围后点击 <strong>Query</strong> 即可。'}</span>`;

        const scrollable = document.querySelector('.sales-summary-scrollable');
        if (scrollable) scrollable.insertBefore(tipContainer, scrollable.querySelector('.summary-content-area'));

        currentSalesData = {};
        generateSalesSummary({});
    } else {
        currentSalesData = sales;
        generateSalesSummary(sales);
    }
}

// Refresh and reload sales summary data with robust timeout and guaranteed loading dismissal
function refreshSalesSummary() {
    const startDate = document.getElementById('summaryStartDate')?.value;
    const endDate = document.getElementById('summaryEndDate')?.value;
    const selectedStores = getSelectedSummaryStores(); // [] = all, [id,...] = specific
    
    if (!startDate || !endDate) {
        alert('Please select a complete date range!');
        return;
    }

    // 离线导入模式：直接从内存里的 JSON 取数，完全不碰 Firebase
    if (importedMode && importedSalesDb) {
        showSummaryLoadingState(true);
        try {
            const result = extractSalesFromImport(importedSalesDb.roots, startDate, endDate, selectedStores);
            console.log('[Import JSON] extracted', result.orders, 'orders from', importedSalesDb.fileName);
            applySalesToSummaryView(result.sales);
        } catch (err) {
            console.error('[Import JSON] extraction failed:', err);
            setImportStatus('error', '从文件里取数失败：' + (err.message || err));
        } finally {
            showSummaryLoadingState(false);
        }
        return;
    }
    
    showSummaryLoadingState(true);
    
    let salesPromise;
    if (selectedStores.length === 0) {
        // All stores
        salesPromise = loadAllStoresSalesForSummaryRange(startDate, endDate);
    } else if (selectedStores.length === 1) {
        salesPromise = getStoreSaleDetailsForRange(selectedStores[0], startDate, endDate);
    } else {
        // Multiple specific stores — run in parallel and merge
        const promises = selectedStores.map(sid => getStoreSaleDetailsForRange(sid, startDate, endDate));
        salesPromise = Promise.all(promises).then(results => {
            let merged = {};
            results.forEach(r => { if (r && typeof r === 'object') merged = { ...merged, ...r }; });
            return merged;
        });
    }
    
    // 全局 5 秒超时保护：无论网络状态或 Firebase 如何，绝对不会长时间卡在 Loading
    promiseWithTimeout(salesPromise, 5000, {})
        .then(sales => {
            console.log('Sales data loaded for summary range:', sales);
            if (!sales || Object.keys(sales).length === 0) {
                console.log('No sales records in range:', startDate, 'to', endDate);
            }
            applySalesToSummaryView(sales);
        })
        .catch(error => {
            console.error('Failed to load sales data for summary range:', error);
            currentSalesData = {};
            generateSalesSummary({});
        })
        .finally(() => {
            // 无论成功、失败还是超时，必定解除 Loading 状态
            showSummaryLoadingState(false);
        });
}

// Show the Sales Summary modal
function showSalesSummary() {
    // 权限校验：仅超级管理员 (sadmin) 可访问
    if (!document.body.classList.contains('is-sadmin')) {
        alert("您没有访问 Sales Summary 的权限（仅限超级管理员使用）");
        return;
    }
    
    const date = dateFilter.value || selectedDate || getCurrentDate();
    
    showModal(salesSummaryModal);
    
    // Sync dashboard date to modal date pickers
    const startDateInput = document.getElementById('summaryStartDate');
    const endDateInput = document.getElementById('summaryEndDate');
    if (startDateInput) startDateInput.value = date;
    if (endDateInput) endDateInput.value = date;
    
    // Build store checkboxes from global stores object
    populateSummaryStoreCheckboxes();
    
    // Reset quick search
    const quickSearchInput = document.getElementById('crosstabQuickSearch');
    if (quickSearchInput) quickSearchInput.value = '';
    crosstabSearchFilter = '';
    const clearBtn = document.getElementById('crosstabClearSearchBtn');
    if (clearBtn) clearBtn.style.display = 'none';

    const storeSearchInput = document.getElementById('storeSalesQuickSearch');
    if (storeSearchInput) storeSearchInput.value = '';
    storeSalesSearchFilter = '';
    const storeClearBtn = document.getElementById('storeSalesClearSearchBtn');
    if (storeClearBtn) storeClearBtn.style.display = 'none';

    // Default to Cross-Tab dynamic pivot view
    switchSummaryTab('crosstab');
    
    // 确保真实商品已载入，如果尚未载入则先预取
    if (!products || Object.keys(products).length === 0) {
        if (typeof getAllProducts === 'function') {
            getAllProducts().then(pData => {
                if (pData && Object.keys(pData).length > 0) {
                    products = pData;
                }
            }).catch(e => console.warn('Could not pre-fetch products:', e))
            .finally(() => {
                refreshSalesSummary();
            });
            return;
        }
    }
    
    // Load data
    refreshSalesSummary();
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

// 核心计算函数：构建多店铺商品动态交叉报表矩阵 (Product Sales Analysis Matrix)
function buildCrossTabMatrix(sales) {
    sales = (sales && typeof sales === 'object') ? sales : {};
    // 安全转字符串：Firebase 中商品 ID 常为数字，直接 .trim() 会抛错导致整份报表归零
    const toStr = v => (v === undefined || v === null) ? '' : String(v).trim();
    const groupBy = document.getElementById('summaryGroupBy')?.value || 'name';
    const selectedStores = getSelectedSummaryStores().map(toStr); // [] = all stores, or array of store IDs

    // 1. 确定选定的店铺列表
    let activeStores = [];
    if (selectedStores.length === 0) {
        // 所有有效店铺（来自 stores 字典及销售数据中出现的店铺）
        const allStoreIdSet = new Set(Object.keys(stores));
        Object.entries(sales).forEach(([k, s]) => {
            const sid = toStr(s && (s.store_id || s.storeId)) || toStr(k.split('__')[0]);
            if (sid) allStoreIdSet.add(sid);
        });
        activeStores = Array.from(allStoreIdSet).map(sid => ({
            id: toStr(sid),
            name: stores[sid]?.name || sid
        }));
    } else {
        activeStores = selectedStores.map(sid => ({
            id: toStr(sid),
            name: stores[sid]?.name || sid
        }));
    }
    // 按照店铺名称排序
    activeStores.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    currentActiveStores = activeStores;

    const activeStoreIdSet = new Set(activeStores.map(s => s.id));
    const productMatrix = {};
    const processedSaleKeys = new Set();

    // 2. 预先注入系统已登记的真实商品库 (products)
    // 确保无论当前所选日期是否有交易，用户自己的真实商品都会完整显示在交叉报表与商品筛选下拉框中
    const registeredProducts = (window.products && Object.keys(window.products).length > 0) ? window.products : (typeof products === 'object' ? products : {});
    if (registeredProducts && typeof registeredProducts === 'object') {
        Object.values(registeredProducts).forEach(prod => {
            if (!prod) return;
            const pName = toStr(prod.name || prod.productName);
            const pId = toStr(prod.original_id || prod.id);
            if (!pName && !pId) return;
            const groupKey = groupBy === 'id' ? (pId || pName) : (pName || pId);
            if (!groupKey) return;

            if (!productMatrix[groupKey]) {
                productMatrix[groupKey] = {
                    key: groupKey,
                    name: pName || pId,
                    id: pId || '-',
                    unitPrice: parseFloat(prod.price) || 0,
                    category: prod.category || 'Uncategorized',
                    stores: {},
                    totalQty: 0,
                    totalSales: 0,
                    ids: new Set()
                };
            }
            if (pId) productMatrix[groupKey].ids.add(pId);
            if (prod.price) productMatrix[groupKey].unitPrice = parseFloat(prod.price);
            if (prod.category) productMatrix[groupKey].category = prod.category;
        });
    }

    // 3. 遍历订单数据，准确累加各店铺的销售数量及净销售额
    let matchedOrders = 0;
    Object.entries(sales).forEach(([compKey, sale]) => {
        if (!sale) return;
        // Firebase 可能把数组以对象形式返回，两种都兼容
        const itemsList = Array.isArray(sale.items) ? sale.items
            : (sale.items && typeof sale.items === 'object' ? Object.values(sale.items) : []);
        if (itemsList.length === 0) return;

        // 严格排除取消、退款、作废订单
        const status = toStr(sale.status).toLowerCase();
        if (status === 'cancelled' || status === 'canceled' || status === 'refunded' || status === 'void') return;
        if (sale.isCancelled === true || sale.isRefunded === true || sale.isVoid === true || sale.void === true) return;

        // 防重复统计
        if (processedSaleKeys.has(compKey)) return;
        processedSaleKeys.add(compKey);

        // 订单所属店铺：优先使用订单字段，否则用查询路径（复合 key 前缀）
        let storeId = toStr(sale.store_id || sale.storeId);
        const pathStoreId = toStr(compKey.split('__')[0]);
        if (!activeStoreIdSet.has(storeId) && activeStoreIdSet.has(pathStoreId)) storeId = pathStoreId;
        if (!storeId || !activeStoreIdSet.has(storeId)) return;
        matchedOrders++;

        // 计算整单折扣率，以便按比例平摊至各商品明细
        let discountRatio = 0;
        const subtotal = parseFloat(sale.subtotal) || 0;
        const discountAmount = parseFloat(sale.discountAmount) || 0;
        if (subtotal > 0 && discountAmount > 0) {
            discountRatio = Math.min(1, Math.max(0, discountAmount / subtotal));
        }

        itemsList.forEach(item => {
            if (!item) return;
            const pName = toStr(item.name || item.productName) || 'Unnamed Product';
            const pId = toStr(item.id || item.productId);
            const groupKey = groupBy === 'id' ? (pId || pName) : pName;
            if (!groupKey) return;

            const quantity = parseFloat(item.quantity) || 0;

            // 商品原小计（免费商品按 0 元算）
            let itemSubtotal = 0;
            if (item.isFree) {
                itemSubtotal = 0;
            } else if (item.subtotal !== undefined && item.subtotal !== null) {
                itemSubtotal = parseFloat(item.subtotal) || 0;
            } else {
                itemSubtotal = (parseFloat(item.price) || 0) * quantity;
            }

            // 扣除整单折扣后的实际销售金额 (Net Sales)
            const netSales = itemSubtotal * (1 - discountRatio);

            if (!productMatrix[groupKey]) {
                productMatrix[groupKey] = {
                    key: groupKey,
                    name: pName,
                    id: pId || '-',
                    unitPrice: parseFloat(item.price) || 0,
                    category: item.category || 'Uncategorized',
                    stores: {},
                    totalQty: 0,
                    totalSales: 0,
                    ids: new Set()
                };
            }

            if (pId) productMatrix[groupKey].ids.add(pId);
            if (item.price) productMatrix[groupKey].unitPrice = parseFloat(item.price);

            if (!productMatrix[groupKey].stores[storeId]) {
                productMatrix[groupKey].stores[storeId] = { qty: 0, sales: 0 };
            }

            productMatrix[groupKey].stores[storeId].qty += quantity;
            productMatrix[groupKey].stores[storeId].sales += netSales;
            productMatrix[groupKey].totalQty += quantity;
            productMatrix[groupKey].totalSales += netSales;
        });
    });

    console.log(`[Sales Summary] ${Object.keys(sales).length} orders loaded, ${matchedOrders} matched selected stores:`, Array.from(activeStoreIdSet));

    // 格式化商品 ID
    Object.values(productMatrix).forEach(p => {
        if (p.ids) {
            const idArr = Array.from(p.ids);
            if (idArr.length === 1) p.id = idArr[0];
            else if (idArr.length > 1) p.id = `${idArr[0]} (+${idArr.length - 1})`;
            delete p.ids;
        }
    });

    currentCrossTabMatrix = productMatrix;

    // 填充商品筛选下拉框
    const productList = Object.values(productMatrix).map(p => ({
        key: p.key,
        name: p.name,
        id: p.id
    })).sort((a, b) => a.name.localeCompare(b.name));

    populateSummaryProductCheckboxes(productList);
}

// 渲染 Product Sales Analysis 动态交叉报表
function renderCrossTabReport() {
    const thead = document.getElementById('crosstabThead');
    const tbody = document.getElementById('crosstabTbody');
    const tfoot = document.getElementById('crosstabTfoot');
    if (!thead || !tbody || !tfoot) return;

    const selectedProductKeys = getSelectedSummaryProducts();
    let filtered = Object.values(currentCrossTabMatrix || {});

    // 1. 商品多选下拉筛选
    if (selectedProductKeys.length > 0) {
        const allowedSet = new Set(selectedProductKeys);
        filtered = filtered.filter(p => allowedSet.has(p.key));
    }

    // 2. 表格上方实时快捷搜索
    if (crosstabSearchFilter) {
        const q = crosstabSearchFilter.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.id && p.id.toLowerCase().includes(q)));
    }

    // 3. 排序
    const sortBy = document.getElementById('summarySortBy')?.value || 'quantity';
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'quantity': return b.totalQty - a.totalQty;
            case 'quantity_asc': return a.totalQty - b.totalQty;
            case 'revenue': return b.totalSales - a.totalSales;
            case 'revenue_asc': return a.totalSales - b.totalSales;
            case 'name': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            default: return b.totalQty - a.totalQty;
        }
    });

    currentFilteredProducts = filtered;

    // 4. 统计每间店铺的总销售数量、总销售金额，以及所有选定店铺的 GRAND TOTAL
    const storeTotals = {};
    currentActiveStores.forEach(s => {
        storeTotals[s.id] = { qty: 0, sales: 0 };
    });
    let grandTotalQty = 0;
    let grandTotalSales = 0;

    filtered.forEach(p => {
        currentActiveStores.forEach(s => {
            const sData = p.stores[s.id] || { qty: 0, sales: 0 };
            storeTotals[s.id].qty += sData.qty;
            storeTotals[s.id].sales += sData.sales;
        });
        grandTotalQty += p.totalQty;
        grandTotalSales += p.totalSales;
    });

    // 5. 更新元数据徽章与提示文案
    const storeBadge = document.getElementById('crosstabStoreBadge');
    const prodBadge = document.getElementById('crosstabProductBadge');
    const revBadge = document.getElementById('crosstabTotalRevenueBadge');
    const countSpan = document.getElementById('crosstabShowingCount');

    if (storeBadge) storeBadge.querySelector('span').textContent = `${currentActiveStores.length} Stores`;
    if (prodBadge) prodBadge.querySelector('span').textContent = `${filtered.length} Products`;
    if (revBadge) revBadge.querySelector('span').textContent = formatRM(grandTotalSales);
    if (countSpan) countSpan.textContent = `Showing ${filtered.length} of ${Object.keys(currentCrossTabMatrix || {}).length} products`;

    // 6. 动态生成表头（两层复合表头：第一层商品名称跨两行，各店铺占两个子栏；最后两栏为 Total Qty, Total Sales）
    let row1 = `<tr>
        <th rowspan="2" class="crosstab-th crosstab-sticky-col crosstab-product-th">Product</th>`;
    currentActiveStores.forEach(store => {
        row1 += `<th colspan="2" class="crosstab-th crosstab-store-group-th text-center">
            <div class="store-header-title"><i class="material-icons">store</i> ${escapeHtml(store.name)}</div>
        </th>`;
    });
    row1 += `<th colspan="2" class="crosstab-th crosstab-total-group-th text-center">
        <div class="total-header-title"><i class="material-icons">summarize</i> TOTAL</div>
    </th></tr>`;

    let row2 = `<tr>`;
    currentActiveStores.forEach(store => {
        row2 += `<th class="crosstab-subth text-right crosstab-qty-col">Qty Sold</th>
                 <th class="crosstab-subth text-right crosstab-sales-col">Sales (RM)</th>`;
    });
    row2 += `<th class="crosstab-subth crosstab-total-subth text-right crosstab-qty-col">Total Qty</th>
             <th class="crosstab-subth crosstab-total-subth text-right crosstab-sales-col">Total Sales (RM)</th>
    </tr>`;

    thead.innerHTML = row1 + row2;

    // 7. 动态生成数据行（每一行代表一个商品，冻结第一栏 Product）
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${2 + currentActiveStores.length * 2}" class="text-center" style="padding: 40px; color: #64748b; font-size: 14px;">No products match the selected criteria</td></tr>`;
    } else {
        let bodyHtml = '';
        filtered.forEach(prod => {
            bodyHtml += `<tr>
                <td class="crosstab-td crosstab-sticky-col crosstab-product-cell">
                    <div class="product-cell-wrapper">
                        <span class="product-cell-name">${escapeHtml(prod.name)}</span>
                        ${prod.id && prod.id !== '-' ? `<span class="product-cell-id">${escapeHtml(prod.id)}</span>` : ''}
                    </div>
                </td>`;
            currentActiveStores.forEach(store => {
                const sData = prod.stores[store.id] || { qty: 0, sales: 0 };
                bodyHtml += `<td class="crosstab-td text-right crosstab-qty-col ${sData.qty === 0 ? 'cell-zero' : ''}">${formatQty(sData.qty)}</td>
                             <td class="crosstab-td text-right crosstab-sales-col ${sData.sales === 0 ? 'cell-zero' : ''}">${formatRM(sData.sales)}</td>`;
            });
            bodyHtml += `<td class="crosstab-td crosstab-total-cell text-right crosstab-qty-col font-bold">${formatQty(prod.totalQty)}</td>
                         <td class="crosstab-td crosstab-total-cell text-right crosstab-sales-col font-bold">${formatRM(prod.totalSales)}</td>
            </tr>`;
        });
        tbody.innerHTML = bodyHtml;
    }

    // 8. 动态生成底部 GRAND TOTAL 行
    let footHtml = `<tr class="crosstab-grand-total-row">
        <th class="crosstab-foot-th crosstab-sticky-col">GRAND TOTAL</th>`;
    currentActiveStores.forEach(store => {
        const st = storeTotals[store.id] || { qty: 0, sales: 0 };
        footHtml += `<th class="crosstab-foot-th text-right crosstab-qty-col font-bold">${formatQty(st.qty)}</th>
                     <th class="crosstab-foot-th text-right crosstab-sales-col font-bold">${formatRM(st.sales)}</th>`;
    });
    footHtml += `<th class="crosstab-foot-th crosstab-total-foot text-right crosstab-qty-col font-bold">${formatQty(grandTotalQty)}</th>
                 <th class="crosstab-foot-th crosstab-total-foot text-right crosstab-sales-col font-bold">${formatRM(grandTotalSales)}</th>
    </tr>`;
    tfoot.innerHTML = footHtml;
}

// 生成销售汇总
function generateSalesSummary(sales) {
    // 1. 构建动态交叉报表数据（自动包含真实商品库）
    buildCrossTabMatrix(sales || {});

    // 2. 构建每间店销售总览数据 (Store Total Sales)
    currentStoreSalesData = buildStoreSalesSummary(sales || {}, currentActiveStores);

    // Check group by preference
    const groupBy = document.getElementById('summaryGroupBy')?.value || 'name';
    
    // 按产品汇总标准列表销售数据
    const productSummary = {};
    const categories = new Set();

    // 预注入真实商品库，确保列表展示真实商品
    const registeredProducts = (window.products && Object.keys(window.products).length > 0) ? window.products : (typeof products === 'object' ? products : {});
    if (registeredProducts && typeof registeredProducts === 'object') {
        Object.values(registeredProducts).forEach(prod => {
            if (!prod) return;
            const pName = String(prod.name || prod.productName || '').trim();
            const pId = String(prod.original_id || prod.id || '').trim();
            if (!pName && !pId) return;
            const groupKey = groupBy === 'id' ? (pId || pName) : (pName || pId);
            if (!groupKey) return;
            const category = prod.category || 'Uncategorized';
            categories.add(category);

            if (!productSummary[groupKey]) {
                productSummary[groupKey] = {
                    id: pId || '-',
                    name: pName || pId,
                    category: category,
                    totalQuantity: 0,
                    totalRevenue: 0,
                    unitPrice: parseFloat(prod.price) || 0,
                    saleCount: 0,
                    ids: new Set()
                };
            }
            if (pId) productSummary[groupKey].ids.add(pId);
        });
    }

    // 处理实际销售订单（若有订单数据）
    if (sales && typeof sales === 'object') {
        Object.values(sales).forEach(sale => {
            if (!sale || !sale.items || !Array.isArray(sale.items)) return;

            const status = (sale.status || '').toLowerCase();
            if (status === 'cancelled' || status === 'canceled' || status === 'refunded' || status === 'void') return;
            if (sale.isCancelled === true || sale.isRefunded === true || sale.isVoid === true || sale.void === true) return;
            
            let discountRatio = 0;
            const subtotal = parseFloat(sale.subtotal) || 0;
            const discountAmount = parseFloat(sale.discountAmount) || 0;
            if (subtotal > 0 && discountAmount > 0) {
                discountRatio = Math.min(1, Math.max(0, discountAmount / subtotal));
            }

            sale.items.forEach(item => {
                if (!item) return;
                const productId = item.id || item.productId || '';
                const productName = item.name || item.productName || 'Unnamed Product';
                const quantity = parseFloat(item.quantity) || 0;
                const unitPrice = parseFloat(item.price) || 0;
                let itemSubtotal = 0;
                if (item.isFree) {
                    itemSubtotal = 0;
                } else if (item.subtotal !== undefined && item.subtotal !== null) {
                    itemSubtotal = parseFloat(item.subtotal) || 0;
                } else {
                    itemSubtotal = quantity * unitPrice;
                }
                const netRevenue = itemSubtotal * (1 - discountRatio);
                const category = item.category && String(item.category).trim() !== '' ? item.category : 'Uncategorized';
                
                const groupByKey = groupBy === 'name' ? String(productName).trim() : (String(productId) || String(productName).trim());
                if (!groupByKey) return;
                
                categories.add(category);
                
                if (!productSummary[groupByKey]) {
                    productSummary[groupByKey] = {
                        id: productId || '-',
                        name: productName,
                        category: category,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        unitPrice: unitPrice,
                        saleCount: 0,
                        ids: new Set()
                    };
                }
                
                if (productId) productSummary[groupByKey].ids.add(productId);
                productSummary[groupByKey].totalQuantity += quantity;
                productSummary[groupByKey].totalRevenue += netRevenue;
                productSummary[groupByKey].saleCount += 1;
                if (unitPrice > 0) productSummary[groupByKey].unitPrice = unitPrice;
            });
        });
    }
    
    // 转换为数组以便排序
    currentSalesSummary = Object.values(productSummary).map(item => {
        if (groupBy === 'name') {
            const idArray = Array.from(item.ids || []);
            if (idArray.length === 0) {
                item.id = item.id || '-';
            } else if (idArray.length === 1) {
                item.id = idArray[0];
            } else {
                item.id = `${idArray[0]} (+${idArray.length - 1})`;
            }
        }
        delete item.ids;
        return item;
    });
    
    // 更新分类筛选器
    updateCategoryFilter(Array.from(categories));
    updateSummaryStats();
    
    // 渲染所有视图
    renderCurrentView();
}

// 更新分类下拉筛选列表
function updateCategoryFilter(categories) {
    const categorySelect = document.getElementById('summaryCategory');
    if (!categorySelect) return;
    const currentValue = categorySelect.value;
    categorySelect.innerHTML = '<option value="all">All Categories</option>';
    (categories || []).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    if (currentValue && (categories || []).includes(currentValue)) {
        categorySelect.value = currentValue;
    }
}

// 更新统计卡片（兼容保留）
function updateSummaryStats() {
    // 保留函数避免调用处报错
}

// 获取筛选后的汇总数据（用于标准汇总视图）
function getFilteredSummary() {
    const categoryFilter = document.getElementById('summaryCategory')?.value || 'all';
    const minQuantityFilter = parseInt(document.getElementById('summaryMinQuantity')?.value || '0', 10);
    
    return (currentSalesSummary || []).filter(product => {
        const categoryMatch = categoryFilter === 'all' || product.category === categoryFilter;
        const quantityMatch = (product.totalQuantity || 0) >= minQuantityFilter;
        return categoryMatch && quantityMatch;
    });
}

// 获取排序后的汇总数据（用于标准汇总视图）
function getSortedSummary() {
    const sortBy = document.getElementById('summarySortBy')?.value || 'quantity';
    const filteredSummary = getFilteredSummary();
    
    return [...filteredSummary].sort((a, b) => {
        switch (sortBy) {
            case 'quantity':
                return (b.totalQuantity || 0) - (a.totalQuantity || 0);
            case 'quantity_asc':
                return (a.totalQuantity || 0) - (b.totalQuantity || 0);
            case 'revenue':
                return (b.totalRevenue || 0) - (a.totalRevenue || 0);
            case 'revenue_asc':
                return (a.totalRevenue || 0) - (b.totalRevenue || 0);
            case 'name':
                return String(a.name || '').localeCompare(String(b.name || ''));
            case 'name_desc':
                return String(b.name || '').localeCompare(String(a.name || ''));
            case 'profit':
                return ((b.totalRevenue || 0) * 0.3) - ((a.totalRevenue || 0) * 0.3);
            default:
                return (b.totalQuantity || 0) - (a.totalQuantity || 0);
        }
    });
}

// 全局存储每日走势图实例
let storeDailyChart = null;
let chartTrendState = {
    showTotal: true,
    enabledStoreIds: null // null 表示默认全选所有店铺
};

// 预设高对比度、清晰绚丽的店铺折线配色表
const STORE_CHART_COLORS = [
    { border: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' }, // 0: Total (Blue)
    { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }, // 1: Emerald Green
    { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' }, // 2: Amber Orange
    { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' }, // 3: Purple
    { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' }, // 4: Hot Pink
    { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },  // 5: Cyan
    { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },  // 6: Red
    { border: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' }, // 7: Lime Green
    { border: '#d946ef', bg: 'rgba(217, 70, 239, 0.15)' }, // 8: Fuchsia
    { border: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' }, // 9: Teal
    { border: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' }, // 10: Bright Orange
    { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' }, // 11: Indigo
    { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' }, // 12: Violet
    { border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' }, // 13: Sky Blue
    { border: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' }   // 14: Golden Yellow
];

function getStoreChartColor(index) {
    if (index < STORE_CHART_COLORS.length) {
        return STORE_CHART_COLORS[index];
    }
    const hue = (index * 137.5) % 360;
    return {
        border: `hsl(${hue}, 75%, 48%)`,
        bg: `hsla(${hue}, 75%, 48%, 0.15)`
    };
}

// 构建每间店总销售数据及每日销售走势数据 (Store Total Sales & Daily Sales Summary)
function buildStoreSalesSummary(sales, activeStores) {
    sales = (sales && typeof sales === 'object') ? sales : {};
    const toStr = v => (v === undefined || v === null) ? '' : String(v).trim();
    const storeMap = {};
    const activeStoreIdSet = new Set((activeStores || []).map(s => toStr(s.id)));

    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';
    const dateRangeList = (startDate && endDate) ? getDatesInRange(startDate, endDate) : [];

    // 1. 初始化当前选中的店铺（包含各店每日销售字典）
    (activeStores || []).forEach(store => {
        const sId = toStr(store.id);
        const storeDaily = {};
        dateRangeList.forEach(d => {
            storeDaily[d] = 0;
        });
        storeMap[sId] = {
            id: sId,
            name: store.name || sId,
            sales: 0,
            dailySalesMap: storeDaily
        };
    });

    // 2. 初始化总计每日销售走势字典
    const dailySalesMap = {};
    dateRangeList.forEach(d => {
        dailySalesMap[d] = 0;
    });

    const processedSaleKeys = new Set();

    // 3. 遍历所有订单累计数据
    Object.entries(sales).forEach(([compKey, sale]) => {
        if (!sale) return;

        // 严格排除取消、退款、作废订单
        const status = toStr(sale.status).toLowerCase();
        if (status === 'cancelled' || status === 'canceled' || status === 'refunded' || status === 'void') return;
        if (sale.isCancelled === true || sale.isRefunded === true || sale.isVoid === true || sale.void === true) return;

        // 防重复统计
        if (processedSaleKeys.has(compKey)) return;
        processedSaleKeys.add(compKey);

        // 订单所属店铺
        let storeId = toStr(sale.store_id || sale.storeId);
        const pathStoreId = toStr(compKey.split('__')[0]);
        if (!activeStoreIdSet.has(storeId) && activeStoreIdSet.has(pathStoreId)) storeId = pathStoreId;
        if (!storeId || !activeStoreIdSet.has(storeId)) return;

        if (!storeMap[storeId]) {
            const storeDaily = {};
            dateRangeList.forEach(d => {
                storeDaily[d] = 0;
            });
            storeMap[storeId] = {
                id: storeId,
                name: (stores && stores[storeId] && stores[storeId].name) || storeId,
                sales: 0,
                dailySalesMap: storeDaily
            };
        }

        // 直接读取 RTDB 订单最终收款总额 (total_amount，包含折扣扣减、税金及舍入)
        let orderAmount = 0;
        if (sale.total_amount !== undefined && sale.total_amount !== null && !isNaN(Number(sale.total_amount))) {
            orderAmount = Number(sale.total_amount);
        } else if (sale.totalAmount !== undefined && sale.totalAmount !== null && !isNaN(Number(sale.totalAmount))) {
            orderAmount = Number(sale.totalAmount);
        } else if (sale.total !== undefined && sale.total !== null && !isNaN(Number(sale.total))) {
            orderAmount = Number(sale.total);
        } else if (sale.finalTotal !== undefined && sale.finalTotal !== null && !isNaN(Number(sale.finalTotal))) {
            orderAmount = Number(sale.finalTotal);
        } else {
            // 回退兼容：若极端情况未存整单金额，按 items 计算净额
            const itemsList = Array.isArray(sale.items) ? sale.items
                : (sale.items && typeof sale.items === 'object' ? Object.values(sale.items) : []);
            let itemsSum = 0;
            itemsList.forEach(item => {
                if (!item) return;
                const quantity = parseFloat(item.quantity) || 0;
                let itemSubtotal = 0;
                if (!item.isFree) {
                    itemSubtotal = (item.subtotal !== undefined && item.subtotal !== null)
                        ? (parseFloat(item.subtotal) || 0)
                        : ((parseFloat(item.price) || 0) * quantity);
                }
                itemsSum += itemSubtotal;
            });
            const discount = parseFloat(sale.discountAmount) || 0;
            orderAmount = Math.max(0, itemsSum - discount);
        }

        storeMap[storeId].sales += orderAmount;

        // 归属到具体日期以供走势图渲染
        let saleDate = sale.sale_date;
        if (!saleDate) {
            const parts = compKey.split('__');
            if (parts.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
                saleDate = parts[1];
            } else if (sale.date && /^\d{4}-\d{2}-\d{2}$/.test(String(sale.date).trim())) {
                saleDate = String(sale.date).trim();
            } else if (sale.orderDate && /^\d{4}-\d{2}-\d{2}$/.test(String(sale.orderDate).substring(0, 10))) {
                saleDate = String(sale.orderDate).substring(0, 10);
            }
        }

        if (saleDate && dailySalesMap[saleDate] !== undefined) {
            dailySalesMap[saleDate] += orderAmount;
        }
        if (saleDate && storeMap[storeId].dailySalesMap && storeMap[storeId].dailySalesMap[saleDate] !== undefined) {
            storeMap[storeId].dailySalesMap[saleDate] += orderAmount;
        }
    });

    const storeList = Object.values(storeMap);
    const grandSales = storeList.reduce((sum, s) => sum + s.sales, 0);

    // 默认按销售额由高到低排序
    storeList.sort((a, b) => b.sales - a.sales);

    // 为每个店铺生成每日金额列表与专属颜色 (从 index 1 开始分配，0 为 Total)
    storeList.forEach((store, idx) => {
        store.dailyAmounts = dateRangeList.map(d => store.dailySalesMap[d] || 0);
        store.color = getStoreChartColor(idx + 1);
    });

    // 初始化/更新勾选状态
    const validStoreIds = new Set(storeList.map(s => s.id));
    if (!chartTrendState.enabledStoreIds) {
        chartTrendState.enabledStoreIds = new Set(validStoreIds);
    } else {
        const updated = new Set();
        chartTrendState.enabledStoreIds.forEach(id => {
            if (validStoreIds.has(id)) updated.add(id);
        });
        if (updated.size === 0) {
            validStoreIds.forEach(id => updated.add(id));
        }
        chartTrendState.enabledStoreIds = updated;
    }

    // 每日总走势数据分析
    const dailyAmounts = dateRangeList.map(d => dailySalesMap[d] || 0);
    const maxDailySale = dailyAmounts.length > 0 ? Math.max(...dailyAmounts) : 0;
    const maxDayIndex = dailyAmounts.indexOf(maxDailySale);
    const peakDate = (maxDayIndex !== -1 && maxDailySale > 0) ? dateRangeList[maxDayIndex] : '-';

    const nonZeroAmounts = dailyAmounts.filter(a => a > 0);
    const minDailySale = nonZeroAmounts.length > 0 ? Math.min(...nonZeroAmounts) : 0;
    const minDayIndex = dailyAmounts.indexOf(minDailySale);
    const lowestDate = (minDayIndex !== -1 && minDailySale > 0) ? dateRangeList[minDayIndex] : '-';

    const avgDailySale = dateRangeList.length > 0 ? (grandSales / dateRangeList.length) : 0;

    return {
        stores: storeList,
        grandSales,
        dateRangeList,
        dailySalesMap,
        dailyAmounts,
        maxDailySale,
        peakDate,
        minDailySale,
        lowestDate,
        avgDailySale
    };
}

// 渲染走势图线条勾选栏 (Total Sales 和各店铺独立勾选与配色)
function renderChartLineSelectors(summaryData) {
    const container = document.getElementById('chartTrendChipsContainer');
    if (!container || !summaryData) return;

    if (!chartTrendState.enabledStoreIds) {
        chartTrendState.enabledStoreIds = new Set((summaryData.stores || []).map(s => s.id));
    }

    let chipsHtml = '';

    // Total Checkbox Chip (蓝色总计线)
    const isTotalActive = !!chartTrendState.showTotal;
    chipsHtml += `
        <label class="chart-line-chip ${isTotalActive ? 'active' : ''}" style="--chip-color: #2563eb;" title="Toggle Total line">
            <input type="checkbox" id="trendLineToggle_total" ${isTotalActive ? 'checked' : ''}>
            <span class="chip-color-dot" style="background-color: #2563eb;"></span>
            <span class="chip-label">Total Sales</span>
        </label>
    `;

    // Each Store Checkbox Chip (各店铺独立色彩线条)
    (summaryData.stores || []).forEach(store => {
        const isStoreActive = chartTrendState.enabledStoreIds.has(store.id);
        const color = store.color?.border || '#10b981';
        chipsHtml += `
            <label class="chart-line-chip ${isStoreActive ? 'active' : ''}" style="--chip-color: ${color};" title="Toggle ${escapeHtml(store.name)}">
                <input type="checkbox" class="trend-store-cb" data-store-id="${escapeHtml(store.id)}" ${isStoreActive ? 'checked' : ''}>
                <span class="chip-color-dot" style="background-color: ${color};"></span>
                <span class="chip-label">${escapeHtml(store.name)}</span>
            </label>
        `;
    });

    container.innerHTML = chipsHtml;

    // 绑定事件（仅绑定一次委托）
    if (!container._hasBoundEvents) {
        container._hasBoundEvents = true;
        container.addEventListener('change', (e) => {
            const target = e.target;
            if (!target || target.type !== 'checkbox') return;

            if (target.id === 'trendLineToggle_total') {
                chartTrendState.showTotal = target.checked;
                target.closest('.chart-line-chip')?.classList.toggle('active', target.checked);
                renderDailySalesChart(currentStoreSalesData);
            } else if (target.classList.contains('trend-store-cb')) {
                const storeId = target.dataset.storeId;
                if (target.checked) {
                    chartTrendState.enabledStoreIds.add(storeId);
                } else {
                    chartTrendState.enabledStoreIds.delete(storeId);
                }
                target.closest('.chart-line-chip')?.classList.toggle('active', target.checked);
                renderDailySalesChart(currentStoreSalesData);
            }
        });
    }

    // 绑定快捷按钮
    const btnAll = document.getElementById('chartSelectAllLinesBtn');
    const btnTotalOnly = document.getElementById('chartTotalOnlyBtn');
    const btnStoresOnly = document.getElementById('chartStoresOnlyBtn');

    if (btnAll && !btnAll._hasBound) {
        btnAll._hasBound = true;
        btnAll.addEventListener('click', () => {
            chartTrendState.showTotal = true;
            if (currentStoreSalesData && currentStoreSalesData.stores) {
                chartTrendState.enabledStoreIds = new Set(currentStoreSalesData.stores.map(s => s.id));
            }
            renderChartLineSelectors(currentStoreSalesData);
            renderDailySalesChart(currentStoreSalesData);
        });
    }

    if (btnTotalOnly && !btnTotalOnly._hasBound) {
        btnTotalOnly._hasBound = true;
        btnTotalOnly.addEventListener('click', () => {
            chartTrendState.showTotal = true;
            chartTrendState.enabledStoreIds = new Set();
            renderChartLineSelectors(currentStoreSalesData);
            renderDailySalesChart(currentStoreSalesData);
        });
    }

    if (btnStoresOnly && !btnStoresOnly._hasBound) {
        btnStoresOnly._hasBound = true;
        btnStoresOnly.addEventListener('click', () => {
            chartTrendState.showTotal = false;
            if (currentStoreSalesData && currentStoreSalesData.stores) {
                chartTrendState.enabledStoreIds = new Set(currentStoreSalesData.stores.map(s => s.id));
            }
            renderChartLineSelectors(currentStoreSalesData);
            renderDailySalesChart(currentStoreSalesData);
        });
    }
}

// 渲染每日走势曲线图 (支持不同店铺不同颜色线条，以及 Total 线条勾选显示)
function renderDailySalesChart(summaryData) {
    const canvas = document.getElementById('dailySalesChartCanvas');
    if (!canvas) return;

    if (storeDailyChart) {
        storeDailyChart.destroy();
        storeDailyChart = null;
    }

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet');
        return;
    }

    if (!summaryData) return;

    const dates = summaryData.dateRangeList || [];
    const ctx = canvas.getContext('2d');
    
    // X 轴显示简明日期 (MM/DD)
    const formattedLabels = dates.map(d => {
        const parts = d.split('-');
        if (parts.length === 3) {
            return `${parts[1]}/${parts[2]}`;
        }
        return d;
    });

    const isTotalOnly = chartTrendState.showTotal && (!chartTrendState.enabledStoreIds || chartTrendState.enabledStoreIds.size === 0);

    // 创建柔和渐变填充底色（仅在只有 Total 一条线时展现平滑底色）
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.30)');
    gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.10)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

    const datasets = [];
    const allVisibleAmounts = [];

    // 1. Total Line（如果已勾选）
    if (chartTrendState.showTotal) {
        const totalAmounts = summaryData.dailyAmounts || [];
        totalAmounts.forEach(v => allVisibleAmounts.push(v));
        datasets.push({
            label: 'Total Sales',
            data: totalAmounts,
            borderColor: '#2563eb',
            borderWidth: 3.5,
            backgroundColor: isTotalOnly ? gradient : 'transparent',
            fill: isTotalOnly,
            tension: 0.38,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#2563eb',
            pointBorderWidth: 2.5,
            pointRadius: dates.length <= 15 ? 5 : (dates.length <= 31 ? 3.5 : 2),
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#2563eb',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2.5,
            spanGaps: true,
            order: 0
        });
    }

    // 2. Individual Store Lines（针对每个勾选的店铺，赋予独立高饱和颜色）
    (summaryData.stores || []).forEach(store => {
        if (chartTrendState.enabledStoreIds && chartTrendState.enabledStoreIds.has(store.id)) {
            const storeAmounts = store.dailyAmounts || [];
            storeAmounts.forEach(v => allVisibleAmounts.push(v));
            const color = store.color?.border || '#10b981';
            datasets.push({
                label: store.name,
                data: storeAmounts,
                borderColor: color,
                borderWidth: 2.5,
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.38,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: color,
                pointBorderWidth: 2,
                pointRadius: dates.length <= 15 ? 4.5 : (dates.length <= 31 ? 3 : 1.5),
                pointHoverRadius: 6.5,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
                spanGaps: true,
                order: 1
            });
        }
    });

    const maxVal = allVisibleAmounts.length > 0 ? Math.max(...allVisibleAmounts, 100) : 100;

    // 动态更新 Peak Badge 显示当前可见线条的最大值
    const peakBadge = document.getElementById('dailyChartPeakBadge');
    if (peakBadge) {
        const maxPeak = allVisibleAmounts.length > 0 ? Math.max(...allVisibleAmounts) : 0;
        peakBadge.querySelector('span').textContent = maxPeak > 0 ? `Peak: ${formatRM(maxPeak)}` : 'Peak: RM 0.00';
    }

    storeDailyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false // 使用上方自定义芯片勾选栏
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.94)',
                    titleColor: '#94a3b8',
                    titleFont: { size: 12, family: 'Poppins, sans-serif' },
                    bodyColor: '#f8fafc',
                    bodyFont: { size: 13, family: 'Poppins, sans-serif' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    boxWidth: 9,
                    boxHeight: 9,
                    callbacks: {
                        title: function(items) {
                            if (!items || !items.length) return '';
                            const idx = items[0].dataIndex;
                            return `📅 Date: ${dates[idx]}`;
                        },
                        label: function(item) {
                            return ` ${item.dataset.label}: ${formatRM(item.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: maxVal * 1.15,
                    grid: {
                        color: 'rgba(226, 232, 240, 0.75)',
                        drawBorder: false
                    },
                    ticks: {
                        font: { size: 11, family: 'Poppins, sans-serif' },
                        color: '#64748b',
                        callback: function(val) {
                            return 'RM ' + Number(val).toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 11, family: 'Poppins, sans-serif' },
                        color: '#64748b',
                        maxRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 16
                    }
                }
            }
        }
    });
}

// 渲染每间店总销售报表与每日销售走势图 (Store Total Sales & Daily Trend)
function renderStoreTotalSalesReport() {
    const tbody = document.getElementById('storeSalesTbody');
    const tfoot = document.getElementById('storeSalesTfoot');
    if (!tbody || !tfoot) return;

    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    const summaryData = currentStoreSalesData || {
        stores: [],
        grandSales: 0,
        dateRangeList: [],
        dailyAmounts: [],
        maxDailySale: 0,
        peakDate: '-',
        minDailySale: 0,
        lowestDate: '-',
        avgDailySale: 0
    };
    let storeList = [...(summaryData.stores || [])];

    // 快捷搜索店铺名称
    if (storeSalesSearchFilter) {
        const q = storeSalesSearchFilter.toLowerCase();
        storeList = storeList.filter(s => s.name.toLowerCase().includes(q));
    }

    // 更新 KPI 统计卡片（Total Sales, Peak Sales Day, Lowest Day, Daily Average）
    const kpiTotalSales = document.getElementById('storeKpiTotalSales');
    const kpiPeakDay = document.getElementById('storeKpiPeakDay');
    const kpiLowestDay = document.getElementById('storeKpiLowestDay');
    const kpiAvgDaily = document.getElementById('storeKpiAvgDaily');
    const kpiDateRangeText = document.getElementById('storeKpiDateRangeText');
    const showingCount = document.getElementById('storeSalesShowingCount');

    if (kpiTotalSales) kpiTotalSales.textContent = formatRM(summaryData.grandSales);
    if (kpiDateRangeText) kpiDateRangeText.textContent = (startDate && endDate) ? `${startDate} ~ ${endDate}` : 'All Time';

    if (kpiPeakDay) {
        kpiPeakDay.textContent = summaryData.maxDailySale > 0 ? formatRM(summaryData.maxDailySale) : 'RM 0.00';
    }
    const kpiPeakDateSub = document.getElementById('storeKpiPeakDateSub');
    if (kpiPeakDateSub) {
        kpiPeakDateSub.textContent = summaryData.peakDate !== '-' ? `Date: ${summaryData.peakDate}` : 'No sales in range';
    }

    if (kpiLowestDay) {
        kpiLowestDay.textContent = summaryData.minDailySale > 0 ? formatRM(summaryData.minDailySale) : 'RM 0.00';
    }
    const kpiLowestDateSub = document.getElementById('storeKpiLowestDateSub');
    if (kpiLowestDateSub) {
        kpiLowestDateSub.textContent = summaryData.lowestDate !== '-' ? `Date: ${summaryData.lowestDate}` : 'No sales in range';
    }

    if (kpiAvgDaily) {
        kpiAvgDaily.textContent = formatRM(summaryData.avgDailySale);
    }
    const kpiAvgSub = document.getElementById('storeKpiAvgSub');
    if (kpiAvgSub) {
        kpiAvgSub.textContent = `Across ${summaryData.dateRangeList.length || 1} day(s)`;
    }

    if (showingCount) {
        showingCount.textContent = `Showing ${storeList.length} of ${summaryData.stores.length} stores`;
    }

    // 渲染线条选择芯片栏与每日走势曲线图
    renderChartLineSelectors(summaryData);
    renderDailySalesChart(summaryData);

    // 渲染店铺销售表格数据行（仅保留 Store Name 与 Total Sales (RM)，配有店铺色标圆点）
    if (storeList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center" style="padding: 30px; color: #64748b; font-size: 14px;">No stores match the selected criteria</td></tr>`;
    } else {
        let html = '';
        storeList.forEach(store => {
            const color = store.color?.border || '#10b981';
            html += `<tr>
                <td class="crosstab-td font-bold" style="color: #0f172a; padding: 12px 18px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; flex-shrink: 0; box-shadow: 0 0 0 1.5px rgba(0,0,0,0.1);"></span>
                        <span style="font-size: 14px;">${escapeHtml(store.name)}</span>
                    </div>
                </td>
                <td class="crosstab-td text-right font-bold store-sales-amount" style="color: #1d4ed8; font-size: 15px; padding: 12px 18px;">
                    ${formatRM(store.sales)}
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }

    // 渲染 GRAND TOTAL 底部汇总行（仅 Store Name 与 Total Sales (RM)）
    tfoot.innerHTML = `<tr class="crosstab-tfoot-tr">
        <th class="crosstab-tfoot-th" style="font-size: 14px; padding: 14px 18px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="material-icons" style="font-size: 18px; color: #38bdf8;">summarize</i>
                <span>GRAND TOTAL (${storeList.length} Stores)</span>
            </div>
        </th>
        <th class="crosstab-tfoot-th text-right font-bold store-sales-amount" style="color: #38bdf8; font-size: 16px; padding: 14px 18px;">
            ${formatRM(summaryData.grandSales)}
        </th>
    </tr>`;
}

// 统一渲染当前激活的视图
function renderCurrentView() {
    renderCrossTabReport();
    renderStoreTotalSalesReport();
    renderTableView();
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
    
    // 极具现代美感的高饱和配色调色板
    const barColors = [
        'rgba(59, 130, 246, 0.85)', // 宝蓝色
        'rgba(16, 185, 129, 0.85)', // 翠绿色
        'rgba(245, 158, 11, 0.85)', // 琥珀黄
        'rgba(239, 68, 68, 0.85)',  // 珊瑚红
        'rgba(139, 92, 246, 0.85)', // 罗兰紫
        'rgba(236, 72, 153, 0.85)', // 玫瑰粉
        'rgba(6, 182, 212, 0.85)',  // 青黛色
        'rgba(100, 116, 139, 0.85)',// 黛灰色
        'rgba(20, 184, 166, 0.85)', // 蓝绿色
        'rgba(120, 113, 108, 0.85)' // 褐色
    ];
    
    const barBorders = barColors.map(color => color.replace('0.85', '1'));
    
    switch (chartType) {
        case 'bar':
            chartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '销售数量 (件)',
                        data: quantities,
                        backgroundColor: barColors,
                        borderColor: barBorders,
                        borderWidth: 1.5,
                        borderRadius: 6 // 精致柱状图圆角
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#f1f5f9'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
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
                        backgroundColor: barColors.slice(0, Math.min(data.length, barColors.length)),
                        borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                font: {
                                    size: 11
                                }
                            }
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
                        label: '销售额 (RM)',
                        data: revenues,
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#f1f5f9'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            };
            break;
    }
    
    summaryChart = new Chart(ctx, chartConfig);
}

// Initialize sales summary event listeners
function initSalesSummaryEventListeners() {
    // Date range inputs — validate and reload on change
    const summaryStartDateInput = document.getElementById('summaryStartDate');
    const summaryEndDateInput = document.getElementById('summaryEndDate');
    
    if (summaryStartDateInput) {
        summaryStartDateInput.addEventListener('change', () => {
            if (summaryEndDateInput.value && summaryEndDateInput.value < summaryStartDateInput.value) {
                summaryEndDateInput.value = summaryStartDateInput.value;
            }
        });
    }
    
    if (summaryEndDateInput) {
        summaryEndDateInput.addEventListener('change', () => {
            if (summaryStartDateInput.value && summaryStartDateInput.value > summaryEndDateInput.value) {
                summaryStartDateInput.value = summaryEndDateInput.value;
            }
        });
    }

    // Apply / Query button
    const applyFiltersBtn = document.getElementById('summaryApplyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            refreshSalesSummary();
        });
    }

    // Import JSON（用 RTDB 导出文件离线出报表，支持多选合并）
    const importBtn = document.getElementById('importJsonBtn');
    const importInput = document.getElementById('importJsonInput');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', e => {
            const files = e.target.files;
            if (files && files.length) handleImportJsonFiles(files);
        });
    }
    const importClearBtn = document.getElementById('importJsonClearBtn');
    if (importClearBtn) {
        importClearBtn.addEventListener('click', () => clearImportedData());
    }

    // 支持直接把 .json 拖进报表区域（可一次拖多个）
    const dropZone = document.querySelector('#salesSummaryModal .sales-summary-scrollable');
    if (dropZone) {
        dropZone.addEventListener('dragover', e => { e.preventDefault(); });
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            const list = e.dataTransfer && e.dataTransfer.files;
            if (!list || !list.length) return;
            const jsons = Array.prototype.slice.call(list).filter(f => /\.json$/i.test(f.name));
            if (jsons.length) handleImportJsonFiles(jsons);
        });
    }

    // Tab buttons for switching between Cross-Tab, Store Total Sales, and Standard views
    const tabCrossTabBtn = document.getElementById('tabCrossTabBtn');
    const tabStoreSalesBtn = document.getElementById('tabStoreSalesBtn');
    const tabStandardBtn = document.getElementById('tabStandardBtn');
    if (tabCrossTabBtn) tabCrossTabBtn.addEventListener('click', () => switchSummaryTab('crosstab'));
    if (tabStoreSalesBtn) tabStoreSalesBtn.addEventListener('click', () => switchSummaryTab('storesales'));
    if (tabStandardBtn) tabStandardBtn.addEventListener('click', () => switchSummaryTab('standard'));

    // Cross-Tab real-time quick search input
    const quickSearchInput = document.getElementById('crosstabQuickSearch');
    const clearSearchBtn = document.getElementById('crosstabClearSearchBtn');
    if (quickSearchInput) {
        quickSearchInput.addEventListener('input', (e) => {
            crosstabSearchFilter = e.target.value.trim();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = crosstabSearchFilter ? 'block' : 'none';
            }
            renderCrossTabReport();
        });
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (quickSearchInput) quickSearchInput.value = '';
            crosstabSearchFilter = '';
            clearSearchBtn.style.display = 'none';
            renderCrossTabReport();
        });
    }

    // Store Total Sales real-time quick search input
    const storeSearchInput = document.getElementById('storeSalesQuickSearch');
    const storeClearBtn = document.getElementById('storeSalesClearSearchBtn');
    if (storeSearchInput) {
        storeSearchInput.addEventListener('input', (e) => {
            storeSalesSearchFilter = e.target.value.trim();
            if (storeClearBtn) {
                storeClearBtn.style.display = storeSalesSearchFilter ? 'block' : 'none';
            }
            renderStoreTotalSalesReport();
        });
    }
    if (storeClearBtn) {
        storeClearBtn.addEventListener('click', () => {
            if (storeSearchInput) storeSearchInput.value = '';
            storeSalesSearchFilter = '';
            storeClearBtn.style.display = 'none';
            renderStoreTotalSalesReport();
        });
    }
    
    // Sort
    const sortSelect = document.getElementById('summarySortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => renderCurrentView());
    }
    
    // Group By
    const groupBySelect = document.getElementById('summaryGroupBy');
    if (groupBySelect) {
        groupBySelect.addEventListener('change', () => {
            if (currentSalesData) {
                generateSalesSummary(currentSalesData);
            }
        });
    }

    // Filters
    const categorySelect = document.getElementById('summaryCategory');
    const minQuantitySelect = document.getElementById('summaryMinQuantity');
    
    if (categorySelect) {
        categorySelect.addEventListener('change', () => renderCurrentView());
    }
    
    if (minQuantitySelect) {
        minQuantitySelect.addEventListener('change', () => renderCurrentView());
    }
    
    // Action buttons
    const screenshotBtn = document.getElementById('screenshotSummaryBtn');
    const exportBtn = document.getElementById('exportSummaryBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportHtmlBtn = document.getElementById('exportHtmlBtn');
    const storeSalesDownloadHtmlBtn = document.getElementById('storeSalesDownloadHtmlBtn');
    const exportHtmlLandscapeBtn = document.getElementById('exportHtmlLandscapeBtn');
    const storeSalesDownloadHtmlLandscapeBtn = document.getElementById('storeSalesDownloadHtmlLandscapeBtn');
    const printBtn = document.getElementById('printSummaryBtn');
    
    if (screenshotBtn)    screenshotBtn.addEventListener('click', screenshotSalesSummary);
    if (exportBtn)        exportBtn.addEventListener('click', exportSalesSummary);
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            if (currentSummaryActiveTab === 'storesales') {
                exportStoreSalesExcel();
            } else {
                exportCrossTabExcel();
            }
        });
    }
    if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener('click', () => {
            if (currentSummaryActiveTab === 'storesales') {
                exportStoreSalesHTML(false);
            } else {
                exportCrossTabHTML();
            }
        });
    }
    if (exportHtmlLandscapeBtn) {
        exportHtmlLandscapeBtn.addEventListener('click', () => {
            exportStoreSalesHTML(true);
        });
    }
    if (storeSalesDownloadHtmlBtn) {
        storeSalesDownloadHtmlBtn.addEventListener('click', () => exportStoreSalesHTML(false));
    }
    if (storeSalesDownloadHtmlLandscapeBtn) {
        storeSalesDownloadHtmlLandscapeBtn.addEventListener('click', () => exportStoreSalesHTML(true));
    }
    if (printBtn)         printBtn.addEventListener('click', printSalesSummary);
}

// 切换报表视图标签 (Cross-Tab 动态交叉报表 vs Store Total Sales 每间店销售总览 vs Standard 标准汇总)
function switchSummaryTab(tabName) {
    currentSummaryActiveTab = tabName;
    const tabCrossTabBtn = document.getElementById('tabCrossTabBtn');
    const tabStoreSalesBtn = document.getElementById('tabStoreSalesBtn');
    const tabStandardBtn = document.getElementById('tabStandardBtn');
    const crossTabView = document.getElementById('summaryCrossTabView');
    const storeSalesView = document.getElementById('summaryStoreSalesView');
    const tableView = document.getElementById('summaryTableView');

    if (tabCrossTabBtn) tabCrossTabBtn.classList.remove('active');
    if (tabStoreSalesBtn) tabStoreSalesBtn.classList.remove('active');
    if (tabStandardBtn) tabStandardBtn.classList.remove('active');

    if (crossTabView) crossTabView.classList.remove('active');
    if (storeSalesView) storeSalesView.classList.remove('active');
    if (tableView) tableView.classList.remove('active');

    if (tabName === 'crosstab') {
        if (tabCrossTabBtn) tabCrossTabBtn.classList.add('active');
        if (crossTabView) crossTabView.classList.add('active');
        renderCrossTabReport();
    } else if (tabName === 'storesales') {
        if (tabStoreSalesBtn) tabStoreSalesBtn.classList.add('active');
        if (storeSalesView) storeSalesView.classList.add('active');
        renderStoreTotalSalesReport();
    } else {
        if (tabStandardBtn) tabStandardBtn.classList.add('active');
        if (tableView) tableView.classList.add('active');
        renderTableView();
    }
}

// 切换汇总视图（保留兼容性）
function switchSummaryView(viewMode) {
    document.querySelectorAll('.summary-view').forEach(view => {
        view.classList.remove('active');
    });
    
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
    
    renderCurrentView();
}

// 导出动态交叉报表为 CSV (数量与金额与页面报表完全一致，含 UTF-8 BOM，Excel 打开无乱码)
function exportCrossTabCSV() {
    if (!currentFilteredProducts || currentFilteredProducts.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';
    
    // 带 UTF-8 BOM，确保 Excel 打开中文与符号正常
    let csv = '\uFEFF';
    csv += `"Product Sales Analysis (Cross-Tab Report)"\n`;
    csv += `"Date Range:","${startDate} to ${endDate}"\n`;
    csv += `"Stores:","${currentActiveStores.map(s => s.name.replace(/"/g, '""')).join(', ')}"\n\n`;

    // 表头行：Product, 每个店铺的 Qty Sold 和 Sales (RM), 最后 Total Qty, Total Sales (RM)
    const headerCols = ['"Product"'];
    currentActiveStores.forEach(s => {
        headerCols.push(`"${s.name.replace(/"/g, '""')} - Qty Sold"`);
        headerCols.push(`"${s.name.replace(/"/g, '""')} - Sales (RM)"`);
    });
    headerCols.push('"Total Qty"');
    headerCols.push('"Total Sales (RM)"');
    csv += headerCols.join(',') + '\n';

    // 商品数据行
    currentFilteredProducts.forEach(prod => {
        const prodLabel = `${prod.name.replace(/"/g, '""')}${prod.id && prod.id !== '-' ? ` (${prod.id})` : ''}`;
        const row = [`"${prodLabel}"`];
        currentActiveStores.forEach(s => {
            const sData = prod.stores[s.id] || { qty: 0, sales: 0 };
            row.push(sData.qty);
            row.push(`"${formatRM(sData.sales)}"`);
        });
        row.push(prod.totalQty);
        row.push(`"${formatRM(prod.totalSales)}"`);
        csv += row.join(',') + '\n';
    });

    // 计算底部 GRAND TOTAL
    const storeTotals = {};
    currentActiveStores.forEach(s => { storeTotals[s.id] = { qty: 0, sales: 0 }; });
    let grandQty = 0;
    let grandSales = 0;
    currentFilteredProducts.forEach(prod => {
        currentActiveStores.forEach(s => {
            const sData = prod.stores[s.id] || { qty: 0, sales: 0 };
            storeTotals[s.id].qty += sData.qty;
            storeTotals[s.id].sales += sData.sales;
        });
        grandQty += prod.totalQty;
        grandSales += prod.totalSales;
    });

    const totalRow = ['"GRAND TOTAL"'];
    currentActiveStores.forEach(s => {
        totalRow.push(storeTotals[s.id].qty);
        totalRow.push(`"${formatRM(storeTotals[s.id].sales)}"`);
    });
    totalRow.push(grandQty);
    totalRow.push(`"${formatRM(grandSales)}"`);
    csv += totalRow.join(',') + '\n';

    const filename = `Product_Sales_Analysis_${startDate}_to_${endDate}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

// 导出格式化 Excel 表格文件 (.xls HTML XML 格式，完美保留两层合并表头与样式)
function exportCrossTabExcel() {
    if (!currentFilteredProducts || currentFilteredProducts.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    // 计算统计数据
    const storeTotals = {};
    currentActiveStores.forEach(s => { storeTotals[s.id] = { qty: 0, sales: 0 }; });
    let grandQty = 0;
    let grandSales = 0;
    currentFilteredProducts.forEach(prod => {
        currentActiveStores.forEach(s => {
            const sData = prod.stores[s.id] || { qty: 0, sales: 0 };
            storeTotals[s.id].qty += sData.qty;
            storeTotals[s.id].sales += sData.sales;
        });
        grandQty += prod.totalQty;
        grandSales += prod.totalSales;
    });

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Product Sales Analysis</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
            th { background-color: #1e293b; color: #ffffff; border: 1px solid #475569; font-family: Arial, sans-serif; }
            .store-header { background-color: #0f172a; text-align: center; }
            .total-header { background-color: #1d4ed8; text-align: center; font-weight: bold; }
            .sub-header { background-color: #334155; font-size: 11px; text-align: right; }
            .total-sub { background-color: #1e3a8a; }
            td { border: 1px solid #e2e8f0; font-family: Arial, sans-serif; font-size: 12px; }
            .num-cell { text-align: right; }
            .total-cell { background-color: #eff6ff; font-weight: bold; text-align: right; color: #1d4ed8; }
            .grand-row th { background-color: #0f172a; color: #38bdf8; font-weight: bold; }
            .grand-total-col { background-color: #1e3a8a !important; color: #67e8f9 !important; }
        </style>
    </head>
    <body>
        <h2>Product Sales Analysis (Cross-Tab Report)</h2>
        <p><strong>Date Range:</strong> ${startDate} to ${endDate} | <strong>Stores:</strong> ${escapeHtml(currentActiveStores.map(s => s.name).join(', '))}</p>
        <table border="1" cellspacing="0" cellpadding="6">
            <thead>
                <tr>
                    <th rowspan="2">Product</th>
                    ${currentActiveStores.map(s => `<th colspan="2" class="store-header">${escapeHtml(s.name)}</th>`).join('')}
                    <th colspan="2" class="total-header">TOTAL</th>
                </tr>
                <tr>
                    ${currentActiveStores.map(() => `<th class="sub-header">Qty Sold</th><th class="sub-header">Sales (RM)</th>`).join('')}
                    <th class="sub-header total-sub">Total Qty</th>
                    <th class="sub-header total-sub">Total Sales (RM)</th>
                </tr>
            </thead>
            <tbody>
                ${currentFilteredProducts.map(prod => `
                    <tr>
                        <td>${escapeHtml(prod.name)}${prod.id && prod.id !== '-' ? ` (${escapeHtml(prod.id)})` : ''}</td>
                        ${currentActiveStores.map(s => {
                            const sd = prod.stores[s.id] || { qty: 0, sales: 0 };
                            return `<td class="num-cell">${formatQty(sd.qty)}</td><td class="num-cell">${formatRM(sd.sales)}</td>`;
                        }).join('')}
                        <td class="total-cell">${formatQty(prod.totalQty)}</td>
                        <td class="total-cell">${formatRM(prod.totalSales)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr class="grand-row">
                    <th>GRAND TOTAL</th>
                    ${currentActiveStores.map(s => `<th class="num-cell">${formatQty(storeTotals[s.id].qty)}</th><th class="num-cell">${formatRM(storeTotals[s.id].sales)}</th>`).join('')}
                    <th class="total-cell grand-total-col">${formatQty(grandQty)}</th>
                    <th class="total-cell grand-total-col">${formatRM(grandSales)}</th>
                </tr>
            </tfoot>
        </table>
    </body>
    </html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `Product_Sales_Analysis_${startDate}_to_${endDate}.xls`;
    downloadBlob(blob, filename);
}

// 导出每间店总销售 Excel 表格 (.xls)
function exportStoreSalesExcel() {
    const summaryData = currentStoreSalesData;
    if (!summaryData || !summaryData.stores || summaryData.stores.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Store Total Sales</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
            th { background-color: #1e293b; color: #ffffff; border: 1px solid #475569; font-family: Arial, sans-serif; font-size: 12px; }
            td { border: 1px solid #e2e8f0; font-family: Arial, sans-serif; font-size: 12px; padding: 6px 10px; }
            .num-cell { text-align: right; }
            .center-cell { text-align: center; }
            .sales-cell { text-align: right; font-weight: bold; color: #1d4ed8; background-color: #eff6ff; }
            .grand-row th { background-color: #0f172a; color: #38bdf8; font-weight: bold; }
            .section-title { font-size: 14px; font-weight: bold; color: #0f172a; margin-top: 20px; }
        </style>
    </head>
    <body>
        <h2>Store Total Sales Report (每间店总销售报表)</h2>
        <p><strong>Date Range:</strong> ${startDate} to ${endDate} | <strong>Total Stores:</strong> ${summaryData.stores.length} | <strong>Grand Total Sales:</strong> ${formatRM(summaryData.grandSales)}</p>
        <p><strong>Peak Day:</strong> ${summaryData.peakDate} (${formatRM(summaryData.maxDailySale)}) | <strong>Lowest Day:</strong> ${summaryData.lowestDate} (${formatRM(summaryData.minDailySale)}) | <strong>Daily Average:</strong> ${formatRM(summaryData.avgDailySale)}</p>
        
        <table border="1" cellspacing="0" cellpadding="6">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 8px;">Store Name</th>
                    <th class="num-cell" style="width: 180px; padding: 8px;">Total Sales (RM)</th>
                </tr>
            </thead>
            <tbody>
                ${summaryData.stores.map(store => `
                    <tr>
                        <td><strong>${escapeHtml(store.name)}</strong></td>
                        <td class="sales-cell">${formatRM(store.sales)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr class="grand-row">
                    <th style="text-align: left; padding: 8px;">GRAND TOTAL (${summaryData.stores.length} Stores)</th>
                    <th class="num-cell" style="color: #67e8f9 !important; padding: 8px;">${formatRM(summaryData.grandSales)}</th>
                </tr>
            </tfoot>
        </table>

        ${summaryData.dateRangeList && summaryData.dateRangeList.length > 0 ? `
        <h3 class="section-title">Daily Sales Breakdown (每日销售明细走势)</h3>
        <table border="1" cellspacing="0" cellpadding="6">
            <thead>
                <tr>
                    <th class="center-cell" style="width: 140px; padding: 8px;">Date</th>
                    <th class="num-cell" style="width: 180px; padding: 8px;">Daily Sales (RM)</th>
                </tr>
            </thead>
            <tbody>
                ${summaryData.dateRangeList.map(date => `
                    <tr>
                        <td class="center-cell">${date}</td>
                        <td class="num-cell" style="font-weight: bold;">${formatRM(summaryData.dailySalesMap[date] || 0)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}
    </body>
    </html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `Store_Total_Sales_${startDate}_to_${endDate}.xls`;
    downloadBlob(blob, filename);
}

// 导出每间店总销售 CSV (含每日销售明细，带 UTF-8 BOM)
function exportStoreSalesCSV() {
    const summaryData = currentStoreSalesData;
    if (!summaryData || !summaryData.stores || summaryData.stores.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    let csv = '\uFEFF';
    csv += `"Store Total Sales Report (每间店总销售报表)"\n`;
    csv += `"Date Range:","${startDate} to ${endDate}"\n`;
    csv += `"Grand Total Sales:","${formatRM(summaryData.grandSales)}"\n`;
    csv += `"Peak Sales Day:","${summaryData.peakDate} (${formatRM(summaryData.maxDailySale)})"\n`;
    csv += `"Lowest Sales Day:","${summaryData.lowestDate} (${formatRM(summaryData.minDailySale)})"\n`;
    csv += `"Daily Average:","${formatRM(summaryData.avgDailySale)}"\n\n`;

    // 1. 每间店总销售
    csv += `"Store Name","Total Sales (RM)"\n`;
    summaryData.stores.forEach(store => {
        csv += `"${store.name.replace(/"/g, '""')}","${formatRM(store.sales)}"\n`;
    });
    csv += `"GRAND TOTAL (${summaryData.stores.length} Stores)","${formatRM(summaryData.grandSales)}"\n\n`;

    // 2. 每日销售明细
    if (summaryData.dateRangeList && summaryData.dateRangeList.length > 0) {
        csv += `"Daily Sales Breakdown"\n`;
        csv += `"Date","Daily Sales (RM)"\n`;
        summaryData.dateRangeList.forEach(date => {
            csv += `"${date}","${formatRM(summaryData.dailySalesMap[date] || 0)}"\n`;
        });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const filename = `Store_Total_Sales_${startDate}_to_${endDate}.csv`;
    downloadBlob(blob, filename);
}

// 导出独立离线版 Store Total Sales & Daily Trend HTML 报告（支持Standard与手机横屏专版，内置全屏、交互走势图及过滤搜索）
function exportStoreSalesHTML(isLandscapeMode = false) {
    const summaryData = currentStoreSalesData;
    if (!summaryData || !summaryData.stores || summaryData.stores.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';
    const generatedTime = new Date().toLocaleString();

    // 结构化报告数据
    const safeData = {
        title: isLandscapeMode ? "Store Total Sales (手机横屏专版)" : "Store Total Sales & Daily Trend Report",
        startDate: startDate || 'All Time',
        endDate: endDate || 'All Time',
        generatedTime: generatedTime,
        grandSales: summaryData.grandSales || 0,
        maxDailySale: summaryData.maxDailySale || 0,
        peakDate: summaryData.peakDate || '-',
        minDailySale: summaryData.minDailySale || 0,
        lowestDate: summaryData.lowestDate || '-',
        avgDailySale: summaryData.avgDailySale || 0,
        dateRangeList: summaryData.dateRangeList || [],
        dailyAmounts: summaryData.dailyAmounts || [],
        dailySalesMap: summaryData.dailySalesMap || {},
        isLandscapeDefault: !!isLandscapeMode,
        stores: (summaryData.stores || []).map(s => ({
            id: s.id,
            name: s.name,
            sales: s.sales || 0,
            dailyAmounts: s.dailyAmounts || [],
            color: s.color || { border: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }
        }))
    };

    const jsonPayload = JSON.stringify(safeData).replace(/<\/script>/gi, '<\\/script>');
    const docTitle = isLandscapeMode 
        ? `Store_Total_Sales_${startDate}_to_${endDate}_Mobile_Landscape`
        : `Store_Total_Sales_${startDate}_to_${endDate}`;

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Store Sales">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#0f172a">
    <title>${escapeHtml(safeData.title)} (${startDate} ~ ${endDate})</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
    <style>
        :root {
            --primary: #2563eb;
            --bg-page: #f8fafc;
            --bg-card: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent !important;
            touch-action: manipulation;
        }
        html, body {
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: none !important;
            overscroll-behavior-y: none !important;
            -webkit-overflow-scrolling: touch;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-font-smoothing: antialiased;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-page);
            color: var(--text-main);
            padding: env(safe-area-inset-top, 16px) env(safe-area-inset-right, 16px) env(safe-area-inset-bottom, 16px) env(safe-area-inset-left, 16px);
            line-height: 1.5;
        }
        input, textarea {
            -webkit-user-select: text !important;
            user-select: text !important;
            touch-action: auto !important;
        }
        img, svg, a {
            -webkit-user-drag: none;
            user-drag: none;
        }
        /* Custom App-like Scrollbars */
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.35); border-radius: 3px; }

        /* Native App Tactile Press Interactions (按下去有类似原生 App 的物理微压反馈，绝非网页死板感) */
        .btn-action, .fs-enter-btn, .line-chip, .action-pill, .store-card-item, .fullscreen-banner {
            -webkit-tap-highlight-color: transparent !important;
            touch-action: manipulation !important;
            transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1), filter 0.08s ease, background 0.12s ease !important;
            cursor: pointer;
            outline: none !important;
        }
        .btn-action:active,
        .fs-enter-btn:active,
        .line-chip:active,
        .action-pill:active,
        .fullscreen-banner:active {
            transform: scale(0.95) !important;
            filter: brightness(0.92);
        }
        .store-card-item:active {
            transform: scale(0.97) !important;
            background-color: #f1f5f9 !important;
            border-color: #93c5fd !important;
        }
        .report-wrapper { max-width: 1200px; margin: 0 auto; transition: max-width 0.2s ease; }

        /* Fullscreen Entry Prompt Banner */
        .fullscreen-banner {
            background: linear-gradient(135deg, #1e3a8a, #2563eb);
            color: #ffffff;
            border-radius: 10px;
            padding: 9px 14px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
            border: 1px solid rgba(255, 255, 255, 0.2);
            user-select: none;
            transition: all 0.2s ease;
        }
        .fullscreen-banner:hover {
            background: linear-gradient(135deg, #1d4ed8, #1e40af);
        }
        .fs-banner-text {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12.5px;
            font-weight: 500;
        }
        .fs-enter-btn {
            background: #ffffff;
            color: #1d4ed8;
            border: none;
            border-radius: 6px;
            padding: 5px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            flex-shrink: 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        :fullscreen .fullscreen-banner,
        :-webkit-full-screen .fullscreen-banner {
            display: none !important;
        }

        .report-header {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .header-left h1 { font-size: 19px; font-weight: 800; color: var(--text-main); margin-bottom: 3px; display: flex; align-items: center; gap: 8px; }
        .header-left p { font-size: 12px; color: var(--text-muted); }
        .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .btn-action {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 7px 13px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            color: #334155;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
        }
        .btn-action:hover { background: #f1f5f9; border-color: #94a3b8; }
        .btn-primary { background: #2563eb; color: #ffffff; border-color: #2563eb; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-landscape-mode { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
        .btn-landscape-mode:hover { background: #10b981; color: #ffffff; }

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 12px;
            margin-bottom: 16px;
        }
        .kpi-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .kpi-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;
            font-weight: bold;
            flex-shrink: 0;
        }
        .icon-revenue { background: linear-gradient(135deg, #10b981, #059669); }
        .icon-peak { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .icon-lowest { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .icon-avg { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
        .kpi-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 18px; font-weight: 800; color: var(--text-main); margin-top: 1px; }
        .kpi-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

        .card-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 18px 20px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .card-title { font-size: 15px; font-weight: 700; color: var(--text-main); }
        .badge-peak {
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 600;
        }
        .chart-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .toolbar-label { font-size: 11.5px; font-weight: 700; color: #475569; }
        .chips-container { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; flex: 1; }
        .line-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 10px;
            background: #fff;
            border: 1.5px solid #cbd5e1;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 500;
            color: #64748b;
            cursor: pointer;
            user-select: none;
            transition: all 0.15s ease;
        }
        .line-chip.active {
            background: rgba(37, 99, 235, 0.06);
            border-color: var(--chip-color, #2563eb);
            color: #0f172a;
            font-weight: 600;
        }
        .line-chip input { accent-color: var(--chip-color, #2563eb); width: 13px; height: 13px; cursor: pointer; }
        .chip-dot { width: 8.5px; height: 8.5px; border-radius: 50%; background: var(--chip-color, #2563eb); }
        .actions-wrap { display: flex; gap: 4px; margin-left: auto; }
        .action-pill {
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
            background: #e2e8f0;
            color: #475569;
            border: none;
            cursor: pointer;
        }
        .action-pill:hover { background: #2563eb; color: #fff; }
        .action-pill.active {
            background: #2563eb;
            color: #fff;
            box-shadow: 0 1px 5px rgba(37, 99, 235, 0.4);
        }

        .chart-wrapper { position: relative; width: 100%; height: 260px; }
        .search-box {
            padding: 6px 12px;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            font-size: 12px;
            width: 220px;
            outline: none;
            transition: border-color 0.15s;
        }
        .search-box:focus { border-color: #2563eb; }

        /* Grand Total Highlight Banner */
        .grand-total-card {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border-radius: 12px;
            padding: 14px 20px;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .grand-total-left {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .grand-total-label {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #94a3b8;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .grand-total-count {
            font-size: 11.5px;
            color: #cbd5e1;
            font-weight: 500;
        }
        .grand-total-amount {
            font-size: 24px;
            font-weight: 800;
            color: #38bdf8;
            letter-spacing: 0.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }

        /* Store Sales Neat Cards Grid (店名在上方，Total Sales在下方) */
        .store-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
        }
        .store-card-item {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            transition: all 0.18s ease;
        }
        .store-card-item:hover {
            border-color: #93c5fd;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.06);
        }
        .store-card-name {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .store-name-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .store-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            flex-shrink: 0;
            box-shadow: 0 0 0 1.5px rgba(0,0,0,0.08);
        }
        .store-card-sales {
            font-size: 17px;
            font-weight: 800;
            color: #1d4ed8;
            letter-spacing: 0.2px;
        }

        .report-footer { text-align: center; font-size: 11.5px; color: #94a3b8; margin: 24px 0 10px; }

        /* ============================================================== */
        /* 📱 手机横屏专属优化 (Mobile Landscape Specific Optimization) */
        /* ============================================================== */
        @media (orientation: landscape) and (max-height: 580px), body.force-landscape {
            body { padding: env(safe-area-inset-top, 6px) env(safe-area-inset-right, 10px) env(safe-area-inset-bottom, 6px) env(safe-area-inset-left, 10px) !important; }
            .report-wrapper { max-width: 100% !important; }
            .fullscreen-banner {
                padding: 6px 10px !important;
                margin-bottom: 6px !important;
                border-radius: 6px !important;
            }
            .fs-banner-text { font-size: 11px !important; }
            .fs-enter-btn { padding: 3px 8px !important; font-size: 10.5px !important; }
            .report-header {
                padding: 6px 10px !important;
                margin-bottom: 6px !important;
                border-radius: 8px !important;
            }
            .header-left h1 { font-size: 14px !important; margin-bottom: 0 !important; }
            .header-left p { font-size: 10px !important; }
            .btn-action { padding: 4px 8px !important; font-size: 11px !important; border-radius: 5px !important; }
            .kpi-grid {
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 5px !important;
                margin-bottom: 6px !important;
            }
            .kpi-card {
                padding: 5px 7px !important;
                gap: 5px !important;
                border-radius: 6px !important;
            }
            .kpi-icon {
                width: 26px !important;
                height: 26px !important;
                font-size: 13px !important;
                border-radius: 5px !important;
            }
            .kpi-label { font-size: 8.5px !important; }
            .kpi-value { font-size: 12.5px !important; }
            .kpi-sub { display: none !important; }
            .card-box {
                padding: 8px 10px !important;
                margin-bottom: 6px !important;
                border-radius: 8px !important;
            }
            .card-header { margin-bottom: 5px !important; }
            .card-title { font-size: 12.5px !important; }
            .badge-peak { padding: 2px 6px !important; font-size: 10px !important; }
            .chart-toolbar {
                padding: 3px 6px !important;
                margin-bottom: 5px !important;
                gap: 4px !important;
            }
            .toolbar-label { font-size: 10px !important; }
            .line-chip {
                padding: 2px 5px !important;
                font-size: 10px !important;
            }
            .line-chip input { width: 10px !important; height: 10px !important; }
            .action-pill { padding: 2px 5px !important; font-size: 9.5px !important; }
            .chart-wrapper {
                height: 185px !important; /* 手机横屏黄金图表高度 */
            }
            .search-box { width: 140px !important; padding: 4px 6px !important; font-size: 11px !important; }

            /* 横屏下的 Grand Total Banner */
            .grand-total-card {
                padding: 7px 12px !important;
                margin-bottom: 6px !important;
                border-radius: 6px !important;
            }
            .grand-total-label { font-size: 10.5px !important; }
            .grand-total-count { font-size: 9.5px !important; }
            .grand-total-amount { font-size: 16px !important; }

            /* 横屏下的 Store Cards Grid (店名上面，Total Sales 下面) */
            .store-grid {
                grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)) !important;
                gap: 6px !important;
            }
            .store-card-item {
                padding: 6px 8px !important;
                gap: 2px !important;
                border-radius: 6px !important;
            }
            .store-card-name { font-size: 11px !important; gap: 5px !important; }
            .store-dot { width: 7px !important; height: 7px !important; }
            .store-card-sales { font-size: 13.5px !important; }
        }

        @media print {
            body { background: #ffffff !important; padding: 0 !important; }
            .header-actions, .chart-toolbar, .search-box, .fullscreen-banner { display: none !important; }
            .report-header, .kpi-card, .card-box { box-shadow: none !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid !important; }
        }
    </style>
</head>
<body class="${isLandscapeMode ? 'force-landscape' : ''}">
    <div class="report-wrapper">
        <!-- Fullscreen Banner for Mobile (Tapping enters fullscreen) -->
        <div class="fullscreen-banner" id="fullscreenBanner" onclick="enterFullscreen()">
            <div class="fs-banner-text">
                <span style="font-size: 15px;">📱</span>
                <span>轻触此处或屏幕进入<strong>沉浸式全屏横屏模式</strong>（自动隐藏浏览器边框）</span>
            </div>
            <button type="button" class="fs-enter-btn">进入全屏 ⛶</button>
        </div>

        <!-- Header -->
        <div class="report-header">
            <div class="header-left">
                <h1>
                    <span>${isLandscapeMode ? '📱 ' : '🏪 '}Store Total Sales</span>
                    <span style="font-size: 12px; font-weight: normal; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 12px;">${isLandscapeMode ? 'Mobile Landscape' : 'Standard'}</span>
                </h1>
                <p>Date Range: <strong>${startDate}</strong> to <strong>${endDate}</strong> | Stores: <strong>${summaryData.stores.length}</strong> | Generated: ${generatedTime}</p>
            </div>
            <div class="header-actions">
                <button type="button" class="btn-action btn-primary" id="btnFullscreen" title="Toggle fullscreen (immersive, borderless)">
                    ⛶ Fullscreen
                </button>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-icon icon-revenue">💰</div>
                <div>
                    <div class="kpi-label">Total Revenue</div>
                    <div class="kpi-value">${formatRM(summaryData.grandSales)}</div>
                    <div class="kpi-sub">${startDate} ~ ${endDate}</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon icon-peak">📈</div>
                <div>
                    <div class="kpi-label">Peak Sales Day</div>
                    <div class="kpi-value">${formatRM(summaryData.maxDailySale)}</div>
                    <div class="kpi-sub">${summaryData.peakDate !== '-' ? `Date: ${summaryData.peakDate}` : '-'}</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon icon-lowest">📉</div>
                <div>
                    <div class="kpi-label">Lowest Sales Day</div>
                    <div class="kpi-value">${formatRM(summaryData.minDailySale)}</div>
                    <div class="kpi-sub">${summaryData.lowestDate !== '-' ? `Date: ${summaryData.lowestDate}` : '-'}</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon icon-avg">📊</div>
                <div>
                    <div class="kpi-label">Daily Average</div>
                    <div class="kpi-value">${formatRM(summaryData.avgDailySale)}</div>
                    <div class="kpi-sub">Across ${summaryData.dateRangeList.length || 1} day(s)</div>
                </div>
            </div>
        </div>

        <!-- Daily Sales Trend Chart -->
        <div class="card-box">
            <div class="card-header">
                <div>
                    <div class="card-title">Daily Sales Trend</div>
                </div>
                <div class="badge-peak" id="exportPeakBadge">Peak: ${formatRM(summaryData.maxDailySale)}</div>
            </div>

            <div class="chart-toolbar">
                <span class="toolbar-label">Trend Lines:</span>
                <div class="chips-container" id="exportChipsContainer">
                    <!-- Checkbox chips injected dynamically -->
                </div>
                <div class="actions-wrap">
                    <button type="button" class="action-pill active" id="exportTotalOnlyBtn" title="Show Total Sales trend only">Total Only</button>
                    <button type="button" class="action-pill" id="exportStoresOnlyBtn" title="Show store trends only (hide Total Sales)">All Stores</button>
                </div>
            </div>

            <div class="chart-wrapper">
                <canvas id="exportChartCanvas"></canvas>
            </div>
        </div>

        <!-- Store Sales Overview (Neat Store Cards + Grand Total) -->
        <div class="card-box">
            <div class="card-header">
                <div class="card-title">🏪 Store Sales Overview (${summaryData.stores.length} Stores)</div>
                <input type="text" id="exportStoreSearch" class="search-box" placeholder="🔍 Search store...">
            </div>

            <!-- Grand Total Highlight Card -->
            <div class="grand-total-card">
                <div class="grand-total-left">
                    <div class="grand-total-label">
                        <span style="font-size:16px;">🏛️</span>
                        <span>GRAND TOTAL</span>
                    </div>
                    <div class="grand-total-count" id="grandStoreCount">${summaryData.stores.length} Stores Total</div>
                </div>
                <div class="grand-total-amount" id="grandTotalDisplay">${formatRM(summaryData.grandSales)}</div>
            </div>

            <!-- Neat Store Cards Grid (店名上面，Total Sales 下面) -->
            <div class="store-grid" id="exportStoreGrid">
                ${summaryData.stores.map(store => `
                    <div class="store-card-item" data-name="${escapeHtml(store.name).toLowerCase()}" data-sales="${store.sales}">
                        <div class="store-card-name">
                            <span class="store-dot" style="background-color: ${store.color?.border || '#10b981'};"></span>
                            <span class="store-name-text" title="${escapeHtml(store.name)}">${escapeHtml(store.name)}</span>
                        </div>
                        <div class="store-card-sales">${formatRM(store.sales)}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="report-footer">
            Generated by SmartProfits POS System &bull; Standalone Executive Sales Report
        </div>
    </div>

    <!-- Client script for interactivity -->
    <script>
        const DATA = ${jsonPayload};

        function formatRM(val) {
            const num = Number(val) || 0;
            return 'RM ' + num.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        let currentChart = null;
        // 默认只画 Total Sales 一条线（店铺线全部Off）。
        // Total Sales 与店铺线是互斥的：勾选任意店铺 -> Total 自动消失；
        // 取消所有店铺 -> Total 自动回来。这样手机横屏一打开就是干净的走势。
        let showTotal = true;
        let enabledStoreIds = new Set();

        function renderChips() {
            const container = document.getElementById('exportChipsContainer');
            if (!container) return;
            let html = '';
            html += '<label class="line-chip ' + (showTotal ? 'active' : '') + '" style="--chip-color: #2563eb;">'
                  + '<input type="checkbox" id="chip_total" ' + (showTotal ? 'checked' : '') + '>'
                  + '<span class="chip-dot" style="background:#2563eb;"></span>'
                  + '<span>Total Sales</span></label>';

            DATA.stores.forEach(s => {
                const active = enabledStoreIds.has(s.id);
                const color = s.color && s.color.border ? s.color.border : '#10b981';
                html += '<label class="line-chip ' + (active ? 'active' : '') + '" style="--chip-color: ' + color + ';">'
                      + '<input type="checkbox" class="cb-store" data-id="' + s.id + '" ' + (active ? 'checked' : '') + '>'
                      + '<span class="chip-dot" style="background:' + color + ';"></span>'
                      + '<span>' + s.name + '</span></label>';
            });
            container.innerHTML = html;
        }

        function renderChart() {
            const canvas = document.getElementById('exportChartCanvas');
            if (!canvas) return;
            if (currentChart) { currentChart.destroy(); currentChart = null; }
            if (typeof Chart === 'undefined') return;

            const ctx = canvas.getContext('2d');
            const dates = DATA.dateRangeList || [];
            const labels = dates.map(d => {
                const p = d.split('-');
                return p.length === 3 ? (p[1] + '/' + p[2]) : d;
            });

            const datasets = [];
            const visibleVals = [];
            const isTotalOnly = showTotal && enabledStoreIds.size === 0;

            const gradient = ctx.createLinearGradient(0, 0, 0, 240);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.30)');
            gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.10)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

            if (showTotal) {
                const arr = DATA.dailyAmounts || [];
                arr.forEach(v => visibleVals.push(v));
                datasets.push({
                    label: 'Total Sales',
                    data: arr,
                    borderColor: '#2563eb',
                    borderWidth: 3,
                    backgroundColor: isTotalOnly ? gradient : 'transparent',
                    fill: isTotalOnly,
                    tension: 0.38,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: dates.length <= 15 ? 4 : 2.5,
                    spanGaps: true
                });
            }

            DATA.stores.forEach(s => {
                if (enabledStoreIds.has(s.id)) {
                    const arr = s.dailyAmounts || [];
                    arr.forEach(v => visibleVals.push(v));
                    const col = s.color && s.color.border ? s.color.border : '#10b981';
                    datasets.push({
                        label: s.name,
                        data: arr,
                        borderColor: col,
                        borderWidth: 2.2,
                        backgroundColor: 'transparent',
                        fill: false,
                        tension: 0.38,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: col,
                        pointBorderWidth: 1.8,
                        pointRadius: dates.length <= 15 ? 3.5 : 2,
                        spanGaps: true
                    });
                }
            });

            const maxVal = visibleVals.length > 0 ? Math.max(...visibleVals, 100) : 100;
            const badge = document.getElementById('exportPeakBadge');
            if (badge) {
                const peak = visibleVals.length > 0 ? Math.max(...visibleVals) : 0;
                badge.textContent = 'Peak: ' + formatRM(peak);
            }

            currentChart = new Chart(ctx, {
                type: 'line',
                data: { labels: labels, datasets: datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.94)',
                            titleColor: '#94a3b8',
                            bodyColor: '#f8fafc',
                            padding: 10,
                            cornerRadius: 6,
                            displayColors: true,
                            callbacks: {
                                title: items => items && items.length ? ('📅 Date: ' + dates[items[0].dataIndex]) : '',
                                label: item => ' ' + item.dataset.label + ': ' + formatRM(item.raw)
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            suggestedMax: maxVal * 1.15,
                            grid: { color: 'rgba(226, 232, 240, 0.75)' },
                            ticks: { font: { size: 10 }, callback: v => 'RM ' + Number(v).toLocaleString() }
                        },
                        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: true } }
                    }
                }
            });
        }

        // 高亮当前模式按钮（Total Only / All Stores）
        function updateModeButtons() {
            const totalBtn = document.getElementById('exportTotalOnlyBtn');
            const storesBtn = document.getElementById('exportStoresOnlyBtn');
            const totalOnly = showTotal && enabledStoreIds.size === 0;
            const storesOnly = !showTotal && enabledStoreIds.size > 0;
            if (totalBtn) totalBtn.classList.toggle('active', totalOnly);
            if (storesBtn) storesBtn.classList.toggle('active', storesOnly);
        }

        // Fullscreen Handling (支持厂商前缀与手机浏览器手势)
        function enterFullscreen() {
            const docEl = document.documentElement;
            const rfs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (rfs && !document.fullscreenElement && !document.webkitFullscreenElement) {
                rfs.call(docEl).then(() => {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(() => {});
                    }
                }).catch(err => {
                    console.log('Fullscreen request blocked:', err);
                });
            }
        }

        function exitFullscreen() {
            const efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (efs && (document.fullscreenElement || document.webkitFullscreenElement)) {
                efs.call(document).catch(() => {});
            }
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                enterFullscreen();
            } else {
                exitFullscreen();
            }
        }

        // 监听全屏切换更新按钮文本及重排图表
        function handleFullscreenChange() {
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
            const btn = document.getElementById('btnFullscreen');
            if (btn) {
                btn.textContent = isFs ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
            }
            const banner = document.getElementById('fullscreenBanner');
            if (banner) {
                banner.style.display = isFs ? 'none' : 'flex';
            }
            if (currentChart) {
                setTimeout(() => currentChart.resize(), 120);
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        // 阻止长按弹出网页式右键菜单或复制框（保持 App 原生触感）
        document.addEventListener('contextmenu', e => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
        // 阻止多指缩放手势（防止页面错位，保持 App 原生视口）
        document.addEventListener('gesturestart', e => e.preventDefault());
        document.addEventListener('gesturechange', e => e.preventDefault());
        document.addEventListener('gestureend', e => e.preventDefault());

        // 手机第一次触摸或点击时自动触发全屏模式（符合移动端安全规范）
        function setupAutoFullscreen() {
            const onFirstGesture = () => {
                enterFullscreen();
                window.removeEventListener('touchend', onFirstGesture);
                window.removeEventListener('click', onFirstGesture);
            };
            window.addEventListener('touchend', onFirstGesture, { once: true, passive: true });
            window.addEventListener('click', onFirstGesture, { once: true });
        }

        // Initialize events
        document.addEventListener('DOMContentLoaded', () => {
            renderChips();
            renderChart();
            updateModeButtons();
            setupAutoFullscreen();

            document.getElementById('btnFullscreen')?.addEventListener('click', toggleFullscreen);

            window.addEventListener('resize', () => {
                if (currentChart) currentChart.resize();
            });
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    if (currentChart) currentChart.resize();
                }, 200);
            });

            const container = document.getElementById('exportChipsContainer');
            if (container) {
                container.addEventListener('change', e => {
                    if (e.target.id === 'chip_total') {
                        if (e.target.checked) {
                            // 点 Total = 回到"Total only"模式，清掉所有店铺线
                            showTotal = true;
                            enabledStoreIds = new Set();
                        } else {
                            // 不允许全空：没有任何店铺线时，Total 保持On
                            showTotal = enabledStoreIds.size === 0;
                        }
                    } else if (e.target.classList.contains('cb-store')) {
                        const sid = e.target.dataset.id;
                        if (e.target.checked) {
                            // 选了店铺 -> Total Sales 立刻消失
                            enabledStoreIds.add(sid);
                            showTotal = false;
                        } else {
                            enabledStoreIds.delete(sid);
                            // 店铺全部取消 -> 自动回到默认的 Total Sales 视图
                            if (enabledStoreIds.size === 0) showTotal = true;
                        }
                    }
                    renderChips();
                    renderChart();
                    updateModeButtons();
                });
            }

            document.getElementById('exportTotalOnlyBtn')?.addEventListener('click', () => {
                showTotal = true;
                enabledStoreIds = new Set();
                renderChips();
                renderChart();
                updateModeButtons();
            });

            document.getElementById('exportStoresOnlyBtn')?.addEventListener('click', () => {
                showTotal = false;
                enabledStoreIds = new Set(DATA.stores.map(s => s.id));
                renderChips();
                renderChart();
                updateModeButtons();
            });

            // Store cards search & real-time Grand Total calculation
            const searchInput = document.getElementById('exportStoreSearch');
            if (searchInput) {
                searchInput.addEventListener('input', e => {
                    const q = (e.target.value || '').toLowerCase().trim();
                    const items = document.querySelectorAll('.store-card-item');
                    let visibleCount = 0;
                    let visibleTotal = 0;
                    items.forEach(item => {
                        const name = item.dataset.name || '';
                        const sales = parseFloat(item.dataset.sales) || 0;
                        if (!q || name.includes(q)) {
                            item.style.display = 'flex';
                            visibleCount++;
                            visibleTotal += sales;
                        } else {
                            item.style.display = 'none';
                        }
                    });
                    const grandAmount = document.getElementById('grandTotalDisplay');
                    const grandCount = document.getElementById('grandStoreCount');
                    if (grandAmount) grandAmount.textContent = formatRM(visibleTotal);
                    if (grandCount) grandCount.textContent = visibleCount + ' Stores ' + (q ? 'Filtered' : 'Total');
                });
            }
        });
    <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const filename = `${docTitle}.html`;
    downloadBlob(blob, filename);
}

// 导出独立离线版 Product Sales Analysis (Cross-Tab) HTML 报告
function exportCrossTabHTML() {
    if (!currentFilteredProducts || currentFilteredProducts.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';
    const generatedTime = new Date().toLocaleString();

    const storeTotals = {};
    currentActiveStores.forEach(s => { storeTotals[s.id] = { qty: 0, sales: 0 }; });
    let grandQty = 0;
    let grandSales = 0;
    currentFilteredProducts.forEach(prod => {
        grandQty += (prod.totalQty || 0);
        grandSales += (prod.totalSales || 0);
        currentActiveStores.forEach(s => {
            const sData = prod.stores[s.id] || { qty: 0, sales: 0 };
            storeTotals[s.id].qty += (sData.qty || 0);
            storeTotals[s.id].sales += (sData.sales || 0);
        });
    });

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Sales Analysis (${startDate} ~ ${endDate})</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; }
        .wrapper { max-width: 98%; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 14px; flex-wrap: wrap; gap: 10px; }
        .header h1 { font-size: 20px; margin: 0 0 6px 0; color: #0f172a; }
        .header p { font-size: 13px; color: #64748b; margin: 0; }
        .btn-print { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
        .search-box { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; margin-bottom: 14px; width: 280px; }
        .table-wrap { overflow-x: auto; max-height: 75vh; }
        table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; }
        thead th { background: #0f172a; color: #fff; position: sticky; top: 0; z-index: 2; }
        .store-header { background: #1e293b; color: #38bdf8; text-align: center; }
        .total-header { background: #1e3a8a; color: #67e8f9; text-align: center; }
        .num-col { text-align: right; }
        .sales-col { text-align: right; font-weight: 700; color: #1d4ed8; background: #eff6ff; }
        .total-cell { text-align: right; font-weight: 700; background: #f0fdf4; color: #166534; }
        tfoot tr { background: #0f172a; color: #38bdf8; font-weight: 700; position: sticky; bottom: 0; }
        tfoot th { background: #0f172a; color: #38bdf8; padding: 10px; }
        @media print { .btn-print, .search-box { display: none; } .table-wrap { max-height: none; overflow: visible; } }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div>
                <h1>Product Sales Analysis (动态交叉报表)</h1>
                <p>Date Range: <strong>${startDate}</strong> to <strong>${endDate}</strong> | Stores: <strong>${currentActiveStores.length}</strong> | Products: <strong>${currentFilteredProducts.length}</strong> | Generated: ${generatedTime}</p>
            </div>
            <button class="btn-print" onclick="window.print()">🖨️ Print Report</button>
        </div>
        <input type="text" id="prodSearch" class="search-box" placeholder="Filter product name in table...">
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th rowspan="2" style="width: 260px;">Product Name</th>
                        ${currentActiveStores.map(s => `<th colspan="2" class="store-header">${escapeHtml(s.name)}</th>`).join('')}
                        <th colspan="2" class="total-header">TOTAL</th>
                    </tr>
                    <tr>
                        ${currentActiveStores.map(() => `<th class="num-col" style="width: 70px;">Qty</th><th class="num-col" style="width: 100px;">Sales (RM)</th>`).join('')}
                        <th class="num-col" style="width: 80px;">Total Qty</th>
                        <th class="num-col" style="width: 120px;">Total Sales (RM)</th>
                    </tr>
                </thead>
                <tbody id="prodTbody">
                    ${currentFilteredProducts.map(p => `
                        <tr>
                            <td><strong>${escapeHtml(p.name)}</strong></td>
                            ${currentActiveStores.map(s => {
                                const sd = p.stores[s.id] || { qty: 0, sales: 0 };
                                return `<td class="num-col">${sd.qty > 0 ? sd.qty : '-'}</td><td class="sales-col">${sd.sales > 0 ? formatRM(sd.sales) : '-'}</td>`;
                            }).join('')}
                            <td class="total-cell">${formatQty(p.totalQty)}</td>
                            <td class="total-cell">${formatRM(p.totalSales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th>GRAND TOTAL</th>
                        ${currentActiveStores.map(s => `
                            <th class="num-col">${formatQty(storeTotals[s.id].qty)}</th>
                            <th class="num-col">${formatRM(storeTotals[s.id].sales)}</th>
                        `).join('')}
                        <th class="total-cell" style="color: #67e8f9 !important;">${formatQty(grandQty)}</th>
                        <th class="total-cell" style="color: #67e8f9 !important;">${formatRM(grandSales)}</th>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
    <script>
        document.getElementById('prodSearch')?.addEventListener('input', e => {
            const q = (e.target.value || '').toLowerCase();
            document.querySelectorAll('#prodTbody tr').forEach(r => {
                r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    <\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const filename = `Product_Sales_Analysis_${startDate}_to_${endDate}.html`;
    downloadBlob(blob, filename);
}

// 打印 Product Sales Analysis 动态交叉报表
function printCrossTabSummary() {
    if (!currentFilteredProducts || currentFilteredProducts.length === 0) {
        alert('No data to print');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    const storeTotals = {};
    currentActiveStores.forEach(s => { storeTotals[s.id] = { qty: 0, sales: 0 }; });
    let grandQty = 0;
    let grandSales = 0;
    currentFilteredProducts.forEach(prod => {
        currentActiveStores.forEach(s => {
            const sData = prod.stores[s.id] || { qty: 0, sales: 0 };
            storeTotals[s.id].qty += sData.qty;
            storeTotals[s.id].sales += sData.sales;
        });
        grandQty += prod.totalQty;
        grandSales += prod.totalSales;
    });

    let printContent = `
        <html>
        <head>
            <title>Product Sales Analysis Report</title>
            <style>
                @page { size: landscape; margin: 10mm; }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; color: #1e293b; }
                .report-header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
                .report-header h1 { margin: 0 0 5px 0; font-size: 20px; color: #0f172a; }
                .report-meta { font-size: 12px; color: #475569; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
                th { background-color: #1e293b; color: #ffffff; font-weight: 600; }
                .store-title { text-align: center; }
                .text-right { text-align: right; }
                .total-col { background-color: #f0f7ff; font-weight: bold; }
                .grand-total-row th { background-color: #0f172a; color: #38bdf8; font-weight: 800; border-top: 2px solid #0f172a; }
                .report-footer { margin-top: 15px; text-align: center; font-size: 10.5px; color: #64748b; }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>Product Sales Analysis Report</h1>
                <div class="report-meta">
                    <strong>Date Range:</strong> ${startDate} to ${endDate} &nbsp;|&nbsp; 
                    <strong>Stores:</strong> ${escapeHtml(currentActiveStores.map(s => s.name).join(', '))} &nbsp;|&nbsp;
                    <strong>Products:</strong> ${currentFilteredProducts.length} items
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th rowspan="2">Product</th>
                        ${currentActiveStores.map(s => `<th colspan="2" class="store-title">${escapeHtml(s.name)}</th>`).join('')}
                        <th colspan="2" class="store-title" style="background:#1d4ed8;">TOTAL</th>
                    </tr>
                    <tr>
                        ${currentActiveStores.map(() => `<th class="text-right">Qty Sold</th><th class="text-right">Sales (RM)</th>`).join('')}
                        <th class="text-right" style="background:#1e3a8a;">Total Qty</th>
                        <th class="text-right" style="background:#1e3a8a;">Total Sales (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentFilteredProducts.map(prod => `
                        <tr>
                            <td><strong>${escapeHtml(prod.name)}</strong>${prod.id && prod.id !== '-' ? ` <span style="color:#64748b;font-size:10px;">(${escapeHtml(prod.id)})</span>` : ''}</td>
                            ${currentActiveStores.map(s => {
                                const sd = prod.stores[s.id] || { qty: 0, sales: 0 };
                                return `<td class="text-right">${formatQty(sd.qty)}</td><td class="text-right">${formatRM(sd.sales)}</td>`;
                            }).join('')}
                            <td class="text-right total-col">${formatQty(prod.totalQty)}</td>
                            <td class="text-right total-col">${formatRM(prod.totalSales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="grand-total-row">
                        <th>GRAND TOTAL</th>
                        ${currentActiveStores.map(s => `<th class="text-right">${formatQty(storeTotals[s.id].qty)}</th><th class="text-right">${formatRM(storeTotals[s.id].sales)}</th>`).join('')}
                        <th class="text-right" style="background:#1e3a8a;color:#67e8f9;">${formatQty(grandQty)}</th>
                        <th class="text-right" style="background:#1e3a8a;color:#67e8f9;">${formatRM(grandSales)}</th>
                    </tr>
                </tfoot>
            </table>
            <div class="report-footer">
                Report Generated on ${new Date().toLocaleString()} &bull; SmartProfits POS System
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// 打印标准汇总报告
function printStandardSummary() {
    if (currentSalesSummary.length === 0) {
        alert('No data to print');
        return;
    }
    
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
                    <h3>${formatRM(totalRevenue)}</h3>
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
                <td>${formatRM(product.unitPrice)}</td>
                <td>${formatQty(product.totalQuantity)}</td>
                <td>${formatRM(product.totalRevenue)}</td>
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
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// 打印每间店总销售报告
function printStoreSalesSummary() {
    const summaryData = currentStoreSalesData;
    if (!summaryData || !summaryData.stores || summaryData.stores.length === 0) {
        alert('No data to print');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    let printContent = `
        <html>
        <head>
            <title>Store Total Sales Report</title>
            <style>
                @page { size: portrait; margin: 12mm; }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; color: #1e293b; }
                .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
                .report-header h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
                .report-meta { font-size: 13px; color: #475569; }
                .kpi-row { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 20px; }
                .kpi-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: center; }
                .kpi-box .val { font-size: 18px; font-weight: bold; color: #1d4ed8; }
                .kpi-box .lbl { font-size: 11px; color: #64748b; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
                th { background-color: #1e293b; color: #ffffff; font-weight: 600; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .sales-col { color: #1d4ed8; font-weight: bold; text-align: right; }
                tfoot th { background-color: #0f172a; color: #38bdf8; font-weight: bold; }
                .section-heading { font-size: 15px; font-weight: bold; margin: 20px 0 10px 0; color: #0f172a; }
                .report-footer { margin-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="report-header">
                <h1>Store Total Sales Report (每间店总销售报表)</h1>
                <div class="report-meta">Date Range: <strong>${startDate}</strong> to <strong>${endDate}</strong> | Generated: ${new Date().toLocaleString()}</div>
            </div>
            <div class="kpi-row">
                <div class="kpi-box"><div class="val">${formatRM(summaryData.grandSales)}</div><div class="lbl">Total Revenue</div></div>
                <div class="kpi-box"><div class="val">${summaryData.peakDate !== '-' ? `${summaryData.peakDate}` : '-'}</div><div class="lbl">Peak Day (${formatRM(summaryData.maxDailySale)})</div></div>
                <div class="kpi-box"><div class="val">${summaryData.lowestDate !== '-' ? `${summaryData.lowestDate}` : '-'}</div><div class="lbl">Lowest Day (${formatRM(summaryData.minDailySale)})</div></div>
                <div class="kpi-box"><div class="val">${formatRM(summaryData.avgDailySale)}</div><div class="lbl">Daily Average</div></div>
            </div>

            <div class="section-heading">Store Sales Overview</div>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">Store Name</th>
                        <th class="text-right" style="width: 200px;">Total Sales (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    ${summaryData.stores.map(s => `
                        <tr>
                            <td class="font-bold">${escapeHtml(s.name)}</td>
                            <td class="sales-col">${formatRM(s.sales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th style="text-align: left;">GRAND TOTAL (${summaryData.stores.length} Stores)</th>
                        <th class="text-right" style="color: #38bdf8;">${formatRM(summaryData.grandSales)}</th>
                    </tr>
                </tfoot>
            </table>

            ${summaryData.dateRangeList && summaryData.dateRangeList.length > 0 ? `
            <div class="section-heading">Daily Sales Breakdown</div>
            <table>
                <thead>
                    <tr>
                        <th class="text-center" style="width: 140px;">Date</th>
                        <th class="text-right" style="width: 200px;">Daily Sales (RM)</th>
                    </tr>
                </thead>
                <tbody>
                    ${summaryData.dateRangeList.map(date => `
                        <tr>
                            <td class="text-center">${date}</td>
                            <td class="text-right font-bold">${formatRM(summaryData.dailySalesMap[date] || 0)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : ''}

            <div class="report-footer">
                SmartProfits POS System &bull; Store Performance &amp; Daily Trend Analysis
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }
}

// 统一打印分发入口
function printSalesSummary() {
    if (currentSummaryActiveTab === 'crosstab') {
        printCrossTabSummary();
    } else if (currentSummaryActiveTab === 'storesales') {
        printStoreSalesSummary();
    } else {
        printStandardSummary();
    }
}

// 每间店总销售 CSV 导出
function exportStoreSalesCSV() {
    const summaryData = currentStoreSalesData;
    if (!summaryData || !summaryData.stores || summaryData.stores.length === 0) {
        alert('No data to export');
        return;
    }
    const startDate = document.getElementById('summaryStartDate')?.value || '';
    const endDate = document.getElementById('summaryEndDate')?.value || '';

    let csvContent = '\uFEFFRank,Store Name,Store ID,Total Orders,Quantity Sold,Total Sales (RM),Avg Order Value (RM),Sales Contribution (%)\n';

    summaryData.stores.forEach((store, idx) => {
        const row = [
            idx + 1,
            `"${store.name.replace(/"/g, '""')}"`,
            `"${store.id}"`,
            store.orderCount,
            store.qty,
            store.sales.toFixed(2),
            store.avgOrderValue.toFixed(2),
            `${store.share.toFixed(1)}%`
        ].join(',');
        csvContent += row + '\n';
    });

    // Grand total row
    csvContent += [
        'GRAND TOTAL',
        `"All Stores (${summaryData.stores.length})"`,
        '-',
        summaryData.grandOrders,
        summaryData.grandQty,
        summaryData.grandSales.toFixed(2),
        summaryData.overallAvgOrderValue.toFixed(2),
        '100.0%'
    ].join(',') + '\n';

    const filename = `Store_Total_Sales_${startDate}_to_${endDate}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

// 标准汇总 CSV 导出
function exportStandardCSV() {
    if (currentSalesSummary.length === 0) {
        alert('No data to export');
        return;
    }
    
    const sortedSummary = getSortedSummary();
    let csvContent = '\uFEFFProduct ID,Product Name,Unit Price,Quantity Sold,Total Revenue,Sale Count,Percentage\n';
    
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
    
    const date = dateFilter.value || selectedDate;
    const storeId = selectedStoreId;
    const storeName = storeId === 'all' ? 'All_Stores' : (stores[storeId]?.name || storeId).replace(/\s+/g, '_');
    const filename = `Sales_Summary_${storeName}_${date}.csv`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
}

// 统一 CSV 导出分发入口
function exportSalesSummary() {
    if (currentSummaryActiveTab === 'crosstab') {
        exportCrossTabCSV();
    } else if (currentSummaryActiveTab === 'storesales') {
        exportStoreSalesCSV();
    } else {
        exportStandardCSV();
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
    
    // 添加Off按钮事件
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
            
            // 自动Off截图视图
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
    
    const quantityNumber = parseFloat(quantity);
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
                const datePath = getDatePathFromString(date);
                
                // 对每个店铺获取销售记录
                storeIds.forEach(storeId => {
                    promises.push(
                        database.ref(`sales/${storeId}/${datePath.path}`).once('value')
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

// 生成示例销售数据用于演示（支持日期范围和多天模拟）
function generateSampleSalesDataChinese(startDateStr, endDateStr) {
    console.log('Generating sample sales data for range:', startDateStr, 'to', endDateStr);
    
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
    const dates = getDatesInRange(startDateStr, endDateStr);
    let counter = 1;
    
    dates.forEach(date => {
        // Generate 3-8 sample transactions per day
        const txCount = Math.floor(Math.random() * 6) + 3;
        for (let i = 1; i <= txCount; i++) {
            const saleId = `SAMPLE_SALE_${date.replace(/-/g, '')}_${i}`;
            const billNumber = `BILL${String(counter++).padStart(4, '0')}`;
            
            // Randomly pick 1-4 items
            const numItems = Math.floor(Math.random() * 4) + 1;
            const items = [];
            let totalAmount = 0;
            
            // Randomly decide which store ID to assign (just to simulate different stores)
            const storesList = Object.keys(stores);
            const storeId = storesList.length > 0 ? storesList[Math.floor(Math.random() * storesList.length)] : 'SAMPLE_STORE';
            
            for (let j = 0; j < numItems; j++) {
                const product = { ...sampleProducts[Math.floor(Math.random() * sampleProducts.length)] };
                
                // Simulate a product with the same name but different ID (e.g. variant)
                if (product.id === 'P001' && Math.random() < 0.2) {
                    product.id = 'P001-ALT'; // Same name 'Coca Cola 330ml', different ID
                }
                
                const quantity = Math.floor(Math.random() * 3) + 1; 
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
            
            // Discounts
            let discountAmount = 0;
            let discountPercent = 0;
            let discountType = 'percent';
            
            if (Math.random() < 0.3) {
                if (Math.random() < 0.5) {
                    discountPercent = Math.floor(Math.random() * 15) + 5;
                    discountAmount = totalAmount * (discountPercent / 100);
                    discountType = 'percent';
                } else {
                    discountAmount = Math.floor(Math.random() * 5) + 1;
                    discountType = 'amount';
                }
                totalAmount -= discountAmount;
            }
            
            const saleTime = new Date(date + 'T12:00:00');
            saleTime.setHours(Math.floor(Math.random() * 12) + 8);
            saleTime.setMinutes(Math.floor(Math.random() * 60));
            saleTime.setSeconds(Math.floor(Math.random() * 60));
            
            const timestamp = saleTime.toISOString().slice(0, 19).replace('T', ' ');
            
            sampleSales[saleId] = {
                billNumber: billNumber,
                store_id: storeId,
                items: items,
                total_amount: totalAmount,
                subtotal: totalAmount + discountAmount,
                discountType: discountType,
                discountPercent: discountPercent,
                discountAmount: discountAmount,
                date: date,
                timestamp: timestamp,
                staff_id: 'SAMPLE_STAFF',
                cashierName: `Cashier ${i}`,
                cashierShift: Math.random() < 0.7 ? '1st Shift' : '2nd Shift'
            };
        }
    });
    
    return sampleSales;
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
    
    // Off按钮事件
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 点击模态框外部Off
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// 编辑用户
function editUser(userId) {
    const user = users[userId];
    if (!user) return;
    
    // 检查当前用户是否有权限编辑
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;
    
    getUserRole(currentUser.uid).then(currentUserRole => {
        // 只有超级管理员可以编辑任何用户，或者用户可以编辑自己的资料
        if (currentUserRole !== 'sadmin' && currentUser.uid !== userId) {
            alert('Only Super Admin can edit other users');
            return;
        }
        
        // 填充表单
        document.getElementById('editUserId').value = userId;
        document.getElementById('editUserEmail').value = user.email || '';
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserRole').value = user.role || 'staff';
        
        // 加载店铺选项
        const editUserStoreId = document.getElementById('editUserStoreId');
        editUserStoreId.innerHTML = '<option value="">Select Store</option>';
        
        Object.keys(stores).forEach(storeId => {
            const option = document.createElement('option');
            option.value = storeId;
            option.textContent = stores[storeId].name || storeId;
            if (user.store_id === storeId) {
                option.selected = true;
            }
            editUserStoreId.appendChild(option);
        });
        
        // 根据角色显示或隐藏商店选择
        toggleEditStoreSelection();
        
        // 显示编辑模态框
        showModal(document.getElementById('editUserModal'));
    });
}

// 切换编辑用户角色时显示或隐藏店铺选择
function toggleEditStoreSelection() {
    const editUserRole = document.getElementById('editUserRole');
    const editUserStoreContainer = document.getElementById('editUserStoreContainer');
    const editUserStoreId = document.getElementById('editUserStoreId');
    
    if (editUserRole.value === 'admin') {
        editUserStoreContainer.style.display = 'none';
        editUserStoreId.required = false;
    } else {
        editUserStoreContainer.style.display = 'block';
        editUserStoreId.required = true;
    }
}

// 处理编辑用户表单提交
function handleEditUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('editUserId').value;
    const name = document.getElementById('editUserName').value.trim();
    const role = document.getElementById('editUserRole').value;
    const storeId = role === 'staff' ? document.getElementById('editUserStoreId').value : '';
    
    if ((role === 'staff' && !storeId)) {
        alert('Please select a store for staff user');
        return;
    }
    
    // 获取当前用户角色
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('You need to be logged in to edit users');
        return;
    }
    
    getUserRole(currentUser.uid).then(currentUserRole => {
        // 只有超级管理员可以更改用户角色为超级管理员
        if (role === 'sadmin' && currentUserRole !== 'sadmin') {
            alert('Only Super Admin can assign Super Admin role');
            return;
        }
        
        // 检查是否在尝试降级唯一的超级管理员
        if (users[userId].role === 'sadmin' && role !== 'sadmin') {
            // 计算系统中的超级管理员数量
            const sadminCount = Object.values(users).filter(u => u.role === 'sadmin').length;
            
            if (sadminCount <= 1) {
                alert('Cannot change role. System requires at least one Super Admin');
                return;
            }
        }
        
        // 更新用户信息
        const updates = {
            name: name,
            role: role
        };
        
        if (role === 'staff') {
            updates.store_id = storeId;
        }
        
        // 保存更新
        database.ref(`users/${userId}`).update(updates)
            .then(() => {
                hideModal(document.getElementById('editUserModal'));
                loadUsers();  // 重新加载用户列表
                alert('User updated successfully');
            })
            .catch(error => {
                console.error('Failed to update user:', error);
                alert(`Failed to update user: ${error.message}`);
            });
    });
}

// 公告管理功能
// 加载公告数据
function loadAnnouncements() {
    console.log("开始加载公告数据");
    
    if (!database) {
        console.error("数据库未初始化");
        alert("Database not initialized. Please refresh the page.");
        return;
    }
    
    database.ref('announcements').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            announcements = data || {};
            
            console.log("公告数据加载完成:");
            console.log("- 原始数据:", data);
            console.log("- 处理后数据:", announcements);
            console.log("- 公告数量:", Object.keys(announcements).length);
            
            displayAnnouncements();
            loadCurrentAnnouncement();
        })
        .catch(error => {
            console.error("加载公告数据失败:", error);
            console.error("错误详情:", error.message);
            
            if (error.code === 'PERMISSION_DENIED') {
                alert("Permission denied. Please check if you have Super Admin privileges and update Firebase rules.");
            } else {
                alert("Failed to load announcements: " + error.message);
            }
        });
}

// 加载当前活跃的公告
function loadCurrentAnnouncement() {
    database.ref('system/current_announcement').once('value')
        .then(snapshot => {
            const currentAnnouncementData = snapshot.val();
            currentAnnouncement = currentAnnouncementData;
            updateAnnouncementStatus();
            updateCurrentAnnouncementPreview();
        })
        .catch(error => {
            console.error("加载当前公告失败:", error);
        });
}

// 显示公告列表
function displayAnnouncements() {
    if (!announcementsTableBody) return;
    
    announcementsTableBody.innerHTML = '';
    
    if (Object.keys(announcements).length === 0) {
        announcementsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No announcements found</td>
            </tr>
        `;
        return;
    }
    
    Object.keys(announcements).forEach(announcementId => {
        const announcement = announcements[announcementId];
        const row = document.createElement('tr');
        
        const isActive = currentAnnouncement && currentAnnouncement.id === announcementId;
        const statusText = isActive ? 'Active' : 'Inactive';
        const statusClass = isActive ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td>${announcementId}</td>
            <td class="announcement-text-cell">${announcement.text || ''}</td>
            <td>
                <span style="font-family: ${announcement.fontFamily || 'Arial'}; 
                            font-size: ${announcement.fontSize || '14'}px; 
                            font-weight: ${announcement.fontWeight || 'normal'}; 
                            color: ${announcement.textColor || '#000'};">
                    ${announcement.fontFamily || 'Arial'} ${announcement.fontSize || '14'}px ${announcement.fontWeight || 'normal'}
                </span>
            </td>
            <td>${new Date(announcement.createdAt).toLocaleDateString()}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="icon-button edit-announcement-btn" data-id="${announcementId}" title="Edit">
                    <i class="material-icons">edit</i>
                </button>
                <button class="icon-button activate-announcement-btn" data-id="${announcementId}" title="Activate">
                    <i class="material-icons">play_arrow</i>
                </button>
                <button class="icon-button delete-announcement-btn" data-id="${announcementId}" title="Delete">
                    <i class="material-icons">delete</i>
                </button>
            </td>
        `;
        
        announcementsTableBody.appendChild(row);
    });
    
    // 添加事件监听器
    document.querySelectorAll('.edit-announcement-btn').forEach(btn => {
        btn.addEventListener('click', () => editAnnouncement(btn.dataset.id));
    });
    
    document.querySelectorAll('.activate-announcement-btn').forEach(btn => {
        btn.addEventListener('click', () => activateAnnouncement(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-announcement-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteAnnouncement(btn.dataset.id));
    });
}

// 显示公告模态框
function showAnnouncementModal(announcementId = null) {
    const modal = announcementModal;
    const title = document.getElementById('announcementModalTitle');
    
    if (announcementId) {
        // 编辑模式
        title.innerHTML = '<i class="material-icons">edit</i> Edit Announcement';
        console.log('编辑模式 - 准备填充表单，公告ID:', announcementId);
        console.log('当前公告数据存储:', announcements);
        
        // 延迟填充表单，确保模态框先显示
        setTimeout(() => {
            populateAnnouncementForm(announcementId);
            // 填充完成后更新预览
            setTimeout(() => {
                updateAnnouncementPreview();
            }, 100);
        }, 100);
    } else {
        // 创建模式
        title.innerHTML = '<i class="material-icons">campaign</i> Create Announcement';
        resetAnnouncementForm();
        setTimeout(() => {
            updateAnnouncementPreview();
        }, 100);
    }
    
    showModal(modal);
}

// 填充公告表单
function populateAnnouncementForm(announcementId) {
    console.log('开始填充公告表单，ID:', announcementId);
    console.log('可用公告数据:', announcements);
    
    const announcement = announcements[announcementId];
    if (!announcement) {
        console.error('找不到公告数据，ID:', announcementId);
        alert('Error: Announcement data not found');
        return;
    }
    
    console.log('找到公告数据:', announcement);
    
    // 详细打印公告数据的每个字段
    console.log('公告详细字段:');
    console.log('- text:', announcement.text);
    console.log('- fontFamily:', announcement.fontFamily);
    console.log('- fontSize:', announcement.fontSize);
    console.log('- fontWeight:', announcement.fontWeight);
    console.log('- textColor:', announcement.textColor);
    console.log('- backgroundColor:', announcement.backgroundColor);
    console.log('- backgroundAnimation:', announcement.backgroundAnimation);
    console.log('- speed:', announcement.speed);
    
    // 填充表单字段
    const fields = {
        'announcementId': announcementId,
        'announcementText': announcement.text || '',
        'announcementFont': announcement.fontFamily || 'Poppins',
        'announcementSize': announcement.fontSize || '14',
        'announcementWeight': announcement.fontWeight || 'normal',
        'announcementColor': announcement.textColor || '#ffffff',
        'announcementColorText': announcement.textColor || '#ffffff',
        'announcementBackground': announcement.backgroundColor || '#2196F3',
        'announcementBackgroundText': announcement.backgroundColor || '#2196F3',
        'announcementSpeed': announcement.speed || 'normal',
        'announcementAnimation': announcement.backgroundAnimation || 'none'
    };
    
    console.log('准备设置的字段值:');
    
    // 逐个设置字段并记录
    Object.keys(fields).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            const oldValue = element.value;
            element.value = fields[fieldId];
            console.log(`设置字段 ${fieldId}: "${oldValue}" → "${fields[fieldId]}"`);
            
            // 验证设置是否成功
            if (element.value !== fields[fieldId]) {
                console.warn(`字段 ${fieldId} 设置失败! 期望: "${fields[fieldId]}", 实际: "${element.value}"`);
            }
        } else {
            console.error(`找不到表单元素:`, fieldId);
        }
    });
    
    updateCharCount();
    
    // 实时验证所有字段是否正确设置
    console.log('=== 实时验证所有字段 ===');
    const verificationResults = [];
    Object.keys(fields).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            const expected = fields[fieldId];
            const actual = element.value;
            const isCorrect = actual === expected;
            
            const fieldLabels = {
                'announcementText': 'Announcement Text',
                'announcementFont': 'Font Family', 
                'announcementSize': 'Font Size',
                'announcementWeight': 'Font Weight',
                'announcementColor': 'Text Color',
                'announcementBackground': 'Background Color',
                'announcementAnimation': 'Background Animation',
                'announcementSpeed': 'Scroll Speed'
            };
            
            const label = fieldLabels[fieldId] || fieldId;
            const status = isCorrect ? '✅' : '❌';
            console.log(`${status} ${label}: "${actual}"`);
            
            verificationResults.push({
                field: label,
                correct: isCorrect,
                expected: expected,
                actual: actual
            });
        }
    });
    
    const allCorrect = verificationResults.every(r => r.correct);
    console.log(`=== 字段验证结果: ${allCorrect ? '✅ All correct' : '❌ Some issues'} ===`);
    
    if (!allCorrect) {
        console.warn('以下字段设置不正确:');
        verificationResults.filter(r => !r.correct).forEach(r => {
            console.warn(`- ${r.field}: 期望 "${r.expected}", 实际 "${r.actual}"`);
        });
    }
    
    console.log('公告表单填充完成');
}

// 重置公告表单
function resetAnnouncementForm() {
    document.getElementById('announcementId').value = '';
    document.getElementById('announcementText').value = '';
    document.getElementById('announcementFont').value = 'Poppins';
    document.getElementById('announcementSize').value = '14';
    document.getElementById('announcementWeight').value = 'normal';
    document.getElementById('announcementColor').value = '#ffffff';
    document.getElementById('announcementColorText').value = '#ffffff';
    document.getElementById('announcementBackground').value = '#2196F3';
    document.getElementById('announcementBackgroundText').value = '#2196F3';
    document.getElementById('announcementSpeed').value = 'normal';
    document.getElementById('announcementAnimation').value = 'none';
    
    updateCharCount();
}

// 更新字符计数
function updateCharCount() {
    if (!announcementText || !charCount) return;
    
    const count = announcementText.value.length;
    charCount.textContent = count;
    
    if (count > 180) {
        charCount.style.color = '#f44336';
    } else if (count > 150) {
        charCount.style.color = '#ff9800';
    } else {
        charCount.style.color = '#666';
    }
}

// 同步颜色输入框
function syncColorInputs(event) {
    if (event.target.id === 'announcementColor') {
        announcementColorText.value = event.target.value.toUpperCase();
    } else if (event.target.id === 'announcementColorText') {
        if (/^#[0-9A-F]{6}$/i.test(event.target.value)) {
            announcementColor.value = event.target.value;
        }
    }
}

// 同步背景颜色输入框
function syncBackgroundInputs(event) {
    if (event.target.id === 'announcementBackground') {
        announcementBackgroundText.value = event.target.value.toUpperCase();
    } else if (event.target.id === 'announcementBackgroundText') {
        if (/^#[0-9A-F]{6}$/i.test(event.target.value)) {
            announcementBackground.value = event.target.value;
        }
    }
}

// 更新公告预览
function updateAnnouncementPreview() {
    if (!announcementScrollingPreview) return;
    
    const text = document.getElementById('announcementText').value || 'Your announcement will appear here...';
    const fontFamily = document.getElementById('announcementFont').value;
    const fontSize = document.getElementById('announcementSize').value;
    const fontWeight = document.getElementById('announcementWeight').value;
    const textColor = document.getElementById('announcementColor').value;
    const backgroundColor = document.getElementById('announcementBackground').value;
    const speed = document.getElementById('announcementSpeed').value;
    const backgroundAnimation = document.getElementById('announcementAnimation').value;
    
    announcementScrollingPreview.textContent = text;
    announcementScrollingPreview.style.fontFamily = fontFamily;
    announcementScrollingPreview.style.fontSize = fontSize + 'px';
    announcementScrollingPreview.style.fontWeight = fontWeight;
    announcementScrollingPreview.style.color = textColor;
    
    // 应用背景颜色或动画
    const previewContainer = document.getElementById('announcementPreviewContainer');
    if (previewContainer) {
        // 移除所有动画类
        previewContainer.classList.remove('gradient-wave', 'alert-pulse', 'neon-glow', 'rainbow-shift', 
                                         'emergency-flash', 'ocean-wave', 'sunset-glow', 'matrix-green');
        
        // 清除容器的内联样式
        previewContainer.style.background = '';
        previewContainer.style.animation = '';
        
        if (backgroundAnimation && backgroundAnimation !== 'none') {
            // 添加动画类到容器
            previewContainer.classList.add(backgroundAnimation);
            // 将滚动文本背景设为透明，让容器背景显示
            announcementScrollingPreview.style.backgroundColor = 'transparent';
            console.log('预览应用动画:', backgroundAnimation);
        } else {
            // 使用纯色背景
            previewContainer.style.background = '#f5f5f5';
            announcementScrollingPreview.style.backgroundColor = backgroundColor;
            console.log('预览应用纯色背景:', backgroundColor);
        }
    }
    
    // 移除旧的速度类
    announcementScrollingPreview.classList.remove('slow', 'normal', 'fast');
    announcementScrollingPreview.classList.add(speed);
}

// 处理公告表单提交
function handleAnnouncementSubmit(event) {
    event.preventDefault();
    
    const announcementId = document.getElementById('announcementId').value;
    const text = document.getElementById('announcementText').value.trim();
    
    if (!text) {
        alert('Please enter announcement text');
        return;
    }
    
    if (text.length > 200) {
        alert('Announcement text cannot exceed 200 characters');
        return;
    }
    
    const announcementData = {
        text: text,
        fontFamily: document.getElementById('announcementFont').value,
        fontSize: document.getElementById('announcementSize').value,
        fontWeight: document.getElementById('announcementWeight').value,
        textColor: document.getElementById('announcementColor').value,
        backgroundColor: document.getElementById('announcementBackground').value,
        backgroundAnimation: document.getElementById('announcementAnimation').value,
        speed: document.getElementById('announcementSpeed').value,
        updatedAt: getCurrentDateTime()
    };
    
    if (announcementId) {
        // 更新现有公告
        announcementData.createdAt = announcements[announcementId].createdAt;
        
        database.ref(`announcements/${announcementId}`).update(announcementData)
            .then(() => {
                hideModal(announcementModal);
                loadAnnouncements();
                alert('Announcement updated successfully');
            })
            .catch(error => {
                console.error('更新公告失败:', error);
                alert('Failed to update announcement');
            });
    } else {
        // 创建新公告
        const newAnnouncementId = 'ann_' + Date.now();
        announcementData.createdAt = getCurrentDateTime();
        
        database.ref(`announcements/${newAnnouncementId}`).set(announcementData)
            .then(() => {
                hideModal(announcementModal);
                loadAnnouncements();
                alert('Announcement created successfully');
            })
            .catch(error => {
                console.error('创建公告失败:', error);
                alert('Failed to create announcement');
            });
    }
}

// 编辑公告
function editAnnouncement(announcementId) {
    console.log('开始编辑公告，ID:', announcementId);
    console.log('当前公告数据:', announcements);
    
    if (!announcements || Object.keys(announcements).length === 0) {
        console.warn('公告数据为空，重新加载数据...');
        loadAnnouncements();
        
        // 等待数据加载完成后再尝试编辑
        setTimeout(() => {
            if (announcements[announcementId]) {
                editAnnouncement(announcementId);
            } else {
                alert('Error: Unable to load announcement data. Please refresh the page.');
            }
        }, 1000);
        return;
    }
    
    if (!announcements[announcementId]) {
        console.error('无法编辑：公告不存在，ID:', announcementId);
        console.error('可用的公告ID:', Object.keys(announcements));
        alert('Error: Announcement not found! Available IDs: ' + Object.keys(announcements).join(', '));
        return;
    }
    
    console.log('找到公告数据，准备编辑:', announcements[announcementId]);
    showAnnouncementModal(announcementId);
}

// 激活公告
function activateAnnouncement(announcementId) {
    if (!announcements[announcementId]) {
        alert('Announcement not found');
        return;
    }
    
    const announcementData = {
        id: announcementId,
        ...announcements[announcementId],
        enabled: true
    };
    
    database.ref('system/current_announcement').set(announcementData)
        .then(() => {
            currentAnnouncement = announcementData;
            updateAnnouncementStatus();
            updateCurrentAnnouncementPreview();
            displayAnnouncements();
            alert('Announcement activated successfully');
        })
        .catch(error => {
            console.error('激活公告失败:', error);
            alert('Failed to activate announcement');
        });
}

// 删除公告
function deleteAnnouncement(announcementId) {
    if (!confirm('Are you sure you want to delete this announcement?')) {
        return;
    }
    
    database.ref(`announcements/${announcementId}`).remove()
        .then(() => {
            // 如果删除的是当前活跃的公告，则清除当前公告
            if (currentAnnouncement && currentAnnouncement.id === announcementId) {
                database.ref('system/current_announcement').remove();
                currentAnnouncement = null;
                updateAnnouncementStatus();
                updateCurrentAnnouncementPreview();
            }
            
            loadAnnouncements();
            alert('Announcement deleted successfully');
        })
        .catch(error => {
            console.error('删除公告失败:', error);
            alert('Failed to delete announcement');
        });
}

// 切换全局公告开关
function toggleAnnouncementGlobal() {
    if (!currentAnnouncement) {
        announcementGlobalToggle.checked = false;
        alert('Please activate an announcement first');
        return;
    }
    
    const enabled = announcementGlobalToggle.checked;
    
    database.ref('system/current_announcement/enabled').set(enabled)
        .then(() => {
            currentAnnouncement.enabled = enabled;
            updateAnnouncementStatus();
            console.log(`公告全局开关已${enabled ? 'On' : 'Off'}`);
        })
        .catch(error => {
            console.error('切换公告状态失败:', error);
            // 恢复开关状态
            announcementGlobalToggle.checked = !enabled;
            alert('Failed to toggle announcement status');
        });
}

// 更新公告状态显示
function updateAnnouncementStatus() {
    if (!announcementStatus || !announcementGlobalToggle) return;
    
    if (currentAnnouncement && currentAnnouncement.enabled) {
        announcementStatus.textContent = 'Enabled';
        announcementStatus.style.color = '#4CAF50';
        announcementGlobalToggle.checked = true;
    } else {
        announcementStatus.textContent = 'Disabled';
        announcementStatus.style.color = '#f44336';
        announcementGlobalToggle.checked = false;
    }
}

// 更新当前公告预览
function updateCurrentAnnouncementPreview() {
    if (!previewContent) return;
    
    if (currentAnnouncement && currentAnnouncement.enabled) {
        previewContent.innerHTML = `
            <div class="scrolling-text ${currentAnnouncement.speed || 'normal'}" 
                 style="font-family: ${currentAnnouncement.fontFamily || 'Poppins'}; 
                        font-size: ${currentAnnouncement.fontSize || '14'}px; 
                        font-weight: ${currentAnnouncement.fontWeight || 'normal'}; 
                        color: ${currentAnnouncement.textColor || '#ffffff'}; 
                        background-color: ${currentAnnouncement.backgroundColor || '#2196F3'};">
                ${currentAnnouncement.text || ''}
            </div>
        `;
    } else {
        previewContent.innerHTML = '<span class="no-announcement">No active announcement</span>';
    }
}

// 调试函数 - 手动测试公告编辑功能
function debugAnnouncementEdit() {
    console.log('=== 调试公告编辑功能 ===');
    console.log('1. 当前公告数据:', announcements);
    console.log('2. 公告数量:', Object.keys(announcements).length);
    
    if (Object.keys(announcements).length > 0) {
        const firstAnnouncementId = Object.keys(announcements)[0];
        console.log('3. 第一个公告ID:', firstAnnouncementId);
        console.log('4. 第一个公告数据:', announcements[firstAnnouncementId]);
        
        console.log('5. 尝试编辑第一个公告...');
        editAnnouncement(firstAnnouncementId);
    } else {
        console.log('3. 没有公告数据，尝试重新加载...');
        loadAnnouncements();
    }
}

// 完整字段验证测试
function testAllAnnouncementFields() {
    console.log('=== 完整字段验证测试 ===');
    
    const testData = {
        text: 'Test announcement message',
        fontFamily: 'Georgia',
        fontSize: '18',
        fontWeight: 'bold',
        textColor: '#ff0000',
        backgroundColor: '#00ff00',
        backgroundAnimation: 'rainbow-shift',
        speed: 'fast'
    };
    
    console.log('测试数据:', testData);
    
    // 创建测试公告
    const testId = 'test_' + Date.now();
    announcements[testId] = {
        ...testData,
        createdAt: getCurrentDateTime(),
        updatedAt: getCurrentDateTime()
    };
    
    console.log('创建测试公告ID:', testId);
    console.log('测试公告数据:', announcements[testId]);
    
    // 测试编辑功能
    setTimeout(() => {
        console.log('开始测试编辑功能...');
        editAnnouncement(testId);
        
        // 验证表单字段
        setTimeout(() => {
            console.log('=== 验证表单字段 ===');
            const fieldTests = [
                { field: 'announcementText', expected: testData.text, label: 'Announcement Text' },
                { field: 'announcementFont', expected: testData.fontFamily, label: 'Font Family' },
                { field: 'announcementSize', expected: testData.fontSize, label: 'Font Size' },
                { field: 'announcementWeight', expected: testData.fontWeight, label: 'Font Weight' },
                { field: 'announcementColor', expected: testData.textColor, label: 'Text Color' },
                { field: 'announcementBackground', expected: testData.backgroundColor, label: 'Background Color' },
                { field: 'announcementAnimation', expected: testData.backgroundAnimation, label: 'Background Animation' },
                { field: 'announcementSpeed', expected: testData.speed, label: 'Scroll Speed' }
            ];
            
            let allPassed = true;
            fieldTests.forEach(test => {
                const element = document.getElementById(test.field);
                if (element) {
                    const actual = element.value;
                    const passed = actual === test.expected;
                    console.log(`${test.label}: ${passed ? '✅' : '❌'} 期望: "${test.expected}", 实际: "${actual}"`);
                    if (!passed) allPassed = false;
                } else {
                    console.log(`${test.label}: ❌ 元素未找到`);
                    allPassed = false;
                }
            });
            
            console.log(`=== 测试结果: ${allPassed ? '✅ All passed' : '❌ Some failed'} ===`);
            
            // 清理测试数据
            delete announcements[testId];
        }, 500);
    }, 100);
}

// 全局暴露调试函数
window.debugAnnouncementEdit = debugAnnouncementEdit;
window.testAllAnnouncementFields = testAllAnnouncementFields;

// ====== 维护模式管理功能 ======

// 检查当前维护状态
function checkMaintenanceStatus() {
    return database.ref('system/maintenance').once('value').then(snapshot => {
        return snapshot.val() || { enabled: false };
    });
}

// 切换维护模式
function toggleMaintenanceMode() {
    // 权限校验：仅超级管理员 (sadmin) 可使用
    if (!document.body.classList.contains('is-sadmin')) {
        alert("You do not have permission to change System Maintenance (Super Admin only)");
        return;
    }

    checkMaintenanceStatus().then(currentStatus => {
        const newStatus = !currentStatus.enabled;
        const updateData = {
            enabled: newStatus,
            lastUpdated: firebase.database.ServerValue.TIMESTAMP,
            updatedBy: firebase.auth().currentUser.email
        };
        
        // 更新Firebase中的维护状态
        database.ref('system/maintenance').set(updateData)
            .then(() => {
                const statusText = newStatus ? 'On' : 'Off';
                alert(`维护模式已${statusText}`);
                updateMaintenanceButtonDisplay(newStatus);
                console.log(`维护模式已${statusText}`);
            })
            .catch(error => {
                console.error('更新维护状态失败:', error);
                alert('更新维护状态失败，请重试');
            });
    }).catch(error => {
        console.error('获取维护状态失败:', error);
        alert('获取维护状态失败，请重试');
    });
}

// 更新维护按钮显示状态
function updateMaintenanceButtonDisplay(isEnabled) {
    const maintenanceToggle = document.getElementById('maintenanceToggle');
    if (maintenanceToggle) {
        const icon = maintenanceToggle.querySelector('.material-icons');
        const text = maintenanceToggle.childNodes[maintenanceToggle.childNodes.length - 1];
        
        if (isEnabled) {
            maintenanceToggle.style.backgroundColor = '#ff5722';
            maintenanceToggle.style.color = 'white';
            icon.textContent = 'build_circle';
            text.textContent = ' Maintenance ON';
        } else {
            maintenanceToggle.style.backgroundColor = '';
            maintenanceToggle.style.color = '';
            icon.textContent = 'build';
            text.textContent = ' System Maintenance';
        }
    }
}

// 初始化维护状态显示
function initializeMaintenanceStatus() {
    checkMaintenanceStatus().then(status => {
        updateMaintenanceButtonDisplay(status.enabled);
    }).catch(error => {
        console.error('初始化维护状态失败:', error);
    });
}

// ====== Stock History 功能 ======

// 加载 Stock History 视图
function loadStockHistoryView() {
    if (!stockHistoryTableBody || !stockHistoryDatePicker || !stockHistoryStoreFilter) {
        console.error('Stock History DOM elements not found');
        return;
    }
    
    // 显示加载状态
    stockHistoryTableBody.innerHTML = `
        <tr>
            <td colspan="10" style="text-align: center; padding: 20px;">
                <div class="loading"><i class="material-icons">hourglass_empty</i> Loading stock history...</div>
            </td>
        </tr>
    `;
    
    // 获取选定的日期，如果没有选择则使用今天
    const selectedDate = stockHistoryDatePicker.value || getCurrentDate();
    const selectedStoreId = stockHistoryStoreFilter.value;
    
    // 更新标题
    if (stockHistoryTitle) {
        const dateObj = new Date(selectedDate);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        if (selectedStoreId === 'all') {
            stockHistoryTitle.textContent = `Stock History - ${formattedDate} (All Stores)`;
        } else {
            const storeName = stores[selectedStoreId] ? stores[selectedStoreId].name : selectedStoreId;
            stockHistoryTitle.textContent = `Stock History - ${formattedDate} (${storeName})`;
        }
    }
    
    // 如果选择了所有商店，需要加载所有商店的数据
    if (selectedStoreId === 'all') {
        loadAllStoresStockHistory(selectedDate);
    } else {
        loadSingleStoreStockHistory(selectedStoreId, selectedDate);
    }
}

// 加载单个商店的库存历史
function loadSingleStoreStockHistory(storeId, selectedDate) {
    if (!storeId) {
        stockHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 20px; color: #e74c3c;">
                    <i class="material-icons">error</i> Store ID not found
                </td>
            </tr>
        `;
        return;
    }
    
    // 加载所有产品的库存历史
    database.ref(`stock_history/${storeId}`).once('value')
        .then(snapshot => {
            const allStockHistory = snapshot.val() || {};
            const selectedDateRecords = [];
            
            // 遍历所有产品的历史记录
            Object.keys(allStockHistory).forEach(productId => {
                const productHistory = allStockHistory[productId];
                if (!productHistory) return;
                
                // 遍历该产品的所有历史记录
                Object.keys(productHistory).forEach(historyId => {
                    const record = productHistory[historyId];
                    if (!record || !record.timestamp) return;
                    
                    // 提取日期部分（格式：YYYY-MM-DD HH:MM:SS）
                    const recordDate = record.timestamp.split(' ')[0];
                    
                    // 显示指定日期的所有记录（包括进货和消耗）
                    if (recordDate === selectedDate) {
                        selectedDateRecords.push({
                            productId,
                            storeId,
                            ...record
                        });
                    }
                });
            });
            
            // 按时间排序，最新的在前
            selectedDateRecords.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            // 更新统计信息
            updateStockHistorySummary(selectedDateRecords);
            
            // 显示记录
            displayStockHistoryRecords(selectedDateRecords);
        })
        .catch(error => {
            console.error('Failed to load stock history:', error);
            stockHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 20px; color: #e74c3c;">
                        <i class="material-icons">error</i> Failed to load stock history data
                    </td>
                </tr>
            `;
        });
}

// 加载所有商店的库存历史
function loadAllStoresStockHistory(selectedDate) {
    // 获取所有商店的ID
    const storeIds = Object.keys(stores);
    
    if (storeIds.length === 0) {
        stockHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 20px;">
                    <div class="no-data"><i class="material-icons">info</i> No stores found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // 并行加载所有商店的数据
    const promises = storeIds.map(storeId => {
        return database.ref(`stock_history/${storeId}`).once('value')
            .then(snapshot => {
                const allStockHistory = snapshot.val() || {};
                const storeRecords = [];
                
                // 遍历所有产品的历史记录
                Object.keys(allStockHistory).forEach(productId => {
                    const productHistory = allStockHistory[productId];
                    if (!productHistory) return;
                    
                    // 遍历该产品的所有历史记录
                    Object.keys(productHistory).forEach(historyId => {
                        const record = productHistory[historyId];
                        if (!record || !record.timestamp) return;
                        
                        // 提取日期部分（格式：YYYY-MM-DD HH:MM:SS）
                        const recordDate = record.timestamp.split(' ')[0];
                        
                        // 显示指定日期的所有记录（包括进货和消耗）
                        if (recordDate === selectedDate) {
                            storeRecords.push({
                                productId,
                                storeId,
                                ...record
                            });
                        }
                    });
                });
                
                return storeRecords;
            });
    });
    
    Promise.all(promises)
        .then(allStoreRecords => {
            // 合并所有商店的记录
            const allRecords = allStoreRecords.flat();
            
            // 按时间排序，最新的在前
            allRecords.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            // 更新统计信息
            updateStockHistorySummary(allRecords);
            
            // 显示记录
            displayStockHistoryRecords(allRecords);
        })
        .catch(error => {
            console.error('Failed to load stock history:', error);
            stockHistoryTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 20px; color: #e74c3c;">
                        <i class="material-icons">error</i> Failed to load stock history data
                    </td>
                </tr>
            `;
        });
}

// 显示库存历史记录
function displayStockHistoryRecords(records) {
    if (!stockHistoryTableBody) return;
    
    // 检查是否选择了所有商店
    const selectedStoreId = stockHistoryStoreFilter ? stockHistoryStoreFilter.value : 'all';
    const showStoreColumn = selectedStoreId === 'all';
    
    // 显示/隐藏商店列表头
    const storeColumnHeader = document.getElementById('storeColumnHeader');
    if (storeColumnHeader) {
        storeColumnHeader.style.display = showStoreColumn ? '' : 'none';
    }
    
    if (records.length === 0) {
        const colspan = showStoreColumn ? 11 : 10;
        stockHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="${colspan}" style="text-align: center; padding: 20px;">
                    <div class="no-data"><i class="material-icons">info</i> No stock history found for this date</div>
                </td>
            </tr>
        `;
        return;
    }
    
    // 收集所有需要获取的产品信息（去重）
    const productKeys = new Set();
    records.forEach(record => {
        if (record.storeId && record.productId) {
            productKeys.add(`${record.storeId}_${record.productId}`);
        }
    });
    
    // 并行获取所有产品信息
    const productPromises = Array.from(productKeys).map(key => {
        const [storeId, productId] = key.split('_');
        return database.ref(`store_products/${storeId}/${productId}`).once('value')
            .then(snapshot => {
                const product = snapshot.val();
                return {
                    key: key,
                    product: product || null
                };
            })
            .catch(error => {
                console.error(`Failed to load product ${productId} from store ${storeId}:`, error);
                return {
                    key: key,
                    product: null
                };
            });
    });
    
    // 等待所有产品信息加载完成后再显示
    Promise.all(productPromises)
        .then(productResults => {
            // 创建产品信息映射
            const productMap = {};
            productResults.forEach(({ key, product }) => {
                productMap[key] = product;
            });
            
            // 生成表格内容
            let tableHTML = '';
            records.forEach(record => {
                // 从产品映射中获取产品信息
                const productKey = `${record.storeId}_${record.productId}`;
                const product = productMap[productKey] || {};
                const productName = product.name || record.productId;
                const category = product.category || '-';
                
                // 获取商店名称
                const storeName = stores[record.storeId] ? stores[record.storeId].name : record.storeId;
                
                // 格式化时间（只显示时间部分）
                const timePart = record.timestamp.split(' ')[1] || record.timestamp;
                
                // 根据 operation 判断是增加还是减少库存
                const operation = record.operation || 'add';
                const quantity = record.quantity || 0;
                let displayQuantity;
                let quantityColor;
                
                if (operation === 'subtract') {
                    // 减少库存，显示负数，红色
                    displayQuantity = `-${quantity}`;
                    quantityColor = '#f44336'; // 红色
                } else {
                    // 增加库存，显示正数，绿色
                    displayQuantity = `+${quantity}`;
                    quantityColor = '#4caf50'; // 绿色
                }
                
                // 根据是否显示商店列来构建表格行
                if (showStoreColumn) {
                    tableHTML += `
                        <tr>
                            <td>${timePart}</td>
                            <td>${storeName}</td>
                            <td>${record.productId}</td>
                            <td>${productName}</td>
                            <td>${category}</td>
                            <td style="text-align: center; color: ${quantityColor}; font-weight: 600;">${displayQuantity}</td>
                            <td style="text-align: center;">${record.previous_stock || 0}</td>
                            <td style="text-align: center; font-weight: 600;">${record.new_stock || 0}</td>
                            <td>${record.reason || '-'}</td>
                            <td>${record.cashier || '-'}</td>
                            <td>${record.notes || '-'}</td>
                        </tr>
                    `;
                } else {
                    tableHTML += `
                        <tr>
                            <td>${timePart}</td>
                            <td>${record.productId}</td>
                            <td>${productName}</td>
                            <td>${category}</td>
                            <td style="text-align: center; color: ${quantityColor}; font-weight: 600;">${displayQuantity}</td>
                            <td style="text-align: center;">${record.previous_stock || 0}</td>
                            <td style="text-align: center; font-weight: 600;">${record.new_stock || 0}</td>
                            <td>${record.reason || '-'}</td>
                            <td>${record.cashier || '-'}</td>
                            <td>${record.notes || '-'}</td>
                        </tr>
                    `;
                }
            });
            
            stockHistoryTableBody.innerHTML = tableHTML;
        })
        .catch(error => {
            console.error('Failed to load product information:', error);
            // 即使产品信息加载失败，也显示记录（使用 productId 作为名称）
            let tableHTML = '';
            records.forEach(record => {
                const storeName = stores[record.storeId] ? stores[record.storeId].name : record.storeId;
                const timePart = record.timestamp.split(' ')[1] || record.timestamp;
                const operation = record.operation || 'add';
                const quantity = record.quantity || 0;
                let displayQuantity;
                let quantityColor;
                
                if (operation === 'subtract') {
                    displayQuantity = `-${quantity}`;
                    quantityColor = '#f44336';
                } else {
                    displayQuantity = `+${quantity}`;
                    quantityColor = '#4caf50';
                }
                
                if (showStoreColumn) {
                    tableHTML += `
                        <tr>
                            <td>${timePart}</td>
                            <td>${storeName}</td>
                            <td>${record.productId}</td>
                            <td>${record.productId}</td>
                            <td>-</td>
                            <td style="text-align: center; color: ${quantityColor}; font-weight: 600;">${displayQuantity}</td>
                            <td style="text-align: center;">${record.previous_stock || 0}</td>
                            <td style="text-align: center; font-weight: 600;">${record.new_stock || 0}</td>
                            <td>${record.reason || '-'}</td>
                            <td>${record.cashier || '-'}</td>
                            <td>${record.notes || '-'}</td>
                        </tr>
                    `;
                } else {
                    tableHTML += `
                        <tr>
                            <td>${timePart}</td>
                            <td>${record.productId}</td>
                            <td>${record.productId}</td>
                            <td>-</td>
                            <td style="text-align: center; color: ${quantityColor}; font-weight: 600;">${displayQuantity}</td>
                            <td style="text-align: center;">${record.previous_stock || 0}</td>
                            <td style="text-align: center; font-weight: 600;">${record.new_stock || 0}</td>
                            <td>${record.reason || '-'}</td>
                            <td>${record.cashier || '-'}</td>
                            <td>${record.notes || '-'}</td>
                        </tr>
                    `;
                }
            });
            stockHistoryTableBody.innerHTML = tableHTML;
        });
}

// 更新 Stock History 统计信息
function updateStockHistorySummary(records) {
    if (!records || records.length === 0) {
        if (totalItemsReceived) totalItemsReceived.textContent = '0';
        if (totalQuantityReceived) totalQuantityReceived.textContent = '0';
        if (lastReceiptTime) lastReceiptTime.textContent = '-';
        return;
    }
    
    // 只统计增加库存的记录（进货记录）
    const receiptRecords = records.filter(r => {
        const operation = r.operation || 'add';
        return operation !== 'subtract';
    });
    
    // 计算不同产品的数量（只统计进货记录）
    const uniqueProducts = new Set(receiptRecords.map(r => r.productId));
    if (totalItemsReceived) {
        totalItemsReceived.textContent = uniqueProducts.size;
    }
    
    // 计算总数量（只统计进货记录）
    const totalQuantity = receiptRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
    if (totalQuantityReceived) {
        totalQuantityReceived.textContent = totalQuantity;
    }
    
    // 获取最后进货时间（只统计进货记录）
    if (receiptRecords.length > 0 && lastReceiptTime) {
        const lastRecord = receiptRecords[0]; // 已经按时间排序，第一个就是最新的
        const timePart = lastRecord.timestamp.split(' ')[1] || lastRecord.timestamp;
        lastReceiptTime.textContent = timePart;
    } else if (lastReceiptTime) {
        lastReceiptTime.textContent = '-';
    }
}

// =========================================================================
// Product & Sales Migration Module (English UI, Store + Product rows & Rollback Audit)
// =========================================================================

let cachedCatalogProductsMap = {};
let cachedCatalogList = [];
let catalogIdIndex = new Set();      // lower-cased catalog product IDs (fast lookup)
let catalogNameIndex = new Set();    // normalized catalog product names (fast lookup)
let catalogByIdMap = new Map();      // lower-cased catalog ID -> catalog entry
let catalogByNameMap = new Map();    // normalized catalog name -> catalog entry
let cachedStoreProductList = [];     // every store product (all stores) + inCatalog flag
let showAllSourceProducts = false;   // false = only list products missing from the Master Catalog
let migrationPairs = [];             // [{ uid, storeId, productId, productName, price, promoPrice, stock, searchText }]
let pairUidSeq = 0;
let lastMigrationScanResult = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initProductMigrationModule();
});

function initProductMigrationModule() {
    const openBtn = document.getElementById('openMigrationModalBtn');
    const closeBtn = document.getElementById('closeMigrationModalBtn');
    const modal = document.getElementById('productMigrationModal');
    const scanBtn = document.getElementById('migrationScanBtn');
    const execBtn = document.getElementById('migrationExecuteBtn');
    const toggleHistoryBtn = document.getElementById('toggleMigrationHistoryBtn');
    const addPairBtn = document.getElementById('migrationAddPairBtn');
    const cancelBtn = document.getElementById('migrationCancelBtn');

    if (openBtn) {
        openBtn.addEventListener('click', () => openProductMigrationModal());
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => hideModal(modal));
    }

    // Bottom "Close" button inside the sticky action bar
    if (cancelBtn && modal) {
        cancelBtn.addEventListener('click', () => hideModal(modal));
    }

    // Toggle Audit Logs & Rollback Panel
    if (toggleHistoryBtn) {
        toggleHistoryBtn.addEventListener('click', () => {
            const panel = document.getElementById('migrationHistoryPanel');
            if (!panel) return;
            const isVisible = panel.style.display !== 'none';
            if (isVisible) {
                panel.style.display = 'none';
            } else {
                panel.style.display = 'block';
                loadMigrationAuditLogs();
            }
        });
    }

    // "+ Add Store / Product" row
    if (addPairBtn) {
        addPairBtn.addEventListener('click', () => {
            migrationPairs.push(createEmptyPair(getNextUnusedStoreId()));
            renderMigrationPairRows();
            resetMigrationScanState();
        });
    }

    // Toggle: include products that already exist in the Master Catalog
    const showAllToggle = document.getElementById('migrationShowAllSourceProducts');
    if (showAllToggle) {
        showAllToggle.addEventListener('change', () => {
            showAllSourceProducts = showAllToggle.checked;
            updateSourceCatalogSummary();
            document.querySelectorAll('.migration-pair-row').forEach(row => {
                const results = row.querySelector('.migration-pair-results');
                if (!results || results.style.display !== 'block') return;
                const pair = migrationPairs[Number(row.dataset.idx)];
                const input = row.querySelector('.migration-pair-search');
                if (pair && input) renderPairDropdown(row, pair, input.value.trim());
            });
        });
    }

    // Setup searchable input for the target Master Catalog
    setupSearchableCatalogInput();

    // Reset scan state whenever key inputs change
    ['migrationNewProductId', 'migrationNewProductName', 'migrationMatchMode'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', resetMigrationScanState);
    });

    if (scanBtn) scanBtn.addEventListener('click', handleProductMigrationScan);
    if (execBtn) execBtn.addEventListener('click', handleProductMigrationExecute);

    // Global click listener to close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.migration-pair-row').forEach(row => {
            const results = row.querySelector('.migration-pair-results');
            if (!results || results.style.display !== 'block') return;
            const wrap = row.querySelector('.migration-pair-product');
            if (wrap && !wrap.contains(e.target)) results.style.display = 'none';
        });

        const catWrap = document.querySelector('#migrationCatalogSearch')?.closest('.migration-search-wrap');
        const catResults = document.getElementById('migrationCatalogResults');
        if (catWrap && !catWrap.contains(e.target) && catResults) {
            catResults.style.display = 'none';
        }
    });
}

// Open modal with optional pre-selected product
function openProductMigrationModal(preSelectedProductId = null) {
    const modal = document.getElementById('productMigrationModal');
    if (!modal) return;

    resetMigrationScanState();
    migrationPairs = [];

    // Hide audit panel by default
    const historyPanel = document.getElementById('migrationHistoryPanel');
    if (historyPanel) historyPanel.style.display = 'none';

    showModal(modal);

    // Load the Master Catalog FIRST, so the product pickers can exclude
    // products that already exist in it.
    loadMigrationCatalogProducts().then(() => {
        buildStoreProductCache();

        if (preSelectedProductId && products[preSelectedProductId]) {
            const p = products[preSelectedProductId];
            const actualId = p.original_id || preSelectedProductId;
            const hasPromo = p.promotionEnabled && p.promotionPrice !== null && p.promotionPrice !== undefined;
            migrationPairs = [{
                uid: ++pairUidSeq,
                storeId: p.store_id,
                productId: actualId,
                productName: p.name || '',
                price: Number(p.price) || 0,
                promoPrice: hasPromo ? Number(p.promotionPrice) : null,
                stock: p.stock !== undefined ? p.stock : (p.quantity || 0),
                catalogStatus: (getCatalogMatchInfo(actualId, p.name, preSelectedProductId, p.catalog_id) || {}).status || '',
                catalogName: (getCatalogMatchInfo(actualId, p.name, preSelectedProductId, p.catalog_id).catalog || {}).name || '',
                searchText: `[${actualId}] ${p.name || ''}`
            }];
        } else {
            migrationPairs = [createEmptyPair(getDefaultStoreId())];
        }

        renderMigrationPairRows();
    });
}

// -------------------------------------------------------------------------
// Store + Product row helpers
// -------------------------------------------------------------------------

function getDefaultStoreId() {
    const filterVal = document.getElementById('productStoreFilter')?.value;
    if (filterVal && filterVal !== 'all' && stores && stores[filterVal]) return filterVal;
    return Object.keys(stores || {})[0] || '';
}

// When adding a row, prefer a store that is not used yet
function getNextUnusedStoreId() {
    const used = new Set(migrationPairs.map(p => p.storeId).filter(Boolean));
    const free = Object.keys(stores || {}).find(id => !used.has(id));
    return free || getDefaultStoreId();
}

function createEmptyPair(storeId) {
    return {
        uid: ++pairUidSeq,
        storeId: storeId || '',
        productId: '',
        productName: '',
        price: null,
        promoPrice: null,
        stock: null,
        catalogStatus: '',
        catalogName: '',
        searchText: ''
    };
}

// Build the flat list of every store product (all stores) with its catalog status
function buildStoreProductCache() {
    cachedStoreProductList = [];

    Object.keys(products || {}).forEach(pId => {
        const prod = products[pId];
        if (!prod) return;

        const actualId = prod.original_id || pId;
        const basePrice = Number(prod.price);
        const hasPromo = prod.promotionEnabled && prod.promotionPrice !== null && prod.promotionPrice !== undefined;
        const matchInfo = getCatalogMatchInfo(actualId, prod.name, pId, prod.catalog_id);

        cachedStoreProductList.push({
            key: pId,
            id: actualId,
            name: prod.name || '',
            category: prod.category || '',
            price: isNaN(basePrice) ? 0 : basePrice,
            promoPrice: hasPromo ? Number(prod.promotionPrice) : null,
            stock: prod.stock !== undefined ? prod.stock : (prod.quantity || 0),
            storeId: prod.store_id,
            storeName: stores[prod.store_id]?.name || prod.store_id,
            catalogStatus: matchInfo.status,
            catalogId: matchInfo.catalog ? matchInfo.catalog.id : '',
            catalogName: matchInfo.catalog ? matchInfo.catalog.name : '',
            // Fully standardized (same ID and same name) - hidden by default
            inCatalog: matchInfo.status === 'matched'
        });
    });

    updateSourceCatalogSummary();
}

// Normalize a product name so loose comparisons ignore case, punctuation and spacing
function normalizeCatalogName(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

// Rebuild fast lookup indexes from the loaded Master Catalog
function buildCatalogIndex() {
    catalogIdIndex = new Set();
    catalogNameIndex = new Set();
    catalogByIdMap = new Map();
    catalogByNameMap = new Map();

    cachedCatalogList.forEach(item => {
        if (item.id) {
            const idKey = String(item.id).trim().toLowerCase();
            catalogIdIndex.add(idKey);
            if (!catalogByIdMap.has(idKey)) catalogByIdMap.set(idKey, item);
        }
        if (item.name) {
            const norm = normalizeCatalogName(item.name);
            if (norm) {
                catalogNameIndex.add(norm);
                if (!catalogByNameMap.has(norm)) catalogByNameMap.set(norm, item);
            }
        }
    });
}

// Is this store product already present in the Master Catalog?
// Matched by product ID (or store key) or by exact normalized name.
// Compare a store product with the Master Catalog.
// status:
//   'matched'    -> same ID AND same name (fully standardized, hidden by default)
//   'name_diff'  -> same ID as a catalog product, but a different name  (shown + flagged)
//   'id_diff'    -> same name as a catalog product, but a different ID  (shown + flagged, purple)
//   'missing'    -> not found in the catalog at all                     (shown)
function getCatalogMatchInfo(productId, productName, productKey, catalogId) {
    const ids = [productId, productKey, catalogId]
        .filter(v => v !== undefined && v !== null && v !== '')
        .map(v => String(v).trim().toLowerCase());

    const normName = normalizeCatalogName(productName);

    for (const idKey of ids) {
        const entry = catalogByIdMap.get(idKey);
        if (entry) {
            const sameName = !!normName && normalizeCatalogName(entry.name) === normName;
            return { status: sameName ? 'matched' : 'name_diff', catalog: entry };
        }
    }

    if (normName) {
        const entry = catalogByNameMap.get(normName);
        if (entry) return { status: 'id_diff', catalog: entry };
    }

    return { status: 'missing', catalog: null };
}

// Update the coverage summary line above the rows
function updateSourceCatalogSummary() {
    const el = document.getElementById('migrationSourceCatalogSummary');
    if (!el) return;

    const total = cachedStoreProductList.length;
    const needsWork = cachedStoreProductList.filter(i =>
        i.catalogStatus === 'missing' || i.catalogStatus === 'name_diff' || i.catalogStatus === 'id_diff'
    ).length;
    const nameDiff = cachedStoreProductList.filter(i => i.catalogStatus === 'name_diff').length;
    const idDiff = cachedStoreProductList.filter(i => i.catalogStatus === 'id_diff').length;

    if (catalogIdIndex.size === 0 && catalogNameIndex.size === 0) {
        el.textContent = `${total} store product(s) loaded - Master Catalog is empty or still loading.`;
        el.style.color = '#b45309';
        return;
    }

    el.style.color = '#9f1239';
    el.textContent = `${needsWork} of ${total} product(s) across all stores need standardization`
        + (nameDiff > 0 ? ` · ${nameDiff} with the same ID but a different name` : '')
        + (idDiff > 0 ? ` · ${idDiff} with the same name but a different ID` : '')
        + (showAllSourceProducts ? ' (showing all)' : '');
}

function updateMigrationPairCount() {
    const el = document.getElementById('migrationPairCount');
    if (!el) return;
    const ready = migrationPairs.filter(p => p.productId || (p.searchText || '').trim()).length;
    el.textContent = `${ready} of ${migrationPairs.length} row(s) ready`;
    el.style.background = ready > 0 ? '#dcfce7' : '#ffe4e6';
    el.style.color = ready > 0 ? '#15803d' : '#9f1239';
}

// Inline result banner inside the modal (replaces blocking popups)
function showMigrationResultBanner(type, title, bodyHtml, actionsHtml) {
    const el = document.getElementById('migrationResultBanner');
    if (!el) return;

    const icon = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'check_circle');
    el.className = 'migration-result-banner is-' + type;
    el.innerHTML = `
        <i class="material-icons">${icon}</i>
        <div class="migration-banner-body">
            <div class="migration-banner-title">${title}</div>
            <div>${bodyHtml || ''}</div>
            ${actionsHtml ? `<div class="migration-banner-actions">${actionsHtml}</div>` : ''}
        </div>
        <button type="button" class="migration-banner-close" title="Dismiss">&times;</button>
    `;
    el.style.display = 'flex';

    const closeBtn = el.querySelector('.migration-banner-close');
    if (closeBtn) closeBtn.addEventListener('click', hideMigrationResultBanner);

    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function hideMigrationResultBanner() {
    const el = document.getElementById('migrationResultBanner');
    if (!el) return;
    el.style.display = 'none';
    el.innerHTML = '';
}

// After a successful apply: keep the modal open and reset it for the next batch
function resetMigrationFormAfterApply(keepStoreId) {
    // Clear the source rows (the migrated products are already standardized)
    migrationPairs = [createEmptyPair(keepStoreId || getDefaultStoreId())];
    renderMigrationPairRows();
    resetMigrationScanState();
    updateSourceCatalogSummary();
}

// Products of one store, filtered to those missing from the Master Catalog
function getStoreProductPool(storeId) {
    if (!storeId) return [];
    return cachedStoreProductList.filter(item => {
        if (item.storeId !== storeId) return false;
        if (showAllSourceProducts) return true;
        // Show everything that is not fully standardized yet:
        //   missing   -> not in the catalog at all
        //   name_diff -> same catalog ID, different name
        //   id_diff   -> same catalog name, different ID
        return item.catalogStatus === 'missing'
            || item.catalogStatus === 'name_diff'
            || item.catalogStatus === 'id_diff';
    });
}

function escapeMigrationHtml(str) {
    return String(str === undefined || str === null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMigrationMoney(value) {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
}

function pairPriceHtml(pair) {
    if (!pair.productId) {
        return '<span class="migration-pair-price-empty">-</span>';
    }
    const promo = (pair.promoPrice !== null && pair.promoPrice !== undefined && !isNaN(Number(pair.promoPrice)))
        ? `<span class="migration-pair-promo">Promo RM ${formatMigrationMoney(pair.promoPrice)}</span>`
        : '';
    let warn = '';
    if (pair.catalogStatus === 'name_diff') {
        warn = `<span class="migration-pair-warn" title="Same ID as the Master Catalog, but the name differs">⚠ name differs</span>`;
    } else if (pair.catalogStatus === 'id_diff') {
        warn = `<span class="migration-pair-warn is-id-diff" title="Same name as the Master Catalog, but the ID differs">⚠ ID differs</span>`;
    }
    const stock = (pair.stock === null || pair.stock === undefined) ? '-' : pair.stock;
    return `<span class="migration-pair-price-main">RM ${formatMigrationMoney(pair.price)}</span>${promo}${warn}<span class="migration-pair-stock">Stock: ${stock}</span>`;
}

function updatePairPriceCell(row, pair) {
    const cell = row.querySelector('.migration-pair-price');
    if (cell) cell.innerHTML = pairPriceHtml(pair);
}

// Render every Store + Product row
function renderMigrationPairRows() {
    const box = document.getElementById('migrationPairRows');
    if (!box) return;

    if (migrationPairs.length === 0) {
        migrationPairs.push(createEmptyPair(getDefaultStoreId()));
    }

    box.innerHTML = '';
    migrationPairs.forEach((pair, idx) => {
        box.appendChild(buildMigrationPairRow(pair, idx));
    });

    updateMigrationPairCount();
    updateSourceCatalogSummary();
}

function buildMigrationPairRow(pair, idx) {
    const row = document.createElement('div');
    row.className = 'migration-pair-row';
    row.dataset.idx = String(idx);

    // --- Store selector ---
    const select = document.createElement('select');
    select.className = 'migration-pair-store';

    const storeIds = Object.keys(stores || {});
    if (storeIds.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No stores available';
        select.appendChild(opt);
    }
    storeIds.forEach(sid => {
        const opt = document.createElement('option');
        opt.value = sid;
        opt.textContent = stores[sid]?.name || sid;
        if (sid === pair.storeId) opt.selected = true;
        select.appendChild(opt);
    });

    select.addEventListener('change', () => {
        pair.storeId = select.value;
        pair.productId = '';
        pair.productName = '';
        pair.price = null;
        pair.promoPrice = null;
        pair.stock = null;
        pair.catalogStatus = '';
        pair.catalogName = '';
        pair.searchText = '';
        renderMigrationPairRows();
        resetMigrationScanState();
    });

    // --- Product combobox ---
    const productWrap = document.createElement('div');
    productWrap.className = 'migration-pair-product';
    productWrap.innerHTML = `
        <div class="migration-search-input-box">
            <i class="material-icons">search</i>
            <input type="text" class="migration-search-input migration-pair-search" placeholder="Search product in this store..." autocomplete="off">
            <button type="button" class="migration-search-clear migration-pair-clear" title="Clear selection">&times;</button>
        </div>
        <div class="migration-dropdown-list migration-pair-results"></div>
    `;

    const input = productWrap.querySelector('.migration-pair-search');
    const clearBtn = productWrap.querySelector('.migration-pair-clear');
    const results = productWrap.querySelector('.migration-pair-results');

    if (pair.productId) {
        input.value = `[${pair.productId}] ${pair.productName}`;
        clearBtn.style.display = 'block';
    }

    input.addEventListener('input', () => {
        pair.searchText = input.value;
        clearBtn.style.display = input.value.trim() ? 'block' : 'none';

        // Typing over a chosen product unlinks it (falls back to keyword matching)
        if (pair.productId) {
            pair.productId = '';
            pair.productName = '';
            pair.price = null;
            pair.promoPrice = null;
            pair.stock = null;
            pair.catalogStatus = '';
            pair.catalogName = '';
            updatePairPriceCell(row, pair);
            updateMigrationPairCount();
            resetMigrationScanState();
        }

        renderPairDropdown(row, pair, input.value.trim());
    });

    input.addEventListener('focus', () => {
        // If the box still shows the selected product, list the whole pool again
        const selectedLabel = pair.productId ? `[${pair.productId}] ${pair.productName}` : '';
        const query = (selectedLabel && input.value === selectedLabel) ? '' : input.value.trim();
        renderPairDropdown(row, pair, query);
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        pair.productId = '';
        pair.productName = '';
        pair.searchText = '';
        pair.price = null;
        pair.promoPrice = null;
        pair.stock = null;
        pair.catalogStatus = '';
        pair.catalogName = '';
        results.style.display = 'none';
        updatePairPriceCell(row, pair);
        updateMigrationPairCount();
        resetMigrationScanState();
        input.focus();
    });

    // --- Current price cell ---
    const priceCell = document.createElement('div');
    priceCell.className = 'migration-pair-price';
    priceCell.innerHTML = pairPriceHtml(pair);

    // --- Remove button ---
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'migration-pair-remove';
    removeBtn.title = 'Remove this row';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', () => {
        if (migrationPairs.length <= 1) {
            migrationPairs[0] = createEmptyPair(migrationPairs[0].storeId);
        } else {
            migrationPairs.splice(idx, 1);
        }
        renderMigrationPairRows();
        resetMigrationScanState();
    });

    row.appendChild(select);
    row.appendChild(productWrap);
    row.appendChild(priceCell);
    row.appendChild(removeBtn);

    return row;
}

// Dropdown listing the products of the row's store
function renderPairDropdown(row, pair, query) {
    const results = row.querySelector('.migration-pair-results');
    if (!results) return;

    results.innerHTML = '';

    if (!pair.storeId) {
        results.innerHTML = '<div class="migration-dropdown-empty">Please select a store first.</div>';
        results.style.display = 'block';
        return;
    }

    const q = (query || '').toLowerCase();
    const storePool = getStoreProductPool(pair.storeId);
    const pool = storePool.filter(item => {
        if (!q) return true;
        return String(item.id).toLowerCase().includes(q) ||
               item.name.toLowerCase().includes(q) ||
               (item.category || '').toLowerCase().includes(q) ||
               (item.catalogName || '').toLowerCase().includes(q);
    });

    if (pool.length === 0) {
        const storeTotal = cachedStoreProductList.filter(i => i.storeId === pair.storeId).length;
        if (!showAllSourceProducts && storePool.length === 0 && storeTotal > 0) {
            results.innerHTML = `<div class="migration-dropdown-empty ok">
                    All ${storeTotal} product(s) in this store already exist in the Master Catalog.<br>
                    <span>Tick "Show products already in Master Catalog" above to list them anyway.</span>
                </div>`;
        } else {
            results.innerHTML = '<div class="migration-dropdown-empty">No matching products found in this store.</div>';
        }
        results.style.display = 'block';
        return;
    }

    pool.slice(0, 60).forEach(item => {
        const el = document.createElement('div');
        el.className = 'migration-dropdown-item';

        const isNameDiff = item.catalogStatus === 'name_diff';
        const isIdDiff = item.catalogStatus === 'id_diff';

        let catalogTag = '';
        let catalogHint = '';
        if (isNameDiff) {
            catalogTag = ' <span class="migration-mismatch-tag">⚠ Same ID · name differs</span>';
            catalogHint = `<span class="migration-catalog-hint">Catalog name: ${escapeMigrationHtml(item.catalogName)}</span>`;
            el.classList.add('is-mismatch');
        } else if (isIdDiff) {
            catalogTag = ' <span class="migration-iddiff-tag">⚠ Same name · ID differs</span>';
            catalogHint = `<span class="migration-iddiff-hint">Catalog ID: ${escapeMigrationHtml(item.catalogId)}</span>`;
            el.classList.add('is-id-diff');
        } else if (item.inCatalog) {
            catalogTag = ' <span class="migration-in-catalog-tag">✓ In Catalog</span>';
        }

        const categoryTag = item.category ? ` • ${escapeMigrationHtml(item.category)}` : '';
        const promoHtml = (item.promoPrice !== null && item.promoPrice !== undefined && !isNaN(Number(item.promoPrice)))
            ? `<span class="item-badge item-price-promo" title="Promotion price">Promo RM ${formatMigrationMoney(item.promoPrice)}</span>`
            : '';

        el.innerHTML = `
            <div class="item-main">
                <span class="item-id">${escapeMigrationHtml(item.id)}</span>
                <span class="item-name">${escapeMigrationHtml(item.name)}${catalogTag}${categoryTag}</span>
                ${catalogHint}
            </div>
            <div class="migration-item-meta">
                <span class="item-badge item-price" title="Current selling price">RM ${formatMigrationMoney(item.price)}</span>
                ${promoHtml}
                <span class="item-badge">Stock: ${escapeMigrationHtml(item.stock)}</span>
            </div>
        `;

        el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            pair.productId = item.id;
            pair.productName = item.name;
            pair.price = item.price;
            pair.promoPrice = item.promoPrice;
            pair.stock = item.stock;
            pair.catalogStatus = item.catalogStatus;
            pair.catalogName = item.catalogName;
            pair.searchText = `[${item.id}] ${item.name}`;
            renderMigrationPairRows();
            resetMigrationScanState();
        });

        results.appendChild(el);
    });

    results.style.display = 'block';
}

// Load and setup searchable Master Catalog
function loadMigrationCatalogProducts() {
    return database.ref('product_catalog').once('value')
        .then(snapshot => {
            cachedCatalogProductsMap = snapshot.val() || {};
            cachedCatalogList = [];

            Object.entries(cachedCatalogProductsMap).forEach(([catId, catProd]) => {
                if (!catProd || typeof catProd !== 'object') return;
                cachedCatalogList.push({
                    id: catId,
                    name: catProd.name || '',
                    category: catProd.category || '',
                    price: catProd.price || 0
                });
            });

            buildCatalogIndex();
            console.log(`[Migration] Master catalog loaded: ${cachedCatalogList.length} product(s).`);
        })
        .catch(err => {
            console.warn('[Migration] Could not load product_catalog:', err);
        });
}

// Setup searchable input for Catalog Products
function setupSearchableCatalogInput() {
    const searchInput = document.getElementById('migrationCatalogSearch');
    const clearBtn = document.getElementById('clearCatalogSearchBtn');
    const resultsBox = document.getElementById('migrationCatalogResults');
    const newIdInput = document.getElementById('migrationNewProductId');
    const newNameInput = document.getElementById('migrationNewProductName');
    const newCatInput = document.getElementById('migrationNewCategory');

    if (!searchInput || !resultsBox) return;

    function renderResults(filteredItems) {
        resultsBox.innerHTML = '';
        if (filteredItems.length === 0) {
            resultsBox.innerHTML = '<div style="padding: 10px; color: #94a3b8; font-size: 0.82rem; text-align: center;">No catalog products found</div>';
            resultsBox.style.display = 'block';
            return;
        }

        filteredItems.slice(0, 30).forEach(item => {
            const row = document.createElement('div');
            row.className = 'migration-dropdown-item';

            const catTag = item.category ? ` • ${item.category}` : '';

            row.innerHTML = `
                <div class="item-main">
                    <span class="item-id" style="color: #15803d;">${item.id}</span>
                    <span class="item-name">${item.name}${catTag}</span>
                </div>
                <span class="item-badge" style="background: #dcfce7; color: #166534; font-weight: 600;">RM ${(item.price || 0).toFixed(2)}</span>
            `;

            row.addEventListener('click', () => {
                searchInput.value = `[${item.id}] ${item.name}`;
                if (clearBtn) clearBtn.style.display = 'block';
                if (newIdInput) newIdInput.value = item.id;
                if (newNameInput) newNameInput.value = item.name;
                if (newCatInput) newCatInput.value = item.category || '';
                resultsBox.style.display = 'none';
                resetMigrationScanState();
            });

            resultsBox.appendChild(row);
        });

        resultsBox.style.display = 'block';
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

        if (!query) {
            renderResults(cachedCatalogList);
            return;
        }

        const filtered = cachedCatalogList.filter(item => {
            return item.id.toLowerCase().includes(query) ||
                   item.name.toLowerCase().includes(query) ||
                   item.category.toLowerCase().includes(query);
        });

        renderResults(filtered);
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            renderResults(cachedCatalogList);
        } else {
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            if (newIdInput) newIdInput.value = '';
            if (newNameInput) newNameInput.value = '';
            if (newCatInput) newCatInput.value = '';
            resultsBox.style.display = 'none';
            resetMigrationScanState();
            searchInput.focus();
        });
    }
}

// Reset scan preview status
function resetMigrationScanState() {
    lastMigrationScanResult = null;
    const badge = document.getElementById('migrationStatusBadge');
    const orderCountEl = document.getElementById('migrationScanOrderCount');
    const qtyCountEl = document.getElementById('migrationScanQtyCount');
    const salesTotalEl = document.getElementById('migrationScanSalesTotal');
    const sampleBox = document.getElementById('migrationSampleContainer');
    const sampleList = document.getElementById('migrationSampleList');
    const execBtn = document.getElementById('migrationExecuteBtn');

    if (badge) {
        badge.textContent = 'Not Scanned Yet';
        badge.style.background = '#e2e8f0';
        badge.style.color = '#64748b';
    }
    if (orderCountEl) orderCountEl.textContent = '0';
    if (qtyCountEl) qtyCountEl.textContent = '0';
    if (salesTotalEl) salesTotalEl.textContent = 'RM 0.00';
    if (sampleBox) sampleBox.style.display = 'none';
    if (sampleList) sampleList.innerHTML = '';

    if (execBtn) {
        execBtn.disabled = true;
        execBtn.classList.remove('is-ready');
        execBtn.style.background = '';
        execBtn.style.color = '';
        execBtn.style.cursor = '';
    }
}

// Recursive helper to traverse Firebase tree and extract order nodes containing items
function extractAllOrdersFromTree(tree, currentPath = '') {
    const orders = [];
    if (!tree || typeof tree !== 'object') return orders;

    if (tree.items && (Array.isArray(tree.items) || typeof tree.items === 'object')) {
        orders.push({
            relPath: currentPath,
            order: tree
        });
        return orders;
    }

    Object.keys(tree).forEach(key => {
        const nextPath = currentPath ? `${currentPath}/${key}` : key;
        const subOrders = extractAllOrdersFromTree(tree[key], nextPath);
        if (subOrders.length > 0) {
            orders.push(...subOrders);
        }
    });

    return orders;
}

// Execute Scan & Preview (Dry Run)
function handleProductMigrationScan() {
    const newIdInput = document.getElementById('migrationNewProductId');
    const newNameInput = document.getElementById('migrationNewProductName');
    const matchModeSelect = document.getElementById('migrationMatchMode');
    const optSales = document.getElementById('migrationOptSales')?.checked;
    const optStoreProduct = document.getElementById('migrationOptStoreProduct')?.checked;

    const newId = (newIdInput?.value || '').trim();
    const newName = (newNameInput?.value || '').trim();
    const matchMode = matchModeSelect?.value || 'contains_keyword';

    // Build the source targets from the Store + Product rows.
    // Each source target is bound to its own store.
    const targetSourceItems = [];
    migrationPairs.forEach(pair => {
        if (!pair.storeId) return;

        if (pair.productId) {
            targetSourceItems.push({
                storeId: pair.storeId,
                id: String(pair.productId).trim().toLowerCase(),
                name: String(pair.productName || '').trim().toLowerCase(),
                rawId: pair.productId,
                rawName: pair.productName || ''
            });
        } else {
            const keyword = (pair.searchText || '').trim();
            if (!keyword) return;
            targetSourceItems.push({
                storeId: pair.storeId,
                id: '',
                name: keyword.toLowerCase(),
                rawId: '',
                rawName: keyword
            });
        }
    });

    if (targetSourceItems.length === 0) {
        alert('Please add at least one Store + Product row to replace!');
        return;
    }

    const primaryOldId = targetSourceItems[0].rawId;
    const primaryOldName = targetSourceItems[0].rawName;

    if (!newId || !newName) {
        alert('Please specify the Standard Product ID and Standard Name!');
        if (newIdInput) newIdInput.focus();
        return;
    }

    const loadingIndicator = document.getElementById('migrationLoadingIndicator');
    const loadingText = document.getElementById('migrationLoadingText');
    const scanBtn = document.getElementById('migrationScanBtn');
    const badge = document.getElementById('migrationStatusBadge');

    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (loadingText) loadingText.textContent = 'Scanning historical orders with fuzzy & multi-product matching...';
    if (scanBtn) scanBtn.disabled = true;

    // Only the stores referenced by the rows are scanned
    const targetStoreIds = Array.from(new Set(targetSourceItems.map(src => src.storeId).filter(Boolean)));

    if (targetStoreIds.length === 0) {
        alert('No stores available to scan!');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (scanBtn) scanBtn.disabled = false;
        return;
    }

    console.log(`[Product Migration] Scanning stores with ${targetSourceItems.length} source target(s):`, targetStoreIds);

    const storeScanPromises = targetStoreIds.map(stId => {
        return database.ref(`sales/${stId}`).once('value')
            .then(snapshot => {
                const salesTree = snapshot.val() || {};
                const orders = extractAllOrdersFromTree(salesTree);
                return { storeId: stId, orders };
            })
            .catch(err => {
                console.warn(`[Product Migration] Failed to scan sales for store ${stId}:`, err);
                return { storeId: stId, orders: [] };
            });
    });

    Promise.all(storeScanPromises)
        .then(storeResults => {
            let matchedOrders = [];
            let totalMatchedQty = 0;
            let totalMatchedSales = 0;

            storeResults.forEach(({ storeId, orders }) => {
                orders.forEach(({ relPath, order }) => {
                    const rawItems = order.items;
                    const itemsList = Array.isArray(rawItems)
                        ? rawItems
                        : (rawItems && typeof rawItems === 'object' ? Object.values(rawItems) : []);

                    let orderHasMatch = false;
                    const matchedItemIndices = [];

                    itemsList.forEach((item, index) => {
                        if (!item) return;
                        const itemId = String(item.id || item.productId || item.item_id || '').trim().toLowerCase();
                        const itemName = String(item.name || item.productName || item.item_name || '').trim().toLowerCase();

                        // Check if this item matches ANY of the targetSourceItems
                        let isMatch = false;

                        for (const src of targetSourceItems) {
                            // Each source row is bound to its own store - never match across stores
                            if (src.storeId && src.storeId !== storeId) {
                                continue;
                            }

                            if (matchMode === 'contains_keyword') {
                                // Fuzzy partial match: keyword contained in item name or item id
                                const idContains = src.id && (itemId.includes(src.id) || src.id.includes(itemId));
                                const nameContains = src.name && (itemName.includes(src.name) || src.name.includes(itemName));
                                if (idContains || nameContains) {
                                    isMatch = true;
                                    break;
                                }
                            } else if (matchMode === 'id_only') {
                                if (src.id && itemId === src.id) {
                                    isMatch = true;
                                    break;
                                }
                            } else if (matchMode === 'name_only') {
                                if (src.name && itemName === src.name) {
                                    isMatch = true;
                                    break;
                                }
                            } else {
                                // id_or_name exact match
                                if ((src.id && itemId === src.id) || (src.name && itemName === src.name)) {
                                    isMatch = true;
                                    break;
                                }
                            }
                        }

                        if (isMatch) {
                            orderHasMatch = true;
                            matchedItemIndices.push(index);
                            const qty = parseFloat(item.quantity) || 0;
                            const itemPrice = parseFloat(item.price) || 0;
                            const subtotal = item.subtotal !== undefined ? (parseFloat(item.subtotal) || 0) : (itemPrice * qty);

                            totalMatchedQty += qty;
                            totalMatchedSales += subtotal;
                        }
                    });

                    if (orderHasMatch) {
                        matchedOrders.push({
                            storeId,
                            relPath,
                            order,
                            matchedItemIndices
                        });
                    }
                });
            });

            lastMigrationScanResult = {
                targetStoreIds,
                targetSourceItems,
                primaryOldId,
                primaryOldName,
                newId,
                newName,
                newCategory: document.getElementById('migrationNewCategory')?.value.trim() || '',
                matchMode,
                optSales,
                optStoreProduct,
                matchedOrders,
                totalMatchedQty,
                totalMatchedSales
            };

            // Update UI
            const orderCountEl = document.getElementById('migrationScanOrderCount');
            const qtyCountEl = document.getElementById('migrationScanQtyCount');
            const salesTotalEl = document.getElementById('migrationScanSalesTotal');
            const sampleBox = document.getElementById('migrationSampleContainer');
            const sampleList = document.getElementById('migrationSampleList');
            const execBtn = document.getElementById('migrationExecuteBtn');

            if (orderCountEl) orderCountEl.textContent = matchedOrders.length;
            if (qtyCountEl) qtyCountEl.textContent = totalMatchedQty.toFixed(1).replace(/\.0$/, '');
            if (salesTotalEl) salesTotalEl.textContent = `RM ${totalMatchedSales.toFixed(2)}`;

            if (badge) {
                if (matchedOrders.length > 0) {
                    badge.textContent = `${matchedOrders.length} Matched Receipt(s) Found`;
                    badge.style.background = '#dcfce7';
                    badge.style.color = '#15803d';
                } else {
                    badge.textContent = `No Historical Receipts Found`;
                    badge.style.background = '#fef3c7';
                    badge.style.color = '#b45309';
                }
            }

            // Samples preview
            if (sampleBox && sampleList) {
                if (matchedOrders.length > 0) {
                    sampleBox.style.display = 'block';
                    sampleList.innerHTML = matchedOrders.slice(0, 5).map(m => {
                        const stName = stores[m.storeId]?.name || m.storeId;
                        const dateStr = m.order.date || m.relPath.split('/')[0] || '-';
                        const billNo = m.order.bill_number || m.order.receipt_number || m.relPath.split('/').pop();
                        return `<div style="padding: 4px 0; border-bottom: 1px dashed #e2e8f0; display: flex; justify-content: space-between;">
                            <span><b>[${stName}]</b> Receipt: ${billNo} (${dateStr})</span>
                            <span style="color: #059669; font-weight: 600;">Matched ${m.matchedItemIndices.length} Item(s)</span>
                        </div>`;
                    }).join('');
                } else {
                    sampleBox.style.display = 'none';
                }
            }

            // Enable execute button
            if (execBtn) {
                execBtn.disabled = false;
                execBtn.classList.add('is-ready');
                execBtn.style.background = '';
                execBtn.style.color = '';
                execBtn.style.cursor = '';
            }
        })
        .catch(err => {
            console.error('[Product Migration] Scan failed:', err);
            showMigrationResultBanner(
                'error',
                'Scan failed',
                `Error: ${escapeMigrationHtml(err.message || String(err))}`
            );
        })
        .finally(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (scanBtn) scanBtn.disabled = false;
        });
}

// Execute migration write to Firebase and save Audit History Log
function handleProductMigrationExecute() {
    if (!lastMigrationScanResult) {
        alert('Please run "1. Scan & Preview (Dry Run)" first!');
        return;
    }

    const {
        targetStoreIds,
        targetSourceItems,
        primaryOldId,
        primaryOldName,
        newId,
        newName,
        newCategory,
        optSales,
        optStoreProduct,
        matchedOrders
    } = lastMigrationScanResult;

    const storeScopeDesc = targetStoreIds.length === 1
        ? (stores[targetStoreIds[0]]?.name || targetStoreIds[0])
        : `${targetStoreIds.length} store(s)`;

    const sourceSummary = targetSourceItems
        .map(s => {
            const label = s.rawId ? `[${s.rawId}] ${s.rawName}` : `"${s.rawName}" (keyword)`;
            const stName = stores[s.storeId]?.name || s.storeId || '-';
            return `${label} @ ${stName}`;
        })
        .join(', ');

    const confirmMsg = `[CONFIRMATION REQUIRED]\nAre you sure you want to proceed with this batch migration?\n\n` +
        `• Store Scope: ${storeScopeDesc}\n` +
        `• Source Products (${targetSourceItems.length}): ${sourceSummary}\n` +
        `• Standardized To: [${newId}] ${newName}\n` +
        `• Historical Orders to Update: ${optSales ? matchedOrders.length + ' receipts' : 'Skipped'}\n` +
        `• Update Active Store Products: ${optStoreProduct ? 'Yes' : 'No'}\n\n` +
        `Original product names and IDs will be permanently saved in Audit Logs for Rollback & Reference. Proceed?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    const loadingIndicator = document.getElementById('migrationLoadingIndicator');
    const loadingText = document.getElementById('migrationLoadingText');
    const execBtn = document.getElementById('migrationExecuteBtn');
    const scanBtn = document.getElementById('migrationScanBtn');

    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (loadingText) loadingText.textContent = 'Updating database safely and writing audit logs...';
    if (execBtn) execBtn.disabled = true;
    if (scanBtn) scanBtn.disabled = true;

    const updates = {};
    const timestampNow = new Date().toISOString();
    const logId = `MIG_${Date.now()}`;

    // 1. Prepare historical orders updates
    if (optSales && matchedOrders.length > 0) {
        matchedOrders.forEach(({ storeId, relPath, order, matchedItemIndices }) => {
            const rawItems = order.items;
            const isArray = Array.isArray(rawItems);
            let itemsClone = JSON.parse(JSON.stringify(rawItems));

            matchedItemIndices.forEach(idx => {
                const item = isArray ? itemsClone[idx] : itemsClone[Object.keys(itemsClone)[idx]];
                if (item) {
                    if (!item._original_id) item._original_id = item.id || item.productId || primaryOldId;
                    if (!item._original_name) item._original_name = item.name || item.productName || primaryOldName;
                    item._migrated = true;
                    item._migration_log_id = logId;
                    item._migrated_at = timestampNow;

                    item.id = newId;
                    item.productId = newId;
                    item.name = newName;
                    item.productName = newName;
                    if (newCategory) item.category = newCategory;
                }
            });

            updates[`sales/${storeId}/${relPath}/items`] = itemsClone;
            updates[`sales/${storeId}/${relPath}/_last_migrated_at`] = timestampNow;
        });
    }

    // 2. Prepare store_products inventory migration
    const storeProductPromises = [];
    if (optStoreProduct) {
        // Migrate only the exact store/product pair that the user selected
        targetSourceItems.forEach(src => {
            const sId = src.rawId;
            const stId = src.storeId;
            if (!sId || !stId) return;
            const p = database.ref(`store_products/${stId}/${sId}`).once('value')
                .then(snap => {
                    const prodData = snap.val();
                    if (prodData) {
                        const updatedData = {
                            ...prodData,
                            id: newId,
                            name: newName,
                            category: newCategory || prodData.category || '',
                            _migrated_from_id: sId,
                            _migrated_from_name: prodData.name || src.rawName || '',
                            _migration_log_id: logId,
                            _migrated_at: timestampNow
                        };
                        updates[`store_products/${stId}/${newId}`] = updatedData;
                        if (newId !== sId) {
                            updates[`store_products/${stId}/${sId}`] = null;
                        }
                    }
                });
            storeProductPromises.push(p);
        });
    }

    // 3. Write Migration Audit Log
    const auditRecord = {
        id: logId,
        timestamp: timestampNow,
        storeScope: targetStoreIds.length === 1 ? targetStoreIds[0] : 'all',
        targetStoreIds,
        sourceItems: targetSourceItems.map(s => ({ id: s.rawId, name: s.rawName, storeId: s.storeId })),
        standardProduct: {
            id: newId,
            name: newName,
            category: newCategory || ''
        },
        ordersUpdatedCount: optSales ? matchedOrders.length : 0,
        rolledBack: false
    };
    updates[`migration_history/${logId}`] = auditRecord;

    Promise.all(storeProductPromises)
        .then(() => {
            const updateKeys = Object.keys(updates);
            if (updateKeys.length === 0) {
                showMigrationResultBanner(
                    'warning',
                    'Nothing to update',
                    'No database records matched this migration. Check the store / product rows and the application scope options, then scan again.'
                );
                return Promise.resolve();
            }

            console.log(`[Product Migration] Executing multi-path update with ${updateKeys.length} keys...`);

            const BATCH_SIZE = 150;
            const batchPromises = [];
            for (let i = 0; i < updateKeys.length; i += BATCH_SIZE) {
                const batch = {};
                updateKeys.slice(i, i + BATCH_SIZE).forEach(k => {
                    batch[k] = updates[k];
                });
                batchPromises.push(database.ref().update(batch));
            }

            return Promise.all(batchPromises);
        })
        .then(() => {
            const receiptCount = optSales ? matchedOrders.length : 0;
            const storeNames = targetStoreIds.map(id => stores[id]?.name || id).join(', ');

            // Locally mark the migrated products as standardized so they immediately
            // disappear from the "not in Master Catalog" pickers
            targetSourceItems.forEach(src => {
                cachedStoreProductList.forEach(entry => {
                    if (entry.storeId === src.storeId && String(entry.id) === String(src.rawId)) {
                        entry.inCatalog = true;
                        entry.catalogStatus = 'matched';
                        entry.catalogId = newId;
                        entry.catalogName = newName;
                        entry.id = newId;
                        entry.name = newName;
                        if (newCategory) entry.category = newCategory;
                    }
                });
            });

            showMigrationResultBanner(
                'success',
                `Migration completed — ${targetSourceItems.length} product(s) standardized`,
                `Standardized to <b>[${escapeMigrationHtml(newId)}] ${escapeMigrationHtml(newName)}</b>`
                + `<br>Store(s): ${escapeMigrationHtml(storeNames) || '-'}`
                + `<br>Historical receipts updated: <b>${receiptCount}</b>`
                + `<br><span style="opacity:.85">The page stays open and the source rows are cleared, ready for the next batch.`
                + ` The Standard Product above is kept — change it if the next batch targets a different product.</span>`,
                `<button type="button" class="migration-banner-btn" id="migrationBannerAuditBtn">
                    <i class="material-icons" style="font-size:15px;">history</i> Open Audit Logs & Undo
                 </button>`
            );

            const auditBtn = document.getElementById('migrationBannerAuditBtn');
            if (auditBtn) {
                auditBtn.addEventListener('click', () => {
                    const panel = document.getElementById('migrationHistoryPanel');
                    if (panel) {
                        panel.style.display = 'block';
                        loadMigrationAuditLogs();
                        panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                });
            }

            // Keep the modal open - reset the source rows only
            resetMigrationFormAfterApply(targetSourceItems[0]?.storeId);

            if (typeof loadProducts === 'function') {
                loadProducts();
            }
        })
        .catch(err => {
            console.error('[Product Migration] Execution failed:', err);
            showMigrationResultBanner(
                'error',
                'Migration failed',
                `Error: ${escapeMigrationHtml(err.message || String(err))}<br>Nothing was left half-applied — please check the console and try again.`
            );
        })
        .finally(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (execBtn) execBtn.disabled = false;
            if (scanBtn) scanBtn.disabled = false;
        });
}

// Load and render Migration Audit History Logs with Rollback / Undo
function loadMigrationAuditLogs() {
    const listContainer = document.getElementById('migrationHistoryList');
    const countBadge = document.getElementById('migrationHistoryCount');
    if (!listContainer) return;

    listContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 14px; font-size: 0.82rem;"><i class="material-icons" style="animation: spin 1s linear infinite; vertical-align: middle;">refresh</i> Loading audit records...</div>';

    // 1. Fetch from migration_history node
    database.ref('migration_history').once('value')
        .then(snapshot => {
            const historyMap = snapshot.val() || {};
            const logs = Object.values(historyMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Also inspect products in memory for any migrated items without logs
            const discoveredFromProducts = [];
            Object.values(products || {}).forEach(p => {
                if (p._migrated_from_id || p._migrated_from_name) {
                    discoveredFromProducts.push({
                        storeId: p.store_id,
                        storeName: stores[p.store_id]?.name || p.store_id,
                        currentId: p.original_id || p.id,
                        currentName: p.name,
                        oldId: p._migrated_from_id || '-',
                        oldName: p._migrated_from_name || '-',
                        migratedAt: p._migrated_at || 'Earlier'
                    });
                }
            });

            if (logs.length === 0 && discoveredFromProducts.length === 0) {
                listContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 16px; font-size: 0.82rem;">No migration audit logs recorded yet.</div>';
                if (countBadge) countBadge.textContent = '0 records';
                return;
            }

            const totalCount = logs.length + discoveredFromProducts.length;
            if (countBadge) countBadge.textContent = `${totalCount} records`;

            let html = '';

            // Render formal migration logs
            logs.forEach(log => {
                const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : '-';
                const sources = (log.sourceItems || []).map(s => `<b>[${s.id}]</b> ${s.name}`).join(', ') || '-';
                const target = `<b>[${log.standardProduct?.id}]</b> ${log.standardProduct?.name}`;
                const storeText = log.storeScope === 'all' ? 'All Stores' : (stores[log.storeScope]?.name || log.storeScope);

                const rollbackBtn = log.rolledBack
                    ? `<span style="font-size: 0.72rem; color: #94a3b8; font-style: italic;">Rolled back</span>`
                    : `<button type="button" class="action-button" style="background: #e11d48; color: white; border: none; padding: 4px 10px; font-size: 0.74rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 3px;" onclick="executeRollbackAuditLog('${log.id}')"><i class="material-icons" style="font-size: 14px;">undo</i> Rollback</button>`;

                html += `
                    <div style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <div style="font-size: 0.8rem; line-height: 1.4;">
                            <div style="color: #64748b; font-size: 0.72rem;">📅 ${dateStr} • Scope: <b>${storeText}</b> • Receipts: <b>${log.ordersUpdatedCount || 0}</b></div>
                            <div style="margin-top: 2px;">
                                <span style="color: #be123c;">Original:</span> ${sources} 
                                <span style="color: #94a3b8; margin: 0 4px;">➔</span> 
                                <span style="color: #15803d;">Standardized To:</span> ${target}
                            </div>
                        </div>
                        <div>${rollbackBtn}</div>
                    </div>
                `;
            });

            // Also display any migrated items discovered from products
            if (discoveredFromProducts.length > 0) {
                html += `<div style="padding: 6px 10px; background: #fffbeb; font-weight: 600; font-size: 0.75rem; color: #b45309; border-top: 1px solid #fed7aa; margin-top: 4px;">Discovered Former Names from Store Products:</div>`;
                discoveredFromProducts.forEach(d => {
                    html += `
                        <div style="padding: 6px 10px; border-bottom: 1px dashed #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                            <div>
                                <span style="color: #64748b;">[${d.storeName}]</span> Current: <b>${d.currentName}</b> ([${d.currentId}])
                                <div style="color: #d97706; margin-top: 1px;"><i class="material-icons" style="font-size: 11px; vertical-align: middle;">history</i> Original Name: <b>${d.oldName}</b> (ID: ${d.oldId})</div>
                            </div>
                            <button type="button" class="action-button" style="background: #f59e0b; color: white; border: none; padding: 3px 8px; font-size: 0.72rem; border-radius: 4px; cursor: pointer;" onclick="restoreSingleProductFormerName('${d.storeId}', '${d.currentId}', '${d.oldId}', '${d.oldName}')">
                                Restore Original Name
                            </button>
                        </div>
                    `;
                });
            }

            listContainer.innerHTML = html;
        })
        .catch(err => {
            console.error('[Audit Logs] Failed to load:', err);
            listContainer.innerHTML = '<div style="color: #ef4444; padding: 10px; font-size: 0.8rem;">Failed to load audit logs: ' + err.message + '</div>';
        });
}

// Rollback an entire audit log entry
window.executeRollbackAuditLog = function(logId) {
    if (!confirm(`Are you sure you want to ROLLBACK (Undo) this migration?\n\nThis will restore the products and historical receipts back to their original names and IDs.`)) {
        return;
    }

    database.ref(`migration_history/${logId}`).once('value')
        .then(snap => {
            const log = snap.val();
            if (!log) throw new Error('Audit log record not found');

            const updates = {};
            const targetId = log.standardProduct?.id;
            const targetName = log.standardProduct?.name;

            // 1. Rollback store_products
            (log.targetStoreIds || []).forEach(stId => {
                (log.sourceItems || []).forEach(src => {
                    const originalId = src.id;
                    const originalName = src.name;
                    if (!originalId) return;

                    const pRef = database.ref(`store_products/${stId}/${targetId}`);
                    pRef.once('value').then(pSnap => {
                        const curProd = pSnap.val();
                        if (curProd) {
                            updates[`store_products/${stId}/${originalId}`] = {
                                ...curProd,
                                id: originalId,
                                name: originalName,
                                _migrated_from_id: null,
                                _migrated_from_name: null,
                                _migration_log_id: null
                            };
                            if (originalId !== targetId) {
                                updates[`store_products/${stId}/${targetId}`] = null;
                            }
                        }
                    });
                });
            });

            // 2. Mark log as rolled back
            updates[`migration_history/${logId}/rolledBack`] = true;
            updates[`migration_history/${logId}/rolledBackAt`] = new Date().toISOString();

            setTimeout(() => {
                database.ref().update(updates)
                    .then(() => {
                        alert('🎉 Rollback successful! The product has been restored to its original ID and Name.');
                        if (typeof loadProducts === 'function') loadProducts();
                        loadMigrationAuditLogs();
                    })
                    .catch(e => alert('Rollback failed: ' + e.message));
            }, 500);
        })
        .catch(err => alert('Rollback error: ' + err.message));
};

// Restore a single product former name
window.restoreSingleProductFormerName = function(storeId, currentId, oldId, oldName) {
    if (!confirm(`Restore [${currentId}] back to Original: [${oldId}] "${oldName}"?`)) return;

    database.ref(`store_products/${storeId}/${currentId}`).once('value')
        .then(snap => {
            const prod = snap.val();
            if (!prod) throw new Error('Product not found in store');

            const updates = {};
            updates[`store_products/${storeId}/${oldId}`] = {
                ...prod,
                id: oldId,
                name: oldName,
                _migrated_from_id: null,
                _migrated_from_name: null
            };
            if (oldId !== currentId) {
                updates[`store_products/${storeId}/${currentId}`] = null;
            }

            return database.ref().update(updates);
        })
        .then(() => {
            alert(`Restored successfully to [${oldId}] ${oldName}!`);
            if (typeof loadProducts === 'function') loadProducts();
            loadMigrationAuditLogs();
        })
        .catch(err => alert('Restore failed: ' + err.message));
};