# POS销售系统

这是一个基于 HTML + JavaScript + Firebase Realtime Database 的 POS（销售点）系统，支持多店铺管理和销售数据统计。

## 功能特点

- **多店铺管理**：每个店铺使用同一套系统，通过 store_id 区分
- **销售管理**：店员可以添加商品到购物车、计算总价、完成交易
- **销售记录**：记录每笔交易信息，包含店铺ID、商品、数量、金额、时间等
- **数据统计**：汇总当日销售额和交易量，并存入数据库
- **管理功能**：管理员可查看所有店铺的销售详情和统计数据
- **用户权限**：分为管理员和店员两种角色，权限不同

## 技术栈

- 前端：HTML + CSS + JavaScript
- 数据库：Firebase Realtime Database
- 认证：Firebase Authentication

## 目录结构

```
├── index.html          # 登录页面
├── css/
│   └── styles.css      # 全局样式
├── js/
│   ├── firebase-config.js # Firebase配置
│   ├── auth.js         # 认证相关功能
│   ├── database.js     # 数据库操作函数
│   ├── pos.js          # 销售页面功能
│   └── admin.js        # 管理员页面功能
└── pages/
    ├── pos.html        # 销售页面
    └── admin.html      # 管理员页面
```

## 安装和配置

1. 在Firebase控制台创建一个新项目
2. 启用Firebase Authentication和Realtime Database
3. 复制Firebase配置，并更新 `js/firebase-config.js` 中的配置信息
4. 部署到Web服务器或使用Firebase Hosting部署

## 数据库结构

系统使用以下数据结构：

```
- users/
  - {user_id}/
    - email: string
    - role: "admin" | "staff"
    - store_id: string (仅店员)
    
- stores/
  - {store_id}/
    - name: string
    - address: string
    
- store_products/
  - {store_id}/
    - {product_id}/
      - name: string
      - price: number
      - store_id: string
      
- sales/
  - {store_id}/
    - {sale_id}/
      - items: array
        - id: string
        - name: string
        - price: number
        - quantity: number
        - subtotal: number
      - total_amount: number
      - date: string (YYYY-MM-DD)
      - timestamp: string (YYYY-MM-DD HH:MM:SS)
      - staff_id: string
    
- daily_sales/
  - {store_id}/
    - {date}/
      - total_sales: number
      - transaction_count: number
```

## 使用方法

### 初始设置

1. 创建管理员用户
   - 可以通过 Firebase Authentication 控制台创建初始管理员
   - 在数据库中添加用户角色信息（`users/{uid}/role: "admin"`）

2. 添加店铺
   - 使用管理员账户登录
   - 进入"店铺管理"页面创建店铺

3. 添加商品
   - 使用管理员账户登录
   - 进入"商品管理"页面为各店铺添加商品

4. 创建店员账户
   - 使用管理员账户登录
   - 进入"用户管理"页面创建店员账户，并分配到相应店铺

### 日常使用

#### 店员操作

1. 使用店员账户登录系统
2. 系统会自动跳转到销售页面
3. 点击商品添加到购物车
4. 调整商品数量或从购物车中移除商品
5. 点击"结账"按钮完成交易
6. 可选择打印小票

#### 管理员操作

1. 使用管理员账户登录系统
2. 系统会自动跳转到管理页面
3. 查看销售统计数据，可以按日期和店铺筛选
4. 管理店铺、商品和用户

## 安全性考虑

- 在生产环境中，应当使用Firebase Admin SDK或服务端API来处理用户创建和密码重置等敏感操作
- 应当为数据库设置适当的安全规则，限制不同角色的用户只能访问其有权限的数据

## 许可证

MIT 