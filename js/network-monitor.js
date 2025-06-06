// Firebase Realtime Database 网络监控器
// 用于捕获和记录从Firebase数据库的网络请求信息

let isNetworkMonitorActive = false; // 监控是否激活
let networkRequests = []; // 存储所有捕获的请求

// 定义一个队列来存储原始的firebase.database.Reference.prototype方法
const originalMethods = {
    once: firebase.database.Reference.prototype.once,
    on: firebase.database.Reference.prototype.on,
    get: firebase.database.Reference.prototype.get,
    set: firebase.database.Reference.prototype.set,
    update: firebase.database.Reference.prototype.update
};

// 提取Firebase路径的辅助函数
function extractPath(ref) {
    try {
        // 尝试获取引用路径
        const refString = ref.toString();
        console.log("[网络监控] 原始引用字符串:", refString);
        
        // 多种方式尝试提取路径
        let path;
        
        // 方法1：如果包含database URL的标准格式
        if (refString.includes("firebaseio.com/") || refString.includes("firebasedatabase.app/")) {
            let parts = refString.split(/firebaseio\.com\/|firebasedatabase\.app\//);
            if (parts.length > 1) {
                path = parts[1];
            }
        } 
        
        // 方法2：尝试使用ref.path（某些Firebase SDK版本支持）
        if (!path && ref.path) {
            path = ref.path.toString();
        }
        
        // 方法3：最后使用引用键（一般是最后的路径部分）
        if (!path && ref.key) {
            path = ref.key;
            // 尝试获取父级路径
            let parent = ref.parent;
            while (parent && parent.key) {
                path = parent.key + '/' + path;
                parent = parent.parent;
            }
        }
        
        // 如果无法提取，至少显示一部分引用信息
        if (!path) {
            path = "路径提取失败: " + refString.substring(0, 100);
        }
        
        console.log("[网络监控] 提取的路径:", path);
        return path;
    } catch (error) {
        console.error("[网络监控] 路径提取错误:", error);
        return "路径提取错误";
    }
}

// 重写Firebase数据库方法以添加监控
function initNetworkMonitor() {
    // 重写once方法
    firebase.database.Reference.prototype.once = function(eventType, ...args) {
        const startTime = performance.now();
        const path = extractPath(this);
        
        return originalMethods.once.call(this, eventType, ...args)
            .then(snapshot => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // 计算响应大小（粗略估计）
                const dataSize = JSON.stringify(snapshot.val() || {}).length / 1024; // KB
                
                if (isNetworkMonitorActive) {
                    networkRequests.push({
                        path: path,
                        method: 'once',
                        event: eventType,
                        size: dataSize.toFixed(2),
                        duration: duration.toFixed(2),
                        timestamp: new Date().getTime(), // 存储为时间戳
                        localTime: formatLocalTime(new Date()) // 存储本地时间格式
                    });
                    
                    console.log(`[网络监控] 路径: ${path}, 方法: once, 事件: ${eventType}, 大小: ${dataSize.toFixed(2)}KB, 耗时: ${duration.toFixed(2)}ms`);
                }
                
                return snapshot;
            })
            .catch(error => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (isNetworkMonitorActive) {
                    networkRequests.push({
                        path: path,
                        method: 'once',
                        event: eventType,
                        error: error.message,
                        duration: duration.toFixed(2),
                        timestamp: new Date().getTime(),
                        localTime: formatLocalTime(new Date())
                    });
                    
                    console.log(`[网络监控] 路径: ${path}, 方法: once, 事件: ${eventType}, 错误: ${error.message}, 耗时: ${duration.toFixed(2)}ms`);
                }
                
                throw error;
            });
    };
    
    // 重写on方法（略微复杂，因为它持续监听）
    firebase.database.Reference.prototype.on = function(eventType, callback, ...args) {
        const path = extractPath(this);
        
        // 替换callback以添加监控
        const wrappedCallback = function(snapshot) {
            const dataSize = JSON.stringify(snapshot.val() || {}).length / 1024; // KB
            
            if (isNetworkMonitorActive) {
                networkRequests.push({
                    path: path,
                    method: 'on',
                    event: eventType,
                    size: dataSize.toFixed(2),
                    timestamp: new Date().getTime(),
                    localTime: formatLocalTime(new Date())
                });
                
                console.log(`[网络监控] 路径: ${path}, 方法: on, 事件: ${eventType}, 大小: ${dataSize.toFixed(2)}KB`);
            }
            
            return callback(snapshot);
        };
        
        return originalMethods.on.call(this, eventType, wrappedCallback, ...args);
    };
    
    // 重写get方法
    if (firebase.database.Reference.prototype.get) {
        firebase.database.Reference.prototype.get = function(...args) {
            const startTime = performance.now();
            const path = extractPath(this);
            
            return originalMethods.get.call(this, ...args)
                .then(snapshot => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    // 计算响应大小
                    const dataSize = JSON.stringify(snapshot.val() || {}).length / 1024; // KB
                    
                    if (isNetworkMonitorActive) {
                        networkRequests.push({
                            path: path,
                            method: 'get',
                            size: dataSize.toFixed(2),
                            duration: duration.toFixed(2),
                            timestamp: new Date().getTime(),
                            localTime: formatLocalTime(new Date())
                        });
                        
                        console.log(`[网络监控] 路径: ${path}, 方法: get, 大小: ${dataSize.toFixed(2)}KB, 耗时: ${duration.toFixed(2)}ms`);
                    }
                    
                    return snapshot;
                })
                .catch(error => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    if (isNetworkMonitorActive) {
                        networkRequests.push({
                            path: path,
                            method: 'get',
                            error: error.message,
                            duration: duration.toFixed(2),
                            timestamp: new Date().getTime(),
                            localTime: formatLocalTime(new Date())
                        });
                        
                        console.log(`[网络监控] 路径: ${path}, 方法: get, 错误: ${error.message}, 耗时: ${duration.toFixed(2)}ms`);
                    }
                    
                    throw error;
                });
        };
    }
    
    // 重写set和update方法，这些通常是写操作
    firebase.database.Reference.prototype.set = function(value, ...args) {
        const startTime = performance.now();
        const path = extractPath(this);
        const dataSize = JSON.stringify(value || {}).length / 1024; // KB
        
        return originalMethods.set.call(this, value, ...args)
            .then(result => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (isNetworkMonitorActive) {
                    networkRequests.push({
                        path: path,
                        method: 'set',
                        size: dataSize.toFixed(2),
                        duration: duration.toFixed(2),
                        timestamp: new Date().getTime(),
                        localTime: formatLocalTime(new Date())
                    });
                    
                    console.log(`[网络监控] 路径: ${path}, 方法: set, 大小: ${dataSize.toFixed(2)}KB, 耗时: ${duration.toFixed(2)}ms`);
                }
                
                return result;
            })
            .catch(error => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (isNetworkMonitorActive) {
                    networkRequests.push({
                        path: path,
                        method: 'set',
                        error: error.message,
                        size: dataSize.toFixed(2),
                        duration: duration.toFixed(2),
                        timestamp: new Date().getTime(),
                        localTime: formatLocalTime(new Date())
                    });
                    
                    console.log(`[网络监控] 路径: ${path}, 方法: set, 错误: ${error.message}, 耗时: ${duration.toFixed(2)}ms`);
                }
                
                throw error;
            });
    };
    
    firebase.database.Reference.prototype.update = function(values, ...args) {
        const startTime = performance.now();
        const path = extractPath(this);
        const dataSize = JSON.stringify(values || {}).length / 1024; // KB
        
        return originalMethods.update.call(this, values, ...args)
            .then(result => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (isNetworkMonitorActive) {
                    networkRequests.push({
                        path: path,
                        method: 'update',
                        size: dataSize.toFixed(2),
                        duration: duration.toFixed(2),
                        timestamp: new Date().getTime(),
                        localTime: formatLocalTime(new Date())
                    });
                    
                    console.log(`[网络监控] 路径: ${path}, 方法: update, 大小: ${dataSize.toFixed(2)}KB, 耗时: ${duration.toFixed(2)}ms`);
                }
                
                return result;
            })
            .catch(error => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                if (isNetworkMonitorActive) {
                    networkRequests.push({
                        path: path,
                        method: 'update',
                        error: error.message,
                        size: dataSize.toFixed(2),
                        duration: duration.toFixed(2),
                        timestamp: new Date().getTime(),
                        localTime: formatLocalTime(new Date())
                    });
                    
                    console.log(`[网络监控] 路径: ${path}, 方法: update, 错误: ${error.message}, 耗时: ${duration.toFixed(2)}ms`);
                }
                
                throw error;
            });
    };
}

