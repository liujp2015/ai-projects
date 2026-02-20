# 项目启动指南

## 前置要求

1. Node.js >= 18.0.0
2. PostgreSQL >= 14
3. Redis >= 6.0
4. npm 或 yarn

## 快速启动

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前台
cd ../frontend
npm install

# 后台管理
cd ../admin
npm install
```

### 2. 配置环境变量

#### 后端环境变量 (backend/.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rebate_db"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

#### 前台环境变量 (frontend/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

#### 后台管理环境变量 (admin/.env)

```env
API_BASE_URL=http://localhost:3000/api
```

### 3. 数据库初始化

```bash
cd backend

# 生成Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充种子数据
npm run prisma:seed
```

### 4. 启动服务

#### 启动后端（终端1）

```bash
cd backend
npm run start:dev
```

后端服务将在 http://localhost:3000 启动

#### 启动前台（终端2）

```bash
cd frontend
npm run dev
```

前台将在 http://localhost:3001 启动

#### 启动后台管理（终端3）

```bash
cd admin
npm start
```

后台管理将在 http://localhost:8000 启动

## 默认账号

- 邮箱: admin@example.com
- 密码: admin123

## 测试API

访问 http://localhost:3000/api/health 检查后端服务是否正常

## 常见问题

### 1. 数据库连接失败
- 检查PostgreSQL是否运行
- 检查DATABASE_URL配置是否正确

### 2. Redis连接失败
- 检查Redis是否运行
- 检查REDIS_HOST和REDIS_PORT配置

### 3. 端口被占用
- 修改各项目的端口配置
- 或关闭占用端口的进程

## 下一步

1. 访问后台管理 http://localhost:8000 使用默认账号登录
2. 创建商品、品牌、分类等数据
3. 访问前台 http://localhost:3001 查看效果

