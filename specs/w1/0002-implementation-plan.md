# 返利折扣网系统 - 实现计划

## 1. 项目概述

本文档基于需求文档（0001-requirement.md）和设计文档（0001-design.md），制定详细的开发实现计划。

### 1.1 项目目标

构建一个完整的返利折扣网系统，包括：

- 后台管理系统（UmiJS）
- 前台 PC 端（Next.js + Tailwind CSS + TypeScript）
- 后端 API 服务（NestJS + Prisma + PostgreSQL + Redis）

### 1.2 技术栈

**后端：**

- NestJS
- Prisma ORM
- PostgreSQL
- Redis
- WebSocket

**前端：**

- Next.js (前台)
- UmiJS (后台管理)
- Tailwind CSS
- TypeScript

### 1.3 开发阶段

本项目分为 7 个主要开发阶段：

1. **项目初始化与环境搭建**
2. **数据库设计与 Prisma 配置**
3. **后端 NestJS 核心模块开发**
4. **后台管理系统 UmiJS 开发**
5. **前台 PC 端 Next.js 开发**
6. **WebSocket 与队列系统**
7. **测试与部署**

---

## 2. 第一阶段：项目初始化与环境搭建

### 2.1 项目结构规划

```
rebate-discount-system/
├── backend/                 # NestJS 后端服务
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── admin/                   # UmiJS 后台管理系统
│   ├── src/
│   ├── package.json
│   └── .umirc.ts
├── frontend/                # Next.js 前台PC端
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
└── docs/                    # 项目文档
```

### 2.2 后端项目初始化

#### 2.2.1 创建 NestJS 项目

```bash
# 安装NestJS CLI
npm i -g @nestjs/cli

# 创建项目
nest new backend
cd backend

# 安装核心依赖
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install passport passport-jwt bcrypt class-validator class-transformer
npm install redis ioredis
npm install @prisma/client
npm install --save-dev prisma
```

#### 2.2.2 配置 TypeScript 和 ESLint

- 配置 `tsconfig.json` 启用严格模式
- 配置 ESLint 和 Prettier
- 设置代码格式化规则

#### 2.2.3 环境变量配置

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/rebate_db"

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# 应用配置
PORT=3000
NODE_ENV=development

# 云存储配置（后续添加）
STORAGE_TYPE=aliyun
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_REGION=
```

### 2.3 前端项目初始化

#### 2.3.1 创建 Next.js 项目（前台）

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend

# 安装额外依赖
npm install axios
npm install zustand  # 状态管理
npm install socket.io-client  # WebSocket客户端
npm install react-hook-form  # 表单处理
npm install @headlessui/react  # UI组件
```

#### 2.3.2 创建 UmiJS 项目（后台管理）

```bash
# 使用UmiJS脚手架
npm create umi admin
cd admin

# 选择配置
# - TypeScript: Yes
# - Ant Design: Yes
# - 其他按需选择

# 安装依赖
npm install
```

### 2.4 数据库环境准备

#### 2.4.1 安装 PostgreSQL

- 安装 PostgreSQL 数据库
- 创建数据库：`rebate_db`
- 配置数据库用户和权限

#### 2.4.2 安装 Redis

- 安装 Redis 服务器
- 配置 Redis 密码（生产环境）
- 测试 Redis 连接

### 2.5 Git 仓库初始化

```bash
# 初始化Git仓库
git init

# 创建.gitignore
# 添加node_modules, .env等忽略文件

# 创建README.md
# 添加项目说明和启动指南
```

### 2.6 开发工具配置

- 配置 VS Code 工作区
- 安装推荐插件（ESLint, Prettier, Prisma 等）
- 配置调试环境

### 2.7 验收标准

- [ ] 三个项目（backend, admin, frontend）都能正常启动
- [ ] 数据库连接成功
- [ ] Redis 连接成功
- [ ] 环境变量配置正确
- [ ] Git 仓库初始化完成

---

## 3. 第二阶段：数据库设计与 Prisma 配置

### 3.1 Prisma 初始化

```bash
cd backend
npx prisma init
```

### 3.2 创建 Prisma Schema

根据设计文档创建完整的 `schema.prisma` 文件，包括：

#### 3.2.1 数据模型定义

1. **User 模型**（用户表）

   - 基础字段：id, email, username, password
   - 个人信息：nickname, avatar
   - 积分字段：totalPoints, remainingPoints
   - 余额字段：balance
   - 关系：roles, points, tokens, orders

