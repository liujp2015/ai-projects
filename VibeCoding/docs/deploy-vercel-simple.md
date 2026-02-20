# Vercel 快速部署指南（最简单方式）

## 概述

本指南将帮助你用最简单的方式部署 VibeCoding：
- **前端**：部署到 Vercel（免费，自动 HTTPS）
- **后端**：部署到 Vercel（免费，Serverless Functions）
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

## 第二步：部署后端到 Vercel

### 2.1 准备代码仓库

确保你的代码已推送到 GitHub：
```bash
git add .
git commit -m "准备部署"
git push origin main
```

### 2.2 在 Vercel 部署后端

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "Add New..." → "Project"
4. 导入你的 GitHub 仓库
5. 在项目配置中：
   - **Framework Preset**: Other（或留空）
   - **Root Directory**: `backend`（重要！）
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Output Directory**: `dist`（NestJS 构建输出）
   - **Install Command**: `npm install`

### 2.3 配置环境变量

在 Vercel 后端项目的 "Settings" → "Environment Variables" 中添加：

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
NODE_ENV=production
```

**注意**：Vercel Serverless Functions 不需要设置 `PORT`，Vercel 会自动处理。

### 2.4 运行数据库迁移

**推荐：在本地运行迁移（使用 Supabase 连接字符串）**

```bash
cd backend
# 设置 DATABASE_URL 环境变量（使用 Supabase 连接字符串）
export DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
export DIRECT_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"
npx prisma migrate deploy
npx prisma generate
```

**注意**：建议先在本地运行迁移，确保数据库结构正确创建。

### 2.5 获取后端 URL

1. 部署完成后，Vercel 会生成一个 URL（如：`xxx.vercel.app`）
2. 在项目的 "Settings" → "Domains" 可以添加自定义域名
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
NEXT_PUBLIC_API_BASE_URL=https://你的-vercel-后端-url.vercel.app
```

**重要**：将 `https://你的-vercel-后端-url.vercel.app` 替换为第二步获取的后端 URL。

### 3.4 部署

1. 点击 "Deploy"
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，Vercel 会提供一个 URL（如：`xxx.vercel.app`）

---

## 第四步：验证部署

### 4.1 检查前端

访问 Vercel 提供的 URL，应该能看到前端界面。

### 4.2 检查后端

访问 `https://你的-vercel-后端-url.vercel.app`，应该能看到后端运行（可能显示 NestJS 默认响应或错误页面，这是正常的）。

### 4.3 测试 API

在浏览器中访问：
```
https://你的-vercel-后端-url.vercel.app/documents
```

应该能看到 JSON 响应（可能是空数组 `[]`）。

---

## 常见问题

### Q1: Vercel 后端部署失败

**可能原因**：
- 环境变量未配置
- 数据库连接失败
- Prisma Client 未生成

**解决方案**：
1. 检查 Vercel 的 "Deployments" 标签查看错误日志
2. 确认所有环境变量都已设置
3. 确认数据库已创建并运行
4. 确认 Build Command 中包含 `npx prisma generate`

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

### Q4: Vercel 免费额度用完了

**解决方案**：
- Vercel 免费额度非常充足，一般不会用完
- 如果超出免费额度，可以考虑升级到 Pro 计划
- Supabase 数据库是免费的，不受 Vercel 额度影响

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

## 成本说明

### 免费额度

- **Vercel**: 
  - 无限次部署
  - 100GB 带宽/月
  - 100GB 函数执行时间/月
  - 完全免费用于个人项目

### 推荐配置

- 前端：Vercel（免费）
- 后端：Vercel（免费，Serverless Functions）
- 数据库：Supabase（免费，500MB 数据库 + 2GB 带宽/月）

**总成本：$0/月**（完全免费）

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
- 前后端都可以使用自定义域名

### 2. 监控和日志

- **Vercel**: 自动提供访问日志和分析
- 在 "Deployments" 标签查看构建和运行日志

### 3. 自动部署

- 推送到 GitHub `main` 分支会自动触发部署
- 无需手动操作

---

## 快速检查清单

- [ ] Supabase 项目已创建
- [ ] Supabase 数据库连接字符串已获取
- [ ] 数据库迁移已运行（本地）
- [ ] Vercel 后端已部署并运行
- [ ] 后端环境变量已配置（包括 Supabase 数据库 URL 和 API 密钥）
- [ ] Vercel 前端已部署
- [ ] 前端环境变量 `NEXT_PUBLIC_API_BASE_URL` 已配置
- [ ] 前端可以访问后端 API

---

## 获取帮助

如果遇到问题：

1. 查看 Vercel 后端项目的 "Deployments" 日志
2. 查看 Vercel 前端项目的 "Deployments" 日志
3. 检查环境变量是否正确
4. 确认 API 密钥有效
5. 确认 Prisma Client 已生成（检查 Build Command）

---

**部署完成后，你的应用就可以在互联网上访问了！** 🎉

