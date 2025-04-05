// 获取当前日期的字符串，格式为YYYY-MM-DD
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取当前时间的字符串，格式为YYYY-MM-DD HH:MM:SS
function getCurrentDateTime() {
    const now = new Date();
    const date = getCurrentDate();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${date} ${hours}:${minutes}:${seconds}`;
}

// 添加销售记录到数据库
function addSaleRecord(saleData) {
    return new Promise((resolve, reject) => {
        // 获取当前用户
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            reject(new Error('用户未登录'));
            return;
        }

        const storeId = localStorage.getItem('store_id');
        if (!storeId) {
            reject(new Error('未找到店铺ID'));
            return;
        }

        // 创建销售记录对象
        const currentDate = getCurrentDate();
        const currentDateTime = getCurrentDateTime();
        const saleRecord = {
            billNumber: saleData.billNumber,
            store_id: storeId,
            items: saleData.items,
            total_amount: saleData.totalAmount,
            date: currentDate,
            timestamp: currentDateTime,
            staff_id: user.uid,
            cashierName: saleData.cashierName || 'Unknown',
            shiftInfo: saleData.shiftInfo || {
                cashierName: saleData.cashierName || 'Unknown',
                shiftTime: currentDateTime
            }
        };

        // 生成唯一的销售记录ID
        const saleId = database.ref().child('sales').push().key;
        
        // 创建一个批量更新对象
        const updates = {};
        
        // 更新销售记录
        updates[`sales/${saleId}`] = saleRecord;
        
        // 更新店铺当天销售统计
        // 使用事务来确保数据一致性
        const dailySaleRef = database.ref(`daily_sales/${storeId}/${currentDate}`);
        
        dailySaleRef.transaction((currentData) => {
            if (currentData === null) {
                return {
                    total_sales: saleData.totalAmount,
                    transaction_count: 1
                };
            } else {
                return {
                    total_sales: currentData.total_sales + saleData.totalAmount,
                    transaction_count: currentData.transaction_count + 1
                };
            }
        }).then(() => {
            // 执行批量更新
            database.ref().update(updates)
                .then(() => resolve(saleId))
                .catch(error => reject(error));
        }).catch(error => reject(error));
    });
}

// 获取商品列表
function getProducts() {
    return new Promise((resolve, reject) => {
        database.ref('products').once('value')
            .then(snapshot => {
                const products = snapshot.val() || {};
                resolve(products);
            })
            .catch(error => reject(error));
    });
}

// 获取特定店铺的商品列表
function getStoreProducts(storeId) {
    return new Promise((resolve, reject) => {
        database.ref(`store_products/${storeId}`).once('value')
            .then(snapshot => {
                const products = snapshot.val() || {};
                resolve(products);
            })
            .catch(error => reject(error));
    });
}

// 获取特定日期的店铺销售数据
function getStoreDailySales(storeId, date) {
    return new Promise((resolve, reject) => {
        database.ref(`daily_sales/${storeId}/${date}`).once('value')
            .then(snapshot => {
                const dailySales = snapshot.val() || { total_sales: 0, transaction_count: 0 };
                resolve(dailySales);
            })
            .catch(error => reject(error));
    });
}

// 获取所有店铺的特定日期销售数据
function getAllStoresDailySales(date) {
    return new Promise((resolve, reject) => {
        database.ref(`daily_sales`).once('value')
            .then(snapshot => {
                const allStoreSales = snapshot.val() || {};
                const result = {};
                
                // 处理每个店铺的数据
                Object.keys(allStoreSales).forEach(storeId => {
                    if (allStoreSales[storeId][date]) {
                        result[storeId] = allStoreSales[storeId][date];
                    } else {
                        result[storeId] = { total_sales: 0, transaction_count: 0 };
                    }
                });
                
                resolve(result);
            })
            .catch(error => reject(error));
    });
}

// 获取特定店铺的特定日期销售详情
function getStoreSaleDetails(storeId, date) {
    return new Promise((resolve, reject) => {
        database.ref('sales').orderByChild('store_id').equalTo(storeId).once('value')
            .then(snapshot => {
                const sales = snapshot.val() || {};
                const filteredSales = {};
                
                // 过滤出特定日期的销售记录
                Object.keys(sales).forEach(saleId => {
                    if (sales[saleId].date === date) {
                        filteredSales[saleId] = sales[saleId];
                    }
                });
                
                resolve(filteredSales);
            })
            .catch(error => reject(error));
    });
}

// 获取所有店铺信息
function getAllStores() {
    return new Promise((resolve, reject) => {
        database.ref('stores').once('value')
            .then(snapshot => {
                const stores = snapshot.val() || {};
                resolve(stores);
            })
            .catch(error => reject(error));
    });
}

// 初始化数据库结构
function initializeDatabase() {
    console.log("正在检查数据库结构...");
    
    return new Promise((resolve, reject) => {
        // 检查stores路径是否存在
        database.ref('stores').once('value')
            .then(snapshot => {
                if (!snapshot.exists()) {
                    console.log("创建初始stores结构");
                    // 如果不存在，创建空的stores结构
                    return database.ref('stores').set({});
                }
                return Promise.resolve();
            })
            .then(() => {
                // 检查products路径是否存在
                return database.ref('products').once('value');
            })
            .then(snapshot => {
                if (!snapshot.exists()) {
                    console.log("创建初始products结构");
                    // 如果不存在，创建空的products结构
                    return database.ref('products').set({});
                }
                return Promise.resolve();
            })
            .then(() => {
                console.log("数据库结构检查完成");
                resolve();
            })
            .catch(error => {
                console.error("数据库结构初始化失败:", error);
                reject(error);
            });
    });
}

// 在页面加载时初始化数据库结构
document.addEventListener('DOMContentLoaded', () => {
    initializeDatabase()
        .then(() => {
            console.log("数据库结构初始化成功");
        })
        .catch(error => {
            console.error("数据库结构初始化失败:", error);
        });
}); 