2. **PointRecord 模型**（积分记录表）

   - 关联用户
   - 积分变动记录

3. **Product 模型**（商品表）

   - 商品基本信息
   - 价格信息
   - 关联：brand, category, storage

4. **Brand 模型**（品牌表）
5. **Category 模型**（分类表，支持树形结构）
6. **Order 模型**（订单表）

   - 包含 clickId 字段
   - 关联用户和商品

7. **Banner 模型**（Banner 表）
8. **Storage 模型**（存储配置表）
9. **Permission 模型**（权限表）
10. **Role 模型**（角色表）
11. **RolePermission 模型**（角色权限关联表）
12. **UserRole 模型**（用户角色关联表）
13. **AccessToken 模型**（访问令牌表）
14. **RefreshToken 模型**（刷新令牌表）
15. **SiteConfig 模型**（网站配置表）
16. **ClickRecord 模型**（点击记录表，可选）

#### 3.2.2 关系定义

- 定义所有模型之间的关联关系
- 设置外键约束
- 配置级联删除规则

#### 3.2.3 索引优化

- 为常用查询字段创建索引
- clickId 索引
- userId 索引
- email, username 唯一索引

### 3.3 数据库迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name init

# 查看数据库结构
npx prisma studio
```

### 3.4 Prisma Client 生成

```bash
# 生成Prisma Client
npx prisma generate
```

### 3.5 创建 Prisma Service

在 NestJS 中创建 Prisma 服务：

```typescript
// src/database/prisma.service.ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### 3.6 种子数据（Seed）

创建初始数据：

1. **默认管理员用户**

   - email: admin@example.com
   - password: (加密后的密码)
   - isAdmin: true

2. **默认角色和权限**

   - admin 角色（拥有所有权限）
   - 基础权限列表

3. **网站配置**
   - 注册赠送积分数量
   - 订单赠送积分数量

```bash
# 创建seed文件
npx prisma db seed
```

### 3.7 数据库验证

- [ ] 所有表创建成功
- [ ] 关系定义正确
- [ ] 索引创建成功
- [ ] 种子数据插入成功
- [ ] Prisma Client 可以正常使用

### 3.8 验收标准

- [ ] Prisma Schema 定义完整
- [ ] 数据库迁移成功
- [ ] 所有模型关系正确
- [ ] 索引优化完成
- [ ] 种子数据创建成功
- [ ] Prisma Service 可以正常使用

---

## 4. 第三阶段：后端 NestJS 核心模块开发

### 4.1 项目结构搭建

```
src/
├── common/              # 公共模块
│   ├── guards/         # 守卫（认证、权限）
│   ├── decorators/     # 装饰器
│   ├── filters/        # 异常过滤器
│   ├── interceptors/   # 拦截器
│   ├── pipes/          # 管道（验证）
│   └── dto/            # 数据传输对象
├── config/             # 配置文件
├── database/           # 数据库相关
│   └── prisma.service.ts
└── modules/            # 业务模块
    ├── auth/
    ├── users/
    ├── products/
    ├── brands/
    ├── categories/
    ├── orders/
    ├── banners/
    ├── storages/
    ├── permissions/
    ├── roles/
    └── configs/
```

### 4.2 公共模块开发

#### 4.2.1 配置模块（ConfigModule）

- 使用@nestjs/config
- 加载环境变量
- 配置验证

#### 4.2.2 异常过滤器

- 全局异常过滤器
- 统一错误响应格式
- 错误日志记录

#### 4.2.3 响应拦截器

- 统一成功响应格式
- 数据转换

#### 4.2.4 验证管道

- 使用 class-validator
- DTO 验证
- 自定义验证规则

### 4.3 认证模块（AuthModule）

#### 4.3.1 JWT 策略

- 实现 JWT 认证策略
- Access Token 生成
- Refresh Token 生成
- Token 验证

#### 4.3.2 认证服务（AuthService）

功能实现：

- `register()` - 用户注册（邮箱验证码）
- `login()` - 用户登录
- `refreshToken()` - 刷新 Token
- `forgotPassword()` - 忘记密码
- `sendVerificationCode()` - 发送验证码
- `validateUser()` - 验证用户

#### 4.3.3 认证守卫（AuthGuard）

