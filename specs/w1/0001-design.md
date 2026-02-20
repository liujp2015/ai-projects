# 返利折扣网系统 - 设计文档

## 1. 系统架构设计

### 1.1 整体架构

```
┌─────────────────┐
│   前台PC端      │
│   Next.js       │
│   + Tailwind    │
│   + TypeScript  │
└────────┬────────┘
         │ HTTP/WebSocket
         │
┌────────▼────────┐
│   后端服务      │
│   NestJS        │
│   + Prisma      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│PostgreSQL│ │ Redis │
└─────────┘ └───────┘
```

### 1.2 技术架构分层

1. **表现层**：Next.js 前台 + UmiJS 后台管理
2. **应用层**：NestJS API 服务
3. **数据层**：PostgreSQL + Redis
4. **通信层**：RESTful API + WebSocket

## 2. 数据库设计

### 2.1 核心数据表设计

#### 2.1.1 用户表 (users)

```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  username          String?  @unique
  nickname          String?  // 昵称
  avatar            String?  // 头像URL
  password          String
  totalPoints       Int      @default(0)  // 总积分
  remainingPoints   Int      @default(0)  // 剩余积分
  balance           Decimal  @default(0) @db.Decimal(10, 2)  // 余额
  isAdmin           Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  roles             UserRole[]
  points            PointRecord[]
  accessTokens      AccessToken[]
  refreshTokens     RefreshToken[]
  orders            Order[]
}
```

#### 2.1.2 积分记录表 (point_records)

```prisma
model PointRecord {
  id          String   @id @default(uuid())
  userId      String
  points      Int      // 正数为增加，负数为减少
  type        String   // 'register', 'order', 'consume', etc.
  description String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}
```

#### 2.1.3 商品表 (products)

```prisma
model Product {
  id            String    @id @default(uuid())
  title         String
  description   String?   @db.Text
  originalPrice Decimal   @db.Decimal(10, 2)
  discountPrice Decimal   @db.Decimal(10, 2)
  link          String    // 跳转链接
  isHidden      Boolean   @default(false)
  storageId     String?
  brandId       String?
  categoryId    String?
  platform      String?   // 购物平台来源
  keywords      String?
  sortOrder     Int       @default(0)
  isTop         Boolean   @default(false)
  createdAt     DateTime  @default(now())
  endTime       DateTime?
  updatedAt     DateTime  @updatedAt

  brand         Brand?    @relation(fields: [brandId], references: [id])
  category      Category? @relation(fields: [categoryId], references: [id])
  storage       Storage?  @relation(fields: [storageId], references: [id])
  orders        Order[]
}
```

#### 2.1.4 品牌表 (brands)

```prisma
model Brand {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?   @db.Text
  logo        String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]
}
```

#### 2.1.5 分类表 (categories)

```prisma
model Category {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?   @db.Text
  parentId    String?   // 支持分类层级
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  parent      Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]
}
```

#### 2.1.6 订单表 (orders)

```prisma
model Order {
  id            String   @id @default(uuid())
  userId        String?
  productId     String?
  clickId       String?   // 点击ID，用于关联用户和购物平台订单
  orderNumber   String   @unique  // 购物平台的订单号
  platform      String
  amount        Decimal  @db.Decimal(10, 2)
  status        String   // 'pending', 'completed', 'cancelled'
  pointsEarned  Int      @default(0)
  syncedAt      DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User?    @relation(fields: [userId], references: [id])
  product       Product? @relation(fields: [productId], references: [id])

  @@index([clickId])  // 为clickId建立索引，方便查询
  @@index([userId])   // 为用户ID建立索引，方便查询用户订单
}
```

#### 2.1.7 Banner 表 (banners)

