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
    console.log("开始添加销售记录", saleData);
    return new Promise((resolve, reject) => {
        try {
            // 获取当前用户
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user || !user.uid) {
                console.error("添加销售记录失败: 用户未登录");
                reject(new Error('用户未登录'));
                return;
            }

            const storeId = localStorage.getItem('store_id');
            if (!storeId) {
                console.error("添加销售记录失败: 未找到店铺ID");
                reject(new Error('未找到店铺ID'));
                return;
            }

            // 使用JSON序列化和反序列化创建深度副本
            const saleDataCopy = JSON.parse(JSON.stringify(saleData));
            
            // 确保total_amount值存在
            if (saleDataCopy.total_amount === undefined && saleDataCopy.totalAmount !== undefined) {
                console.log("兼容模式: 使用totalAmount替代total_amount");
                saleDataCopy.total_amount = saleDataCopy.totalAmount;
            } else if (saleDataCopy.total_amount === undefined) {
                console.error("错误: sale_data中缺少total_amount");
                reject(new Error('销售数据缺少total_amount'));
                return;
            }

            // 创建销售记录对象
            const currentDate = getCurrentDate();
            const currentDateTime = getCurrentDateTime();
            const saleRecord = {
                billNumber: saleDataCopy.billNumber,
                store_id: storeId,
                items: saleDataCopy.items, // 已经是深度副本
                total_amount: saleDataCopy.total_amount,
                subtotal: saleDataCopy.subtotal || saleDataCopy.total_amount,
                discountType: saleDataCopy.discountType || 'percent',
                discountPercent: saleDataCopy.discountPercent || 0,
                discountAmount: saleDataCopy.discountAmount || 0,
                date: currentDate,
                timestamp: currentDateTime,
                staff_id: user.uid,
                cashierName: saleDataCopy.cashierName || 'Unknown',
                cashierShift: saleDataCopy.cashierShift || '1st Shift',
                shiftInfo: {
                    cashierName: saleDataCopy.cashierName || 'Unknown',
                    cashierShift: saleDataCopy.cashierShift || '1st Shift',
                    shiftTime: currentDateTime
                }
            };

            console.log("准备添加的销售记录对象:", saleRecord);

            // 生成唯一的销售记录ID
            const saleId = database.ref().child(`sales/${storeId}/${currentDate}`).push().key;
            
            // 创建一个批量更新对象
            const updates = {};
            
            // 更新销售记录 - 按日期存储
            updates[`sales/${storeId}/${currentDate}/${saleId}`] = saleRecord;
            
            // 确保使用correct的total_amount值更新统计
            const totalAmount = saleDataCopy.total_amount;
            const cashierShift = saleDataCopy.cashierShift || '1st Shift';
            
            // 直接更新数据 - 避免使用事务，可能导致错误
            console.log("执行批量更新:", updates);
            
            // 使用单独的变量存储统计更新
            let dailySalesUpdate;
            
            // 执行批量更新
            database.ref().update(updates)
                .then(() => {
                    // 成功添加销售记录后，再更新每日销售统计
                    console.log("销售记录添加成功，ID:", saleId);
                    
                    // 获取当前的每日销售统计
                    return database.ref(`daily_sales/${storeId}/${currentDate}`).once('value');
                })
                .then(snapshot => {
                    const dailyData = snapshot.val() || { 
                        total_sales: 0, 
                        transaction_count: 0,
                        shifts: {
                            '1st Shift': { total_sales: 0, transaction_count: 0 },
                            '2nd Shift': { total_sales: 0, transaction_count: 0 }
                        }
                    };
                    
                    // 确保shifts对象存在
                    if (!dailyData.shifts) {
                        dailyData.shifts = {
                            '1st Shift': { total_sales: 0, transaction_count: 0 },
                            '2nd Shift': { total_sales: 0, transaction_count: 0 }
                        };
                    }
                    
                    // 确保当前班次的统计数据存在
                    if (!dailyData.shifts[cashierShift]) {
                        dailyData.shifts[cashierShift] = { total_sales: 0, transaction_count: 0 };
                    }
                    
                    // 更新每日销售统计
                    dailySalesUpdate = {
                        total_sales: Number(dailyData.total_sales || 0) + Number(totalAmount || 0),
                        transaction_count: Number(dailyData.transaction_count || 0) + 1,
                        shifts: {
                            ...dailyData.shifts,
                            [cashierShift]: {
                                total_sales: Number(dailyData.shifts[cashierShift].total_sales || 0) + Number(totalAmount || 0),
                                transaction_count: Number(dailyData.shifts[cashierShift].transaction_count || 0) + 1
                            }
                        }
                    };
                    
                    return database.ref(`daily_sales/${storeId}/${currentDate}`).set(dailySalesUpdate);
                })
                .then(() => {
                    console.log("每日销售统计更新成功", dailySalesUpdate);
                    resolve(saleId);
                })
                .catch(error => {
                    console.error("销售记录或统计更新失败:", error);
                    reject(error);
                });
        } catch (error) {
            console.error("添加销售记录过程中发生异常:", error);
            reject(error);
        }
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

// 获取特定日期的店铺销售详情
function getStoreSaleDetails(storeId, date) {
    return new Promise((resolve, reject) => {
        // 直接从特定日期的节点获取销售记录
        database.ref(`sales/${storeId}/${date}`).once('value')
            .then(snapshot => {
                const sales = snapshot.val() || {};
                resolve(sales);
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

// === 优化的数据获取函数 ===

/**
 * 优化的店铺商品获取函数 - 实现数据分片
 * 通过店铺ID进行数据分区，确保只获取当前店铺的数据
 */
function getStoreProductsOptimized(storeId) {
    return new Promise((resolve, reject) => {
        database.ref(`store_products/${storeId}`).once('value')
            .then(snapshot => {
                const products = snapshot.val() || {};
                resolve(products);
            })
            .catch(error => reject(error));
    });
}

/**
 * 获取产品目录中的产品 - 使用浅层查询和分页加载
 * @param {number} pageSize - 每页显示的商品数量
 * @param {number} page - 页码，从1开始
 */
function getCatalogProductsPaginated(pageSize = 20, page = 1) {
    return new Promise((resolve, reject) => {
        const startIndex = (page - 1) * pageSize;
        
        // 使用limitToFirst限制结果数量
        database.ref('product_catalog')
            .orderByKey()
            .startAt(String(startIndex))
            .limitToFirst(pageSize)
            .once('value')
            .then(snapshot => {
                const products = snapshot.val() || {};
                resolve(products);
            })
            .catch(error => reject(error));
    });
}

/**
 * 按类别获取产品 - 使用查询过滤
 * @param {string} category - 产品类别
 */
function getProductsByCategory(storeId, category) {
    return new Promise((resolve, reject) => {
        if (category === 'all') {
            // 如果选择全部类别，使用常规获取函数
            return getStoreProductsOptimized(storeId).then(resolve).catch(reject);
        }
        
        // 使用orderByChild和equalTo过滤特定类别
        database.ref(`store_products/${storeId}`)
            .orderByChild('category')
            .equalTo(category)
            .once('value')
            .then(snapshot => {
                const products = snapshot.val() || {};
                resolve(products);
            })
            .catch(error => reject(error));
    });
}

/**
 * 按日期获取销售历史 - 按需加载数据
 * @param {string} storeId - 店铺ID
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @param {string} shift - 班次 (可选，如不指定则获取全部)
 */
function getSalesByDateOptimized(storeId, date, shift = null) {
    return new Promise((resolve, reject) => {
        // 直接从特定日期的节点获取销售记录，减少数据传输
        database.ref(`sales/${storeId}/${date}`)
            .once('value')
            .then(snapshot => {
                const sales = snapshot.val() || {};
                
                // 如果指定了班次，进一步过滤结果
                if (shift && shift !== 'all') {
                    const filteredSales = {};
                    Object.keys(sales).forEach(saleId => {
                        if (sales[saleId].cashierShift === shift) {
                            filteredSales[saleId] = sales[saleId];
                        }
                    });
                    resolve(filteredSales);
                } else {
                    resolve(sales);
                }
            })
            .catch(error => reject(error));
    });
}

/**
 * 获取产品库存状态 - 轻量级查询
 * 只获取库存数量而非完整产品数据
 */
function getProductStockStatus(storeId, productId) {
    return new Promise((resolve, reject) => {
        database.ref(`store_products/${storeId}/${productId}/stock`)
            .once('value')
            .then(snapshot => {
                const stock = snapshot.val() || 0;
                resolve(stock);
            })
            .catch(error => reject(error));
    });
}

/**
 * 获取产品摘要信息 - 轻量级查询
 * 只获取基本产品信息而非详细数据
 */
function getProductSummary(storeId, productId) {
    return new Promise((resolve, reject) => {
        database.ref(`store_products/${storeId}/${productId}`)
            .once('value')
            .then(snapshot => {
                const product = snapshot.val();
                if (product) {
                    // 只返回必要信息
                    resolve({
                        id: productId,
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        category: product.category
                    });
                } else {
                    resolve(null);
                }
            })
            .catch(error => reject(error));
    });
}

/**
 * 获取日销售统计 - 只获取汇总数据而非详细销售记录
 */
function getDailySalesSummary(storeId, date) {
    return new Promise((resolve, reject) => {
        database.ref(`daily_sales/${storeId}/${date}`)
            .once('value')
            .then(snapshot => {
                const summary = snapshot.val() || {
                    total_sales: 0, 
                    transaction_count: 0,
                    shifts: {
                        '1st Shift': { total_sales: 0, transaction_count: 0 },
                        '2nd Shift': { total_sales: 0, transaction_count: 0 }
                    }
                };
                resolve(summary);
            })
            .catch(error => reject(error));
    });
}

/**
 * 获取库存历史记录
 * @param {string} storeId - 店铺ID
 * @param {string} productId - 产品ID
 * @returns {Promise} 返回库存历史记录
 */
function getStockHistory(storeId, productId) {
    return new Promise((resolve, reject) => {
        database.ref(`stock_history/${storeId}/${productId}`)
            .once('value')
            .then(snapshot => {
                const history = snapshot.val() || {};
                resolve(history);
            })
            .catch(error => {
                console.error('获取库存历史失败:', error);
                reject(error);
            });
    });
} 