- JWT 认证守卫
- Token 验证
- 用户信息注入

#### 4.3.4 认证控制器（AuthController）

API 端点：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/send-code`

#### 4.3.5 验证码服务

- 邮箱验证码生成
- 验证码存储（Redis）
- 验证码验证

### 4.4 用户模块（UsersModule）

#### 4.4.1 用户服务（UserService）

功能实现：

- `findAll()` - 查询用户列表
- `findOne()` - 查询用户详情
- `update()` - 更新用户信息
- `delete()` - 删除用户
- `assignRole()` - 分配角色
- `getProfile()` - 获取当前用户信息
- `updateProfile()` - 更新个人信息
- `uploadAvatar()` - 上传头像

#### 4.4.2 用户控制器（UsersController）

API 端点：

- `GET /api/users`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/users/:id/roles`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `POST /api/user/upload-avatar`

### 4.5 商品模块（ProductsModule）

#### 4.5.1 商品服务（ProductService）

功能实现：

- `findAll()` - 查询商品列表（分页、排序、筛选）
- `findOne()` - 查询商品详情
- `create()` - 创建商品
- `update()` - 更新商品
- `delete()` - 删除商品
- `push()` - 推送商品到队列
- `search()` - 搜索商品
- `getRecommendations()` - 获取推荐商品

#### 4.5.2 商品控制器（ProductsController）

API 端点：

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/push`
- `GET /api/public/products`
- `GET /api/public/products/:id`
- `GET /api/public/products/:id/recommendations`

### 4.6 品牌模块（BrandsModule）

#### 4.6.1 品牌服务（BrandService）

- CRUD 操作

#### 4.6.2 品牌控制器（BrandsController）

- `GET /api/brands`
- `GET /api/brands/:id`
- `POST /api/brands`
- `PUT /api/brands/:id`
- `DELETE /api/brands/:id`

### 4.7 分类模块（CategoriesModule）

#### 4.7.1 分类服务（CategoryService）

- CRUD 操作
- 树形结构处理
- 分类层级管理

#### 4.7.2 分类控制器（CategoriesController）

- `GET /api/categories`（返回树形结构）
- `GET /api/categories/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### 4.8 订单模块（OrdersModule）

#### 4.8.1 订单服务（OrderService）

功能实现：

- `findAll()` - 查询订单列表
- `findOne()` - 查询订单详情
- `syncOrder()` - 同步订单（从购物平台）
- `associateByClickId()` - 通过 clickId 关联订单
- `getUserOrders()` - 获取用户订单
- `exportOrders()` - 导出订单

#### 4.8.2 订单控制器（OrdersController）

API 端点：

- `GET /api/orders`
- `GET /api/orders/:id`
- `GET /api/orders/export`
- `POST /api/orders/sync`（购物平台回调）
- `GET /api/user/orders`
- `GET /api/user/orders/:id`

### 4.9 Banner 模块（BannersModule）

#### 4.9.1 Banner 服务（BannerService）

- CRUD 操作
- 排序管理

#### 4.9.2 Banner 控制器（BannersController）

- `GET /api/banners`
- `GET /api/banners/:id`
- `POST /api/banners`
- `PUT /api/banners/:id`
- `DELETE /api/banners/:id`
- `PUT /api/banners/sort`
- `GET /api/public/banners`

### 4.10 存储模块（StoragesModule）

#### 4.10.1 存储服务（StorageService）

- 存储配置管理
- 文件上传到云存储
- 支持多种云存储（阿里云、七牛等）

#### 4.10.2 存储控制器（StoragesController）

- `GET /api/storages`
- `GET /api/storages/:id`
- `POST /api/storages`
- `PUT /api/storages/:id`
- `DELETE /api/storages/:id`

### 4.11 权限模块（PermissionsModule）

#### 4.11.1 权限服务（PermissionService）

- 权限 CRUD
- 权限验证
- 用户权限检查

#### 4.11.2 权限守卫（PermissionGuard）

- 基于权限代码的访问控制
- 装饰器：`@RequirePermission()`

#### 4.11.3 权限控制器（PermissionsController）

- `GET /api/permissions`
- `GET /api/permissions/:id`
- `POST /api/permissions`
- `PUT /api/permissions/:id`
- `DELETE /api/permissions/:id`

### 4.12 角色模块（RolesModule）

#### 4.12.1 角色服务（RoleService）

