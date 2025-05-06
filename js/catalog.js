// 定义全局变量
let currentUser = null;
let currentStore = null;
let catalogProducts = {}; // 全局商品目录
let categories = new Set(); // 商品类别
let selectedProducts = new Set(); // 选中的产品
let stores = {}; // 商店列表
let storeProducts = {}; // 商店产品

// DOM元素
const storeName = document.getElementById('storeName');
const userName = document.getElementById('userName');
const currentDateTime = document.getElementById('currentDateTime');
const viewTitle = document.getElementById('viewTitle');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

// 目录管理DOM元素
const catalogCategoryFilter = document.getElementById('catalogCategoryFilter');
const catalogSearch = document.getElementById('catalogSearch');
const catalogTableBody = document.getElementById('catalogTableBody');
const addCatalogProductBtn = document.getElementById('addCatalogProductBtn');
const addCatalogProductModal = document.getElementById('addCatalogProductModal');
const addCatalogProductForm = document.getElementById('addCatalogProductForm');

// 导入管理DOM元素
const importCategoryFilter = document.getElementById('importCategoryFilter');
const importSearch = document.getElementById('importSearch');
const importTableBody = document.getElementById('importTableBody');
const selectAllProducts = document.getElementById('selectAllProducts');
const importSelectedBtn = document.getElementById('importSelectedBtn');
const importConfirmModal = document.getElementById('importConfirmModal');
const importCount = document.getElementById('importCount');
const confirmImportBtn = document.getElementById('confirmImportBtn');
const cancelImportBtn = document.getElementById('cancelImportBtn');

// 模态框关闭按钮
const closeButtons = document.querySelectorAll('.close');

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log("商品目录页面加载中...");
    
    // 初始化Firebase
    initializeFirebase();
    
    // 检查用户登录状态
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            getUserInfo(user.uid)
                .then(userInfo => {
                    // 检查用户是否是管理员
                    const isAdmin = userInfo && userInfo.role === 'admin';
                    
                    // 如果不是管理员，则需要检查商店ID
                    if (!isAdmin && (!userInfo || !userInfo.store_id)) {
                        alert('未分配商店，请联系管理员');
                        window.location.href = '../index.html';
                        return;
                    }
                    
                    // 设置当前商店(管理员默认可以访问所有商店)
                    currentStore = isAdmin ? 'admin' : userInfo.store_id;
                    document.getElementById('storeName').textContent = `Store: ${isAdmin ? 'All Stores (Admin)' : (userInfo.store_name || currentStore)}`;
                    document.getElementById('userName').textContent = `User: ${user.email}`;
                    
                    // 加载数据
                    init();
                });
        } else {
            // 未登录，重定向到登录页面
            window.location.href = '../index.html';
        }
    });
});

// 初始化
function init() {
    // 加载商店列表（仅管理员）
    if (currentStore === 'admin') {
        loadStores().then(() => {
            // 创建商店选择器
            createStoreSelector();
        });
    }

    // 加载目录商品
    loadCatalogProducts();
    
    // 设置当前日期和时间
    updateDateTime();
    setInterval(updateDateTime, 60000);
    
    // 初始化事件监听器
    initEventListeners();
    
    // 初始化模态框关闭按钮
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            hideModal(modal);
        });
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', event => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                hideModal(modal);
            }
        });
    });
}

