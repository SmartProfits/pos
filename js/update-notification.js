/**
 * PWA更新通知功能
 */

// 创建更新通知样式
function createUpdateNotificationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .update-notification {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #007bff;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      0% { transform: translateY(100px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    .update-notification .message {
      flex-grow: 1;
      margin-right: 15px;
    }
    
    .update-notification .actions {
      display: flex;
    }
    
    .update-notification button {
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-left: 5px;
      font-size: 14px;
    }
    
    .update-notification button:hover {
      background: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(style);
}

// 显示更新通知
function showUpdateNotification(version) {
  // 如果已经有通知，则不再显示
  if (document.querySelector('.update-notification')) {
    return;
  }
  
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="message">
      <strong>新版本可用 (${version})</strong>
      <p>应用程序有新的更新，请刷新页面以获取最新功能。</p>
    </div>
    <div class="actions">
      <button id="update-now">立即更新</button>
      <button id="update-later">稍后</button>
    </div>
  `;
  
  // 确保样式已添加
  createUpdateNotificationStyles();
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 添加事件监听
  document.getElementById('update-now').addEventListener('click', () => {
    // 刷新页面以应用更新
    window.location.reload();
  });
  
  document.getElementById('update-later').addEventListener('click', () => {
    // 移除通知
    notification.remove();
  });
}

// 监听Service Worker的消息
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'APP_UPDATE') {
      showUpdateNotification(event.data.version);
    }
  });
}

// 注册函数以便主动检查更新
window.checkForUpdates = function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        // 检查更新
        registration.update().then(() => {
          console.log('Service Worker 已检查更新');
        }).catch(err => {
          console.error('检查更新失败:', err);
        });
      }
    });
  }
};

// 页面加载时主动检查更新
window.addEventListener('load', () => {
  // 延迟检查更新，避免影响页面加载性能
  setTimeout(() => {
    window.checkForUpdates();
  }, 3000);
}); 