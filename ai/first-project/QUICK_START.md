# 快速启动指南（5分钟）

## 前提条件检查

```bash
# 检查Node.js版本（需要 >= 18）
node --version

# 检查npm
npm --version

# 检查PostgreSQL（需要运行中）
psql --version

# 检查Redis（需要运行中）
redis-cli ping
```

## 一键安装（推荐）

### Windows:

```powershell
cd ai/first-project

# 1. 安装所有依赖
.\install.ps1

# 2. 编辑 backend/.env 配置数据库连接

# 3. 初始化数据库
.\init-db.ps1

# 4. 启动服务（需要3个终端）
# 终端1:
.\start-backend.ps1

# 终端2:
.\start-frontend.ps1

# 终端3:
.\start-admin.ps1
```

### Linux/Mac:

```bash
cd ai/first-project

# 1. 安装所有依赖
chmod +x install.sh
./install.sh

# 2. 编辑 backend/.env 配置数据库连接

# 3. 初始化数据库
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. 启动服务（需要3个终端）
# 终端1: cd backend && npm run start:dev
# 终端2: cd frontend && npm run dev
# 终端3: cd admin && npm start
```

## 最小化配置

### 1. 数据库配置

编辑 `backend/.env`，只需修改这一行：

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/rebate_db"
```

### 2. 确保Redis运行

```bash
redis-server
```

## 验证

1. **后端**: http://localhost:3000/api/health ✅
2. **后台**: http://localhost:8000/login ✅ (admin@example.com / admin123)
3. **前台**: http://localhost:3001 ✅

## 遇到问题？

查看 `NEXT_STEPS.md` 获取详细说明和故障排除指南。