```prisma
model Banner {
  id          String   @id @default(uuid())
  title       String?
  imageUrl    String
  link        String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 2.1.8 存储配置表 (storages)

```prisma
model Storage {
  id          String   @id @default(uuid())
  name        String
  type        String   // 'aliyun', 'qiniu', 'aws', etc.
  endpoint    String?
  accessKey   String
  secretKey   String
  bucket      String?
  region      String?
  config      Json?    // 其他配置信息
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products    Product[]
}
```

#### 2.1.9 权限表 (permissions)

```prisma
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  code        String   @unique // 权限代码，如 'product:read', 'product:write'
  module      String   // 模块名称
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles       RolePermission[]
}
```

#### 2.1.10 角色表 (roles)

```prisma
model Role {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  permissions RolePermission[]
  users       UserRole[]
}
```

#### 2.1.11 角色权限关联表 (role_permissions)

```prisma
model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  createdAt    DateTime   @default(now())

  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@unique([roleId, permissionId])
}
```

#### 2.1.12 用户角色关联表 (user_roles)

```prisma
model UserRole {
  id        String   @id @default(uuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId])
}
```

#### 2.1.13 Token 表

```prisma
model AccessToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}
```

#### 2.1.14 网站配置表 (site_configs)

```prisma
model SiteConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  description String?
  updatedAt   DateTime @updatedAt
}
```

### 2.2 数据库关系图

- User 1:N UserRole
- User 1:N PointRecord
- User 1:N Order (通过 userId 和 clickId 关联)
- User 1:N AccessToken
- User 1:N RefreshToken
- Role 1:N UserRole
- Role 1:N RolePermission
- Permission 1:N RolePermission
- Product N:1 Brand
- Product N:1 Category
- Product N:1 Storage
- Product 1:N Order
- Category 1:N Category (自关联，支持分类树)

### 2.3 订单关联机制

#### 2.3.1 clickId 生成流程

```
1. 用户点击商品"去购买"按钮
2. 系统生成唯一的 clickId (UUID)
3. 将 clickId 附加到商品链接中（作为参数）
4. 用户跳转到购物平台，完成购买
5. 购物平台回调订单信息，包含 clickId
6. 系统通过 clickId 找到对应的用户，关联订单
```

#### 2.3.2 订单关联表设计

可以考虑添加一个点击记录表来追踪 clickId：

```prisma
model ClickRecord {
  id        String   @id @default(uuid())
  userId    String
  productId String
  clickId   String   @unique
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  product   Product  @relation(fields: [productId], references: [id])
}
```

## 3. API 设计

### 3.1 RESTful API 设计规范

#### 3.1.1 统一响应格式

```typescript
// 成功响应
{
  code: 200,
  message: "success",
  data: T
}

// 错误响应
{
  code: number,
  message: string,
  error?: any
}
```

#### 3.1.2 商品管理 API

```
GET    /api/products              // 查询商品列表（支持分页、排序、筛选）
GET    /api/products/:id          // 查询商品详情
POST   /api/products              // 添加商品
PUT    /api/products/:id          // 修改商品
DELETE /api/products/:id          // 删除商品
POST   /api/products/:id/push     // 推送商品到队列
```

#### 3.1.3 品牌管理 API

```
GET    /api/brands                // 查询品牌列表
GET    /api/brands/:id            // 查询品牌详情
POST   /api/brands                // 添加品牌
PUT    /api/brands/:id            // 修改品牌
DELETE /api/brands/:id            // 删除品牌
```

#### 3.1.4 分类管理 API

```
GET    /api/categories            // 查询分类列表（树形结构）
GET    /api/categories/:id        // 查询分类详情
POST   /api/categories            // 添加分类
PUT    /api/categories/:id        // 修改分类
DELETE /api/categories/:id        // 删除分类
```

#### 3.1.5 权限管理 API

```
GET    /api/permissions           // 查询权限列表
GET    /api/permissions/:id       // 查询权限详情
POST   /api/permissions           // 添加权限
PUT    /api/permissions/:id       // 修改权限
DELETE /api/permissions/:id       // 删除权限
```

#### 3.1.6 角色管理 API

```
GET    /api/roles                 // 查询角色列表
GET    /api/roles/:id             // 查询角色详情（包含权限）
POST   /api/roles                 // 添加角色
PUT    /api/roles/:id             // 修改角色
DELETE /api/roles/:id             // 删除角色
POST   /api/roles/:id/permissions // 为角色分配权限
```

#### 3.1.7 用户管理 API

```
GET    /api/users                 // 查询用户列表
GET    /api/users/:id             // 查询用户详情
PUT    /api/users/:id             // 修改用户
DELETE /api/users/:id             // 删除用户
POST   /api/users/:id/roles       // 为用户分配角色
```

#### 3.1.8 存储管理 API

```
GET    /api/storages              // 查询存储配置列表
GET    /api/storages/:id          // 查询存储配置详情
POST   /api/storages              // 添加存储配置
PUT    /api/storages/:id          // 修改存储配置
DELETE /api/storages/:id          // 删除存储配置
```

#### 3.1.9 订单管理 API

```
GET    /api/orders                // 查询订单列表（支持分页、筛选）
GET    /api/orders/:id            // 查询订单详情
GET    /api/orders/export         // 导出订单（下载）
```

#### 3.1.10 Banner 管理 API

```
GET    /api/banners               // 查询Banner列表
GET    /api/banners/:id           // 查询Banner详情
POST   /api/banners               // 添加Banner
PUT    /api/banners/:id           // 修改Banner
DELETE /api/banners/:id           // 删除Banner
PUT    /api/banners/sort          // 更新Banner排序
```

#### 3.1.11 网站配置 API

```
GET    /api/configs               // 查询所有配置
GET    /api/configs/:key          // 查询单个配置
PUT    /api/configs/:key          // 更新配置
```

#### 3.1.12 认证 API

```
POST   /api/auth/register         // 注册（邮箱验证码）
POST   /api/auth/login            // 登录
POST   /api/auth/refresh          // 刷新token
POST   /api/auth/forgot-password  // 忘记密码
POST   /api/auth/send-code        // 发送验证码
```

#### 3.1.13 前台商品 API

```
GET    /api/public/products       // 公开商品列表（分页、搜索、筛选）
GET    /api/public/products/:id   // 公开商品详情
GET    /api/public/products/:id/recommendations // 推荐商品
GET    /api/public/banners        // 公开Banner列表
GET    /api/public/categories     // 公开分类列表
GET    /api/public/brands         // 公开品牌列表
```

#### 3.1.14 个人中心 API

```
GET    /api/user/profile          // 获取当前用户信息
PUT    /api/user/profile          // 更新当前用户信息（昵称、头像）
GET    /api/user/orders           // 获取当前用户的订单列表（分页）
GET    /api/user/orders/:id       // 获取当前用户的订单详情
POST   /api/user/upload-avatar    // 上传头像
```

### 3.2 WebSocket 设计

#### 3.2.1 连接流程

```
1. 客户端建立WebSocket连接: ws://domain/ws
2. 客户端发送认证消息: { type: 'auth', token: 'access_token' }
3. 服务端验证token，返回: { type: 'auth_success' } 或 { type: 'auth_failed' }
4. 连接成功后，客户端进入在线状态
```

#### 3.2.2 消息格式

```typescript
// 客户端发送
{
  type: 'auth' | 'ping',
  token?: string,
  data?: any
}

