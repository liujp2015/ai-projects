# 创建.env文件的脚本

$envContent = @"
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
"@

if (Test-Path .env) {
    Write-Host ".env 文件已存在，跳过创建" -ForegroundColor Yellow
} else {
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host ".env 文件已创建" -ForegroundColor Green
}
























