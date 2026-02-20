# Supabase + Vercel + Railway 快速部署

## 🚀 3 步快速开始

### 步骤 1: Supabase 数据库（5 分钟）

1. 访问 [supabase.com](https://supabase.com/) 注册
2. 创建新项目，设置数据库密码
3. 在 Settings → Database 复制连接字符串（URI 格式）
4. **替换密码**：将 `[YOUR-PASSWORD]` 替换为你的密码

**连接字符串示例**：
```
postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
```

### 步骤 2: Railway 后端（5 分钟）

1. 访问 [railway.app](https://railway.app/) 注册
2. New Project → Deploy from GitHub → 选择仓库
3. **Root Directory**: `backend`
4. 在 Variables 添加环境变量（**包含 Node 18 设置**）：

```env
# 固定 Node 版本（Railway/Nixpacks）
NIXPACKS_NODE_VERSION=18

# Supabase 数据库
DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres

# API 密钥
DEEPSEEK_API_KEY=your-deepseek-key
DASHSCOPE_API_KEY=your-dashscope-key

# 其他
PORT=3001
NODE_ENV=production
```

5. Settings → Start Command: `npm run start:prod`
6. Settings → Build Command: `npm install && npx prisma migrate deploy && npx prisma generate && npm run build`
7. 复制生成的 URL（如：`xxx.up.railway.app`）

### 步骤 3: Vercel 前端（3 分钟）

1. 访问 [vercel.com](https://vercel.com/) 注册
2. Import Project → 选择 GitHub 仓库
3. **Root Directory**: `frontend`
4. Environment Variables 添加：

```env
NEXT_PUBLIC_API_BASE_URL=https://xxx.up.railway.app
```

5. Deploy

## ✅ 完成！

访问 Vercel 提供的 URL，你的应用就上线了！

## 📝 重要提示

- **Supabase 密码**：创建项目时设置的密码，保存在连接字符串中
- **数据库迁移**：Railway 会在构建时自动运行，或本地运行：
  ```bash
  cd backend
  export DATABASE_URL="你的 Supabase 连接字符串"
  npx prisma migrate deploy
  ```
- **免费额度**：
  - Supabase: 500MB 数据库，完全免费
  - Vercel: 无限部署，免费
  - Railway: $5/月免费额度

## 🆘 遇到问题？

查看完整文档：`docs/deploy-vercel-simple.md`

