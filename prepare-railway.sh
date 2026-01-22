#!/bin/bash

# Railway 部署准备脚本
# 此脚本帮助你准备 Railway 部署所需的环境变量

echo "🚀 Railway 部署准备工具"
echo "========================"
echo ""

# 检查 credentials.json 是否存在
if [ ! -f "credentials.json" ]; then
    echo "❌ 错误: 找不到 credentials.json 文件"
    echo "请确保 credentials.json 在项目根目录"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 找不到 .env 文件"
    echo "请先创建 .env 文件并配置 GOOGLE_SHEET_ID"
    exit 1
fi

echo "✅ 找到必要的配置文件"
echo ""

# 读取 Google Sheet ID
SHEET_ID=$(grep GOOGLE_SHEET_ID .env | cut -d '=' -f2)

if [ -z "$SHEET_ID" ]; then
    echo "❌ 错误: .env 文件中未找到 GOOGLE_SHEET_ID"
    exit 1
fi

echo "📋 检测到的配置："
echo "   Google Sheet ID: $SHEET_ID"
echo ""

# 转换 credentials.json 为单行
echo "🔧 准备环境变量..."
echo ""

# 创建临时文件存储环境变量
ENV_FILE="railway-env.txt"

echo "# Railway 环境变量配置" > $ENV_FILE
echo "# 复制以下内容到 Railway 项目的环境变量设置中" >> $ENV_FILE
echo "" >> $ENV_FILE

echo "GOOGLE_SHEET_ID=$SHEET_ID" >> $ENV_FILE
echo "" >> $ENV_FILE

echo "GOOGLE_CREDENTIALS_JSON=" >> $ENV_FILE
cat credentials.json | tr -d '\n' >> $ENV_FILE
echo "" >> $ENV_FILE

echo "✅ 环境变量已准备完成！"
echo ""
echo "📄 配置已保存到: $ENV_FILE"
echo ""
echo "📋 下一步操作："
echo "   1. 打开 $ENV_FILE 文件"
echo "   2. 复制文件内容"
echo "   3. 在 Railway 项目设置中粘贴环境变量"
echo ""
echo "🌐 Railway 部署步骤："
echo "   1. 访问 https://railway.app/"
echo "   2. 登录并创建新项目"
echo "   3. 连接你的 GitHub 仓库"
echo "   4. 在 Variables 中添加环境变量"
echo "   5. 点击 Deploy"
echo ""
echo "📖 详细说明请查看 DEPLOYMENT.md"
echo ""

# 显示文件内容预览
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "环境变量预览（前 200 个字符）："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
head -c 200 $ENV_FILE
echo "..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
