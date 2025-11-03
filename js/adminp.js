// adminp.js - iOS Style Mobile Admin Interface

let currentUser = null;
let currentView = 'sales';
let storesData = {};
let productsData = {};
let salesData = {};
let dailySalesData = {};
let selectedDate = null;

// DOM elements for category filter
let categoryFilter = null;

// Image preloading system for better performance
const imageCache = new Map();
const preloadQueue = [];

// Store image mapping - maps store IDs to images in shop folder
const storeImageMap = {
    'dalam': '../shop/dalam.png',
    'luar': '../shop/luar.png',
    'tawau': '../shop/tawau.png',
    'wisma': '../shop/wisma.png',
    'tom': '../shop/tom.png',
    'mas': '../shop/Mas.png',
    'aa': '../shop/Aa.png',
    'jkl': '../shop/jkl.png',
    'som': '../shop/som.png',
    'left': '../shop/left.png',
    'ktsp': '../shop/ktsp.png',
    // Fallback options
    'store1': '../shop/dalam.png',
    'store2': '../shop/luar.png',
    'store3': '../shop/tawau.png',
    'store4': '../shop/wisma.png',
    'store5': '../shop/tom.png',
    'store6': '../shop/Mas.png',
    'store7': '../shop/Aa.png',
    'store8': '../shop/jkl.png'
};

// Product image mapping will be loaded from external file

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    initializeApp();
    setupEventListeners();
    console.log('Admin panel ready!');
});

// Initialize application
function initializeApp() {
    // Check Firebase connection
    if (!firebase || !firebase.auth || !firebase.database) {
        showError('Firebase connection failed. Please check your internet connection and refresh the page.');
        return;
    }
    
    // Check user authentication status
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.email);
            
            // 首先检查维护状态
            checkMaintenanceStatus().then(maintenanceData => {
                if (maintenanceData.enabled) {
                    // 如果维护模式开启，显示维护页面
                    showMaintenancePage();
                    return;
                }
                
                // 如果没有维护模式，继续正常流程
                // Initialize selected date
                if (!selectedDate) {
                    selectedDate = getCurrentDate();
                }
                
                loadUserProfile();
                loadDashboardData();
            }).catch(error => {
                console.error('检查维护状态失败:', error);
                // 如果检查失败，继续正常流程
                if (!selectedDate) {
                    selectedDate = getCurrentDate();
                }
                loadUserProfile();
                loadDashboardData();
            });
        } else {
            console.log('User not authenticated, redirecting to login...');
            // Redirect to login page
            window.location.href = '../index.html';
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Bottom navigation
    document.querySelectorAll('.tab-item[data-view]').forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterProducts();
        });
    });

    // Store selector
    const storeSelector = document.getElementById('storeSelector');
    if (storeSelector) {
        storeSelector.addEventListener('change', function() {
            // Repopulate category filter when store changes
            populateCategoryFilter();
            // Then filter products
            filterProducts();
        });
    }

    // Category filter
    categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // Date picker
    const datePickerInput = document.getElementById('salesDatePicker');
    if (datePickerInput) {
        // Set default date to today
        const today = getCurrentDate();
        datePickerInput.value = today;
        selectedDate = today;
        
        // Listen for date changes
        datePickerInput.addEventListener('change', function() {
            selectedDate = this.value;
            updateDateDisplay();
            loadSalesDataForDate(selectedDate);
            hapticFeedback();
        });
    }

    // Sales record detail modal background click
    const salesRecordModal = document.getElementById('salesRecordDetailModal');
    if (salesRecordModal) {
        salesRecordModal.addEventListener('click', (e) => {
            if (e.target === salesRecordModal) {
                closeSalesRecordDetail();
            }
        });
    }
}

