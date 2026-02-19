# VibeCoding 部署文档

## 目录

1. [环境要求](#环境要求)
2. [快速开始](#快速开始)
3. [详细部署步骤](#详细部署步骤)
4. [环境变量配置](#环境变量配置)
5. [数据库配置](#数据库配置)
6. [生产环境部署](#生产环境部署)
7. [常见问题](#常见问题)
8. [维护与监控](#维护与监控)

---

## 环境要求

### 必需软件

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0（或 yarn/pnpm）
- **PostgreSQL**: >= 14.0
- **Git**: 用于克隆代码

### 推荐配置

- **CPU**: 2 核以上
- **内存**: 4GB 以上
- **磁盘**: 20GB 以上可用空间
- **操作系统**: Linux (Ubuntu 20.04+), macOS, Windows 10+

### API 密钥要求

- **DeepSeek API Key**: 用于文本生成、翻译、题目生成
- **Qwen (DashScope) API Key**: 用于 OCR 识别和内容合并

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd VibeCoding
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 3. 配置环境变量

在 `backend` 目录创建 `.env` 文件：

```bash
cd backend
cp .env.example .env  # 如果有示例文件
# 或直接创建 .env 文件
```

编辑 `.env` 文件，配置必要的环境变量（详见[环境变量配置](#环境变量配置)）。

### 4. 配置数据库

```bash
# 确保 PostgreSQL 已启动
# 创建数据库
createdb vibecoding

# 或使用 psql
psql -U postgres
CREATE DATABASE vibecoding;
\q
```

### 5. 运行数据库迁移

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 6. 启动服务

**开发环境**（两个终端窗口）：

```bash
# 终端 1: 启动后端
cd backend
npm run start:dev

# 终端 2: 启动前端
cd frontend
npm run dev
```

访问：
- 前端: http://localhost:3000
- 后端: http://localhost:3001

---

## 详细部署步骤

### 步骤 1: 系统准备

#### Linux (Ubuntu/Debian)

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (使用 nvm 推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 安装 Git
sudo apt install git -y
```

#### macOS

```bash
# 使用 Homebrew
brew install node@18
brew install postgresql@14
brew services start postgresql@14
```

#### Windows

1. 下载并安装 [Node.js](https://nodejs.org/)
2. 下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
3. 下载并安装 [Git](https://git-scm.com/download/win)

### 步骤 2: 克隆代码

```bash
git clone <repository-url>
cd VibeCoding
```

### 步骤 3: 后端配置

#### 3.1 安装依赖

```bash
cd backend
npm install
```

#### 3.2 配置环境变量

创建 `backend/.env` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/vibecoding?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/vibecoding?schema=public"

# DeepSeek API 配置
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-chat"

# Qwen (DashScope) API 配置
DASHSCOPE_API_KEY="your-dashscope-api-key"
QWEN_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
QWEN_VL_MODEL="qwen3-vl-flash"
QWEN_TEXT_MODEL="qwen-turbo"

# 服务器配置
PORT=3001
NODE_ENV=production
```

**重要提示**：
- 将 `username` 和 `password` 替换为你的 PostgreSQL 用户名和密码
- 将 `your-deepseek-api-key` 替换为你的 DeepSeek API 密钥
- 将 `your-dashscope-api-key` 替换为你的 DashScope API 密钥

#### 3.3 数据库迁移

```bash
# 运行迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

如果遇到迁移问题，可以查看 `backend/prisma/migrations` 目录，或使用：

```bash
# 重置数据库（会删除所有数据！）
npx prisma migrate reset

# 或手动应用迁移
npx prisma migrate dev
```

#### 3.4 验证后端

```bash
# 开发模式启动
npm run start:dev

# 应该看到类似输出：
# [Nest] INFO  [NestFactory] Starting Nest application...
# [Nest] INFO  [InstanceLoader] AppModule dependencies initialized
# [Nest] INFO  [NestFactory] Nest application successfully started
```

访问 http://localhost:3001 应该能看到后端服务运行。

### 步骤 4: 前端配置

#### 4.1 安装依赖

```bash
cd ../frontend
npm install
```

#### 4.2 配置环境变量

创建 `frontend/.env.local` 文件：

```env
# 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

**生产环境**：将 `http://localhost:3001` 替换为实际的后端服务器地址。

#### 4.3 构建前端

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
```

#### 4.4 验证前端

访问 http://localhost:3000 应该能看到前端界面。

---

## 环境变量配置

### 后端环境变量 (`backend/.env`)

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | ✅ | - |
| `DIRECT_URL` | PostgreSQL 直连字符串（用于迁移） | ✅ | - |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ | - |
| `DEEPSEEK_BASE_URL` | DeepSeek API 基础 URL | ❌ | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名称 | ❌ | `deepseek-chat` |
| `DASHSCOPE_API_KEY` | DashScope (Qwen) API 密钥 | ✅ | - |
| `QWEN_BASE_URL` | Qwen API 基础 URL | ❌ | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `QWEN_VL_MODEL` | Qwen 视觉语言模型 | ❌ | `qwen3-vl-flash` |
| `QWEN_TEXT_MODEL` | Qwen 文本模型 | ❌ | `qwen-turbo` |
| `PORT` | 后端服务端口 | ❌ | `3001` |
| `NODE_ENV` | 运行环境 | ❌ | `development` |

### 前端环境变量 (`frontend/.env.local`)

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | 后端 API 地址 | ✅ | `http://localhost:3001` |

### 获取 API 密钥

#### DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册/登录账号
3. 进入 API 管理页面
4. 创建 API Key
5. 复制密钥到 `DEEPSEEK_API_KEY`

#### DashScope (Qwen) API Key

1. 访问 [阿里云 DashScope](https://dashscope.console.aliyun.com/)
2. 注册/登录账号
3. 开通 DashScope 服务
4. 创建 API Key
5. 复制密钥到 `DASHSCOPE_API_KEY`

---

## 数据库配置

### PostgreSQL 安装与配置

#### Linux

```bash
# 安装
sudo apt install postgresql postgresql-contrib -y

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 设置 postgres 用户密码
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your-password';
\q
```

#### 创建数据库

```bash
# 使用 postgres 用户创建数据库
sudo -u postgres psql

# 在 psql 中执行
CREATE DATABASE vibecoding;
CREATE USER vibecoding_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE vibecoding TO vibecoding_user;
\q
```

#### 验证连接

```bash
psql -U vibecoding_user -d vibecoding -h localhost
```

### Prisma 迁移

```bash
cd backend

# 查看迁移状态
npx prisma migrate status

# 应用所有待执行的迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate

# 查看数据库结构
npx prisma studio
```

### 数据库备份与恢复

#### 备份

```bash
pg_dump -U vibecoding_user -d vibecoding -F c -f backup.dump
```

#### 恢复

```bash
pg_restore -U vibecoding_user -d vibecoding -c backup.dump
```

---

## 生产环境部署

### 使用 PM2 管理进程

#### 安装 PM2

```bash
npm install -g pm2
```

#### 配置 PM2

创建 `backend/ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'vibecoding-backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
```

#### 启动服务

```bash
cd backend

# 构建项目
npm run build

# 启动 PM2
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs vibecoding-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 使用 Nginx 反向代理

#### 安装 Nginx

```bash
sudo apt install nginx -y
```

#### 配置 Nginx

创建 `/etc/nginx/sites-available/vibecoding`：

```nginx
# 后端 API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 前端
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/VibeCoding/frontend/.next;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/vibecoding /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 使用 Docker 部署（可选）

#### 创建 Dockerfile

**backend/Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

**frontend/Dockerfile**:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

#### 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: vibecoding_user
      POSTGRES_PASSWORD: your-password
      POSTGRES_DB: vibecoding
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://vibecoding_user:your-password@postgres:5432/vibecoding
      DIRECT_URL: postgresql://vibecoding_user:your-password@postgres:5432/vibecoding
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      DASHSCOPE_API_KEY: ${DASHSCOPE_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 使用 Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### SSL/HTTPS 配置

#### 使用 Let's Encrypt

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 常见问题

### 1. 数据库连接失败

**问题**: `Error: P1001: Can't reach database server`

**解决方案**:
- 检查 PostgreSQL 是否运行: `sudo systemctl status postgresql`
- 检查 `DATABASE_URL` 是否正确
- 检查防火墙设置
- 确认数据库用户权限

### 2. Prisma 迁移失败

**问题**: `Migration failed to apply`

**解决方案**:
```bash
# 查看迁移状态
npx prisma migrate status

# 重置数据库（会删除数据！）
npx prisma migrate reset

# 或手动修复迁移
npx prisma migrate resolve --applied <migration-name>
```

### 3. API 密钥无效

**问题**: `DeepSeek API Key not configured` 或 `Qwen API Key not provided`

**解决方案**:
- 检查 `.env` 文件是否存在
- 确认环境变量名称正确（区分大小写）
- 验证 API 密钥是否有效
- 重启服务使环境变量生效

### 4. 前端无法连接后端

**问题**: `Failed to fetch` 或 CORS 错误

**解决方案**:
- 检查 `NEXT_PUBLIC_API_BASE_URL` 是否正确
- 确认后端服务正在运行
- 检查防火墙和端口设置
- 如果是生产环境，检查 Nginx 配置

### 5. 构建失败

**问题**: TypeScript 编译错误或依赖安装失败

**解决方案**:
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
rm -rf .next dist

# 重新构建
npm run build
```

### 6. 端口被占用

**问题**: `EADDRINUSE: address already in use`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3001  # Linux/macOS
netstat -ano | findstr :3001  # Windows

# 杀死进程
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### 7. 内存不足

**问题**: 构建或运行时内存溢出

**解决方案**:
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或在 package.json 中设置
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

---

## 维护与监控

### 日志管理

#### 后端日志

使用 PM2 查看日志：
```bash
pm2 logs vibecoding-backend
pm2 logs vibecoding-backend --lines 100
```

#### 前端日志

Next.js 日志在控制台输出，生产环境建议使用日志收集工具（如 ELK、Sentry）。

### 性能监控

#### 使用 PM2 监控

```bash
# 查看实时监控
pm2 monit

# 查看详细信息
pm2 describe vibecoding-backend
```

#### 数据库监控

```bash
# 查看数据库连接数
psql -U vibecoding_user -d vibecoding -c "SELECT count(*) FROM pg_stat_activity;"

# 查看数据库大小
psql -U vibecoding_user -d vibecoding -c "SELECT pg_size_pretty(pg_database_size('vibecoding'));"
```

### 定期维护任务

#### 数据库备份

创建备份脚本 `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U vibecoding_user -d vibecoding -F c -f "$BACKUP_DIR/backup_$DATE.dump"
```

添加到 crontab:
```bash
# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh
```

#### 清理旧日志

```bash
# 清理 PM2 日志（保留最近 7 天）
pm2 flush
```

### 更新部署

#### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 更新依赖
cd backend && npm install
cd ../frontend && npm install

# 运行迁移
cd backend && npx prisma migrate deploy && npx prisma generate

# 重新构建
cd backend && npm run build
cd ../frontend && npm run build

# 重启服务
pm2 restart vibecoding-backend
```

#### 回滚

```bash
# 回滚到上一个版本
git checkout <previous-commit>

# 重新构建和部署
npm run build
pm2 restart vibecoding-backend
```

---

## 安全检查清单

- [ ] 更改默认数据库密码
- [ ] 使用强密码策略
- [ ] 配置防火墙规则
- [ ] 启用 HTTPS/SSL
- [ ] 定期更新依赖包
- [ ] 限制 API 密钥权限
- [ ] 配置日志轮转
- [ ] 设置数据库备份
- [ ] 监控异常访问
- [ ] 定期安全审计

---

## 获取帮助

如果遇到问题，请：

1. 查看本文档的[常见问题](#常见问题)部分
2. 检查日志文件
3. 查看项目 Issues
4. 联系技术支持

---

## 附录

### 端口说明

- **3000**: 前端开发服务器
- **3001**: 后端 API 服务器
- **5432**: PostgreSQL 数据库
- **5555**: Prisma Studio（可选）

### 目录结构

```
VibeCoding/
├── backend/          # 后端代码
│   ├── src/         # 源代码
│   ├── prisma/       # 数据库配置和迁移
│   └── dist/         # 编译输出
├── frontend/         # 前端代码
│   ├── src/         # 源代码
│   └── .next/       # Next.js 构建输出
└── docs/            # 文档
```

### 有用的命令

```bash
# 查看 Prisma 数据库结构
npx prisma studio

# 查看数据库迁移历史
npx prisma migrate status

# 生成新的迁移
npx prisma migrate dev --name migration-name

# 查看 PM2 进程
pm2 list

# 重启所有 PM2 进程
pm2 restart all
```

---

**最后更新**: 2024年

