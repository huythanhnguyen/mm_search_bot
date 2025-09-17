# MM Multi Agent Frontend

Frontend cho hệ thống MM Multi Agent, sử dụng React + Vite + Tailwind CSS.

## Cài đặt

### Cách 1: Sử dụng Node.js đã cài đặt sẵn

Nếu bạn đã cài đặt Node.js:

```bash
# Cài đặt dependencies
npm install

# Khởi động server phát triển
npm run dev
```

### Cách 2: Sử dụng Node.js portable (khuyến nghị)

Nếu bạn chưa cài đặt Node.js, hệ thống sẽ tự động tải và cài đặt Node.js portable:

1. **Tải Node.js portable**:
   ```
   powershell -ExecutionPolicy Bypass -File download-nodejs.ps1
   ```

2. **Cài đặt dependencies**:
   ```
   install-dependencies.bat
   ```

3. **Khởi động server**:
   ```
   start-frontend.bat
   ```

## Các file script

- `download-nodejs.ps1`: Tải và giải nén Node.js portable
- `install-dependencies.bat`: Cài đặt các gói npm
- `start-frontend.bat`: Khởi động server phát triển

## Cấu hình

- Frontend chạy tại: http://localhost:5173
- API proxy đến backend: http://localhost:8000
- Cấu hình trong file `vite.config.ts`

## Cấu trúc thư mục

```
frontend/
├── src/                  # Source code
│   ├── components/       # React components
│   ├── App.tsx           # Component chính
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── package.json          # Dependencies
└── vite.config.ts        # Cấu hình Vite
```

## Yêu cầu hệ thống

- Windows 10/11 (64-bit)
- Hoặc Node.js 18+ nếu đã cài đặt sẵn

## Lưu ý

- Đảm bảo backend đang chạy tại http://localhost:8000
- Nếu cần thay đổi port, chỉnh sửa trong file `vite.config.ts` 