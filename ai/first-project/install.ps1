# Windows PowerShell 安装脚本

Write-Host "开始安装项目依赖..." -ForegroundColor Green

# 安装后端依赖
Write-Host "`n[1/3] 安装后端依赖..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "后端依赖安装失败！" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 安装前台依赖
Write-Host "`n[2/3] 安装前台依赖..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "前台依赖安装失败！" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 安装后台管理依赖
Write-Host "`n[3/3] 安装后台管理依赖..." -ForegroundColor Yellow
Set-Location admin
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "后台管理依赖安装失败！" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "`n所有依赖安装完成！" -ForegroundColor Green
Write-Host "`n下一步操作：" -ForegroundColor Cyan
Write-Host "1. 配置数据库连接（编辑 backend/.env）" -ForegroundColor White
Write-Host "2. 运行数据库迁移：cd backend && npm run prisma:migrate" -ForegroundColor White
Write-Host "3. 填充种子数据：cd backend && npm run prisma:seed" -ForegroundColor White