// 服务端发送
{
  type: 'auth_success' | 'auth_failed' | 'product_push' | 'pong',
  data?: any
}
```

#### 3.2.3 商品推送流程

```
1. 后台管理推送商品 -> POST /api/products/:id/push
2. NestJS将推送任务添加到Redis队列
3. 队列消费者从Redis获取任务
4. 查询所有在线用户（通过refresh_tokens）
5. 通过WebSocket向在线用户推送商品信息
```

## 4. 前端设计

### 4.1 后台管理系统（UmiJS）

#### 4.1.1 页面结构

```
/admin
  /login                    // 登录页
  /dashboard                // 仪表盘
  /products                 // 商品管理
    /list                   // 商品列表
    /create                 // 添加商品
    /edit/:id               // 编辑商品
  /brands                   // 品牌管理
  /categories               // 分类管理
  /permissions              // 权限管理
  /roles                    // 角色管理
  /users                    // 用户管理
  /storages                 // 存储管理
  /orders                   // 订单管理
  /banners                  // Banner管理
  /configs                  // 网站配置
```

#### 4.1.2 组件设计

- Layout 组件（包含菜单、头部、内容区）
- Table 组件（支持分页、排序、筛选）
- Form 组件（统一表单组件）
- Upload 组件（图片上传）
- Modal 组件（弹窗）

### 4.2 前台 PC 端（Next.js）

#### 4.2.1 页面结构

```
/
  /login                    // 登录页
  /register                 // 注册页
  /forgot-password          // 忘记密码
  /                         // 首页
  /products                 // 商品列表页
  /products/[id]            // 商品详情页
  /search                   // 搜索结果页
  /profile                  // 个人中心
    /orders                 // 我的订单
    /settings               // 个人设置
