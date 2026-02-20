# 如何启动服务 - 重要说明

## ⚠️ 问题说明

服务无法自动启动的原因可能是：
1. Redis服务未运行（代码中使用了Redis）
2. 数据库连接问题
3. 其他启动错误

## ✅ 正确的启动方式

**请手动在终端启动服务，这样可以看到错误信息！**

### 步骤1: 启动后端服务

打开**第一个终端窗口**，执行：

```powershell
cd J:\cursor-project\ai\first-project\backend
npm run start:dev
```

**观察输出：**
- 如果成功，会看到: `Application is running on: http://localhost:3000`
- 如果有错误，会显示具体错误信息

**常见错误及解决：**

1. **Redis连接失败**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:6379
   ```
   **解决**: 启动Redis服务，或临时注释Redis相关代码

2. **数据库连接失败**
   ```
   Error: P1001: Can't reach database server
   ```
   **解决**: 检查PostgreSQL服务是否运行

### 步骤2: 启动前台服务

打开**第二个终端窗口**，执行：

```powershell
cd J:\cursor-project\ai\first-project\frontend
npm run dev
```

### 步骤3: 启动后台管理服务

打开**第三个终端窗口**，执行：

```powershell
cd J:\cursor-project\ai\first-project\admin
npm start
```

## 🔧 如果Redis未安装

如果Redis未安装或无法启动，可以临时修改代码跳过Redis：

### 修改 queue.service.ts

在 `ai/first-project/backend/src/modules/queue/queue.service.ts` 中，注释掉Redis初始化：

```typescript
constructor(...) {
  // 临时注释Redis
  // this.redis = new Redis({...});
  
  // 添加空实现
  this.redis = null as any;
}
```

同样修改 `websocket.gateway.ts` 和 `auth.service.ts`。

## 📋 快速检查

启动前确认：

1. **PostgreSQL运行中**
   ```powershell
   # 测试连接
   psql -U postgres -d rebate_db
   ```

2. **Redis运行中（可选，但推荐）**
   ```powershell
   redis-cli ping
   # 应该返回: PONG
   ```

3. **环境变量配置正确**
   - `backend/.env` 文件存在
   - `DATABASE_URL` 配置正确

## 🎯 验证服务

启动后，在浏览器访问：

- 后端: http://localhost:3000/api/health
- 前台: http://localhost:3001
- 后台: http://localhost:8000/login

## 💡 提示

**请务必在终端窗口手动启动服务**，这样可以看到：
- 启动进度
- 错误信息
- 调试日志

后台启动无法看到错误信息，所以无法诊断问题！
