// Switch view
function switchView(viewName) {
    // Update navigation state
    document.querySelectorAll('.tab-item').forEach(item => {
                        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Show corresponding view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(`${viewName}View`);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
        
        // Update navigation title
        const navTitle = document.getElementById('navTitle');
        const navSubtitle = document.getElementById('navSubtitle');
        
        if (viewName === 'sales') {
            navTitle.innerHTML = 'Sales';
            navSubtitle.textContent = "Today's Performance";
            loadRealSalesData();
        } else if (viewName === 'stock') {
            navTitle.innerHTML = 'Stock';
            navSubtitle.textContent = 'Inventory Management';
            loadStockData();
        }
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const userRef = firebase.database().ref(`users/${currentUser.uid}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        if (userData) {
            document.getElementById('adminName').textContent = userData.name || 'Admin';
            document.getElementById('adminRole').textContent = userData.role || 'Admin';
        }
    } catch (error) {
        console.error('Failed to load user profile:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        showLoading('Loading dashboard data...');
        
        // Initialize selected date if not set
        if (!selectedDate) {
            selectedDate = getCurrentDate();
            const datePickerInput = document.getElementById('salesDatePicker');
            if (datePickerInput) {
                datePickerInput.value = selectedDate;
            }
        }
        
        await Promise.all([
            loadStores(),
            loadProducts(),
            loadRealSalesData()
        ]);
        
        updateDashboardStats();
        updateDateDisplay();
        hideLoading();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        hideLoading();
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

// Load stores data
async function loadStores() {
    try {
        const storesRef = firebase.database().ref('stores');
        const snapshot = await storesRef.once('value');
        storesData = snapshot.val() || {};
        console.log('Loaded stores data:', storesData);
        renderStoreCards();
        populateStoreSelector();
    } catch (error) {
        console.error('Failed to load stores data:', error);
    }
}

// Load products data
async function loadProducts() {
    try {
        const productsRef = firebase.database().ref('store_products');
        const snapshot = await productsRef.once('value');
        const storeProducts = snapshot.val() || {};
        
        // 合并所有店铺的产品数据
        productsData = {};
        Object.entries(storeProducts).forEach(([storeId, storeProductList]) => {
            if (storeProductList) {
                Object.entries(storeProductList).forEach(([productId, product]) => {
                    // 使用 storeId + productId 作为唯一键，避免产品ID冲突
                    const uniqueKey = `${storeId}_${productId}`;
                    productsData[uniqueKey] = {
                        ...product,
                        id: productId,
                        unique_id: uniqueKey,
                        store_id: storeId
                    };
                });
            }
        });
        
        console.log('Loaded products data:', productsData);
        console.log('Total products loaded:', Object.keys(productsData).length);
        
        // Populate category filter after loading products
        populateCategoryFilter();
    } catch (error) {
        console.error('Failed to load products data:', error);
    }
}

// Update date display in navigation
function updateDateDisplay() {
    const navSubtitle = document.getElementById('navSubtitle');
    if (selectedDate) {
        const dateObj = new Date(selectedDate);
        const today = getCurrentDate();
        
        if (selectedDate === today) {
            navSubtitle.textContent = "Today's Performance";
                } else {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            navSubtitle.textContent = dateObj.toLocaleDateString('en-US', options);
        }
    }
}

// Load sales data for specific date
async function loadSalesDataForDate(date) {
    try {
        showLoading(`Loading sales data for ${date}...`);
        
        console.log('Loading sales data for date:', date);
        
        // Load daily sales summary for all stores
        const dailySalesRef = firebase.database().ref('daily_sales');
        const dailySalesSnapshot = await dailySalesRef.once('value');
        dailySalesData = dailySalesSnapshot.val() || {};
        
        console.log('Loaded daily sales data:', dailySalesData);
        
        if (currentView === 'sales') {
            updateDashboardStatsForDate(date);
            renderStoreCardsForDate(date);
        }
        
        hideLoading();
    } catch (error) {
        console.error('Failed to load sales data for date:', error);
        hideLoading();
        showError('Failed to load sales data. Please try again.');
    }
}

// Load real sales data from Firebase
async function loadRealSalesData() {
    const dateToLoad = selectedDate || getCurrentDate();
    await loadSalesDataForDate(dateToLoad);
}

// Load sales data (kept for compatibility)
async function loadSalesData() {
    await loadRealSalesData();
}

// Get current date in YYYY-MM-DD format
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

// Update dashboard statistics with real data for specific date
function updateDashboardStatsForDate(date) {
    let totalRevenue = 0;
    let totalTransactions = 0;
    let activeStores = 0;
    
    console.log('Updating dashboard stats for date:', date);
    console.log('Available daily sales data:', dailySalesData);

    const datePath = getDatePathFromString(date);

    // Calculate statistics for the selected date
    Object.keys(dailySalesData).forEach(storeId => {
        const storeData = dailySalesData[storeId];
        // 使用新的分层路径访问数据
        if (storeData && storeData[datePath.year] && 
            storeData[datePath.year][datePath.month] && 
            storeData[datePath.year][datePath.month][datePath.day]) {
            const dateSales = storeData[datePath.year][datePath.month][datePath.day];
            const storeTotalSales = parseFloat(dateSales.total_sales || 0);
            const storeTransactions = parseInt(dateSales.transaction_count || 0);
            
            if (storeTotalSales > 0) {
                totalRevenue += storeTotalSales;
                totalTransactions += storeTransactions;
                activeStores++;
            }
            
            console.log(`Store ${storeId} - Sales: RM ${storeTotalSales}, Transactions: ${storeTransactions}`);
        }
    });

    // Calculate growth rate (compare with previous day)
    const previousDate = getPreviousDate(date);
    const previousDatePath = getDatePathFromString(previousDate);
    let previousRevenue = 0;
    
    Object.keys(dailySalesData).forEach(storeId => {
        const storeData = dailySalesData[storeId];
        if (storeData && storeData[previousDatePath.year] && 
            storeData[previousDatePath.year][previousDatePath.month] && 
            storeData[previousDatePath.year][previousDatePath.month][previousDatePath.day]) {
            previousRevenue += parseFloat(storeData[previousDatePath.year][previousDatePath.month][previousDatePath.day].total_sales || 0);
        }
    });

    const growthRate = previousRevenue > 0 ? 
        ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;

    console.log('Dashboard stats:', {
        totalRevenue,
        totalTransactions,
        activeStores,
        growthRate,
        previousRevenue
    });

    // Update display with animation
    animateValue('totalRevenue', totalRevenue, 'RM ');
    animateValue('totalSales', totalTransactions, '');
    animateValue('activeStores', activeStores, '');
    animateValue('growthRate', growthRate, '', '%');
}

// Update dashboard statistics with real data (for today)
function updateDashboardStats() {
    const today = getCurrentDate();
    updateDashboardStatsForDate(today);
}

// Get yesterday's date
function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get previous date from given date
function getPreviousDate(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Animate value changes
function animateValue(elementId, targetValue, prefix = '', suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 1500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easeProgress;
        
        if (elementId === 'totalRevenue') {
            element.textContent = `${prefix}${currentValue.toFixed(2)}${suffix}`;
        } else if (elementId === 'growthRate') {
            const sign = currentValue >= 0 ? '+' : '';
            element.textContent = `${sign}${currentValue.toFixed(1)}${suffix}`;
            } else {
            element.textContent = `${prefix}${Math.round(currentValue)}${suffix}`;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Get store image
function getStoreImage(storeId, storeName) {
    // First try to match by store ID (lowercase)
    const lowerStoreId = storeId ? storeId.toLowerCase() : '';
    if (storeImageMap[lowerStoreId]) {
        return storeImageMap[lowerStoreId];
    }
    
    // Then try to match by store name (lowercase)
    const lowerStoreName = storeName ? storeName.toLowerCase().replace(/\s+/g, '') : '';
    if (storeImageMap[lowerStoreName]) {
        return storeImageMap[lowerStoreName];
    }
    
    // Try partial matches for common store names
    const availableImages = Object.keys(storeImageMap);
    for (let imageKey of availableImages) {
        if (lowerStoreName.includes(imageKey) || lowerStoreId.includes(imageKey)) {
            return storeImageMap[imageKey];
        }
    }
    
    // Default fallback
    return '../icons/pos.png';
}

// Product image functions are now loaded from js/product-image-map.js

// Render store cards for specific date
function renderStoreCardsForDate(date) {
    const storesGrid = document.getElementById('storesGrid');
    if (!storesGrid) return;

    storesGrid.innerHTML = '';
    
    if (Object.keys(storesData).length === 0) {
        storesGrid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading stores data...</div>';
        return;
    }
    
    // Check if any stores have sales for this date
    let hasAnySales = false;
    Object.keys(storesData).forEach(storeId => {
        const revenue = calculateRealStoreRevenue(storeId, date);
        if (revenue > 0) hasAnySales = true;
    });
    
    Object.entries(storesData).forEach(([storeId, store]) => {
        const storeRevenue = calculateRealStoreRevenue(storeId, date);
        const storeImage = getStoreImage(storeId, store.name);
        
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        storeCard.onclick = () => showStoreDetailView(storeId, date);
        
        storeCard.innerHTML = `
            <div class="store-image">
                <img src="${storeImage}" alt="${store.name}" onerror="this.src='../icons/pos.png'">
                </div>
            <div class="store-info">
                <h3>${store.name}</h3>
                <div class="store-sales">
                    <div class="sales-amount">RM ${storeRevenue.toFixed(2)}</div>
                    <div class="sales-label">Sales</div>
                </div>
        </div>
    `;
    
        storesGrid.appendChild(storeCard);
    });
}

// Render store cards with real data (for today)
function renderStoreCards() {
    const today = getCurrentDate();
    renderStoreCardsForDate(today);
}

// Calculate real store revenue from Firebase data
function calculateRealStoreRevenue(storeId, date) {
    const datePath = getDatePathFromString(date);
    if (!dailySalesData[storeId] || 
        !dailySalesData[storeId][datePath.year] || 
        !dailySalesData[storeId][datePath.year][datePath.month] || 
        !dailySalesData[storeId][datePath.year][datePath.month][datePath.day]) {
        return 0;
    }
    
    const storeDailySales = dailySalesData[storeId][datePath.year][datePath.month][datePath.day];
    return parseFloat(storeDailySales.total_sales || 0);
}

// Calculate real store sales count from Firebase data
function calculateRealStoreSales(storeId, date) {
    const datePath = getDatePathFromString(date);
    if (!dailySalesData[storeId] || 
        !dailySalesData[storeId][datePath.year] || 
        !dailySalesData[storeId][datePath.year][datePath.month] || 
        !dailySalesData[storeId][datePath.year][datePath.month][datePath.day]) {
        return 0;
    }
    
    const storeDailySales = dailySalesData[storeId][datePath.year][datePath.month][datePath.day];
    return parseInt(storeDailySales.transaction_count || 0);
}

// Show store detail modal with real data
async function showStoreDetail(storeId, date = null) {
    hapticFeedback();
    
    const store = storesData[storeId];
    if (!store) return;
    
    const modal = document.getElementById('storeDetailModal');
    const storeImage = getStoreImage(storeId, store.name);
    const targetDate = date || selectedDate || getCurrentDate();
    
    // Get real sales data for this store
    const dateRevenue = calculateRealStoreRevenue(storeId, targetDate);
    const dateTransactions = calculateRealStoreSales(storeId, targetDate);
    
    // Calculate week's data
    const weekData = await calculateWeekData(storeId);
    
    // Set store image
    const storeImageElement = document.querySelector('#storeDetailImage img');
    if (storeImageElement) {
        storeImageElement.src = storeImage;
        storeImageElement.onerror = function() {
            this.src = '../icons/pos.png';
        };
    }
    
    // Update modal content with real data
    document.getElementById('storeDetailName').textContent = store.name;
    document.getElementById('storeDetailAddress').textContent = store.location || 'Location not specified';
    document.getElementById('storeDetailRevenue').textContent = `RM ${dateRevenue.toFixed(2)}`;
    document.getElementById('storeDetailSales').textContent = dateTransactions.toString();
    document.getElementById('storeDetailProducts').textContent = Object.keys(productsData).length.toString();
    document.getElementById('storeDetailOrders').textContent = dateTransactions.toString();
    
    // Load recent sales for this store
    await renderStoreDetailSales(storeId, targetDate);
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Navigate to store detail view
function showStoreDetailView(storeId, date = null) {
    hapticFeedback();
    
    const store = storesData[storeId];
    if (!store) return;
    
    const targetDate = date || selectedDate || getCurrentDate();
    
    // Hide main nav-bar when entering store detail view
    const navBar = document.querySelector('.nav-bar');
    if (navBar) {
        navBar.style.display = 'none';
    }
    
    // Switch to store detail view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById('storeDetailView').classList.add('active');
    
    // Scroll to top to ensure page starts from the top
    document.getElementById('storeDetailView').scrollTop = 0;
    
    // Load store detail data
    loadStoreDetailData(storeId, targetDate);
}

// Go back to sales view
function goBackToSales() {
    hapticFeedback();
    
    // Show main nav-bar when returning to sales view
    const navBar = document.querySelector('.nav-bar');
    if (navBar) {
        navBar.style.display = 'block';
    }
    
    // Switch back to sales view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById('salesView').classList.add('active');
}

// Load store detail data
async function loadStoreDetailData(storeId, date) {
    try {
        const store = storesData[storeId];
        if (!store) return;
        
        showLoading('Loading store details...');
        
        // Get store image
        const storeImage = getStoreImage(storeId, store.name);
        
        // Update store info
        document.getElementById('storeDetailTitle').textContent = store.name;
        document.getElementById('storeDetailImage').src = storeImage;
        document.getElementById('storeDetailImage').onerror = function() {
            this.src = '../icons/pos.png';
        };
        document.getElementById('storeDetailName').textContent = store.name;
        document.getElementById('storeDetailLocation').textContent = store.location || 'Location not specified';
        
        // Get sales data for this store and date
        const datePath = getDatePathFromString(date);
        const salesRef = firebase.database().ref(`sales/${storeId}/${datePath.path}`);
        const salesSnapshot = await salesRef.once('value');
        const salesData = salesSnapshot.val() || {};
        
        // Calculate totals
            let totalSales = 0;
            let transactionCount = 0;
            
        Object.values(salesData).forEach(sale => {
            if (sale && sale.total_amount) {
                totalSales += parseFloat(sale.total_amount || 0);
                    transactionCount++;
                }
            });
            
        // Update sales summary
        document.getElementById('storeDetailTotalSales').textContent = `RM ${totalSales.toFixed(2)}`;
        document.getElementById('storeDetailTransactionText').textContent = `${transactionCount} sales transaction`;
        
        // Calculate shift sales
        const shiftSales = calculateShiftSales(salesData);
        document.getElementById('shift1Sales').textContent = `RM ${shiftSales.shift1.toFixed(2)}`;
        document.getElementById('shift2Sales').textContent = `RM ${shiftSales.shift2.toFixed(2)}`;
        
        // Render sales records
        renderSalesRecords(salesData);
        
        hideLoading();
        
    } catch (error) {
        console.error('Failed to load store detail data:', error);
        hideLoading();
        showError('Failed to load store details. Please try again.');
    }
}

// Render sales records (new function)
function renderSalesRecords(salesData) {
    const salesList = document.getElementById('salesRecordsList'); // Fixed ID
    if (!salesList) return;

    salesList.innerHTML = '';

    if (Object.keys(salesData).length === 0) {
        salesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--ios-gray-1);">
                <i class="material-icons" style="font-size: 48px; margin-bottom: 16px;">receipt_long</i>
                <div>No sales records available</div>
                </div>
        `;
        return;
    }
    
    // Convert to array and sort by timestamp (newest first)
    const salesArray = Object.entries(salesData).map(([saleId, sale]) => ({
        id: saleId,
        ...sale
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    salesArray.forEach(sale => {
        const saleDate = new Date(sale.timestamp);
        const saleTime = saleDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        const saleDateTime = saleDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        }) + ' ' + saleTime;

        const recordItem = document.createElement('div');
        recordItem.className = 'sales-record-item';
        recordItem.onclick = () => showSalesRecordDetail(sale);

        recordItem.innerHTML = `
            <div class="record-info">
                <div class="record-details">${saleDateTime}</div>
                <div class="record-cashier">Cashier: ${sale.cashierName || 'Unknown'}</div>
            </div>
            <div class="record-amount-section">
                <div class="record-amount">
                    <div class="record-total">RM ${parseFloat(sale.total_amount || 0).toFixed(2)}</div>
                    <div class="record-time">${sale.items?.length || 0} items</div>
                </div>
                <i class="material-icons detail-icon">arrow_forward_ios</i>
            </div>
        `;

        salesList.appendChild(recordItem);
    });
}

// Show sales record detail modal
function showSalesRecordDetail(sale) {
    hapticFeedback();
    
    const modal = document.getElementById('salesRecordDetailModal');
    if (!modal) return;

    // Format date and time
    const saleDate = new Date(sale.timestamp);

// 获取日期部分：日/月/年（用马来西亚常用格式）
const datePart = saleDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
});

// 获取时间部分：时:分 AM/PM（使用 12 小时制）
const timePart = saleDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
});