- 角色 CRUD
- 权限分配
- 角色权限管理

#### 4.12.2 角色控制器（RolesController）

- `GET /api/roles`
- `GET /api/roles/:id`
- `POST /api/roles`
- `PUT /api/roles/:id`
- `DELETE /api/roles/:id`
- `POST /api/roles/:id/permissions`

### 4.13 配置模块（ConfigsModule）

#### 4.13.1 配置服务（ConfigService）

- 配置项管理
- 配置读取和更新

#### 4.13.2 配置控制器（ConfigsController）

- `GET /api/configs`
- `GET /api/configs/:key`
- `PUT /api/configs/:key`

### 4.14 积分服务（PointsService）

- 积分增加/减少
- 积分记录
- 积分规则应用（注册赠送、订单赠送）

### 4.15 验收标准

- [ ] 所有模块创建完成
- [ ] 所有 API 端点实现
- [ ] 认证和授权正常工作
- [ ] 数据验证通过
- [ ] 异常处理完善
- [ ] API 文档生成（Swagger）

---

## 5. 第四阶段：后台管理系统 UmiJS 开发

### 5.1 项目结构

```
admin/
├── src/
│   ├── pages/              # 页面
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── brands/
│   │   ├── categories/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── orders/
│   │   ├── banners/
│   │   ├── storages/
│   │   └── configs/
│   ├── components/         # 公共组件
│   ├── services/           # API服务
│   ├── utils/              # 工具函数
│   ├── models/             # 数据模型
│   ├── layouts/            # 布局组件
│   └── app.tsx             # 应用入口
├── .umirc.ts               # UmiJS配置
└── package.json
```

### 5.2 基础配置

#### 5.2.1 UmiJS 配置

- 配置路由
- 配置代理（API 请求）
- 配置 Ant Design
- 配置国际化

#### 5.2.2 API 服务封装

- 创建 axios 实例
- 请求拦截器（添加 token）
- 响应拦截器（处理错误）
- API 接口定义

#### 5.2.3 状态管理

- 使用 UmiJS 的 model
- 用户状态管理
- 权限状态管理

### 5.3 布局组件

#### 5.3.1 主布局（Layout）

- 侧边栏菜单
- 顶部导航
- 内容区域
- 用户信息展示

#### 5.3.2 菜单配置

- 动态菜单（基于权限）
- 菜单图标
- 路由配置

### 5.4 登录页面

- 登录表单
- 表单验证
- 记住我功能
- 错误提示

### 5.5 商品管理页面

#### 5.5.1 商品列表页

- 表格展示
- 分页功能
- 搜索功能
- 筛选功能（品牌、分类、平台）
- 排序功能
- 操作按钮（编辑、删除、推送）

#### 5.5.2 商品添加/编辑页

- 表单组件
- 字段验证
- 图片上传
- 品牌选择
- 分类选择
- 存储选择
- 提交处理

#### 5.5.3 商品推送功能

- 推送按钮
- 推送确认
- 推送状态反馈

### 5.6 品牌管理页面

- 品牌列表
- 品牌添加/编辑
- 品牌删除
- 品牌 Logo 上传

### 5.7 分类管理页面

- 分类树形展示
- 分类添加/编辑
- 分类删除
- 分类排序

### 5.8 用户管理页面

- 用户列表
- 用户详情
- 用户编辑
- 用户删除
- 角色分配

### 5.9 角色管理页面

- 角色列表
- 角色添加/编辑
- 角色删除
- 权限分配（树形选择）

### 5.10 权限管理页面

- 权限列表
- 权限添加/编辑
- 权限删除
- 权限代码管理

### 5.11 订单管理页面

- 订单列表
- 订单筛选
- 订单详情
- 订单导出

### 5.12 Banner 管理页面

- Banner 列表
- Banner 添加/编辑
- Banner 删除
- Banner 排序（拖拽）

### 5.13 存储管理页面

- 存储配置列表
- 存储配置添加/编辑
- 存储配置删除
- 存储测试连接

### 5.14 网站配置页面

- 配置项列表
- 配置项编辑
- 配置项说明

### 5.15 权限控制

- 路由守卫（基于权限）
- 按钮权限控制
- 菜单权限控制

### 5.16 验收标准

- [ ] 所有页面开发完成
- [ ] 路由配置正确
- [ ] API 接口对接成功
- [ ] 权限控制生效
- [ ] 表单验证正常
- [ ] 数据展示正确
- [ ] 用户体验良好

