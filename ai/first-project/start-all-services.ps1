# 启动所有服务的脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "启动返利折扣网系统服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查.env文件
$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host ""
    Write-Host "错误: backend/.env 文件不存在！" -ForegroundColor Red
    Write-Host "正在创建.env文件..." -ForegroundColor Yellow
    
    $envContent = @"
DATABASE_URL="postgresql://postgres:123456@localhost:5432/rebate_db"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=rebate-discount-secret-key-2024-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=rebate-discount-refresh-secret-key-2024-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
"@
    $envContent | Out-File -FilePath $envFile -Encoding utf8
    Write-Host ".env文件已创建" -ForegroundColor Green
}

Write-Host ""
Write-Host "提示: 需要打开3个终端窗口分别启动3个服务" -ForegroundColor Yellow
Write-Host ""
Write-Host "终端1 - 后端服务:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "终端2 - 前台服务:" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "终端3 - 后台管理:" -ForegroundColor Cyan
Write-Host "  cd admin" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "或者使用以下命令在新窗口中启动:" -ForegroundColor Yellow
Write-Host ""

# 启动后端（新窗口）
Write-Host "启动后端服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run start:dev"

Start-Sleep -Seconds 3

# 启动前台（新窗口）
Write-Host "启动前台服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Start-Sleep -Seconds 3

# 启动后台管理（新窗口）
Write-Host "启动后台管理服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\admin'; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "服务启动中，请查看新打开的窗口..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  后端API: http://localhost:3000/api" -ForegroundColor White
Write-Host "  前台: http://localhost:3001" -ForegroundColor White
Write-Host "  后台管理: http://localhost:8000" -ForegroundColor White
Write-Host ""
