// 初始化事件监听器
function initEventListeners() {
    // 导航菜单切换视图
    navItems.forEach(item => {
        if (item.dataset.view) {
            item.addEventListener('click', () => {
                switchView(item.dataset.view);
            });
        }
    });
    
    // 目录类别过滤器
    catalogCategoryFilter.addEventListener('change', () => {
        console.log('Category filter changed to:', catalogCategoryFilter.value);
        filterCatalogProducts();
    });
    
    // 目录搜索框
    catalogSearch.addEventListener('input', () => {
        console.log('Search term changed to:', catalogSearch.value);
        filterCatalogProducts();
    });
    
    // 添加目录商品按钮
    addCatalogProductBtn.addEventListener('click', () => showModal(addCatalogProductModal));
    
    // 添加目录商品表单提交
    addCatalogProductForm.addEventListener('submit', handleAddCatalogProduct);
    
    // 导入类别过滤器
    importCategoryFilter.addEventListener('change', () => {
        console.log('Import category filter changed to:', importCategoryFilter.value);
        renderImportProducts();
    });
    
    // 导入搜索框
    importSearch.addEventListener('input', () => {
        console.log('Import search term changed to:', importSearch.value);
        renderImportProducts();
    });
    
    // 全选按钮
    selectAllProducts.addEventListener('change', toggleSelectAll);
    
    // 商店选择器（仅管理员）
    if (currentStore === 'admin') {
        const storeSelector = document.getElementById('importStoreSelector');
        if (storeSelector) {
            storeSelector.addEventListener('change', updateImportButtonState);
        }
    }
    
    // 导入选中商品按钮
    importSelectedBtn.addEventListener('click', () => {
        const count = selectedProducts.size;
        // 确定目标商店
        let targetStore = currentStore;
        let storeName = "";
        
        if (currentStore === 'admin') {
            const storeSelector = document.getElementById('importStoreSelector');
            if (storeSelector) {
                targetStore = storeSelector.value;
                storeName = stores[targetStore]?.name || targetStore;
            }
        }
        
        if (count > 0) {
            importCount.textContent = count;
            if (document.getElementById('targetStoreName')) {
                document.getElementById('targetStoreName').textContent = storeName;
            }
            showModal(importConfirmModal);
        } else {
            alert('Please select at least one product to import');
        }
    });
    
    // 确认导入按钮
    confirmImportBtn.addEventListener('click', importSelectedProducts);
    
    // 取消导入按钮
    cancelImportBtn.addEventListener('click', () => hideModal(importConfirmModal));
}