// 格式化本地时间
function formatLocalTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 创建显示网络请求数据的UI
function createNetworkMonitorUI() {
    // 创建并添加样式
    const style = document.createElement('style');
    style.innerHTML = `
        #network-monitor {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            background-color: rgba(0, 0, 0, 0.9);
            color: white;
            z-index: 9999;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            overflow: auto;
            display: none;
            font-family: Arial, sans-serif;
        }
        #network-monitor-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background-color: #444;
            border-bottom: 1px solid #666;
        }
        #network-monitor-title {
            font-weight: bold;
            font-size: 16px;
        }
        #network-monitor-stats {
            margin-left: 10px;
            font-size: 12px;
            color: #aaa;
        }
        #network-monitor-close {
            cursor: pointer;
            font-size: 20px;
        }
        #network-monitor-content {
            padding: 10px;
            height: calc(80vh - 50px);
            overflow: auto;
        }
        #network-monitor table {
            width: 100%;
            border-collapse: collapse;
        }
        #network-monitor th, #network-monitor td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #555;
        }
        #network-monitor th {
            background-color: #333;
            position: sticky;
            top: 0;
            cursor: pointer;
        }
        #network-monitor th:hover {
            background-color: #444;
        }
        .network-monitor-actions {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .network-monitor-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
        .network-monitor-button:hover {
            background-color: #45a049;
        }
        .network-monitor-clear {
            background-color: #f44336;
        }
        .network-monitor-clear:hover {
            background-color: #d32f2f;
        }
        .size-high {
            color: #ff5252;
            font-weight: bold;
            background-color: rgba(255, 82, 82, 0.2);
        }
        .size-medium {
            color: #ffab40;
            font-weight: bold;
            background-color: rgba(255, 171, 64, 0.2);
        }
        .path-column {
            max-width: 400px;
            word-break: break-all;
        }
        .sort-asc::after {
            content: " ▲";
        }
        .sort-desc::after {
            content: " ▼";
        }
    `;
    document.head.appendChild(style);
    
    // 创建UI元素
    const monitorContainer = document.createElement('div');
    monitorContainer.id = 'network-monitor';
    
    monitorContainer.innerHTML = `
        <div id="network-monitor-header">
            <div>
                <div id="network-monitor-title">Firebase Realtime Database 请求监控</div>
                <div id="network-monitor-stats">总计: <span id="request-count">0</span> 请求, 总下载: <span id="total-size">0</span> KB</div>
            </div>
            <div id="network-monitor-close">×</div>
        </div>
        <div id="network-monitor-content">
            <div class="network-monitor-actions">
                <button class="network-monitor-button network-monitor-clear" id="clear-requests">清除所有请求</button>
                <button class="network-monitor-button" id="export-requests">导出CSV</button>
                <button class="network-monitor-button" id="sort-by-size">按大小排序</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th data-sort="timestamp">时间</th>
                        <th data-sort="path" style="width: 60%">路径</th>
                        <th data-sort="method">方法</th>
                        <th data-sort="size">大小 (KB)</th>
                    </tr>
                </thead>
                <tbody id="network-requests-table">
                </tbody>
            </table>
        </div>
    `;
    
    document.body.appendChild(monitorContainer);
    
    // 添加事件监听器
    document.getElementById('network-monitor-close').addEventListener('click', toggleNetworkMonitor);
    document.getElementById('clear-requests').addEventListener('click', clearNetworkRequests);
    document.getElementById('export-requests').addEventListener('click', exportNetworkRequests);
    document.getElementById('sort-by-size').addEventListener('click', () => sortRequests('size', 'desc'));
    
    // 表头排序
    document.querySelectorAll('#network-monitor th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            const currentDirection = th.classList.contains('sort-asc') ? 'desc' : 'asc';
            
            // 移除所有表头的排序类
            document.querySelectorAll('#network-monitor th').forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });
            
            // 添加当前排序方向类
            th.classList.add(`sort-${currentDirection}`);
            
            // 排序数据
            sortRequests(sortBy, currentDirection);
        });
    });
}