---

## 6. 第五阶段：前台 PC 端 Next.js 开发

### 6.1 项目结构

```
frontend/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # 认证相关页面
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (main)/         # 主页面
│   │   │   ├── page.tsx    # 首页
│   │   │   ├── products/
│   │   │   ├── products/[id]/
│   │   │   ├── search/
│   │   │   └── profile/
│   │   └── layout.tsx
│   ├── components/         # 组件
│   │   ├── common/         # 公共组件
│   │   ├── product/        # 商品相关组件
│   │   ├── banner/         # Banner组件
│   │   └── profile/        # 个人中心组件
│   ├── lib/                # 工具库
│   │   ├── api/            # API客户端
│   │   ├── websocket/      # WebSocket客户端
│   │   └── utils/          # 工具函数
│   ├── store/              # 状态管理（Zustand）
│   ├── hooks/              # 自定义Hooks
│   └── types/              # TypeScript类型
├── public/                 # 静态资源
└── tailwind.config.js      # Tailwind配置
```

### 6.2 基础配置

#### 6.2.1 Next.js 配置

- App Router 配置
- 环境变量配置
- API 代理配置

#### 6.2.2 Tailwind CSS 配置

- 主题配置
- 自定义颜色
- 响应式断点

#### 6.2.3 API 客户端

- axios 实例创建
- 请求拦截器
- 响应拦截器
- Token 管理

### 6.3 公共组件

#### 6.3.1 Header 组件

- Logo
- 搜索框
- 导航菜单
- 用户信息（登录状态）
- 登录/注册按钮

#### 6.3.2 Footer 组件

- 版权信息
- 友情链接
- 联系方式

#### 6.3.3 Layout 组件

- Header
- 内容区域
- Footer

### 6.4 认证页面

#### 6.4.1 登录页面

- 登录表单
- 邮箱/用户名登录
- 密码输入
- Remember me 选项
- 忘记密码链接
- 注册链接

#### 6.4.2 注册页面

- 注册表单
- 邮箱输入
- 验证码输入
- 发送验证码按钮
- 密码设置
- 注册提交

#### 6.4.3 忘记密码页面

- 邮箱输入
- 验证码输入
- 新密码设置
- 重置密码

### 6.5 首页

#### 6.5.1 Banner 轮播

- Banner 图片展示
- 自动轮播
- 手动切换
- 点击跳转

#### 6.5.2 搜索功能

- 搜索框
- 搜索建议
- 条件筛选（分类、品牌）
- 搜索结果展示

#### 6.5.3 商品列表

- 商品卡片展示
- 分页加载
- 排序功能（价格、时间、热度）
- 筛选功能
- 加载更多

#### 6.5.4 商品卡片组件

- 商品图片
- 商品标题
- 原价/折扣价
- 折扣标签
- "去购买"按钮

### 6.6 商品详情页

#### 6.6.1 商品信息展示

- 商品图片（轮播）
- 商品标题
- 商品描述
- 价格信息
- 品牌信息
- 分类信息
- "去购买"按钮（生成 clickId）

#### 6.6.2 推荐商品

- 推荐商品列表
- 自动滚动轮播
- 商品卡片展示

### 6.7 搜索结果页

- 搜索结果列表
- 筛选条件
- 排序选项
- 分页

### 6.8 个人中心

#### 6.8.1 个人中心首页

- 用户信息展示
  - 头像
  - 昵称
  - 积分信息
  - 余额信息
- 快捷入口
  - 我的订单
  - 个人设置

#### 6.8.2 个人设置

- 修改昵称
- 上传头像
- 头像预览
- 保存按钮

#### 6.8.3 我的订单

- 订单列表（分页）
- 订单状态筛选
- 订单详情
- 订单信息展示
  - 订单号
  - 商品信息
  - 订单金额
  - 订单状态
  - 下单时间

### 6.9 状态管理

#### 6.9.1 用户状态

- 登录状态
- 用户信息
- Token 管理

#### 6.9.2 购物状态（如需要）

- 购物车
- 收藏

### 6.10 路由保护

- 认证路由保护
- 未登录跳转登录页
- Token 过期处理

### 6.11 响应式设计

- 移动端适配
- 平板适配
- PC 端优化

### 6.12 验收标准

