// adminp.js - iOS Style Mobile Admin Interface

let currentUser = null;
let currentView = 'sales';
let storesData = {};
let productsData = {};
let salesData = {};
let dailySalesData = {};
let selectedDate = null;

// Timer system variables
let activeTimers = {}; // Stores timestamps: { storeId: timestamp }
let timerInterval = null;

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
    'tamoi': '../shop/tamoi.png',
    'nooodles': '../shop/nooodles.png',
    'kopikita': '../shop/kopikita.png',
    
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

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin panel initializing...');
    initializeApp();
    setupEventListeners();
    // Start the global timer loop
    startLiveTimer();
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
        item.addEventListener('click', function () {
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
        tab.addEventListener('click', function () {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterProducts();
        });
    });

    // Store selector
    const storeSelector = document.getElementById('storeSelector');
    if (storeSelector) {
        storeSelector.addEventListener('change', function () {
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
        datePickerInput.addEventListener('change', function () {
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

    // Initialize the Flights API system independently so it never gets blocked by other failures
    initFlightsSystem();
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
            loadTopProductsStats(date);
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

// Load top 3 products by qty and by revenue for the given date across all stores
async function loadTopProductsStats(date) {
    const qtyEl = document.getElementById('top3QtyList');
    const revEl = document.getElementById('top3RevenueList');
    if (!qtyEl || !revEl) return;

    qtyEl.innerHTML = '<div class="top3-empty">Loading...</div>';
    revEl.innerHTML = '<div class="top3-empty">Loading...</div>';

    try {
        const datePath = getDatePathFromString(date);
        const storeIds = Object.keys(storesData);

        // Fetch all stores' sales in parallel
        const results = await Promise.all(
            storeIds.map(storeId =>
                firebase.database()
                    .ref(`sales/${storeId}/${datePath.path}`)
                    .once('value')
                    .then(snap => snap.val() || {})
                    .catch(() => ({}))
            )
        );

        // Aggregate products
        const qtyMap = {};   // productName -> total quantity
        const revMap = {};   // productName -> total revenue (RM)

        results.forEach(storeSales => {
            Object.values(storeSales).forEach(sale => {
                if (!sale || !sale.items) return;
                sale.items.forEach(item => {
                    const name = (item.name || item.productName || item.product_name || 'Unknown').trim();
                    const qty = parseInt(item.quantity || item.qty || 1);
                    const price = parseFloat(item.price || item.unit_price || 0);
                    const subtotal = parseFloat(item.subtotal || item.total || (price * qty) || 0);

                    if (!qtyMap[name]) qtyMap[name] = 0;
                    if (!revMap[name]) revMap[name] = 0;
                    qtyMap[name] += qty;
                    revMap[name] += subtotal || (price * qty);
                });
            });
        });

        // Build top 3
        const rankClasses = ['r1', 'r2', 'r3'];

        // --- Top 3 by Quantity ---
        const topQty = Object.entries(qtyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (topQty.length === 0) {
            qtyEl.innerHTML = '<div class="top3-empty">暂无数据</div>';
        } else {
            qtyEl.innerHTML = topQty.map(([name, qty], i) => `
                <div class="top3-item">
                    <span class="top3-rank ${rankClasses[i]}">${i + 1}</span>
                    <span class="top3-name" title="${name}">${name}</span>
                    <span class="top3-val">${qty} 件</span>
                </div>
            `).join('');
        }

        // --- Top 3 by Revenue ---
        const topRev = Object.entries(revMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (topRev.length === 0) {
            revEl.innerHTML = '<div class="top3-empty">暂无数据</div>';
        } else {
            revEl.innerHTML = topRev.map(([name, rev], i) => `
                <div class="top3-item">
                    <span class="top3-rank ${rankClasses[i]}">${i + 1}</span>
                    <span class="top3-name" title="${name}">${name}</span>
                    <span class="top3-val" style="color:#34C759;">RM ${rev.toFixed(2)}</span>
                </div>
            `).join('');
        }

    } catch (err) {
        console.error('Failed to load top products stats:', err);
        qtyEl.innerHTML = '<div class="top3-empty">加载失败</div>';
        revEl.innerHTML = '<div class="top3-empty">加载失败</div>';
    }
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

// ====== REAL TIME TIMER LOGIC ======

/**
 * Starts the global interval to update all active counters every second.
 */
function startLiveTimer() {
    if (timerInterval) clearInterval(timerInterval);

    // Update immediately, then every second
    updateAllTimers();
    timerInterval = setInterval(updateAllTimers, 1000);
}

/**
 * Iterates through all known store timestamps and updates their DOM elements.
 */
function updateAllTimers() {
    const now = new Date();

    Object.keys(activeTimers).forEach(storeId => {
        const timestamp = activeTimers[storeId];
        const el = document.getElementById(`last-sale-time-${storeId}`);

        if (el && timestamp) {
            const diffInSeconds = Math.floor((now - new Date(timestamp)) / 1000);

            // Format time string
            let timeString = '';
            let color = '';

            if (diffInSeconds < 60) {
                timeString = `${diffInSeconds}s `;
                color = '#34C759'; // Bright Green (Active)
            } else {
                const minutes = Math.floor(diffInSeconds / 60);
                const seconds = diffInSeconds % 60;

                if (minutes < 60) {
                    timeString = `${minutes}m ${seconds}s `;
                    color = '#34C759'; // Green (Active)
                } else {
                    const hours = Math.floor(minutes / 60);
                    const remainingMinutes = minutes % 60;

                    if (hours < 24) {
                        timeString = `${hours}h ${remainingMinutes}m ${seconds}s `;
                        // Logic for color based on inactivity
                        if (hours >= 3) {
                            color = '#FF3B30'; // Grey (Inactive)
                        } else {
                            color = '#FF9500'; // Orange (Idle)
                        }
                    } else {
                        // Over 24 hours, show date instead of seconds
                        const dateObj = new Date(timestamp);
                        timeString = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        color = '#8E8E93';
                    }
                }
            }

            el.textContent = timeString;
            el.style.color = color;
            // Use tabular-nums to prevent jitter when numbers change width
            el.style.fontVariantNumeric = 'tabular-nums';
            el.style.fontWeight = '600';
        }
    });
}

/**
 * Fetches the most recent sale for a specific store and date,
 * then updates the global timer registry.
 */
function updateLastSaleTime(storeId, date) {
    const datePath = getDatePathFromString(date);
    const labelId = `last-sale-time-${storeId}`;
    const el = document.getElementById(labelId);

    if (!el) return;

    // Use firebase limitToLast to fetch only the most recent transaction
    firebase.database().ref(`sales/${storeId}/${datePath.path}`)
        .orderByChild('timestamp')
        .limitToLast(1)
        .once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const key = Object.keys(data)[0];
                const sale = data[key];

                if (sale && sale.timestamp) {
                    // STORE THE TIMESTAMP IN GLOBAL OBJECT
                    activeTimers[storeId] = sale.timestamp;

                    // Trigger immediate update for this specific element so user doesn't wait 1s
                    // We don't call updateAllTimers here to save performance, just let the interval handle it next tick
                    // But we can manually set text for instant feedback
                    el.textContent = 'Calculating...';
                } else {
                    delete activeTimers[storeId]; // Remove if no data
                    el.textContent = 'No Sales';
                    el.style.color = '#8E8E93';
                }
            } else {
                delete activeTimers[storeId]; // Remove if no data
                el.textContent = 'No Sales';
                el.style.color = '#8E8E93';
            }
        })
        .catch(err => {
            console.error(`Error fetching last sale for ${storeId}:`, err);
            el.textContent = 'No Sales';
        });
}

// Render store cards for specific date
function renderStoreCardsForDate(date) {
    const storesGrid = document.getElementById('storesGrid');
    if (!storesGrid) return;

    storesGrid.innerHTML = '';

    // Reset timers map when rendering new cards
    activeTimers = {};

    if (Object.keys(storesData).length === 0) {
        storesGrid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading stores data...</div>';
        return;
    }

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
                    <div class="sales-label" id="last-sale-time-${storeId}" style="min-width: 80px; text-align: right;">Checking...</div>
                </div>
            </div>
        `;

        storesGrid.appendChild(storeCard);
    });

    // After rendering HTML, trigger the async fetch for last sale times
    Object.keys(storesData).forEach(storeId => {
        updateLastSaleTime(storeId, date);
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
        storeImageElement.onerror = function () {
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
        document.getElementById('storeDetailImage').onerror = function () {
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

        // 同步并应用布局设置
        if (typeof window.syncProductLayout === 'function') {
            window.syncProductLayout();
        }

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
document.addEventListener('click', function (event) {
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
document.addEventListener('DOMContentLoaded', function () {
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
window.debugCategoryFilter = function () {
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
window.debugImagePerformance = function () {
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

// ====== TOP 3 MODAL ======

// Store the full aggregated data so modal can read it
let _top3QtyData = [];   // [{name, qty}]
let _top3RevData = [];   // [{name, rev}]

// Override loadTopProductsStats to also cache full data for modal
const _origLoadTopProductsStats = loadTopProductsStats;
loadTopProductsStats = async function (date) {
    const qtyEl = document.getElementById('top3QtyList');
    const revEl = document.getElementById('top3RevenueList');
    if (!qtyEl || !revEl) return;

    qtyEl.innerHTML = '<div class="top3-empty">Loading...</div>';
    revEl.innerHTML = '<div class="top3-empty">Loading...</div>';

    try {
        const datePath = getDatePathFromString(date);
        const storeIds = Object.keys(storesData);

        const results = await Promise.all(
            storeIds.map(storeId =>
                firebase.database()
                    .ref(`sales/${storeId}/${datePath.path}`)
                    .once('value')
                    .then(snap => snap.val() || {})
                    .catch(() => ({}))
            )
        );

        const qtyMap = {};
        const revMap = {};

        results.forEach(storeSales => {
            Object.values(storeSales).forEach(sale => {
                if (!sale || !sale.items) return;
                sale.items.forEach(item => {
                    const name = (item.name || item.productName || item.product_name || 'Unknown').trim();
                    const qty = parseInt(item.quantity || item.qty || 1);
                    const price = parseFloat(item.price || item.unit_price || 0);
                    const subtotal = parseFloat(item.subtotal || item.total || 0) || (price * qty);

                    if (!qtyMap[name]) qtyMap[name] = 0;
                    if (!revMap[name]) revMap[name] = 0;
                    qtyMap[name] += qty;
                    revMap[name] += subtotal;
                });
            });
        });

        // Cache full sorted arrays
        _top3QtyData = Object.entries(qtyMap).sort((a, b) => b[1] - a[1]).map(([name, qty]) => ({ name, qty }));
        _top3RevData = Object.entries(revMap).sort((a, b) => b[1] - a[1]).map(([name, rev]) => ({ name, rev }));

        const rankClasses = ['r1', 'r2', 'r3'];

        // Render compact top 3 in cards
        const topQty = _top3QtyData.slice(0, 3);
        qtyEl.innerHTML = topQty.length === 0
            ? '<div class="top3-empty">暂无数据</div>'
            : topQty.map(({ name, qty }, i) => `
                <div class="top3-item">
                    <span class="top3-rank ${rankClasses[i]}">${i + 1}</span>
                    <span class="top3-name" title="${name}">${name}</span>
                    <span class="top3-val">${qty} 件</span>
                </div>`).join('');

        const topRev = _top3RevData.slice(0, 3);
        revEl.innerHTML = topRev.length === 0
            ? '<div class="top3-empty">暂无数据</div>'
            : topRev.map(({ name, rev }, i) => `
                <div class="top3-item">
                    <span class="top3-rank ${rankClasses[i]}">${i + 1}</span>
                    <span class="top3-name" title="${name}">${name}</span>
                    <span class="top3-val" style="color:#34C759;">RM ${rev.toFixed(2)}</span>
                </div>`).join('');

    } catch (err) {
        console.error('Failed to load top products stats:', err);
        qtyEl.innerHTML = '<div class="top3-empty">加载失败</div>';
        revEl.innerHTML = '<div class="top3-empty">加载失败</div>';
    }
};

// Open the Top 3 modal
function openTop3Modal(type) {
    const modal = document.getElementById('top3Modal');
    const title = document.getElementById('top3ModalTitle');
    const body = document.getElementById('top3ModalBody');
    if (!modal || !title || !body) return;

    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const rankTextColors = ['#7a5c00', '#555', '#fff'];

    if (type === 'qty') {
        title.textContent = '今日 Top 10 — 数量排行';

        if (_top3QtyData.length === 0) {
            body.innerHTML = '<p style="text-align:center;color:var(--ios-gray-1);padding:30px 0;">暂无数据</p>';
        } else {
            body.innerHTML = _top3QtyData
                .slice(0, 10)   // ✅ 只取前10
                .map(({ name, qty }, i) => `
                <div style="
                    display:flex; align-items:center; gap:12px;
                    padding:14px 0;
                    border-bottom:0.5px solid var(--ios-gray-5);
                ">
                    <div style="
                        width:28px; height:28px; border-radius:50%; flex-shrink:0;
                        background:${rankColors[i] || '#e5e5ea'};
                        color:${rankTextColors[i] || '#333'};
                        display:flex; align-items:center; justify-content:center;
                        font-weight:700; font-size:13px;
                    ">${i + 1}</div>

                    <div style="flex:1; font-size:14px; font-weight:600; color:var(--ios-label); line-height:1.4;">
                        ${name}
                    </div>

                    <div style="font-size:15px; font-weight:700; color:var(--ios-blue); white-space:nowrap;">
                        ${qty} 件
                    </div>
                </div>
            `).join('');
        }

    } else {

        title.textContent = '今日 Top 10 — 总金额排行';

        if (_top3RevData.length === 0) {
            body.innerHTML = '<p style="text-align:center;color:var(--ios-gray-1);padding:30px 0;">暂无数据</p>';
        } else {
            body.innerHTML = _top3RevData
                .slice(0, 10)   // ✅ 只取前10
                .map(({ name, rev }, i) => `
                <div style="
                    display:flex; align-items:center; gap:12px;
                    padding:14px 0;
                    border-bottom:0.5px solid var(--ios-gray-5);
                ">
                    <div style="
                        width:28px; height:28px; border-radius:50%; flex-shrink:0;
                        background:${rankColors[i] || '#e5e5ea'};
                        color:${rankTextColors[i] || '#333'};
                        display:flex; align-items:center; justify-content:center;
                        font-weight:700; font-size:13px;
                    ">${i + 1}</div>

                    <div style="flex:1; font-size:14px; font-weight:600; color:var(--ios-label); line-height:1.4;">
                        ${name}
                    </div>

                    <div style="font-size:15px; font-weight:700; color:#34C759; white-space:nowrap;">
                        RM ${rev.toFixed(2)}
                    </div>
                </div>
            `).join('');
        }
    }

    modal.style.display = 'flex';

    modal.onclick = function (e) {
        if (e.target === modal) closeTop3Modal();
    };
}
// Close the Top 3 modal
function closeTop3Modal() {
    const modal = document.getElementById('top3Modal');
    if (modal) modal.style.display = 'none';
}

// ==== FLIGHTS SYSTEM IMPLEMENTATION ==== //
const AERODATABOX_API_KEY  = 'c69d3f33bamshf7767ebd0b81927p146247jsn01d73a7a775b';
const AERODATABOX_API_HOST = 'aerodatabox.p.rapidapi.com';
const AIRPORT_IATA = 'BKI';

async function initFlightsSystem() {
    const todayStr = getCurrentDate();
    const flightCacheRef = firebase.database().ref('flight_cache');

    try {
        const snapshot = await flightCacheRef.once('value');
        const cacheData = snapshot.val() || {};
        const lastFetchDate = cacheData.last_fetch_date || '';

        if (lastFetchDate !== todayStr) {
            // 今天还没抓过 → 抓取（每天只抓一次，节省 API 配额）
            await fetchAeroDataBoxFlights(flightCacheRef, todayStr);
        } else {
            // 今天已抓过 → 直接读 Firebase 缓存，不再消耗 API 次数
            renderFlightsUI(cacheData.flights_data || [], cacheData.last_update_timestamp || '--');
        }
    } catch (err) {
        console.error('Flights system err:', err);
    }
}

// 将 AeroDataBox 的 status 字符串映射到我们内部的 status 值
function _mapAeroStatus(s) {
    switch (s) {
        case 'Departed':               return 'active';
        case 'EnRoute':                return 'active';
        case 'Landed':                 return 'landed';
        case 'Arrived':                return 'landed';
        case 'Canceled':               return 'cancelled';
        case 'Delayed':                return 'delayed';
        case 'GateClosed':             return 'scheduled';
        case 'CheckIn':                return 'scheduled';
        case 'Expected':               return 'scheduled';
        case 'Scheduled':              return 'scheduled';
        default:                       return (s || 'unknown').toLowerCase();
    }
}

async function fetchAeroDataBoxFlights(firebaseRef, todayStr) {
    try {
        // ── Step 1: 分两个时间窗抓取全天数据 ─────────────────────────────
        // AeroDataBox 每次请求最多 12 小时，所以分两段覆盖全天
        // 直接调用 RapidAPI（RapidAPI 所有 API 均支持浏览器 CORS）
        const timeWindows = [
            { from: `${todayStr}T00:00`, to: `${todayStr}T11:59` },
            { from: `${todayStr}T12:00`, to: `${todayStr}T23:59` }
        ];
        const allRaw = [];

        for (const slot of timeWindows) {
            try {
                const url = `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${AIRPORT_IATA}/${slot.from}/${slot.to}?withLeg=true&direction=Departure&withCancelled=false&withCodeshared=false&withCargo=false&withPrivate=false&withLocation=false`;
                const res = await fetch(url, {
                    headers: {
                        'X-RapidAPI-Key':  AERODATABOX_API_KEY,
                        'X-RapidAPI-Host': AERODATABOX_API_HOST
                    }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const batch = json?.departures || [];
                console.log(`[Flights] AeroDataBox ${slot.from}→${slot.to}: ${batch.length} 班次`);
                allRaw.push(...batch);

                // 添加 1.2 秒的延迟，防止触发 RapidAPI 每秒速率限制报错
                await new Promise(r => setTimeout(r, 1200));
            } catch (e) {
                console.warn(`[Flights] 时间窗 ${slot.from} 失败:`, e);
                // 第二段失败不影响第一段已有的数据
            }
        }

        if (allRaw.length === 0) throw new Error('No flight data returned');

        // ── Step 2: 过滤 + 去重 ──────────────────────────────────────────
        // AeroDataBox 的过滤参数已在 URL 中指定 (withCodeshared=false, withCargo=false)
        const seenPhysicalFlights = new Set();
        const finalMap = new Map(); // 用 Map 做唯一航班号的终极覆盖去重

        allRaw.forEach(f => {
            if (f.isCargo === true) return;
            if (f.codeshareStatus === 'IsCodeshare') return;
            if (f.status === 'Canceled' || f.status === 'Cancelled') return;

            // 过滤那些连目的地或航空公司都不属于(Unknown)的 "测试/无效航班"
            if (!f.arrival?.airport?.name && !f.arrival?.airport?.iata) return;
            if (!f.airline?.name && !f.airline?.iata) return;

            const iata = (f.number || '').replace(/\s+/g, ''); // "AK 5110" → "AK5110"
            if (!iata) return;

            // 终极拦截隐藏的 Codeshare：同一时间飞同一目的地
            const scheduledTime = f.departure?.scheduledTime?.local || '';
            const arrivalDest = f.arrival?.airport?.iata || f.arrival?.airport?.name || '';
            const physicalKey = `${scheduledTime}_${arrivalDest}`;
            
            if (seenPhysicalFlights.has(physicalKey) && !finalMap.has(iata)) {
                return; // 重复物理航班
            }
            seenPhysicalFlights.add(physicalKey);

            // 如果有同一个航班号出现了两次（比如航空公司修改了时间，发了两次数据），覆盖保留最后一条
            finalMap.set(iata, f);
        });

        const flightsData = Array.from(finalMap.values())
            .map(f => {
                const flightIata   = (f.number || '').replace(/\s+/g, '');
                const airlineIata  = f.airline?.iata || flightIata.substring(0, 2).toUpperCase() || '';
                const scheduledRaw = f.departure?.scheduledTime?.local || '';
                // AeroDataBox local time: "2024-04-10 08:10+08:00"
                // substring(11,16) → "08:10"，和我们的渲染逻辑完全兼容

                // 状态映射
                const flight_status = _mapAeroStatus(f.status);

                return {
                    flight_date:       todayStr,
                    flight_status:     flight_status,
                    airline:           f.airline?.name || 'Unknown',
                    airline_iata:      airlineIata,
                    flight_iata:       flightIata,
                    departure_iata:    f.departure?.airport?.iata    || AIRPORT_IATA,
                    departure_airport: f.departure?.airport?.name    || '',
                    destination:       f.arrival?.airport?.iata      || '?',
                    dest_name:         f.arrival?.airport?.shortName || f.arrival?.airport?.name || 'Unknown',
                    timezone:          '',
                    scheduled:         scheduledRaw
                };
            });

        // ── Step 3: 按计划出发时间排序 ────────────────────────────────────
        flightsData.sort((a, b) => {
            const ta = a.scheduled ? String(a.scheduled).substring(11, 16) : '99:99';
            const tb = b.scheduled ? String(b.scheduled).substring(11, 16) : '99:99';
            return ta.localeCompare(tb);
        });

        console.log(`[Flights] 原始 ${allRaw.length} 条 → 去除 codeshare 后 ${flightsData.length} 班次`);

        // ── Step 4: 存入 Firebase ─────────────────────────────────────────
        const now = new Date();
        const timestamp =
            now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');

        await firebaseRef.set({
            last_fetch_date: todayStr,
            last_update_timestamp: timestamp,
            flights_data: flightsData
        });

        renderFlightsUI(flightsData, timestamp);
        if (window.showToast) window.showToast(`✅ ${flightsData.length} flights loaded`);

    } catch (e) {
        console.error('[Flights] 抓取失败，读取旧缓存:', e);
        if (window.showToast) window.showToast('⚠️ 获取航班失败，读取旧数据');
        const snapshot = await firebaseRef.once('value');
        if (snapshot.exists()) {
            const d = snapshot.val();
            renderFlightsUI(d.flights_data || [], d.last_update_timestamp || '--');
        } else {
            renderFlightsUI([], '--');
        }
    }
}


// 全局存储，供 filterFlights 使用
// 每个条目为 { html, timeStr, departed } 对象
let _flightsDomestic = [];
let _flightsIntl = [];
let _flightsAll = [];

function renderFlightsUI(flightsData, lastUpdateStr) {
    // 数据在 fetch 阶段已去除 codeshare，这里只需验证 departure_iata
    const departingFlights = (flightsData || []).filter(f => {
        if (f.departure_iata) return f.departure_iata === 'BKI';
        return f.destination && f.destination !== 'BKI';
    });

    // ── 1. 顶部卡片计数器（动画） ──────────────────────────────────
    const flightCountEl = document.getElementById('totalFlights');
    if (flightCountEl) {
        let cur = 0;
        const target = departingFlights.length;
        const speed = Math.ceil(target / 30) || 1;
        const anim = setInterval(() => {
            cur += speed;
            if (cur >= target) { cur = target; clearInterval(anim); }
            flightCountEl.innerText = cur;
        }, 30);
    }

    // ── 2. 按时间排序 ──────────────────────────────────────────────
    departingFlights.sort((a, b) => {
        const tA = a.scheduled ? String(a.scheduled).substring(11, 16) : '99:99';
        const tB = b.scheduled ? String(b.scheduled).substring(11, 16) : '99:99';
        return tA.localeCompare(tB);
    });

    // ── 3. 建立 domestic / intl 分组 ──────────────────────────────
    const MY_AIRPORTS = [
        // 半岛马来西亚
        'KUL', 'SZB', 'PEN', 'JHB', 'KBR', 'TGG', 'AOR', 'LGK', 'KUA', 'IPH', 'MKZ',
        // 沙巴 Sabah
        'BKI', 'SDK', 'TWU', 'LDU', 'MYD', 'GSA', 'PAY', 'KGU', 'SPT',
        // 沙捞越 Sarawak
        'KCH', 'MYY', 'BTU', 'SBW', 'LMN', 'LBU', 'MZV', 'ODN', 'BBN', 'BKM', 'SMM', 'RPH'
    ];

    _flightsDomestic = [];
    _flightsIntl = [];
    _flightsAll = [];

    // 当前本地时间（HH:MM）用于判断是否已起飞
    const _now = new Date();
    const _nowMins = _now.getHours() * 60 + _now.getMinutes();

    departingFlights.forEach(f => {
        let isDom = false;
        if (f.timezone && (f.timezone.includes('Kuala_Lumpur') || f.timezone.includes('Kuching'))) {
            isDom = true;
        } else if (MY_AIRPORTS.includes(f.destination)) {
            isDom = true;
        }

        let timeStr = '--:--';
        if (f.scheduled) timeStr = String(f.scheduled).substring(11, 16);

        // ── 判断是否已起飞（scheduled time < 当前时间，或 status 为 landed/active/cancelled） ──
        let flightMins = 9999;
        if (timeStr !== '--:--') {
            const parts = timeStr.split(':');
            flightMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        const hasDeparted = (f.flight_status === 'landed' || f.flight_status === 'active')
            || (f.flight_status !== 'cancelled' && flightMins < _nowMins);

        // 状态颜色
        let sColor = '#34C759';
        if (f.flight_status === 'cancelled') sColor = '#FF3B30';
        else if (f.flight_status === 'delayed') sColor = '#FF9500';
        else if (f.flight_status === 'landed') sColor = '#8E8E93';
        else if (f.flight_status === 'active') sColor = '#007AFF';

        const arrAirport = f.dest_name || f.destination;

        // ── 取消了卡片的淡化(opacity)和删除线，保持清晰可见 ──────
        const cardStyle = `background:var(--ios-tertiary-background); padding:9px 12px;
                           border-radius:10px; border:0.5px solid var(--ios-gray-4);
                           display:flex; align-items:center; gap:10px; margin-bottom:6px;
                           position:relative;`;

        const timeStyle = `font-weight:800; font-size:14px; color:var(--ios-label); line-height:1.1;`;

        const departedBadge = hasDeparted
            ? `<div style="position:absolute; top:5px; right:7px;
                           font-size:9px; font-weight:700; letter-spacing:0.5px;
                           color:#8E8E93; opacity:0.75;">DEPARTED</div>`
            : '';

        const cardHtml = `
            <div class="flight-card${hasDeparted ? ' flight-departed' : ' flight-upcoming'}"
                 data-time="${timeStr}"
                 style="${cardStyle}">
                ${departedBadge}
                <!-- 时间 + 航班号 -->
                <div style="flex-shrink:0; min-width:52px; text-align:center;">
                    <div style="${timeStyle}">${timeStr}</div>
                    <div style="font-size:10px; font-weight:600; color:var(--ios-blue); margin-top:1px;">${f.flight_iata || '---'}</div>
                </div>
                <!-- 分隔线 -->
                <div style="width:0.5px; height:32px; background:var(--ios-gray-5); flex-shrink:0;"></div>
                <!-- 目的地 + 航空公司 -->
                <div style="flex:1; min-width:0; display:flex; align-items:center; gap:8px;">
                    ${f.airline_iata ? `
                    <div style="flex-shrink:0; width:28px; height:28px; background:#fff; border-radius:6px; box-shadow:0 1px 2px rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                        <img src="https://images.kiwi.com/airlines/64x64/${f.airline_iata}.png" style="width:24px; height:24px; object-fit:contain;" onerror="this.parentElement.style.display='none';">
                    </div>` : ''}
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:13px; font-weight:700; color:var(--ios-label); white-space:nowrap;
                                    overflow:hidden; text-overflow:ellipsis;">${arrAirport}</div>
                        <div style="font-size:10px; color:var(--ios-gray-1); margin-top:1px; white-space:nowrap;
                                    overflow:hidden; text-overflow:ellipsis;">${f.airline} · ${f.departure_iata || 'BKI'} → ${f.destination}</div>
                    </div>
                </div>
                <!-- 状态 -->
                <div style="flex-shrink:0; margin-top:${hasDeparted ? '0' : '0'}px;">
                    <div style="font-size:10px; font-weight:700; padding:3px 7px; border-radius:8px;
                                background:${sColor}20; color:${sColor}; text-transform:uppercase; white-space:nowrap;">
                        ${f.flight_status || 'unknown'}
                    </div>
                </div>
            </div>`;

        const entry = { html: cardHtml, timeStr, departed: hasDeparted };

        if (isDom) _flightsDomestic.push(entry);
        else _flightsIntl.push(entry);
        _flightsAll.push(entry);
    });

    // ── 4. 更新统计栏 ──────────────────────────────────────────────
    const statTotal = document.getElementById('statTotal');
    const statDomestic = document.getElementById('statDomestic');
    const statIntl = document.getElementById('statIntl');
    // Show only upcoming count in stats strip
    const upcomingAll = _flightsAll.filter(e => !e.departed).length;
    const upcomingDom = _flightsDomestic.filter(e => !e.departed).length;
    const upcomingIntl = _flightsIntl.filter(e => !e.departed).length;
    if (statTotal) statTotal.textContent = departingFlights.length;
    if (statDomestic) statDomestic.textContent = _flightsDomestic.length;
    if (statIntl) statIntl.textContent = _flightsIntl.length;

    // ── 5. 初始渲染（默认 All） ────────────────────────────────────
    filterFlights('all');

    // ── 6. 更新最后更新时间 + 数据覆盖范围诊断 ────────────────────
    const lastUpdateEl = document.getElementById('flightsLastUpdated');
    if (lastUpdateEl) {
        // 计算数据中最早 / 最晚的 scheduled 时间
        const times = departingFlights
            .map(f => f.scheduled ? String(f.scheduled).substring(11, 16) : null)
            .filter(Boolean)
            .sort();
        const coverageStr = times.length >= 2
            ? `（覆盖 ${times[0]} – ${times[times.length - 1]}）`
            : '';
        lastUpdateEl.innerHTML =
            `最后更新时间：${lastUpdateStr}` +
            (coverageStr
                ? `<br><span style="font-size:10px;color:var(--ios-gray-1);">📊 数据覆盖 ${times[0]} – ${times[times.length - 1]}，共 ${departingFlights.length} 班</span>`
                : '');
    }
}

// ── 辅助：渲染航班列表，并在 DOM 更新后自动滚动到第一个未起飞的航班 ──
function _renderFlightCards(entries, headerHtml) {
    const flightsList = document.getElementById('flightsList');
    if (!flightsList) return;

    let html = headerHtml || '';
    entries.forEach(e => { html += e.html; });
    flightsList.innerHTML = html;

    // 自动滚动到第一个未起飞航班（.flight-upcoming）
    requestAnimationFrame(() => {
        const firstUpcoming = flightsList.querySelector('.flight-upcoming');
        if (firstUpcoming) {
            const body = document.getElementById('flightsModalBody');
            if (body) {
                // header offset inside body
                const bodyTop = body.getBoundingClientRect().top;
                const cardTop = firstUpcoming.getBoundingClientRect().top;
                const offset = cardTop - bodyTop + body.scrollTop - 8; // 8px padding buffer
                body.scrollTo({ top: offset, behavior: 'smooth' });
            }
        }
    });
}

// ── Filter Tab 切换 ────────────────────────────────────────────────
let _currentFlightFilter = 'all';
function filterFlights(type) {
    _currentFlightFilter = type;

    // 更新 Tab 样式
    ['all', 'domestic', 'intl'].forEach(t => {
        const btn = document.getElementById('ftab-' + t);
        if (!btn) return;
        if (t === type) {
            btn.style.background = 'var(--ios-blue)';
            btn.style.color = '#fff';
        } else {
            btn.style.background = 'var(--ios-gray-6)';
            btn.style.color = 'var(--ios-label)';
        }
    });

    // 渲染列表
    const flightsList = document.getElementById('flightsList');
    if (!flightsList) return;

    const total = _flightsDomestic.length + _flightsIntl.length;

    if (total === 0) {
        flightsList.innerHTML = '<div style="text-align:center; padding:40px 0; color:var(--ios-gray-1); font-size:14px;">No departing flights found.</div>';
        return;
    }

    if (type === 'all') {
        if (_flightsAll.length === 0) {
            flightsList.innerHTML = '<div style="text-align:center; padding:40px 0; color:var(--ios-gray-1); font-size:14px;">No departing flights found.</div>';
            return;
        }
        _renderFlightCards(_flightsAll);
    } else if (type === 'domestic') {
        if (_flightsDomestic.length === 0) {
            flightsList.innerHTML = '<div style="text-align:center; padding:40px 0; color:var(--ios-gray-1); font-size:14px;">No domestic flights found.</div>';
            return;
        }
        _renderFlightCards(_flightsDomestic, `<div style="font-size:12px; font-weight:700; color:var(--ios-gray-1); padding:8px 4px 6px;">Domestic (${_flightsDomestic.length})</div>`);
    } else if (type === 'intl') {
        if (_flightsIntl.length === 0) {
            flightsList.innerHTML = '<div style="text-align:center; padding:40px 0; color:var(--ios-gray-1); font-size:14px;">No international flights found.</div>';
            return;
        }
        _renderFlightCards(_flightsIntl, `<div style="font-size:12px; font-weight:700; color:var(--ios-gray-1); padding:8px 4px 6px;">International (${_flightsIntl.length})</div>`);
    }
}

function openFlightsModal() {
    const modal = document.getElementById('flightsModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.onclick = function (e) {
            if (e.target === modal) closeFlightsModal();
        };
        // 打开 modal 后重新触发滚动，确保 modal 已经可见才能正确计算 getBoundingClientRect
        requestAnimationFrame(() => {
            const flightsList = document.getElementById('flightsList');
            const body = document.getElementById('flightsModalBody');
            if (!flightsList || !body) return;
            const firstUpcoming = flightsList.querySelector('.flight-upcoming');
            if (firstUpcoming) {
                const bodyTop = body.getBoundingClientRect().top;
                const cardTop = firstUpcoming.getBoundingClientRect().top;
                const offset = cardTop - bodyTop + body.scrollTop - 8;
                body.scrollTo({ top: offset, behavior: 'smooth' });
            }
        });
    }
}

function closeFlightsModal() {
    const modal = document.getElementById('flightsModal');
    if (modal) modal.style.display = 'none';
}

// ==========================================
// 🚀 Refresh Flights Action
// ==========================================
window.refreshFlightsAction = async function () {
    if (window.showToast) window.showToast('↻ 正在强制刷新航班数据...');
    const btn = document.querySelector('button[title="Refresh Flights"]');
    if (btn) btn.style.opacity = '0.5';

    try {
        const flightsList = document.getElementById('flightsList');
        if (flightsList) flightsList.innerHTML = '<div class="loading"><div class="spinner"></div>Loading new flights...</div>';
        
        // 删除当天的缓存，强制让系统重新请求 API
        await firebase.database().ref('flight_cache').remove();
        
        // 我们需要把本地维护的标志清空，才会触发 initFlightsSystem 请求数据并保存
        // 它的机制是读取缓存时间，如果等于今天就不抓。
        await initFlightsSystem();
        
        if (window.showToast) window.showToast('✅ 航班数据已更新！');
    } catch (e) {
        console.error('Refresh Failed:', e);
        if (window.showToast) window.showToast('❌ 刷新失败，请稍后再试');
    } finally {
        if (btn) btn.style.opacity = '1';
    }
};

// ==========================================
// 🚀 Product Stock Layout Selector
// ==========================================
window.productLayout = localStorage.getItem('productLayout') || 'grid';

window.setProductLayout = function (layout) {
    window.productLayout = layout;
    localStorage.setItem('productLayout', layout);
    
    const gridBtn = document.getElementById('layoutGridBtn');
    const listBtn = document.getElementById('layoutListBtn');
    const productList = document.getElementById('productList');
    
    if (!productList) return;
    
    if (layout === 'grid') {
        gridBtn?.classList.add('active');
        listBtn?.classList.remove('active');
        productList.classList.add('grid-layout');
        productList.classList.remove('list-layout');
    } else {
        gridBtn?.classList.remove('active');
        listBtn?.classList.add('active');
        productList.classList.add('list-layout');
        productList.classList.remove('grid-layout');
    }
    
    if (typeof hapticFeedback === 'function') hapticFeedback();
    
    // Re-filter products to ensure correct render
    filterProducts();
};

window.syncProductLayout = function () {
    const layout = localStorage.getItem('productLayout') || 'grid';
    window.productLayout = layout;
    
    const gridBtn = document.getElementById('layoutGridBtn');
    const listBtn = document.getElementById('layoutListBtn');
    const productList = document.getElementById('productList');
    
    if (!productList) return;
    
    if (layout === 'grid') {
        gridBtn?.classList.add('active');
        listBtn?.classList.remove('active');
        productList.classList.add('grid-layout');
        productList.classList.remove('list-layout');
    } else {
        gridBtn?.classList.remove('active');
        listBtn?.classList.add('active');
        productList.classList.add('list-layout');
        productList.classList.remove('grid-layout');
    }
};