// 组合日期时间字符串
const formattedDateTime = `${datePart} ${timePart}`;


    // Update basic info
    document.getElementById('saleDetailBillNumber').textContent = sale.billNumber || 'N/A';
    document.getElementById('saleDetailDateTime').textContent = formattedDateTime;
    document.getElementById('saleDetailCashier').textContent = sale.cashierName || 'Unknown';
    document.getElementById('saleDetailTotal').textContent = `RM ${parseFloat(sale.total_amount || 0).toFixed(2)}`;
    document.getElementById('saleDetailShift').textContent = sale.cashierShift || 'Unknown';

    // Render items list
    const itemsList = document.getElementById('saleDetailItemsList');
    itemsList.innerHTML = '';
    
    if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
        sale.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'sale-item';
            
            itemDiv.innerHTML = `
                <div class="sale-item-info">
                    <div class="sale-item-name">${item.name || 'Unknown Item'}</div>
                    <div class="sale-item-details">Qty: ${item.quantity || 0} × RM ${parseFloat(item.price || 0).toFixed(2)}</div>
                </div>
                <div class="sale-item-amount">
                    <div class="sale-item-price">RM ${parseFloat(item.price || 0).toFixed(2)}</div>
                    <div class="sale-item-subtotal">Total: RM ${parseFloat(item.subtotal || 0).toFixed(2)}</div>
        </div>
    `;
    
            itemsList.appendChild(itemDiv);
        });
            } else {
        itemsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--ios-gray-1);">
                No items information available
            </div>
        `;
    }

    // Update summary
    const subtotal = parseFloat(sale.subtotal || sale.total_amount || 0);
    const discountAmount = parseFloat(sale.discountAmount || 0);
    const finalTotal = parseFloat(sale.total_amount || 0);

    document.getElementById('saleDetailSubtotal').textContent = `RM ${subtotal.toFixed(2)}`;
    document.getElementById('saleDetailFinalTotal').textContent = `RM ${finalTotal.toFixed(2)}`;

    // Show/hide discount row
    const discountRow = document.getElementById('discountRow');
    if (discountAmount > 0) {
        discountRow.style.display = 'flex';
        document.getElementById('saleDetailDiscount').textContent = `-RM ${discountAmount.toFixed(2)}`;
    } else {
        discountRow.style.display = 'none';
    }

    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close sales record detail modal
function closeSalesRecordDetail() {
    hapticFeedback();
    
    const modal = document.getElementById('salesRecordDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Calculate week data for a store
async function calculateWeekData(storeId) {
    let weekRevenue = 0;
    let weekTransactions = 0;
    
    // Get data for the last 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const datePath = getDatePathFromString(dateStr);
        
        if (dailySalesData[storeId] && 
            dailySalesData[storeId][datePath.year] && 
            dailySalesData[storeId][datePath.year][datePath.month] && 
            dailySalesData[storeId][datePath.year][datePath.month][datePath.day]) {
            const dayData = dailySalesData[storeId][datePath.year][datePath.month][datePath.day];
            weekRevenue += parseFloat(dayData.total_sales || 0);
            weekTransactions += parseInt(dayData.transaction_count || 0);
        }
    }
    
    return { weekRevenue, weekTransactions };
}

// Calculate shift sales from sales data
function calculateShiftSales(salesData) {
    let shift1Sales = 0;
    let shift2Sales = 0;
    
    Object.values(salesData).forEach(sale => {
        if (sale && sale.total_amount) {
            const totalAmount = parseFloat(sale.total_amount || 0);
            const cashierShift = sale.cashierShift || "";
            
            // 根据cashierShift字段计算班次销售额
            if (cashierShift.includes("1st Shift")) {
                shift1Sales += totalAmount;
            } else if (cashierShift.includes("2nd Shift")) {
                shift2Sales += totalAmount;
            }
        }
    });
    
    return { shift1: shift1Sales, shift2: shift2Sales };
}

// Render store detail sales with real data
async function renderStoreDetailSales(storeId, date = null) {
    const salesList = document.getElementById('storeDetailSalesList');
    if (!salesList) return;
    
    salesList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading sales data...</div>';
    
    try {
        const targetDate = date || selectedDate || getCurrentDate();
        const datePath = getDatePathFromString(targetDate);
        
        // Get detailed sales for the selected date
        const salesRef = firebase.database().ref(`sales/${storeId}/${datePath.path}`);
        const salesSnapshot = await salesRef.once('value');
        const salesData = salesSnapshot.val() || {};
        
        salesList.innerHTML = '';
        
        if (Object.keys(salesData).length === 0) {
            const dateObj = new Date(targetDate);
            const dateString = dateObj.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            salesList.innerHTML = `<div style="text-align: center; padding: 20px; color: #8E8E93;">No sales data available for ${dateString}</div>`;
                return;
            }
            
        // Convert to array and sort by timestamp
        const salesArray = Object.entries(salesData).map(([saleId, sale]) => ({
            id: saleId,
            ...sale
        })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Create sales list HTML
        const dateObj = new Date(targetDate);
        const dateString = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        let salesHTML = `<h4 style="margin: 20px 0 10px; color: #1D1D1F; font-weight: 700;">Sales for ${dateString}</h4>`;
        
        // Display recent sales
        salesArray.slice(0, 10).forEach(sale => {
            const saleTime = new Date(sale.timestamp).toLocaleTimeString();
            const itemCount = sale.items ? sale.items.length : 0;
            
            salesHTML += `
                <div style="background: #F2F1F6; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; color: #1D1D1F; font-size: 16px;">Bill #${sale.billNumber || 'N/A'}</div>
                            <div style="font-size: 13px; color: #8E8E93; margin-top: 4px;">${itemCount} items • ${saleTime}</div>
            </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: #34C759; font-size: 18px;">RM ${parseFloat(sale.total_amount || 0).toFixed(2)}</div>
                            <div style="font-size: 13px; color: #8E8E93; margin-top: 4px;">Sale</div>
                    </div>
                    </div>
                </div>
            `;
        });
        
        salesList.innerHTML = salesHTML;
        
    } catch (error) {
        console.error('Failed to load store sales details:', error);
        salesList.innerHTML = '<div style="text-align: center; padding: 20px; color: #FF3B30;">Failed to load sales data</div>';
    }
}

// Close store detail
function closeStoreDetail() {
    const modal = document.getElementById('storeDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Load stock data
async function loadStockData() {
    try {
        const productList = document.getElementById('productList');
        productList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading inventory data...</div>';

        // Test image loading
        testImageLoading();
        
        // Show available image mappings
        showAvailableImageMappings();
        
        await loadProducts();
        
        // Populate category filter after loading products
        populateCategoryFilter();
        
        filterProducts();
    } catch (error) {
        console.error('Failed to load stock data:', error);
        const productList = document.getElementById('productList');
        if (productList) {
            productList.innerHTML = '<div style="text-align: center; padding: 40px; color: #FF3B30;">Failed to load inventory data</div>';
        }
        showError('Failed to load inventory data. Please try again.');
    }
}

// Populate store selector
function populateStoreSelector() {
    const storeSelector = document.getElementById('storeSelector');
    if (!storeSelector) return;

    // Clear existing options
    storeSelector.innerHTML = '';

    // Add individual store options
    let firstStore = true;
    Object.entries(storesData).forEach(([storeId, store]) => {
        const option = document.createElement('option');
        option.value = storeId;
        option.textContent = store.name || storeId;
        if (firstStore) {
            option.selected = true;
            firstStore = false;
        }
        storeSelector.appendChild(option);
    });
}

// Populate category filter
function populateCategoryFilter() {
    if (!categoryFilter) return;
    
    console.log('Populating category filter...');
    console.log('Available products:', Object.keys(productsData).length);
    
    // Get selected store
    const selectedStore = document.getElementById('storeSelector')?.value;
    console.log('Selected store for category filter:', selectedStore);
    
    // Get categories from selected store only
    const categories = ['all'];
    
    Object.values(productsData).forEach(product => {
        if (product.store_id === selectedStore && product.category && !categories.includes(product.category)) {
            categories.push(product.category);
        }
    });
    
    console.log('Found categories for store', selectedStore, ':', categories);
    
    // Save current selection
    const selectedValue = categoryFilter.value;
    
    // Clear all options except the first one
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add category options
    categories.forEach(category => {
        if (category !== 'all') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        }
    });
    
    // Restore previous selection if it's still valid
    if (selectedValue && selectedValue !== 'all' && categories.includes(selectedValue)) {
        categoryFilter.value = selectedValue;
    } else {
        // Reset to "all" if previous selection is no longer valid
        categoryFilter.value = 'all';
    }
    
    console.log('Category filter populated with', categories.length, 'options');
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const activeFilter = document.querySelector('.filter-tab.active')?.getAttribute('data-filter') || 'all';
    const selectedStore = document.getElementById('storeSelector')?.value || 'all';
    const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
    
    console.log('Filtering products with:', {
        searchTerm,
        activeFilter,
        selectedStore,
        selectedCategory
    });
    
    console.log('Category filter element:', categoryFilter);
    console.log('Category filter value:', selectedCategory);
    console.log('Available products data:', Object.keys(productsData).length);
    
    const productList = document.getElementById('productList');
    if (!productList) return;

    productList.innerHTML = '';
    
    const filteredProducts = Object.entries(productsData).filter(([_, product]) => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (product.name && product.name.toLowerCase().includes(searchTerm)) ||
            (product.id && product.id.toLowerCase().includes(searchTerm));
        
        // Store filter
        const matchesStore = product.store_id === selectedStore;
        
        // Category filter
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        
        // Stock status filter - 使用 stock 字段或 quantity 字段
        const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        let matchesFilter = true;
        
        switch (activeFilter) {
            case 'low':
                matchesFilter = stock > 0 && stock <= 10;
            break;
            case 'out':
                matchesFilter = stock === 0;
            break;
            case 'all':
            default:
                matchesFilter = true;
        }
        
        const matches = matchesSearch && matchesStore && matchesCategory && matchesFilter;
        
        // Enhanced debug logging
        if (selectedCategory !== 'all') {
            console.log(`Product ${product.name} (${product.id}) filtering details:`, {
                productCategory: product.category,
                selectedCategory: selectedCategory,
                matchesSearch,
                matchesStore,
                matchesCategory,
                matchesFilter,
                finalMatches: matches
            });
        }
        
        return matches;
    });

    if (filteredProducts.length === 0) {
        productList.innerHTML = '<div style="text-align: center; padding: 40px; color: #8E8E93;">No matching products found</div>';
        return;
    }
    
    // Collect all product images for preloading
    const productImages = [];
    
    filteredProducts.forEach(([productId, product]) => {
        const stock = product.stock !== undefined ? product.stock : (product.quantity || 0);
        const productImage = getProductImage(product.name);
        
        // Add to preload list if it's a real product image
        if (productImage !== '../icons/pos.png') {
            productImages.push(productImage);
        }

        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        
        // 确定库存状态的CSS类
        let stockClass = 'stock';
        if (stock === 0) {
            stockClass = 'stock out';
        } else if (stock <= 10) {
            stockClass = 'stock low';
        }
        
        // 计算显示价格（如果启用促销价格则使用促销价格，否则使用正常价格）
        const displayPrice = (product.promotionEnabled && product.promotionPrice !== null && product.promotionPrice !== undefined) 
            ? product.promotionPrice 
            : product.price;
        const hasPromotion = product.promotionEnabled && product.promotionPrice !== null && product.promotionPrice !== undefined;
        
        // 构建价格显示HTML
        let priceDisplayHTML = '';
        if (hasPromotion) {
            priceDisplayHTML = `<span class="product-price" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center;">
                <span style="text-decoration: line-through; color: #999; font-size: 0.85em;">RM${parseFloat(product.price || 0).toFixed(2)}</span>
                <span style="color: #FF3B30; font-weight: bold;">RM${displayPrice.toFixed(2)}</span>
            </span>`;
        } else {
            priceDisplayHTML = `<span class="product-price">RM ${displayPrice.toFixed(2)}</span>`;
        }
        
        const escapedProductName = (product.name || 'Product').replace(/'/g, "\\'");
        const escapedImagePath = productImage.replace(/'/g, "\\'");
        
        // Test if this is actually a product image or fallback
        const isProductImage = productImage !== '../icons/pos.png';
        
        // Log product matching status
        if (isProductImage) {
            console.log(`✅ Product "${product.name}" -> Image: ${productImage}`);
        } else {
            console.log(`❌ Product "${product.name}" -> No image match, using default icon`);
        }
        
        if (isProductImage) {
            productItem.innerHTML = `
                <div class="product-icon product-image-container" onclick="showImageModal('${escapedImagePath}', '${escapedProductName}')">
                    <img src="${productImage}" alt="${product.name || 'Product'}" 
                         class="product-image"
                         onload="console.log('✅ Image loaded: ${productImage}'); this.style.opacity='1';"
                         onerror="console.log('❌ Image failed: ${productImage}'); this.parentElement.innerHTML='<i class=\\"material-icons\\" style=\\"font-size: 20px; color: var(--ios-blue);\\">inventory_2</i>'; this.parentElement.classList.remove('product-image-container');">
                </div>
                <div class="product-details">
                    <div class="product-name">${product.name || 'Unnamed Product'}${hasPromotion ? ' <span style="color: #FF3B30; font-size: 0.85em;"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">local_offer</i></span>' : ''}</div>
                    <div class="product-category">${product.category || 'Uncategorized'}</div>
                    <div class="product-price-stock">
                        ${priceDisplayHTML}
                        <span class="price-stock-separator">|</span>
                        <span class="product-stock-badge ${stockClass}">Stock: ${stock}</span>
                    </div>
                </div>
            `;
        } else {
            // Use default icon
            productItem.innerHTML = `
                <div class="product-icon" onclick="showImageModal('${escapedImagePath}', '${escapedProductName}')">
                    <i class="material-icons">inventory_2</i>
                </div>
                <div class="product-details">
                    <div class="product-name">${product.name || 'Unnamed Product'}${hasPromotion ? ' <span style="color: #FF3B30; font-size: 0.85em;"><i class="material-icons" style="font-size: 12px; vertical-align: middle;">local_offer</i></span>' : ''}</div>
                    <div class="product-category">${product.category || 'Uncategorized'}</div>
                    <div class="product-price-stock">
                        ${priceDisplayHTML}
                        <span class="price-stock-separator">|</span>
                        <span class="product-stock-badge ${stockClass}">Stock: ${stock}</span>
                    </div>
                </div>
            `;
        }
        
        productList.appendChild(productItem);
    });
    
    // Batch preload images for better performance
    if (productImages.length > 0) {
        batchPreloadImages(productImages);
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = '../index.html';
        }).catch(error => {
            console.error('Logout failed:', error);
            alert('Logout failed, please try again');
        });
    }
}

// Click outside modal to close
document.addEventListener('click', function(event) {
    const modal = document.getElementById('storeDetailModal');
    if (event.target === modal) {
        closeStoreDetail();
    }
});

// Auto refresh is disabled - users can manually refresh using the refresh button

// iOS style haptic feedback (if supported)
function hapticFeedback() {
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

// Show loading state
function showLoading(message = 'Loading...') {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// Hide loading state
function hideLoading() {
    const loadingDiv = document.querySelector('.loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Add haptic feedback to interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add haptic feedback to buttons
    document.querySelectorAll('.nav-item, .store-card, .product-item, .stat-card').forEach(element => {
        element.addEventListener('touchstart', hapticFeedback);
            });
    });

// ====== 维护模式管理功能 ======

// 检查维护状态
function checkMaintenanceStatus() {
    return firebase.database().ref('system/maintenance').once('value').then(snapshot => {
        return snapshot.val() || { enabled: false };
    });
}

// 显示维护页面
function showMaintenancePage() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                padding: 20px;
                text-align: center;
                background: linear-gradient(135deg, #6d6e73 0%, #000000 100%);
                color: white;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 350px;
                    width: 100%;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <div style="font-size: 80px; margin-bottom: 20px;">🔧</div>
                 
                    <h2 style="
                        font-size: 24px;
                        font-weight: 600;
                        margin-bottom: 20px;
                        opacity: 0.9;
                    ">Server is Under Maintenance</h2>
                    <p style="
                        font-size: 16px;
                        line-height: 1.6;
                        opacity: 0.8;
                        margin-bottom: 30px;
             
                    ">We are performing system maintenance. Please try again later.</p>
                    <div style="
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        margin-top: 30px;
                    ">
                        <button onclick="checkMaintenanceAndRetry()" style="
                            background: rgba(255, 255, 255, 0.2);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            color: white;
                            padding: 12px 24px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                           onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                              Retry
                        </button>
                        <button onclick="logout()" style="
                            background: rgba(255, 255, 255, 0.2);
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            color: white;
                            padding: 12px 24px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            backdrop-filter: blur(10px);
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                           onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                             Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// 重新检查维护状态并尝试重新进入应用
function checkMaintenanceAndRetry() {
    showLoading('正在检查系统状态...');
    
    checkMaintenanceStatus().then(maintenanceData => {
        hideLoading();
        
        if (!maintenanceData.enabled) {
            // 维护模式已关闭，重新加载页面
            location.reload();
        } else {
            // 维护模式仍然开启
            showError('System error. Please try again later');
        }
    }).catch(error => {
        hideLoading();
        console.error('检查维护状态失败:', error);
        showError('检查失败，请检查网络连接');
    });
}

// Show image modal for product images - Optimized version
function showImageModal(imageSrc, productName) {
    hapticFeedback();
    
    // Use cached modal if available
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = createImageModal();
        document.body.appendChild(modal);
    }
    
    // Check if this is the same image to avoid unnecessary updates
    const currentImg = document.getElementById('imageModalImg');
    if (currentImg && currentImg.src === imageSrc && modal.style.display === 'flex') {
        return; // Already showing this image
    }
    
    // Preload image before showing modal
    preloadImage(imageSrc).then(() => {
        // Update modal content
        document.getElementById('imageModalTitle').textContent = productName || 'Product Image';
        const modalImg = document.getElementById('imageModalImg');
        modalImg.src = imageSrc;
        modalImg.alt = productName || 'Product Image';
        
        // Show modal with optimized animation
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add loading class for smooth transition
        modal.classList.add('modal-loading');
        setTimeout(() => {
            modal.classList.remove('modal-loading');
        }, 100);
    }).catch(() => {
        // If image fails to load, show modal anyway with fallback
        document.getElementById('imageModalTitle').textContent = productName || 'Product Image';
        const modalImg = document.getElementById('imageModalImg');
        modalImg.src = '../icons/pos.png'; // Fallback image
        modalImg.alt = productName || 'Product Image';
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
}

// Create optimized image modal
function createImageModal() {
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <div class="image-modal-header">
                <div class="image-modal-title" id="imageModalTitle"></div>
                <button class="close-btn" onclick="closeImageModal()">
                    <i class="material-icons" style="font-size: 18px;">close</i>
                </button>
            </div>
            <div class="image-modal-body">
                <img id="imageModalImg" src="" alt="" loading="lazy" />
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal();
        }
    });
    
    return modal;
}

// Preload image for better performance
function preloadImage(src) {
    return new Promise((resolve, reject) => {
        if (!src || src === '../icons/pos.png') {
            resolve(); // Skip preloading for fallback images
            return;
        }
        
        // Check if image is already cached
        if (imageCache.has(src)) {
            resolve();
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            imageCache.set(src, true);
            resolve();
        };
        img.onerror = () => {
            imageCache.set(src, false);
            reject();
        };
        img.src = src;
    });
}

// Batch preload images for better performance
function batchPreloadImages(imageUrls) {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;
    
    // Filter out fallback images and already cached images
    const urlsToPreload = imageUrls.filter(url => 
        url && 
        url !== '../icons/pos.png' && 
        !imageCache.has(url)
    );
    
    if (urlsToPreload.length === 0) return;
    
    console.log(`🔄 Preloading ${urlsToPreload.length} images...`);
    
    // Preload images in batches to avoid overwhelming the browser
    const batchSize = 3;
    for (let i = 0; i < urlsToPreload.length; i += batchSize) {
        const batch = urlsToPreload.slice(i, i + batchSize);
        setTimeout(() => {
            batch.forEach(url => {
                preloadImage(url).catch(() => {
                    // Silently handle preload failures
                });
            });
        }, i * 100); // Stagger preloading
    }
}

// Close image modal - Optimized version
function closeImageModal() {
    hapticFeedback();
    
    const modal = document.getElementById('imageModal');
    if (modal) {
        // Add closing animation class
        modal.classList.add('modal-closing');
        
        // Hide modal after animation
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('modal-closing');
            document.body.style.overflow = '';
        }, 150);
    }
}

// 全局暴露函数
window.checkMaintenanceAndRetry = checkMaintenanceAndRetry;
window.showImageModal = showImageModal;
window.closeImageModal = closeImageModal;

// Debug function for category filter
window.debugCategoryFilter = function() {
    console.log('=== Category Filter Debug ===');
    console.log('Category filter element:', categoryFilter);
    console.log('Category filter value:', categoryFilter ? categoryFilter.value : 'undefined');
    console.log('Available products:', Object.keys(productsData).length);
    
    // Get selected store
    const selectedStore = document.getElementById('storeSelector')?.value;
    console.log('Selected store:', selectedStore);
    
    // Show sample products with categories
    const productsWithCategories = Object.values(productsData).filter(p => p.category);
    console.log('Products with categories:', productsWithCategories.length);
    console.log('Sample products:', productsWithCategories.slice(0, 3));
    
    // Show all unique categories
    const allCategories = [...new Set(Object.values(productsData).map(p => p.category).filter(Boolean))];
    console.log('All unique categories:', allCategories);
    
    // Show categories for selected store
    if (selectedStore) {
        const storeCategories = [...new Set(
            Object.values(productsData)
                .filter(p => p.store_id === selectedStore && p.category)
                .map(p => p.category)
        )];
        console.log(`Categories for store "${selectedStore}":`, storeCategories);
    }
    
    // Test filtering
    if (categoryFilter && categoryFilter.value !== 'all') {
        const testFilter = Object.values(productsData).filter(p => p.category === categoryFilter.value);
        console.log(`Products matching category "${categoryFilter.value}":`, testFilter.length);
        console.log('Sample matches:', testFilter.slice(0, 3));
    }
};

// Performance monitoring function for image loading
window.debugImagePerformance = function() {
    console.log('=== Image Performance Debug ===');
    console.log('Image cache size:', imageCache.size);
    console.log('Cached images:', Array.from(imageCache.entries()));
    console.log('Preload queue length:', preloadQueue.length);
    
    // Show cache hit rate
    const totalImages = Object.keys(productsData).length;
    const cachedImages = Array.from(imageCache.values()).filter(Boolean).length;
    const hitRate = totalImages > 0 ? (cachedImages / totalImages * 100).toFixed(1) : 0;
    console.log(`Cache hit rate: ${hitRate}% (${cachedImages}/${totalImages})`);
    
    // Show memory usage estimate
    const estimatedMemory = imageCache.size * 0.1; // Rough estimate in MB
    console.log(`Estimated memory usage: ~${estimatedMemory.toFixed(2)} MB`);
};