// 切换视图
function switchView(viewName) {
    // 更新活动导航项
    navItems.forEach(item => {
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // 更新活动视图
    views.forEach(view => {
        if (view.id === `${viewName}View`) {
            view.classList.add('active');
            viewTitle.textContent = view.querySelector('h2').textContent;
        } else {
            view.classList.remove('active');
        }
    });
    
    // 根据视图更新数据
    if (viewName === 'import') {
        renderImportProducts();
    }
}

// 显示模态框
function showModal(modal) {
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// 隐藏模态框
function hideModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 加载全局目录商品
function loadCatalogProducts() {
    // 显示加载状态
    catalogTableBody.innerHTML = '<tr><td colspan="5" class="loading"><i class="material-icons">hourglass_empty</i> Loading...</td></tr>';
    
    // 从Firebase加载商品目录
    const catalogRef = firebase.database().ref('product_catalog');
    catalogRef.once('value')
        .then(snapshot => {
            catalogProducts = snapshot.val() || {};
            
            // 提取所有类别
            categories.clear();
            Object.values(catalogProducts).forEach(product => {
                if (product.category) {
                    categories.add(product.category);
                }
            });
            
            // 填充类别过滤器
            populateCategoryFilters();
            
            // 渲染商品
            renderCatalogProducts();
        })
        .catch(error => {
            console.error('Failed to load catalog products:', error);
            catalogTableBody.innerHTML = '<tr><td colspan="5" class="error"><i class="material-icons">error</i> Failed to load catalog products</td></tr>';
        });
}

// 填充类别过滤器
function populateCategoryFilters() {
    // 清空现有选项（保留"全部"选项）
    while (catalogCategoryFilter.options.length > 1) {
        catalogCategoryFilter.remove(1);
    }
    
    while (importCategoryFilter.options.length > 1) {
        importCategoryFilter.remove(1);
    }
    
    // 添加类别选项
    categories.forEach(category => {
        const catalogOption = document.createElement('option');
        catalogOption.value = category;
        catalogOption.textContent = category;
        catalogCategoryFilter.appendChild(catalogOption);
        
        const importOption = document.createElement('option');
        importOption.value = category;
        importOption.textContent = category;
        importCategoryFilter.appendChild(importOption);
    });
}

// 渲染目录商品
function renderCatalogProducts() {
    console.log("Rendering catalog products");
    catalogTableBody.innerHTML = '';
    
    if (Object.keys(catalogProducts).length === 0) {
        console.log("No products in catalog");
        catalogTableBody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="material-icons">info</i> No products in catalog</td></tr>';
        return;
    }
    
    // 获取筛选条件
    const categoryFilter = catalogCategoryFilter.value;
    const searchTerm = catalogSearch.value.toLowerCase();
    console.log("Current filters - Category:", categoryFilter, "Search:", searchTerm);
    
    // 筛选商品
    const filteredProducts = [];
    Object.entries(catalogProducts).forEach(([productId, product]) => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSearch = searchTerm === '' || 
                            product.name.toLowerCase().includes(searchTerm) || 
                            productId.toLowerCase().includes(searchTerm);
        
        if (matchesCategory && matchesSearch) {
            filteredProducts.push({
                id: productId,
                ...product
            });
        }
    });
    console.log("Filtered products:", filteredProducts.length);
    
    if (filteredProducts.length === 0) {
        console.log("No matching products found");
        catalogTableBody.innerHTML = '<tr><td colspan="5" class="no-data"><i class="material-icons">search_off</i> No matching products found</td></tr>';
        return;
    }
    
    // 渲染筛选后的商品
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>RM${product.price.toFixed(2)}</td>
            <td>${product.category || '-'}</td>
            <td>
                <div class="catalog-actions">
                    <button class="catalog-btn edit-catalog-btn" data-id="${product.id}" title="Edit Product">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="catalog-btn delete-catalog-btn" data-id="${product.id}" title="Delete Product">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            </td>
        `;
        
        catalogTableBody.appendChild(row);
    });
    
    // 添加事件监听器到按钮
    document.querySelectorAll('#catalogTableBody .edit-catalog-btn').forEach(btn => {
        btn.addEventListener('click', () => editCatalogProduct(btn.dataset.id));
    });
    
    document.querySelectorAll('#catalogTableBody .delete-catalog-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCatalogProduct(btn.dataset.id));
    });
}

// 渲染导入商品列表
function renderImportProducts() {
    console.log("Rendering import products");
    importTableBody.innerHTML = '';
    
    if (Object.keys(catalogProducts).length === 0) {
        console.log("No products in catalog for import");
        importTableBody.innerHTML = '<tr><td colspan="6" class="no-data"><i class="material-icons">info</i> No products in catalog</td></tr>';
        return;
    }
    
    // 获取筛选条件
    const categoryFilter = importCategoryFilter.value;
    const searchTerm = importSearch.value.toLowerCase();
    console.log("Import filters - Category:", categoryFilter, "Search:", searchTerm);
    
    // 筛选商品
    const filteredProducts = [];
    Object.entries(catalogProducts).forEach(([productId, product]) => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSearch = searchTerm === '' || 
                            product.name.toLowerCase().includes(searchTerm) || 
                            productId.toLowerCase().includes(searchTerm);
        
        if (matchesCategory && matchesSearch) {
            filteredProducts.push({
                id: productId,
                ...product
            });
        }
    });
    console.log("Filtered import products:", filteredProducts.length);
    
    if (filteredProducts.length === 0) {
        console.log("No matching products found for import");
        importTableBody.innerHTML = '<tr><td colspan="6" class="no-data"><i class="material-icons">search_off</i> No matching products found</td></tr>';
        return;
    }
    
    // 清空选中的产品集合
    selectedProducts.clear();
    
    // 更新导入按钮状态
    updateImportButtonState();
    
    // 渲染筛选后的商品
    filteredProducts.forEach(product => {
        // 检查产品是否已存在于所选商店中
        let isImported = false;
        let existingStock = 0;
        
        if (currentStore === 'admin') {
            // 管理员模式：检查所选商店中是否存在该产品
            const storeSelector = document.getElementById('importStoreSelector');
            if (storeSelector && storeSelector.value && storeProducts[product.id]) {
                isImported = true;
                existingStock = storeProducts[product.id].stock || 0;
            }
        } else {
            // 员工模式：检查当前商店中是否存在该产品
            firebase.database().ref(`store_products/${currentStore}/${product.id}`).once('value')
                .then(snapshot => {
                    const existingProduct = snapshot.val();
                    if (existingProduct) {
                        // 找到匹配行并更新
                        const row = document.querySelector(`#importTableBody tr[data-id="${product.id}"]`);
                        if (row) {
                            row.classList.add('product-imported');
                            row.querySelector('.product-status').innerHTML = `<span class="imported-badge">Imported</span> (Stock: ${existingProduct.stock || 0})`;
                        }
                    }
                });
        }
        
        const row = document.createElement('tr');
        row.dataset.id = product.id;
        row.innerHTML = `
            <td>
                <input type="checkbox" class="product-checkbox" data-id="${product.id}" ${isImported ? 'title="This product is already imported"' : ''}>
            </td>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>RM${product.price.toFixed(2)}</td>
            <td>${product.category || '-'}</td>
            <td>
                <input type="number" class="quantity-input" min="1" value="1">
                <div class="product-status">
                    ${isImported ? `<span class="imported-badge">Imported</span> (Stock: ${existingStock})` : ''}
                </div>
            </td>
        `;
        
        if (isImported) {
            row.classList.add('product-imported');
        }
        
        importTableBody.appendChild(row);
    });
    
    // 添加事件监听器到复选框
    document.querySelectorAll('#importTableBody .product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedProducts.add(checkbox.dataset.id);
            } else {
                selectedProducts.delete(checkbox.dataset.id);
            }
            
            // 更新全选复选框状态
            updateSelectAllState();
            
            // 更新导入按钮状态
            updateImportButtonState();
        });
    });
    
    // 更新全选框状态
    updateSelectAllState();
}

