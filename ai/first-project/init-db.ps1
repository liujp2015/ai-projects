# 初始化数据库脚本
Write-Host "初始化数据库..." -ForegroundColor Green

Set-Location backend

Write-Host "`n[1/3] 生成 Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prisma Client 生成失败！" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] 运行数据库迁移..." -ForegroundColor Yellow
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "数据库迁移失败！请检查数据库连接配置。" -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] 填充种子数据..." -ForegroundColor Yellow
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "种子数据填充失败！" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "`n数据库初始化完成！" -ForegroundColor Green
Write-Host "默认管理员账号：" -ForegroundColor Cyan
Write-Host "  邮箱: admin@example.com" -ForegroundColor White
Write-Host "  密码: admin123" -ForegroundColor White

