# Vercel 部署检查清单

## ✅ 已修复的问题

1. **ES Module 导入问题**
   - ✅ `pdfjs-dist` 已改为动态导入
   - ✅ 添加了 Worker 配置

2. **错误处理**
   - ✅ `api/index.ts` 添加了 try-catch
   - ✅ `server.ts` 添加了错误处理和日志

3. **依赖项**
   - ✅ 添加了 `mammoth`, `pdfjs-dist`, `axios`, `tesseract.js`
   - ✅ 添加了 `@types/multer`

## ⚠️ 需要检查的配置

### 1. Vercel 环境变量
确保在 Vercel 项目设置中配置了以下环境变量：

```env
# 数据库（必需）
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
DIRECT_URL=postgresql://postgres:password@host:5432/postgres

# DeepSeek API（必需）
DEEPSEEK_API_KEY=your-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Qwen/DashScope API（可选，某些功能需要）
DASHSCOPE_API_KEY=your-key
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_VL_MODEL=qwen3-vl-flash
QWEN_TEXT_MODEL=qwen-turbo

# 其他
NODE_ENV=production
```

### 2. Vercel 构建配置
在 Vercel 项目设置中：

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

### 3. Prisma 迁移
在首次部署前，需要在本地运行数据库迁移：

```bash
cd backend
export DATABASE_URL="your-supabase-connection-string"
export DIRECT_URL="your-supabase-connection-string"
npx prisma migrate deploy
npx prisma generate
```

### 4. 常见错误排查

#### 错误：`@prisma/client did not initialize yet`
**解决：** 确保 Build Command 中包含 `npx prisma generate`

#### 错误：`Cannot find module 'xxx'`
**解决：** 检查 `package.json` 的 `dependencies` 中是否包含该模块

#### 错误：`ERR_REQUIRE_ESM`
**解决：** 已修复，使用动态 `import()` 替代静态 `import`

#### 错误：`500: INTERNAL_SERVER_ERROR`
**可能原因：**
- 数据库连接失败（检查 `DATABASE_URL`）
- 环境变量缺失
- Prisma Client 未生成
- 内存不足或超时

**排查步骤：**
1. 查看 Vercel Function Logs 获取详细错误
2. 检查环境变量是否正确配置
3. 确认 Build Command 包含 `npx prisma generate`
4. 检查数据库连接是否正常

## 📝 部署步骤

1. **准备数据库**
   - 在 Supabase 创建项目
   - 获取连接字符串
   - 在本地运行迁移

2. **配置 Vercel**
   - 导入 GitHub 仓库
   - 设置 Root Directory: `backend`
   - 配置环境变量
   - 设置 Build Command

3. **部署**
   - 推送到 GitHub
   - Vercel 自动构建和部署
   - 检查部署日志

4. **验证**
   - 访问部署的 URL
   - 测试 API 端点
   - 检查 Function Logs

## 🔍 调试技巧

1. **查看日志**
   - Vercel Dashboard → Functions → Logs
   - 查看实时日志输出

2. **本地测试**
   ```bash
   cd backend
   npm run build
   npm run start:prod
   ```

3. **检查构建输出**
   - 确认 `dist` 目录包含编译后的文件
   - 确认 `node_modules/.prisma/client` 存在