// 筛选目录商品
function filterCatalogProducts(returnFiltered = false) {
    console.log("Running filterCatalogProducts");
    const categoryFilter = catalogCategoryFilter.value;
    const searchTerm = catalogSearch.value.toLowerCase();
    
    console.log("Filtering with category:", categoryFilter, "and search term:", searchTerm);
    
    const filteredProducts = [];
    
    Object.entries(catalogProducts).forEach(([productId, product]) => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSearch = searchTerm === '' || 
                            product.name.toLowerCase().includes(searchTerm) || 
                            productId.toLowerCase().includes(searchTerm);
        
        if (matchesCategory && matchesSearch) {
            filteredProducts.push({
                id: productId,
                ...product
            });
        }
    });
    
    console.log("Filtered products count:", filteredProducts.length);
    
    if (returnFiltered) {
        return filteredProducts;
    } else {
        renderCatalogProducts();
        return null; // 避免事件处理函数返回值
    }
}

// 筛选导入商品
function filterImportProducts(returnFiltered = false) {
    console.log("Running filterImportProducts");
    const categoryFilter = importCategoryFilter.value;
    const searchTerm = importSearch.value.toLowerCase();
    
    console.log("Filtering imports with category:", categoryFilter, "and search term:", searchTerm);
    
    const filteredProducts = [];
    
    Object.entries(catalogProducts).forEach(([productId, product]) => {
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        const matchesSearch = searchTerm === '' || 
                            product.name.toLowerCase().includes(searchTerm) || 
                            productId.toLowerCase().includes(searchTerm);
        
        if (matchesCategory && matchesSearch) {
            filteredProducts.push({
                id: productId,
                ...product
            });
        }
    });
    
    console.log("Filtered import products count:", filteredProducts.length);
    
    if (returnFiltered) {
        return filteredProducts;
    } else {
        renderImportProducts();
        return null; // 避免事件处理函数返回值
    }
}

