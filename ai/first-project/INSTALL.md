# 安装和启动指南

## 第一步：检查环境

确保已安装：
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0

检查命令：
```bash
node --version
npm --version
psql --version
redis-cli --version
```

## 第二步：安装依赖

### 后端依赖

```bash
cd ai/first-project/backend
npm install
```

### 前台依赖

```bash
cd ai/first-project/frontend
npm install
```

### 后台管理依赖

```bash
cd ai/first-project/admin
npm install
```

## 第三步：配置数据库

### 1. 创建PostgreSQL数据库

```sql
CREATE DATABASE rebate_db;
```

### 2. 修改后端环境变量

编辑 `backend/.env` 文件，修改数据库连接：

```env
DATABASE_URL="postgresql://你的用户名:你的密码@localhost:5432/rebate_db"
```

### 3. 初始化数据库

```bash
cd ai/first-project/backend

# 生成Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 填充种子数据（创建默认管理员）
npm run prisma:seed
```

## 第四步：启动Redis

确保Redis服务正在运行：

```bash
# Windows (如果已安装Redis)
redis-server

# 或使用Docker
docker run -d -p 6379:6379 redis:latest
```

## 第五步：启动服务

### 启动后端（终端1）

```bash
cd ai/first-project/backend
npm run start:dev
```

后端将在 http://localhost:3000 启动

### 启动前台（终端2）

```bash
cd ai/first-project/frontend
npm run dev
```

前台将在 http://localhost:3001 启动

### 启动后台管理（终端3）

```bash
cd ai/first-project/admin
npm start
```

后台管理将在 http://localhost:8000 启动

## 验证安装

1. **后端健康检查**
   - 访问: http://localhost:3000/api/health
   - 应该返回: `{"status":"ok","timestamp":"..."}`

2. **后台管理登录**
   - 访问: http://localhost:8000/login
   - 账号: admin@example.com
   - 密码: admin123

3. **前台访问**
   - 访问: http://localhost:3001
   - 应该看到首页

## 常见问题解决

### 问题1: Prisma迁移失败

**错误**: `Error: P1001: Can't reach database server`

**解决**:
- 检查PostgreSQL是否运行
- 检查DATABASE_URL配置
- 确认数据库已创建

### 问题2: Redis连接失败

**错误**: `Error: connect ECONNREFUSED`

**解决**:
- 检查Redis是否运行: `redis-cli ping` (应该返回 PONG)
- 检查REDIS_HOST和REDIS_PORT配置

### 问题3: 端口被占用

**错误**: `Error: listen EADDRINUSE`

**解决**:
- 修改端口配置
- 或关闭占用端口的进程

### 问题4: 模块找不到

**错误**: `Cannot find module '@nestjs/...'`

**解决**:
- 确保已运行 `npm install`
- 删除 `node_modules` 和 `package-lock.json`，重新安装

## 下一步

安装完成后，按照以下顺序操作：

1. ✅ 访问后台管理，使用默认账号登录
2. ✅ 创建品牌和分类数据
3. ✅ 添加商品
4. ✅ 访问前台查看商品
5. ✅ 测试注册登录功能
6. ✅ 测试商品推送功能

## 开发提示

- 后端代码修改后会自动重启（watch模式）
- 前台代码修改后会自动刷新（Next.js热更新）
- 后台管理代码修改后会自动刷新（UmiJS热更新）