- [ ] 所有页面开发完成
- [ ] 路由配置正确
- [ ] API 接口对接成功
- [ ] 响应式设计完成
- [ ] 用户体验良好
- [ ] 性能优化完成

---

## 7. 第六阶段：WebSocket 与队列系统

### 7.1 Redis 队列系统

#### 7.1.1 Redis 配置

- 连接 Redis
- Redis 模块封装
- 连接池配置

#### 7.1.2 队列服务（QueueService）

功能实现：

- `addToQueue()` - 添加任务到队列
- `processQueue()` - 处理队列任务
- `getQueueLength()` - 获取队列长度
- `clearQueue()` - 清空队列

#### 7.1.3 商品推送队列

队列结构：

```typescript
{
  productId: string,
  pushTime: timestamp,
  targetUsers?: string[]
}
```

队列操作：

- 商品推送任务入队
- 队列消费者处理
- 失败重试机制

### 7.2 WebSocket 服务端

#### 7.2.1 WebSocket Gateway

- 创建 WebSocket Gateway
- 配置 CORS
- 连接管理

#### 7.2.2 连接处理

- `handleConnection()` - 处理新连接
- `handleDisconnect()` - 处理断开连接
- 连接状态管理

#### 7.2.3 认证机制

- Token 验证
- 用户身份识别
- 在线用户管理（Redis Set）

#### 7.2.4 消息处理

- 接收客户端消息
- 消息类型处理
  - `auth` - 认证
  - `ping` - 心跳
- 发送消息到客户端

#### 7.2.5 商品推送

- 从队列获取推送任务
- 查询在线用户
- 向在线用户推送商品信息
- 推送状态记录

### 7.3 WebSocket 客户端（Next.js）

#### 7.3.1 WebSocket 客户端封装

- Socket.io 客户端
- 连接管理
- 自动重连
- 心跳机制

#### 7.3.2 连接流程

1. 用户登录后建立连接
2. 发送 token 进行认证
3. 接收认证结果
4. 保持连接活跃

#### 7.3.3 消息处理

- 接收服务端消息
- 商品推送消息处理
- 消息展示（通知）

#### 7.3.4 React Hook 封装

```typescript
useWebSocket() {
  // 连接管理
  // 消息接收
  // 状态管理
}
```

### 7.4 在线用户管理

#### 7.4.1 Redis 存储

- 在线用户 Set：`online:users`
- 用户连接映射：`user:connections:{userId}`

#### 7.4.2 用户状态

- 用户上线
- 用户下线
- 在线用户查询

### 7.5 队列消费者

#### 7.5.1 消费者服务

- 定时轮询队列
- 批量处理任务
- 错误处理
- 日志记录

#### 7.5.2 处理流程

1. 从 Redis 队列获取任务
2. 查询在线用户
3. 通过 WebSocket 推送
4. 标记任务完成
5. 失败重试

### 7.6 clickId 生成与管理

#### 7.6.1 clickId 生成

- 用户点击商品时生成
- UUID 格式
- 存储到 ClickRecord 表

#### 7.6.2 链接处理

- 商品链接添加 clickId 参数
- 跳转到购物平台
- clickId 与用户关联

#### 7.6.3 订单关联

- 购物平台回调订单
- 通过 clickId 查找用户
- 关联订单到用户

### 7.7 验收标准

- [ ] Redis 队列正常工作
- [ ] WebSocket 连接稳定
- [ ] 商品推送功能正常
- [ ] 在线用户管理正确
- [ ] clickId 生成和关联正常
- [ ] 错误处理和重试机制完善

---

## 8. 第七阶段：测试与部署

### 8.1 单元测试

#### 8.1.1 后端单元测试

- 服务层测试
- 工具函数测试
- 使用 Jest 框架

测试覆盖：

- AuthService
- UserService
- ProductService
- OrderService
- 其他核心服务

#### 8.1.2 前端单元测试

- 组件测试
- Hook 测试
- 工具函数测试

### 8.2 集成测试

#### 8.2.1 API 集成测试

- 认证流程测试
- CRUD 操作测试
- 权限控制测试
- 使用 Supertest

#### 8.2.2 数据库测试

- 数据模型测试
- 关系测试
- 事务测试

### 8.3 E2E 测试

#### 8.3.1 关键流程测试

- 用户注册登录流程
- 商品浏览购买流程
- 订单关联流程
- 商品推送流程

