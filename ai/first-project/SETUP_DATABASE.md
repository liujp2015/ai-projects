# 数据库配置指南

## 📋 前置步骤

在运行数据库迁移之前，必须完成以下配置：

### 1. 创建PostgreSQL数据库

使用以下方式之一创建数据库：

#### 方式一：使用psql命令行

```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE rebate_db;

# 退出
\q
```

#### 方式二：使用pgAdmin

1. 打开pgAdmin
2. 连接到PostgreSQL服务器
3. 右键点击"Databases" -> "Create" -> "Database"
4. 输入数据库名称: `rebate_db`
5. 点击"Save"

### 2. 配置数据库连接

编辑 `backend/.env` 文件，修改以下行：

```env
DATABASE_URL="postgresql://用户名:密码@localhost:5432/rebate_db"
```

**示例配置:**

```env
# 如果PostgreSQL用户是postgres，密码是123456
DATABASE_URL="postgresql://postgres:123456@localhost:5432/rebate_db"

# 如果PostgreSQL用户是admin，密码是mypassword，端口是5433
DATABASE_URL="postgresql://admin:mypassword@localhost:5433/rebate_db"
```

### 3. 确保PostgreSQL服务运行

**Windows:**
- 检查服务: 打开"服务"管理器，查找"postgresql"服务
- 或使用命令: `sc query postgresql-x64-14` (版本号可能不同)

**Linux:**
```bash
sudo systemctl status postgresql
# 如果未运行，启动: sudo systemctl start postgresql
```

**Mac:**
```bash
brew services list | grep postgresql
# 如果未运行，启动: brew services start postgresql
```

## 🚀 运行数据库迁移

配置完成后，执行以下命令：

```bash
cd ai/first-project/backend

# 1. 生成Prisma Client（已完成）
npm run prisma:generate

# 2. 运行数据库迁移
npm run prisma:migrate
# 输入迁移名称: init

# 3. 填充种子数据（创建默认管理员）
npm run prisma:seed
```

## ✅ 验证数据库

### 方式一：使用Prisma Studio

```bash
cd backend
npm run prisma:studio
```

这将打开浏览器，显示数据库的可视化界面。

### 方式二：使用psql

```bash
psql -U postgres -d rebate_db

# 查看所有表
\dt

# 查看用户表
SELECT * FROM "User";

# 退出
\q
```

## 🔍 常见问题

### Q1: 连接被拒绝

**错误**: `P1001: Can't reach database server`

**解决方案:**
1. 检查PostgreSQL服务是否运行
2. 检查端口是否正确（默认5432）
3. 检查防火墙设置

### Q2: 认证失败

**错误**: `P1000: Authentication failed`

**解决方案:**
1. 检查用户名和密码是否正确
2. 检查PostgreSQL的认证配置（pg_hba.conf）
3. 尝试使用postgres超级用户

### Q3: 数据库不存在

**错误**: `P1003: Database does not exist`

**解决方案:**
1. 确认数据库名称拼写正确
2. 使用psql创建数据库
3. 检查DATABASE_URL配置

### Q4: 权限不足

**错误**: `permission denied`

**解决方案:**
1. 使用具有足够权限的用户
2. 或使用postgres超级用户

## 📝 迁移后的验证

迁移成功后，应该看到：

1. ✅ 所有表已创建（16个表）
2. ✅ 默认管理员用户已创建
3. ✅ 默认角色和权限已创建
4. ✅ 网站配置已初始化

**验证命令:**

```bash
cd backend
npm run prisma:studio
```

在Prisma Studio中，你应该能看到：
- User表中有admin@example.com用户
- Role表中有admin角色
- Permission表中有多个权限
- SiteConfig表中有配置项

## 🎯 下一步

数据库配置完成后，可以：

1. 启动后端服务测试连接
2. 使用默认账号登录后台管理
3. 开始添加数据
