```

#### 4.2.2 组件设计

- Header 组件（包含搜索框、登录状态）
- Banner 组件（轮播图）
- ProductList 组件（商品列表，支持分页）
- ProductCard 组件（商品卡片）
- ProductDetail 组件（商品详情）
- RecommendationCarousel 组件（推荐商品轮播）
- WebSocketClient 组件（WebSocket 连接管理）
- ProfileHeader 组件（个人中心头部，显示头像、昵称、积分、余额）
- ProfileForm 组件（个人信息编辑表单）
- OrderList 组件（订单列表，支持分页）
- AvatarUpload 组件（头像上传组件）

#### 4.2.3 状态管理

- 使用 Context API 或 Zustand 管理全局状态
- 用户登录状态
- WebSocket 连接状态
- 购物车状态（如需要）

## 5. 后端服务设计

### 5.1 NestJS 模块结构

```
src/
  /modules
    /auth              // 认证模块
    /users             // 用户模块
    /products          // 商品模块
    /brands            // 品牌模块
    /categories        // 分类模块
    /orders            // 订单模块
    /banners           // Banner模块
    /storages          // 存储模块
    /permissions       // 权限模块
    /roles             // 角色模块
    /configs           // 配置模块
    /websocket         // WebSocket模块
    /queue             // 队列模块
  /common
    /guards            // 守卫（权限、认证）
    /decorators        // 装饰器
    /filters           // 异常过滤器
    /interceptors      // 拦截器
    /pipes             // 管道（验证）
    /dto               // 数据传输对象
  /config              // 配置文件
  /database            // Prisma配置
```

### 5.2 核心服务设计

#### 5.2.1 认证服务 (AuthService)

- 用户注册（邮箱验证码）
- 用户登录（生成 access_token 和 refresh_token）
- Token 刷新
- 忘记密码
- 验证码发送

#### 5.2.2 商品服务 (ProductService)

- 商品 CRUD 操作
- 商品推送（添加到 Redis 队列）
- 商品搜索
- 商品推荐算法

#### 5.2.3 队列服务 (QueueService)

- 使用 Redis 实现队列
- 商品推送任务入队
- 消费队列，向 WebSocket 客户端推送

#### 5.2.4 WebSocket 服务 (WebSocketGateway)

- 管理 WebSocket 连接
- 用户认证（通过 token）
- 在线用户管理
- 商品推送

#### 5.2.5 权限服务 (PermissionService)

- 权限验证
- 角色权限管理
- 用户权限检查

#### 5.2.6 用户服务 (UserService)

- 获取当前用户信息
- 更新用户信息（昵称、头像）
- 上传头像到云存储
- 查询用户订单列表（分页）
- 查询用户订单详情

#### 5.2.7 订单服务 (OrderService)

- 订单同步（从购物平台）
- 通过 clickId 关联订单到用户
- 订单查询（支持分页、筛选）
- 订单详情查询

### 5.3 Redis 设计

#### 5.3.1 队列设计

```
队列名称: product:push:queue
队列结构: {
  productId: string,
  pushTime: timestamp,
  targetUsers?: string[]  // 可选，指定推送用户
}
```

#### 5.3.2 在线用户管理

```
Key: online:users
Type: Set
Value: userId列表
```

#### 5.3.3 缓存设计

```
商品列表缓存: cache:products:list:{page}:{limit}:{filters}
商品详情缓存: cache:products:{id}
Banner缓存: cache:banners:active
```

## 6. 安全设计

### 6.1 认证机制

- JWT Token 认证
- Access Token（短期有效）
- Refresh Token（长期有效，用于刷新 Access Token）
- Remember me 功能（Refresh Token 有效期一周）

### 6.2 权限控制

- 基于角色的访问控制（RBAC）
- 守卫（Guards）进行权限验证
- 装饰器进行权限声明

### 6.3 数据安全

- 密码加密存储（bcrypt）
- SQL 注入防护（Prisma 参数化查询）
- XSS 防护
- CSRF 防护

## 7. 国际化设计

### 7.1 多语言支持

- 使用 i18n 库（如 react-i18next, nestjs-i18n）
- 语言资源文件管理
- 支持语言切换

### 7.2 资源文件结构

```
locales/
  /zh-CN
    /common.json
    /products.json
    /auth.json
  /en-US
    /common.json
    /products.json
    /auth.json
```

## 8. 部署设计

### 8.1 环境配置

- 开发环境
- 测试环境
- 生产环境

### 8.2 配置文件

- 数据库连接配置
- Redis 连接配置
- JWT 密钥配置
- 云存储配置
- 邮件服务配置（验证码）

## 9. 开发规范

### 9.1 代码规范

- TypeScript 严格模式
- ESLint 代码检查
- Prettier 代码格式化
- 统一的命名规范

### 9.2 Git 规范

- 分支管理策略
- 提交信息规范
- Code Review 流程

## 10. 测试设计

### 10.1 单元测试

- 服务层单元测试
- 工具函数测试

### 10.2 集成测试

- API 接口测试
- 数据库操作测试

### 10.3 E2E 测试

- 关键业务流程测试
