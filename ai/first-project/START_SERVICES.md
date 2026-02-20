# 手动启动服务指南

## ⚠️ 重要：服务需要手动启动

由于后台启动可能无法看到错误信息，请**手动在终端启动服务**。

## 启动步骤

### 1. 打开3个终端窗口

### 2. 终端1 - 启动后端服务

```powershell
cd J:\cursor-project\ai\first-project\backend
npm run start:dev
```

**等待看到:**
```
Application is running on: http://localhost:3000
```

**如果出现错误:**
- 查看错误信息
- 常见错误：数据库连接失败、Redis连接失败
- 检查 `.env` 文件配置

### 3. 终端2 - 启动前台服务

```powershell
cd J:\cursor-project\ai\first-project\frontend
npm run dev
```

**等待看到:**
```
- Local:        http://localhost:3001
```

### 4. 终端3 - 启动后台管理服务

```powershell
cd J:\cursor-project\ai\first-project\admin
npm start
```

**等待看到:**
```
  App running at:
  - Local:    http://localhost:8000
```

## 验证服务

### 检查后端

打开浏览器访问: http://localhost:3000/api/health

应该返回JSON响应。

### 检查前台

打开浏览器访问: http://localhost:3001

应该看到首页。

### 检查后台管理

打开浏览器访问: http://localhost:8000/login

应该看到登录页面。

## 常见启动错误

### 错误1: 数据库连接失败

**错误信息:**
```
Error: P1001: Can't reach database server
```

**解决:**
1. 确认PostgreSQL服务运行
2. 检查 `backend/.env` 中的 `DATABASE_URL`
3. 测试: `psql -U postgres -d rebate_db`

### 错误2: Redis连接失败

**错误信息:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决:**
1. 启动Redis服务
2. 测试: `redis-cli ping` (应该返回 PONG)
3. 如果未安装Redis，需要先安装

### 错误3: 端口被占用

**错误信息:**
```
Error: listen EADDRINUSE
```

**解决:**
```powershell
# 查找占用端口的进程
netstat -ano | findstr ":3000"
# 结束进程（替换<PID>为实际PID）
taskkill /PID <PID> /F
```

### 错误4: 模块找不到

**错误信息:**
```
Cannot find module '@nestjs/...'
```

**解决:**
```powershell
cd backend
npm install
```

## 快速检查清单

启动前确认：
- [ ] PostgreSQL服务运行中
- [ ] Redis服务运行中（如果未安装，可以先注释掉Redis相关代码）
- [ ] `backend/.env` 文件存在
- [ ] 数据库 `rebate_db` 已创建
- [ ] 所有依赖已安装

## 如果Redis未安装

如果Redis未安装或无法启动，可以临时注释掉Redis相关代码：

1. 注释 `queue.service.ts` 中的Redis初始化
2. 注释 `websocket.gateway.ts` 中的Redis初始化  
3. 注释 `auth.service.ts` 中的Redis初始化

但这会影响验证码和队列功能。

## 下一步

服务启动成功后：
1. 访问 http://localhost:8000/login
2. 使用 admin@example.com / admin123 登录
3. 开始添加数据
