// 处理添加目录商品
function handleAddCatalogProduct(e) {
    e.preventDefault();
    
    const productId = document.getElementById('catalogProductId').value.trim();
    const name = document.getElementById('catalogProductName').value.trim();
    const price = parseFloat(document.getElementById('catalogProductPrice').value);
    const category = document.getElementById('catalogProductCategory').value.trim();
    
    if (!productId || !name || isNaN(price)) {
        alert('Please fill in all required fields');
        return;
    }
    
    // 检查商品ID是否已存在
    if (catalogProducts[productId]) {
        alert('Product ID already exists. Please use a different ID.');
        return;
    }
    
    // 创建商品数据
    const productData = {
        name,
        price,
        category: category || '',
        created_at: firebase.database.ServerValue.TIMESTAMP
    };
    
    // 添加到Firebase
    firebase.database().ref(`product_catalog/${productId}`).set(productData)
        .then(() => {
            // 更新本地数据
            catalogProducts[productId] = productData;
            
            // 如果有新类别，添加到类别集合
            if (category && !categories.has(category)) {
                categories.add(category);
                populateCategoryFilters();
            }
            
            // 重新渲染商品
            renderCatalogProducts();
            
            // 重置表单并关闭模态框
            addCatalogProductForm.reset();
            hideModal(addCatalogProductModal);
            
            alert('Product added to catalog successfully!');
        })
        .catch(error => {
            console.error('Failed to add product to catalog:', error);
            alert('Failed to add product to catalog. Please try again.');
        });
}

// 编辑目录商品
function editCatalogProduct(productId) {
    const product = catalogProducts[productId];
    if (!product) return;
    
    // 创建编辑模态框
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editCatalogProductModal';
    
    editModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2><i class="material-icons">edit</i> Edit Product</h2>
            <form id="editCatalogProductForm">
                <div class="form-group">
                    <label for="editCatalogProductId"><i class="material-icons">tag</i> Product ID:</label>
                    <input type="text" id="editCatalogProductId" value="${productId}" readonly>
                </div>
                <div class="form-group">
                    <label for="editCatalogProductName"><i class="material-icons">inventory</i> Product Name:</label>
                    <input type="text" id="editCatalogProductName" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label for="editCatalogProductPrice"><i class="material-icons">attach_money</i> Price:</label>
                    <input type="number" id="editCatalogProductPrice" value="${product.price}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label for="editCatalogProductCategory"><i class="material-icons">category</i> Category:</label>
                    <input type="text" id="editCatalogProductCategory" value="${product.category || ''}">
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
    const editForm = document.getElementById('editCatalogProductForm');
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('editCatalogProductName').value.trim();
        const newPrice = parseFloat(document.getElementById('editCatalogProductPrice').value);
        const newCategory = document.getElementById('editCatalogProductCategory').value.trim();
        
        if (!newName || isNaN(newPrice)) {
            alert('Please fill in all required fields');
            return;
        }
        
        // 更新商品
        updateCatalogProduct(productId, newName, newPrice, newCategory)
            .then(() => {
                hideModal(editModal);
                // 移除模态框
                setTimeout(() => {
                    document.body.removeChild(editModal);
                }, 300);
                
                alert('Product updated successfully!');
            })
            .catch(error => {
                console.error('Failed to update product:', error);
                alert('Failed to update product. Please try again.');
            });
    });
}