// 切换网络监控的显示状态
function toggleNetworkMonitor() {
    const monitor = document.getElementById('network-monitor');
    if (monitor.style.display === 'none' || monitor.style.display === '') {
        monitor.style.display = 'block';
        updateNetworkMonitorTable();
    } else {
        monitor.style.display = 'none';
    }
}

// 启用或禁用网络监控
function toggleNetworkMonitoring() {
    isNetworkMonitorActive = !isNetworkMonitorActive;
    console.log(`[网络监控] ${isNetworkMonitorActive ? '已启用' : '已禁用'}`);
    
    if (isNetworkMonitorActive) {
        // 每次启用时清除旧数据
        networkRequests = [];
    }
}

// 更新网络监控表格
function updateNetworkMonitorTable() {
    // 默认按时间倒序排列请求
    sortRequests('timestamp', 'desc');
}

// 清除所有网络请求记录
function clearNetworkRequests() {
    networkRequests = [];
    updateNetworkMonitorTable();
}

// 将网络请求数据导出为CSV
function exportNetworkRequests() {
    if (networkRequests.length === 0) {
        alert('没有可导出的数据');
        return;
    }
    
    // 创建CSV内容
    let csv = 'Timestamp,Path,Method,Size (KB)\n';
    
    networkRequests.forEach(request => {
        // 处理CSV中的引号和逗号
        const formattedPath = request.path ? `"${request.path.replace(/"/g, '""')}"` : '-';
        
        csv += `${request.timestamp || '-'},${formattedPath},${request.method || '-'},${request.size || '-'}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `firebase-requests-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 初始化键盘快捷键
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // 按下Ctrl+D时切换监控面板
        if (event.ctrlKey && event.key.toLowerCase() === 'd') {
            event.preventDefault(); // 阻止默认行为（如书签保存）
            
            // 如果监控面板不存在，则创建
            if (!document.getElementById('network-monitor')) {
                createNetworkMonitorUI();
            }
            
            // 如果监控不活跃，则激活它
            if (!isNetworkMonitorActive) {
                toggleNetworkMonitoring();
            }
            
            // 切换监控面板显示
            toggleNetworkMonitor();
        }
    });
}

