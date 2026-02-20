# 返利折扣网后端服务

## 技术栈

- NestJS
- Prisma
- PostgreSQL
- Redis
- WebSocket

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置相关参数。

### 数据库迁移

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 启动服务

```bash
npm run start:dev
```

服务将在 http://localhost:3000 启动。

## API 文档

API 基础路径：`/api`

### 认证接口

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新Token

### 商品接口

- `GET /api/products` - 获取商品列表
- `GET /api/products/:id` - 获取商品详情
- `POST /api/products` - 创建商品（需认证）
- `PUT /api/products/:id` - 更新商品（需认证）
- `DELETE /api/products/:id` - 删除商品（需认证）

## 项目结构

```
src/
├── common/          # 公共模块
├── database/        # 数据库配置
├── modules/         # 业务模块
│   ├── auth/       # 认证模块
│   ├── users/      # 用户模块
│   ├── products/   # 商品模块
│   └── ...
└── main.ts          # 入口文件
```