// 更新目录商品
function updateCatalogProduct(productId, name, price, category) {
    const oldCategory = catalogProducts[productId].category;
    
    // 更新数据
    const updates = {
        name,
        price,
        category: category || '',
        updated_at: firebase.database.ServerValue.TIMESTAMP
    };
    
    return firebase.database().ref(`product_catalog/${productId}`).update(updates)
        .then(() => {
            // 更新本地数据
            catalogProducts[productId] = {
                ...catalogProducts[productId],
                ...updates
            };
            
            // 如果类别改变且是新类别，更新类别集合
            if (category && category !== oldCategory && !categories.has(category)) {
                categories.add(category);
                populateCategoryFilters();
            }
            
            // 重新渲染商品
            renderCatalogProducts();
        });
}

// 删除目录商品
function deleteCatalogProduct(productId) {
    if (!confirm(`Are you sure you want to delete the product "${catalogProducts[productId].name}"?`)) {
        return;
    }
    
    firebase.database().ref(`product_catalog/${productId}`).remove()
        .then(() => {
            // 从本地数据删除
            delete catalogProducts[productId];
            
            // 重新生成类别
            categories.clear();
            Object.values(catalogProducts).forEach(product => {
                if (product.category) {
                    categories.add(product.category);
                }
            });
            
            // 重新填充类别过滤器
            populateCategoryFilters();
            
            // 重新渲染商品
            renderCatalogProducts();
            
            alert('Product deleted successfully!');
        })
        .catch(error => {
            console.error('Failed to delete product:', error);
            alert('Failed to delete product. Please try again.');
        });
}

// 全选/取消全选
function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('#importTableBody .product-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllProducts.checked;
        
        if (selectAllProducts.checked) {
            selectedProducts.add(checkbox.dataset.id);
        } else {
            selectedProducts.delete(checkbox.dataset.id);
        }
    });
    
    // 更新导入按钮状态
    updateImportButtonState();
}

// 更新全选复选框状态
function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('#importTableBody .product-checkbox');
    const checkedCount = document.querySelectorAll('#importTableBody .product-checkbox:checked').length;
    
    if (checkboxes.length === 0) {
        selectAllProducts.checked = false;
        selectAllProducts.indeterminate = false;
    } else if (checkedCount === 0) {
        selectAllProducts.checked = false;
        selectAllProducts.indeterminate = false;
    } else if (checkedCount === checkboxes.length) {
        selectAllProducts.checked = true;
        selectAllProducts.indeterminate = false;
    } else {
        selectAllProducts.checked = false;
        selectAllProducts.indeterminate = true;
    }
}

// 更新导入按钮状态
function updateImportButtonState() {
    const hasSelectedProducts = selectedProducts.size > 0;
    let storeSelected = true;
    
    // 如果是管理员，检查是否选择了商店
    if (currentStore === 'admin') {
        const storeSelector = document.getElementById('importStoreSelector');
        storeSelected = storeSelector && storeSelector.value !== '';
    }
    
    importSelectedBtn.disabled = !hasSelectedProducts || !storeSelected;
}

// 导入选中的商品
function importSelectedProducts() {
    // 获取所有选中的商品
    const productsToImport = [];
    
    // 确定目标商店
    let targetStore = currentStore;
    const storeSelector = document.getElementById('importStoreSelector');
    
    // 如果是管理员且存在商店选择器，则使用选择的商店
    if (currentStore === 'admin' && storeSelector) {
        targetStore = storeSelector.value;
        
        if (targetStore === '') {
            alert('Please select a store to import products to');
            return;
        }
    }
    
    document.querySelectorAll('#importTableBody tr').forEach(row => {
        const checkbox = row.querySelector('.product-checkbox');
        if (checkbox && checkbox.checked) {
            const productId = checkbox.dataset.id;
            const quantity = parseInt(row.querySelector('.quantity-input').value) || 1;
            
            if (catalogProducts[productId]) {
                productsToImport.push({
                    id: productId,
                    quantity,
                    ...catalogProducts[productId]
                });
            }
        }
    });
    
    if (productsToImport.length === 0) {
        alert('No products selected for import');
        hideModal(importConfirmModal);
        return;
    }
    
    // 批量导入商品
    const promises = productsToImport.map(product => {
        return addProductToStore(
            product.id,
            product.name,
            product.price,
            product.quantity,
            product.category || '',
            targetStore
        );
    });
    
    Promise.all(promises)
        .then(() => {
            hideModal(importConfirmModal);
            alert(`Successfully imported ${productsToImport.length} products to your store!`);
            
            // 清空选择
            selectedProducts.clear();
            selectAllProducts.checked = false;
            
            // 更新UI
            renderImportProducts();
        })
        .catch(error => {
            console.error('Failed to import products:', error);
            alert('Failed to import some or all products. Please try again.');
            hideModal(importConfirmModal);
        });
}