// 更新统计数据
function updateStats() {
    const requestCount = networkRequests.length;
    const totalSize = networkRequests.reduce((sum, req) => sum + parseFloat(req.size || 0), 0).toFixed(2);
    
    const requestCountElement = document.getElementById('request-count');
    const totalSizeElement = document.getElementById('total-size');
    
    if (requestCountElement) requestCountElement.textContent = requestCount;
    if (totalSizeElement) totalSizeElement.textContent = totalSize;
}

// 排序请求数据
function sortRequests(sortBy, direction = 'asc') {
    const sortedRequests = [...networkRequests].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // 数值类型的比较
        if (sortBy === 'size') {
            aValue = parseFloat(aValue || 0);
            bValue = parseFloat(bValue || 0);
        }
        
        // 字符串类型的比较
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        // 数值类型的比较
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    renderRequestsTable(sortedRequests);
}

// 专门的渲染函数，以便复用
function renderRequestsTable(requests) {
    const tableBody = document.getElementById('network-requests-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        
        // 使用本地时间格式
        const time = request.localTime || formatLocalTime(new Date(request.timestamp));
        
        // 根据大小添加警告级别
        const size = parseFloat(request.size || 0);
        const sizeClass = size > 100 ? 'size-high' : (size > 50 ? 'size-medium' : '');
        
        row.innerHTML = `
            <td>${time}</td>
            <td class="path-column">${request.path || '-'}</td>
            <td>${request.method || '-'}</td>
            <td class="${sizeClass}">${request.size || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 更新统计数据
    updateStats();
}

// 在页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log('[网络监控] 初始化中...');
    // 初始化网络监控
    initNetworkMonitor();
    // 初始化键盘快捷键
    initKeyboardShortcuts();
    console.log('[网络监控] 初始化完成，按下 Ctrl+D 可显示监控面板');
}); 