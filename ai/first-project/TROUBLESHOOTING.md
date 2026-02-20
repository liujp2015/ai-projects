# 故障排除指南

## 服务无法访问的常见原因

### 1. 服务未真正启动

**检查方法:**
```powershell
# 检查端口占用
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
netstat -ano | findstr ":8000"
```

如果没有输出，说明服务未启动。

**解决方案:**
1. 手动在终端启动服务
2. 查看终端错误信息
3. 检查依赖是否安装完整

### 2. 数据库连接失败

**错误信息:**
```
Error: P1001: Can't reach database server
```

**解决方案:**
1. 检查PostgreSQL服务是否运行
2. 检查 `backend/.env` 中的 `DATABASE_URL` 配置
3. 确认数据库 `rebate_db` 已创建
4. 测试连接: `psql -U postgres -d rebate_db`

### 3. Redis连接失败

**错误信息:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决方案:**
1. 检查Redis服务是否运行
2. 测试连接: `redis-cli ping` (应该返回 PONG)
3. 如果未安装Redis，需要先安装并启动

### 4. 端口被占用

**错误信息:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案:**
1. 查找占用端口的进程:
   ```powershell
   netstat -ano | findstr ":3000"
   # 记下PID，然后结束进程
   taskkill /PID <PID> /F
   ```
2. 或修改端口配置

### 5. 依赖未安装

**错误信息:**
```
Cannot find module '@nestjs/...'
```

**解决方案:**
```bash
cd backend
npm install

cd ../frontend
npm install

cd ../admin
npm install
```

### 6. TypeScript编译错误

**错误信息:**
```
error TS2307: Cannot find module '...'
```

**解决方案:**
1. 检查导入路径是否正确
2. 运行 `npm run build` 查看详细错误
3. 检查 `tsconfig.json` 配置

## 手动启动服务步骤

### 方式一：使用脚本（推荐）

```powershell
cd ai/first-project
powershell -ExecutionPolicy Bypass -File start-all-services.ps1
```

这会打开3个新窗口，分别启动3个服务。

### 方式二：手动启动（3个终端）

**终端1 - 后端:**
```powershell
cd ai/first-project/backend
npm run start:dev
```

**终端2 - 前台:**
```powershell
cd ai/first-project/frontend
npm run dev
```

**终端3 - 后台管理:**
```powershell
cd ai/first-project/admin
npm start
```

## 检查服务状态

### 1. 检查后端服务

```powershell
# 方法1: 检查端口
netstat -ano | findstr ":3000"

# 方法2: 访问健康检查
Invoke-WebRequest http://localhost:3000/api/health
```

### 2. 检查前台服务

```powershell
# 检查端口
netstat -ano | findstr ":3001"

# 访问首页
Start-Process http://localhost:3001
```

### 3. 检查后台管理服务

```powershell
# 检查端口
netstat -ano | findstr ":8000"

# 访问登录页
Start-Process http://localhost:8000/login
```

## 常见错误及解决方案

### 错误1: Prisma Client未生成

**错误信息:**
```
Cannot find module '@prisma/client'
```

**解决方案:**
```bash
cd backend
npm run prisma:generate
```

### 错误2: 数据库迁移未运行

**错误信息:**
```
Table "User" does not exist
```

**解决方案:**
```bash
cd backend
npx prisma db push
# 或
npm run prisma:migrate
```

### 错误3: 环境变量未加载

**错误信息:**
```
DATABASE_URL is not defined
```

**解决方案:**
1. 确认 `backend/.env` 文件存在
2. 检查文件内容是否正确
3. 重启服务

### 错误4: CORS错误（前端）

**错误信息:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方案:**
- 后端已配置CORS，检查后端服务是否运行
- 检查前端API配置是否正确

### 错误5: WebSocket连接失败

**错误信息:**
```
WebSocket connection failed
```

**解决方案:**
1. 检查后端WebSocket服务是否运行
2. 检查 `NEXT_PUBLIC_WS_URL` 配置
3. 检查防火墙设置

## 调试技巧

### 1. 查看详细日志

启动服务时，终端会显示详细日志，包括：
- 启动信息
- 错误堆栈
- 数据库查询
- API请求

### 2. 使用Prisma Studio查看数据库

```bash
cd backend
npm run prisma:studio
```

这会打开浏览器，可视化查看数据库内容。

### 3. 检查网络连接

```powershell
# 测试本地连接
Test-NetConnection localhost -Port 3000
Test-NetConnection localhost -Port 3001
Test-NetConnection localhost -Port 8000
```

### 4. 查看进程

```powershell
# 查看Node.js进程
Get-Process node

# 查看特定端口的进程
netstat -ano | findstr ":3000"
```

## 重置环境

如果问题持续，可以尝试重置：

### 1. 清理并重新安装依赖

```bash
# 后端
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# 前台
cd ../frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# 后台管理
cd ../admin
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### 2. 重置数据库

```bash
cd backend
npx prisma migrate reset
npx prisma db push
npm run prisma:seed
```

## 获取帮助

如果以上方法都无法解决问题：

1. 查看终端错误信息（最重要）
2. 检查日志文件
3. 确认所有前置条件（PostgreSQL、Redis）都已满足
4. 查看相关文档

## 快速检查清单

- [ ] PostgreSQL服务运行中
- [ ] Redis服务运行中
- [ ] 数据库 `rebate_db` 已创建
- [ ] `backend/.env` 文件存在且配置正确
- [ ] 所有依赖已安装（npm install）
- [ ] Prisma Client已生成
- [ ] 数据库表已创建
- [ ] 端口未被占用
- [ ] 防火墙未阻止连接
