// 添加产品到店铺
function addProductToStore(productId, name, price, quantity, category, storeId) {
    const productData = {
        name,
        price,
        quantity: quantity || 0,
        category: category || '',
        store_id: storeId,
        stock: quantity || 0, // 确保stock字段存在
        imported_at: firebase.database.ServerValue.TIMESTAMP
    };
    
    return firebase.database().ref(`store_products/${storeId}/${productId}`).set(productData);
}

// 获取用户信息
function getUserInfo(userId) {
    return firebase.database().ref(`users/${userId}`).once('value')
        .then(snapshot => snapshot.val() || {});
}

// 更新日期时间显示
function updateDateTime() {
    if (currentDateTime) {
        const now = new Date();
        currentDateTime.textContent = now.toLocaleString();
    }
}

// 登出
function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = '../index.html';
        })
        .catch(error => {
            console.error('Failed to log out:', error);
        });
}

// 初始化Firebase
function initializeFirebase() {
    if (!firebase.apps.length) {
        // Firebase配置应该在firebase-config.js中定义
        console.log('Firebase already initialized');
    }
}

// 加载所有商店
function loadStores() {
    return firebase.database().ref('stores').once('value')
        .then(snapshot => {
            stores = snapshot.val() || {};
            return stores;
        });
}

// 创建商店选择器（仅管理员）
function createStoreSelector() {
    // 在导入页面添加商店选择器
    const importHeader = document.querySelector('#importView .page-header .filter-section');
    
    if (importHeader && Object.keys(stores).length > 0) {
        // 创建商店选择器元素
        const storeFilterItem = document.createElement('div');
        storeFilterItem.className = 'filter-item';
        storeFilterItem.innerHTML = `
            <label for="importStoreSelector">
                <i class="material-icons">store</i>
                <span>Target Store</span>
            </label>
            <select id="importStoreSelector" required>
                <option value="">Select Store</option>
                ${Object.entries(stores).map(([storeId, store]) => 
                    `<option value="${storeId}">${store.name}</option>`
                ).join('')}
            </select>
        `;
        
        // 添加到页面
        importHeader.prepend(storeFilterItem);
        
        // 添加到确认模态框
        const confirmMsg = document.querySelector('#importConfirmModal p:first-of-type');
        if (confirmMsg) {
            const storeSelector = document.getElementById('importStoreSelector');
            confirmMsg.innerHTML = `You are about to import <span id="importCount">0</span> products to store: <strong id="targetStoreName"></strong>`;
            
            // 更新选择的商店名称和按钮状态
            storeSelector.addEventListener('change', () => {
                const selectedStoreId = storeSelector.value;
                const storeName = selectedStoreId ? stores[selectedStoreId].name : '';
                document.getElementById('targetStoreName').textContent = storeName;
                
                // 加载选定商店的已有产品，用于在导入列表中显示已导入状态
                if (selectedStoreId) {
                    firebase.database().ref(`store_products/${selectedStoreId}`).once('value')
                        .then(snapshot => {
                            storeProducts = snapshot.val() || {};
                            // 重新渲染导入列表，标记已导入商品
                            renderImportProducts();
                        });
                } else {
                    storeProducts = {};
                    renderImportProducts();
                }
            });
        }
    }
} 