#!/bin/bash

# Linux/Mac 安装脚本

echo "开始安装项目依赖..."

# 安装后端依赖
echo -e "\n[1/3] 安装后端依赖..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "后端依赖安装失败！"
    exit 1
fi
cd ..

# 安装前台依赖
echo -e "\n[2/3] 安装前台依赖..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "前台依赖安装失败！"
    exit 1
fi
cd ..

# 安装后台管理依赖
echo -e "\n[3/3] 安装后台管理依赖..."
cd admin
npm install
if [ $? -ne 0 ]; then
    echo "后台管理依赖安装失败！"
    exit 1
fi
cd ..

echo -e "\n所有依赖安装完成！"
echo -e "\n下一步操作："
echo "1. 配置数据库连接（编辑 backend/.env）"
echo "2. 运行数据库迁移：cd backend && npm run prisma:migrate"
echo "3. 填充种子数据：cd backend && npm run prisma:seed"

