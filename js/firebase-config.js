// Firebase配置
const firebaseConfig = {
    apiKey: "AIzaSyBkBQQaCyaxr2cNfiomNVAAONcwyyOuAXw",
    authDomain: "pos-app-64c10.firebaseapp.com",
    databaseURL: "https://pos-app-64c10-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pos-app-64c10",
    storageBucket: "pos-app-64c10.firebasestorage.app",
    messagingSenderId: "772295211380",
    appId: "1:772295211380:web:6e09fa895b808ea29c9421",
    measurementId: "G-M731H0DMJL"
};

// 初始化Firebase
firebase.initializeApp(firebaseConfig);

// 获取Firebase服务的引用
const auth = firebase.auth();
const database = firebase.database();

// 用户在线状态管理
function setupOnlineStatusTracking() {
    // 当前用户已登录
    const uid = auth.currentUser.uid;
    
    // 创建用户在线状态引用
    const userStatusRef = database.ref('user_status/' + uid);
    
    // 创建一个引用到Firebase数据库中的".info/connected"路径
    const connectionRef = database.ref('.info/connected');
    
    // 监听连接状态变化
    connectionRef.on('value', (snapshot) => {
        // 如果连接中断，snapshot.val()会变为false
        // 如果连接正常，snapshot.val()会变为true
        if (snapshot.val() === false) {
            return;
        }
        
        // 如果我们连接到Firebase，设置用户状态
        // 当客户端断开连接时，服务器会自动将状态设置为离线
        const onDisconnectRef = userStatusRef.onDisconnect();
        
        // 断开连接时更新状态为离线
        onDisconnectRef.update({
            state: 'offline',
            last_changed: firebase.database.ServerValue.TIMESTAMP,
            last_online: firebase.database.ServerValue.TIMESTAMP // 记录离线前的最后在线时间
        });
        
        // 手动告诉Firebase我们现在是在线的
        userStatusRef.update({
            state: 'online',
            last_changed: firebase.database.ServerValue.TIMESTAMP,
            last_online: firebase.database.ServerValue.TIMESTAMP, // 更新最后在线时间
            display_name: auth.currentUser.email,
            role: localStorage.getItem('role') || 'unknown'
        });
    });
}

// 获取当前页面的完整URL路径
function getFullPath(relativePath) {
    // 获取当前URL的基础部分（协议+主机+端口+路径）
    const currentUrl = window.location.href;
    // 提取URL的基础部分（不包括文件名和查询参数）
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
    
    // 如果相对路径以/开头，则从网站根目录开始
    if (relativePath.startsWith('/')) {
        const origin = window.location.origin;
        return origin + relativePath;
    }
    
    // 否则从当前URL的基础部分开始
    return baseUrl + relativePath;
}

// 检查用户登录状态
auth.onAuthStateChanged(user => {
    if (user) {
        // 用户已登录
        console.log("用户已登录:", user.email);
        
        // 在本地存储中保存用户信息
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email
        }));
        
        // 获取用户角色和店铺ID
        database.ref(`users/${user.uid}`).once('value').then(snapshot => {
            const userData = snapshot.val();
            console.log("获取到用户数据:", userData);
            
            if (userData) {
                localStorage.setItem('role', userData.role);
                localStorage.setItem('store_id', userData.store_id || '');
                
                console.log("用户角色:", userData.role);
                
                // 设置用户在线状态跟踪
                setupOnlineStatusTracking();
                
                // 获取当前URL的信息
                const currentPath = window.location.pathname;
                console.log("当前路径:", currentPath);
                
                // 根据角色重定向到相应页面
                let targetPage;
                if (userData.role === 'admin' || userData.role === 'sadmin') {
                    // 检查当前是否已经在admin页面或产品目录页面
                    if (currentPath.includes('/pages/admin.html') || 
                        currentPath.includes('/pages/product_catalog.html')) {
                        console.log("已在管理员相关页面，无需重定向");
                        return;
                    }
                    targetPage = getFullPath('pages/admin.html');
                } else if (userData.role === 'staff') {
                    // 检查当前是否已经在pos页面或产品目录页面
                    if (currentPath.includes('/pages/pos.html') || 
                        currentPath.includes('/pages/product_catalog.html')) {
                        console.log("已在销售相关页面，无需重定向");
                        return;
                    }
                    targetPage = getFullPath('pages/pos.html');
                } else {
                    console.error("未知角色:", userData.role);
                    alert("您的账户角色未知，请联系管理员。");
                    return;
                }
                
                console.log("即将重定向到:", targetPage);
                
                // 使用延迟来确保日志消息能被看到
                setTimeout(() => {
                    window.location.href = targetPage;
                }, 500);
            } else {
                // 用户存在但没有角色信息，可能是新用户
                console.log('用户没有角色信息，请联系管理员设置角色');
                alert('您的账户尚未分配角色，请联系管理员。');
            }
        }).catch(error => {
            console.error('获取用户数据失败:', error);
            alert('获取用户数据失败，请刷新页面重试。');
        });
    } else {
        // 用户未登录
        console.log("用户未登录");
        
        // 如果不在登录页面则重定向到登录页面
        const currentPath = window.location.pathname;
        
        if (!currentPath.includes('/index.html') && 
            !currentPath.endsWith('/') && 
            !currentPath.includes('/setup-admin.html')) {
            
            console.log("不在登录页面，将重定向到登录页面");
            const loginPage = getFullPath('index.html');
            console.log("登录页面URL:", loginPage);
            
            window.location.href = loginPage;
        }
    }
}); 