#### 8.3.2 测试工具

- Playwright 或 Cypress
- 自动化测试脚本

### 8.4 性能测试

#### 8.4.1 接口性能

- 响应时间测试
- 并发测试
- 压力测试

#### 8.4.2 数据库性能

- 查询优化
- 索引优化
- 慢查询分析

### 8.5 安全测试

#### 8.5.1 安全漏洞扫描

- SQL 注入测试
- XSS 测试
- CSRF 测试
- 认证授权测试

#### 8.5.2 数据安全

- 密码加密验证
- Token 安全验证
- 敏感数据保护

### 8.6 部署准备

#### 8.6.1 环境配置

- 生产环境变量
- 数据库配置
- Redis 配置
- 云存储配置

#### 8.6.2 构建优化

- 前端构建优化
- 代码压缩
- 资源优化
- 打包分析

#### 8.6.3 Docker 化

- Dockerfile 编写
- docker-compose 配置
- 容器编排

### 8.7 部署方案

#### 8.7.1 服务器部署

- 服务器选择
- 环境安装
- 服务部署
- Nginx 配置

#### 8.7.2 云服务部署

- 容器服务部署
- 云数据库
- 云存储
- CDN 配置

### 8.8 监控与日志

#### 8.8.1 日志系统

- 应用日志
- 错误日志
- 访问日志
- 日志收集和分析

#### 8.8.2 监控系统

- 服务监控
- 性能监控
- 错误监控
- 告警机制

### 8.9 文档编写

#### 8.9.1 API 文档

- Swagger 文档
- 接口说明
- 参数说明
- 示例代码

#### 8.9.2 部署文档

- 部署步骤
- 环境要求
- 配置说明
- 故障排查

#### 8.9.3 用户手册

- 后台管理使用手册
- 前台使用说明

### 8.10 验收标准

- [ ] 单元测试覆盖率>80%
- [ ] 集成测试通过
- [ ] E2E 测试通过
- [ ] 性能测试达标
- [ ] 安全测试通过
- [ ] 部署文档完整
- [ ] 系统稳定运行

---

## 9. 开发规范与最佳实践

### 9.1 代码规范

#### 9.1.1 TypeScript 规范

- 使用严格模式
- 类型定义完整
- 避免使用 any
- 接口优先于类型别名

#### 9.1.2 命名规范

- 文件命名：kebab-case
- 类命名：PascalCase
- 函数/变量命名：camelCase
- 常量命名：UPPER_SNAKE_CASE

#### 9.1.3 代码组织

- 单一职责原则
- 模块化设计
- 代码复用
- 注释规范

### 9.2 Git 工作流

#### 9.2.1 分支策略

- `main` - 主分支（生产环境）
- `develop` - 开发分支
- `feature/*` - 功能分支
- `bugfix/*` - 修复分支
- `hotfix/*` - 热修复分支

#### 9.2.2 提交规范

使用 Conventional Commits：

- `feat:` - 新功能
- `fix:` - 修复 bug
- `docs:` - 文档更新
- `style:` - 代码格式
- `refactor:` - 重构
- `test:` - 测试
- `chore:` - 构建/工具

### 9.3 API 设计规范

#### 9.3.1 RESTful 规范

- 使用标准 HTTP 方法
- 资源命名规范
- 状态码使用规范
- 统一响应格式

#### 9.3.2 版本控制

- API 版本管理
- 向后兼容
- 废弃策略

### 9.4 数据库规范

#### 9.4.1 命名规范

- 表名：snake_case，复数形式
- 字段名：snake_case
- 索引名：idx*{table}*{field}

#### 9.4.2 设计原则

- 规范化设计
- 适当冗余
- 索引优化
- 外键约束

### 9.5 前端规范

#### 9.5.1 组件规范

- 组件单一职责
- Props 类型定义
- 组件文档
- 可复用性

#### 9.5.2 样式规范

- 使用 Tailwind CSS
- 响应式设计
- 主题一致性
- 无障碍访问

---

## 10. 风险点与应对措施

### 10.1 技术风险

#### 10.1.1 WebSocket 连接稳定性

**风险：** 连接断开、消息丢失

**应对：**

- 实现自动重连机制
- 消息确认机制
- 离线消息存储

#### 10.1.2 高并发处理

**风险：** 系统性能瓶颈

**应对：**

