# Vercel 快速部署指南（最简单方式）

## 概述

本指南将帮助你用最简单的方式部署 VibeCoding：
- **前端**：部署到 Vercel（免费，自动 HTTPS）
- **后端**：部署到 Railway（免费额度，一键部署）
- **数据库**：使用 Supabase（免费 PostgreSQL，推荐）

预计时间：**15-20 分钟**

---

## 第一步：准备数据库（Supabase）

### 1.1 注册 Supabase

1. 访问 [Supabase](https://supabase.com/)
2. 使用 GitHub 账号登录（推荐）或邮箱注册
3. 点击 "New Project"

### 1.2 创建项目

1. 填写项目信息：
   - **Name**: 项目名称（如：vibecoding）
   - **Database Password**: 设置一个强密码（**重要：保存好这个密码！**）
   - **Region**: 选择离你最近的区域（如：Southeast Asia (Singapore)）
2. 点击 "Create new project"
3. 等待项目创建完成（约 2 分钟）

### 1.3 获取数据库连接字符串

1. 项目创建完成后，进入项目 Dashboard
2. 点击左侧菜单 "Settings" → "Database"
3. 滚动到 "Connection string" 部分
4. 选择 "URI" 标签
5. 复制连接字符串，格式类似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. **将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的密码**
7. 保存这个完整的连接字符串，稍后需要用到

**示例**：
```
postgresql://postgres:your-password-here@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### 1.4 测试连接（可选）

你可以使用任何 PostgreSQL 客户端测试连接，或者直接进入下一步。

---

## 第二步：部署后端到 Railway

### 2.0 Node 版本（重要）

Railway 当前经常会默认使用较新的 Node 版本，但你的后端需要 **Node.js 18**。

请在 Railway 后端服务的 **Variables** 里新增：

```env
NIXPACKS_NODE_VERSION=18
```

同时本仓库在 `backend/.nvmrc` 与 `backend/package.json#engines` 也已声明为 18，用于让构建器自动选择正确版本。

### 2.1 准备代码仓库

确保你的代码已推送到 GitHub：
```bash
git add .
git commit -m "准备部署"
git push origin main
```

### 2.2 在 Railway 部署后端

1. 在 Railway 项目中，点击 "New"
2. 选择 "Deploy from GitHub repo"
3. 选择你的仓库
4. 选择 `backend` 目录作为根目录
5. Railway 会自动检测到 NestJS 项目

### 2.3 配置环境变量

在 Railway 后端服务的 "Variables" 标签中，添加以下环境变量：

```env
# 数据库（从 Supabase 复制的连接字符串）
DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres

# DeepSeek API
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Qwen (DashScope) API
DASHSCOPE_API_KEY=your-dashscope-api-key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VL_MODEL=qwen3-vl-flash
QWEN_TEXT_MODEL=qwen-turbo

# 服务器配置
PORT=3001
NODE_ENV=production
```

### 2.4 配置启动命令

1. 在 Railway 后端服务的 "Settings" 标签
2. 找到 "Start Command"，设置为：
```bash
npm run start:prod
```

3. 找到 "Build Command"（可选，Railway 会自动检测），设置为：
```bash
npm install && npx prisma generate && npm run build
```

### 2.5 运行数据库迁移

**方式一：在 Railway 中自动运行（推荐）**

在 "Build Command" 中添加迁移：
```bash
npm install && npx prisma migrate deploy && npx prisma generate && npm run build
```

**方式二：手动运行迁移（在本地，推荐用于 Supabase）**

```bash
cd backend
# 设置 DATABASE_URL 环境变量（使用 Supabase 连接字符串）
export DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
export DIRECT_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
npx prisma migrate deploy
npx prisma generate
```

**注意**：如果使用 Supabase，建议先在本地运行迁移，确保数据库结构正确创建。

### 2.5 获取后端 URL

1. 部署完成后，Railway 会生成一个 URL（如：`xxx.up.railway.app`）
2. 在服务的 "Settings" → "Generate Domain" 可以生成自定义域名
3. **复制这个 URL**，稍后配置前端时需要

---

## 第三步：部署前端到 Vercel

### 3.1 注册 Vercel

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 导入你的 GitHub 仓库

### 3.2 配置项目

1. 在 Vercel 导入项目时：
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `frontend`（重要！）
   - **Build Command**: `npm run build`（自动检测）
   - **Output Directory**: `.next`（自动检测）

**注意**：确保 "Root Directory" 设置为 `frontend`，这样 Vercel 才知道从哪个目录构建。

### 3.3 配置环境变量

在 Vercel 项目的 "Settings" → "Environment Variables" 中添加：

```env
NEXT_PUBLIC_API_BASE_URL=https://你的-railway-后端-url.up.railway.app
```

**重要**：将 `https://你的-railway-后端-url.up.railway.app` 替换为第二步获取的后端 URL。

### 3.4 部署

1. 点击 "Deploy"
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，Vercel 会提供一个 URL（如：`xxx.vercel.app`）

---

## 第四步：验证部署

### 4.1 检查前端

访问 Vercel 提供的 URL，应该能看到前端界面。

### 4.2 检查后端

访问 `https://你的-railway-后端-url.up.railway.app`，应该能看到后端运行（可能显示 NestJS 默认响应或错误页面，这是正常的）。

### 4.3 测试 API

在浏览器中访问：
```
https://你的-railway-后端-url.up.railway.app/documents
```

应该能看到 JSON 响应（可能是空数组 `[]`）。

---

## 常见问题

### Q1: Railway 部署失败

**可能原因**：
- 环境变量未配置
- 数据库连接失败

**解决方案**：
1. 检查 Railway 的 "Deployments" 标签查看错误日志
2. 确认所有环境变量都已设置
3. 确认数据库已创建并运行

### Q2: 前端无法连接后端

**可能原因**：
- `NEXT_PUBLIC_API_BASE_URL` 配置错误
- CORS 问题

**解决方案**：
1. 检查 Vercel 环境变量是否正确
2. 确认后端 URL 可以访问
3. 重新部署前端（环境变量更改后需要重新部署）

### Q3: 数据库迁移失败

**解决方案**：
在本地运行迁移（使用 Supabase 连接字符串）：
```bash
cd backend
export DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
export DIRECT_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
npx prisma migrate deploy
npx prisma generate
```

**常见错误**：
- 如果提示密码错误，检查 Supabase 连接字符串中的密码是否正确
- 如果提示连接超时，检查 Supabase 项目的网络设置，确保允许外部连接

### Q4: Railway 免费额度用完了

**解决方案**：
- 后端可以部署到 Render（也有免费额度）
- 或者升级 Railway 付费计划
- Supabase 数据库是免费的，不受 Railway 额度影响

### Q5: Supabase 连接失败

**可能原因**：
- 密码错误
- 网络连接问题
- Supabase 项目暂停（免费项目在 7 天无活动后会暂停）

**解决方案**：
1. 检查连接字符串中的密码是否正确
2. 在 Supabase Dashboard 中恢复项目（如果已暂停）
3. 检查 Supabase 项目的 "Settings" → "Database" → "Connection pooling" 设置

---

## 使用 Railway 数据库（可选）

如果你不想使用 Supabase，也可以使用 Railway 的数据库：

### 1. 在 Railway 创建数据库

1. 在 Railway 项目中，点击 "New"
2. 选择 "Database" → "Add PostgreSQL"
3. 等待数据库创建完成
4. 复制 `DATABASE_URL` 环境变量

### 2. 在 Railway 后端配置

将 `DATABASE_URL` 和 `DIRECT_URL` 设置为 Railway 数据库的连接字符串。

---

## 成本说明

### 免费额度

- **Vercel**: 
  - 无限次部署
  - 100GB 带宽/月
  - 完全免费用于个人项目

- **Railway**:
  - $5 免费额度/月
  - 足够小型项目使用
  - 超出后按使用量付费

### 推荐配置

- 前端：Vercel（免费）
- 后端：Railway（$5 免费额度/月）
- 数据库：Supabase（免费，500MB 数据库 + 2GB 带宽/月）

**总成本：$0/月**（在免费额度内）

### Supabase 免费额度详情

- **数据库大小**: 500MB
- **带宽**: 2GB/月
- **API 请求**: 50,000/月
- **存储**: 1GB
- **完全免费**，适合小型项目使用

---

## 后续优化

### 1. 自定义域名

- **Vercel**: 在项目设置中添加自定义域名（免费 SSL）
- **Railway**: 在服务设置中生成自定义域名

### 2. 监控和日志

- **Vercel**: 自动提供访问日志和分析
- **Railway**: 在 "Deployments" 标签查看日志

### 3. 自动部署

- 推送到 GitHub `main` 分支会自动触发部署
- 无需手动操作

---

## 快速检查清单

- [ ] Supabase 项目已创建
- [ ] Supabase 数据库连接字符串已获取
- [ ] 数据库迁移已运行（本地或 Railway）
- [ ] Railway 后端已部署并运行
- [ ] 后端环境变量已配置（包括 Supabase 数据库 URL 和 API 密钥）
- [ ] Vercel 前端已部署
- [ ] 前端环境变量 `NEXT_PUBLIC_API_BASE_URL` 已配置
- [ ] 前端可以访问后端 API

---

## 获取帮助

如果遇到问题：

1. 查看 Railway 的 "Deployments" 日志
2. 查看 Vercel 的 "Deployments" 日志
3. 检查环境变量是否正确
4. 确认 API 密钥有效

---

**部署完成后，你的应用就可以在互联网上访问了！** 🎉

