# 测试后端启动

Write-Host "测试后端服务启动..." -ForegroundColor Green
Write-Host ""

cd backend

# 检查.env文件
if (Test-Path .env) {
    Write-Host "✓ .env文件存在" -ForegroundColor Green
} else {
    Write-Host "✗ .env文件不存在" -ForegroundColor Red
    exit 1
}

# 检查node_modules
if (Test-Path node_modules) {
    Write-Host "✓ node_modules存在" -ForegroundColor Green
} else {
    Write-Host "✗ node_modules不存在，请先运行 npm install" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "启动服务（按Ctrl+C停止）..." -ForegroundColor Yellow
Write-Host ""

# 启动服务
npm run start:dev
























