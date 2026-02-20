# 返利折扣网系统

完整的返利折扣网系统，包含后台管理系统、前台PC端和后端API服务。

## 📁 项目结构

```
first-project/
├── backend/          # NestJS 后端服务
├── admin/            # UmiJS 后台管理系统
├── frontend/         # Next.js 前台PC端
├── install.ps1       # Windows安装脚本
├── install.sh        # Linux/Mac安装脚本
├── init-db.ps1       # 数据库初始化脚本
├── start-*.ps1       # 启动脚本
├── QUICK_START.md    # 快速启动指南（5分钟）
├── NEXT_STEPS.md     # 详细操作指南
└── INSTALL.md        # 安装说明
```

## 🚀 快速开始

### 方式一：使用脚本（推荐）

**Windows PowerShell:**

```powershell
cd ai/first-project

# 1. 安装依赖
.\install.ps1

# 2. 配置数据库（编辑 backend/.env）

# 3. 初始化数据库
.\init-db.ps1

# 4. 启动服务（3个终端）
.\start-backend.ps1    # 终端1
.\start-frontend.ps1   # 终端2
.\start-admin.ps1      # 终端3
```

**Linux/Mac:**

```bash
cd ai/first-project

# 1. 安装依赖
chmod +x install.sh
./install.sh

# 2. 配置数据库（编辑 backend/.env）

# 3. 初始化数据库
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. 启动服务（3个终端）
cd backend && npm run start:dev    # 终端1
cd frontend && npm run dev          # 终端2
cd admin && npm start               # 终端3
```

### 方式二：手动安装

详细步骤请查看 `NEXT_STEPS.md`

## 📋 前置要求

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- npm 或 yarn

## ⚙️ 配置说明

### 1. 数据库配置

编辑 `backend/.env`:

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/rebate_db"
```

### 2. Redis配置

确保Redis运行在默认端口6379，或修改`.env`中的配置。

## 🔑 默认账号

- **邮箱**: admin@example.com
- **密码**: admin123

## 🌐 访问地址

- **后端API**: http://localhost:3000/api
- **后台管理**: http://localhost:8000
- **前台PC端**: http://localhost:3001

## 📚 文档

- `QUICK_START.md` - 5分钟快速启动
- `NEXT_STEPS.md` - 详细操作步骤和故障排除
- `INSTALL.md` - 完整安装指南
- `COMPLETION_SUMMARY.md` - 项目完成总结
- `PROJECT_STATUS.md` - 项目状态

## 🎯 功能特性

### 后端功能
- ✅ RESTful API
- ✅ JWT认证
- ✅ WebSocket实时推送
- ✅ Redis队列
- ✅ 权限管理（RBAC）
- ✅ 积分系统
- ✅ 订单关联（clickId）

### 后台管理
- ✅ 商品管理（CRUD、推送）
- ✅ 品牌/分类管理
- ✅ 用户/角色/权限管理
- ✅ 订单管理
- ✅ Banner管理
- ✅ 网站配置

### 前台功能
- ✅ 商品浏览和搜索
- ✅ 用户注册登录
- ✅ 个人中心
- ✅ 订单查看
- ✅ 实时商品推送
- ✅ 商品购买跳转

## 🛠️ 技术栈

**后端:**
- NestJS
- Prisma
- PostgreSQL
- Redis
- Socket.io

**前端:**
- Next.js 14
- Tailwind CSS
- Zustand
- Socket.io Client

**后台管理:**
- UmiJS 4
- Ant Design 5

## 📝 开发命令

### 后端

```bash
cd backend

# 开发模式
npm run start:dev

# 生成Prisma Client
npm run prisma:generate

# 数据库迁移
npm run prisma:migrate

# 查看数据库
npm run prisma:studio

# 填充种子数据
npm run prisma:seed
```

### 前台

```bash
cd frontend

# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm start
```

### 后台管理

```bash
cd admin

# 开发模式
npm start

# 构建
npm run build
```

## ⚠️ 注意事项

1. **环境变量**: 必须配置 `backend/.env` 文件
2. **数据库**: 确保PostgreSQL运行并创建数据库
3. **Redis**: 确保Redis运行（用于验证码和队列）
4. **端口**: 确保3000、3001、8000端口未被占用

## 🐛 故障排除

遇到问题请查看 `NEXT_STEPS.md` 中的"常见问题"部分。

## 📞 支持

如有问题，请检查：
1. 日志输出
2. 浏览器控制台
3. 数据库连接状态
4. Redis连接状态

## 📄 许可证

MIT
