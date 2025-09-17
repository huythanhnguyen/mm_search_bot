#!/usr/bin/env bash
# Script build cho Render.com

# Thoát nếu có lỗi
set -o errexit

echo "🚀 Bắt đầu quá trình build..."

# Cài đặt dependencies
echo "📦 Cài đặt dependencies..."
npm install

# Xóa file TypeScript để tránh lỗi
echo "🗑️ Xóa file TypeScript cũ..."
rm -f tailwind.config.ts vite.config.ts

# Build ứng dụng
echo "🔧 Build ứng dụng..."
npm run build

echo "✅ Quá trình build hoàn tất!" 