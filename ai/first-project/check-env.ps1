# 检查环境配置脚本

Write-Host "检查环境配置..." -ForegroundColor Green

$envFile = "backend\.env"
if (-not (Test-Path $envFile)) {
    Write-Host ""
    Write-Host "错误: backend/.env 文件不存在！" -ForegroundColor Red
    Write-Host "请创建 backend/.env 文件并配置数据库连接。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "参考配置:" -ForegroundColor Cyan
    Write-Host "DATABASE_URL=`"postgresql://用户名:密码@localhost:5432/rebate_db`"" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "backend/.env 文件存在" -ForegroundColor Green

# 检查数据库连接配置
$content = Get-Content $envFile -Raw
if ($content -notmatch "DATABASE_URL") {
    Write-Host ""
    Write-Host "警告: DATABASE_URL 未配置" -ForegroundColor Yellow
} else {
    Write-Host "DATABASE_URL 已配置" -ForegroundColor Green
}

if ($content -notmatch "REDIS_HOST") {
    Write-Host "警告: REDIS_HOST 未配置" -ForegroundColor Yellow
} else {
    Write-Host "REDIS_HOST 已配置" -ForegroundColor Green
}

if ($content -notmatch "JWT_SECRET") {
    Write-Host "警告: JWT_SECRET 未配置" -ForegroundColor Yellow
} else {
    Write-Host "JWT_SECRET 已配置" -ForegroundColor Green
}

Write-Host ""
Write-Host "环境配置检查完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步: 运行数据库迁移" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run prisma:migrate" -ForegroundColor White

