# 更新环境变量配置

## 重要：需要手动配置 .env 文件

由于 `.env` 文件被系统保护，需要手动创建或编辑。

## 操作步骤

### 1. 创建或编辑 backend/.env 文件

在 `ai/first-project/backend/` 目录下创建或编辑 `.env` 文件，内容如下：

```env
# 数据库配置
DATABASE_URL="postgresql://postgres:123456@localhost:5432/rebate_db"

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=rebate-discount-secret-key-2024-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=rebate-discount-refresh-secret-key-2024-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# 应用配置
PORT=3000
NODE_ENV=development

# 云存储配置
STORAGE_TYPE=aliyun
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_REGION=

# 邮件服务配置（验证码）
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### 2. 确保数据库已创建

如果还没有创建数据库，执行：

```sql
CREATE DATABASE rebate_db;
```

### 3. 验证配置

配置完成后，运行：

```bash
cd ai/first-project/backend
npm run prisma:migrate
```

## 快速复制

可以直接复制 `.env.example` 文件的内容到 `.env` 文件。
