- 数据库连接池
- Redis 缓存
- 负载均衡
- 异步处理

#### 10.1.3 数据一致性

**风险：** 订单关联错误

**应对：**

- 事务处理
- 唯一性约束
- 数据校验
- 异常处理

### 10.2 业务风险

#### 10.2.1 订单关联失败

**风险：** clickId 丢失或无效

**应对：**

- clickId 有效期管理
- 订单回调验证
- 手动关联机制
- 日志记录

#### 10.2.2 积分计算错误

**风险：** 积分增减错误

**应对：**

- 事务处理
- 积分记录表
- 对账机制
- 异常回滚

### 10.3 安全风险

#### 10.3.1 认证安全

**风险：** Token 泄露、密码泄露

**应对：**

- Token 加密
- HTTPS 传输
- 密码加密存储
- 定期更换密钥

#### 10.3.2 数据安全

**风险：** SQL 注入、XSS 攻击

**应对：**

- 参数化查询（Prisma）
- 输入验证
- XSS 防护
- CSRF 防护

### 10.4 运维风险

#### 10.4.1 服务可用性

**风险：** 服务宕机

**应对：**

- 健康检查
- 自动重启
- 监控告警
- 备份恢复

#### 10.4.2 数据备份

**风险：** 数据丢失

**应对：**

- 定期备份
- 异地备份
- 备份验证
- 恢复演练

---

## 11. 时间估算

### 11.1 开发阶段时间分配

| 阶段                 | 预估时间 | 说明                  |
| -------------------- | -------- | --------------------- |
| 第一阶段：项目初始化 | 3-5 天   | 环境搭建、项目结构    |
| 第二阶段：数据库设计 | 5-7 天   | Prisma 配置、数据模型 |
| 第三阶段：后端开发   | 20-30 天 | 核心模块开发          |
| 第四阶段：后台管理   | 15-20 天 | UmiJS 开发            |
| 第五阶段：前台开发   | 15-20 天 | Next.js 开发          |
| 第六阶段：WebSocket  | 5-7 天   | 队列和 WebSocket      |
| 第七阶段：测试部署   | 10-15 天 | 测试、部署、文档      |

**总计：** 73-104 天（约 2.5-3.5 个月）

### 11.2 人员配置建议

- **后端开发：** 1-2 人
- **前端开发：** 1-2 人
- **测试：** 1 人（兼职）
- **运维：** 1 人（兼职）

### 11.3 里程碑

- **Week 1-2：** 项目初始化完成
- **Week 3-4：** 数据库和后端核心模块完成
- **Week 5-7：** 后台管理系统完成
- **Week 8-10：** 前台 PC 端完成
- **Week 11-12：** WebSocket 和队列完成
- **Week 13-14：** 测试和部署完成

---

## 12. 开发优先级

### 12.1 高优先级（P0）

1. 用户认证系统
2. 商品管理（CRUD）
3. 订单管理
4. 个人中心基础功能

### 12.2 中优先级（P1）

1. 权限管理系统
2. 品牌和分类管理
3. Banner 管理
4. WebSocket 推送

### 12.3 低优先级（P2）

1. 存储管理
2. 网站配置
3. 高级搜索
4. 推荐算法优化

---

## 13. 后续优化方向

### 13.1 功能扩展

- 移动端 APP
- 小程序
- 分销系统
- 优惠券系统

### 13.2 性能优化

- CDN 加速
- 图片优化
- 数据库优化
- 缓存策略优化

### 13.3 用户体验

- 个性化推荐
- 搜索优化
- 界面优化
- 交互优化

### 13.4 数据分析

- 用户行为分析
- 商品数据分析
- 订单数据分析
- 报表系统

---

## 14. 总结

本实现计划详细规划了返利折扣网系统的开发流程，包括 7 个主要开发阶段，从项目初始化到最终部署。每个阶段都有明确的任务清单和验收标准，确保项目按计划推进。

### 14.1 关键成功因素

1. **严格按照计划执行**
2. **及时沟通和反馈**
3. **代码质量保证**
4. **充分测试验证**
5. **文档及时更新**

### 14.2 注意事项

1. 每个阶段完成后进行评审
2. 遇到问题及时调整计划
3. 保持代码规范一致
4. 重视安全性和性能
5. 做好备份和版本控制

---

**文档版本：** v1.0  
**最后更新：** 2024 年  
**维护者：** 开发团队
