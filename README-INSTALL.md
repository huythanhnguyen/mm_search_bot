# 🚀 Hướng dẫn cài đặt MM Multi Agent System

## 📋 Yêu cầu hệ thống

- **Windows 10/11** (64-bit)
- **Python 3.8+** (cho backend)
- **Quyền Administrator** (để chạy script cài đặt)

## 🎯 Cấu trúc dự án

```
mm_multi_agent/
├── frontend/                 # React + Vite Frontend
│   ├── src/                 # Source code React
│   ├── package.json         # Dependencies frontend
│   └── vite.config.ts       # Cấu hình Vite
├── multi_tool_agent/        # Backend Python
│   ├── agent.py            # Main agent file
│   ├── tools/              # Các tools của agent
│   └── sub_agents/         # Các sub-agents
├── requirements.txt         # Python dependencies
└── run_backend.py          # Script khởi động backend
```

## 🛠️ Cài đặt từng bước

### Bước 1: Cài đặt Python (nếu chưa có)

1. Tải Python từ: https://www.python.org/downloads/
2. Chọn "Add Python to PATH" khi cài đặt
3. Kiểm tra: `python --version`

### Bước 2: Cài đặt Backend

1. Mở PowerShell với quyền Administrator
2. Di chuyển đến thư mục dự án:
   ```powershell
   cd "C:\Users\60506053\Desktop\project\agent_front\mm_multi_agent_v2\mm_multi_agent"
   ```
3. Chạy script cài đặt backend:
   ```powershell
   .\install-backend.ps1
   ```

### Bước 3: Cài đặt Frontend

1. Di chuyển đến thư mục frontend:
   ```powershell
   cd frontend
   ```
2. Chạy script cài đặt frontend:
   ```powershell
   .\install-nodejs-portable.ps1
   ```
3. Cài đặt dependencies:
   ```cmd
   .\install-dependencies.bat
   ```

## 🚀 Khởi động hệ thống

### Cách 1: Khởi động toàn bộ hệ thống (Khuyến nghị)

```cmd
.\start-system.bat
```

### Cách 2: Khởi động riêng lẻ

**Backend:**
```cmd
.\start-backend.bat
```

**Frontend:**
```cmd
cd frontend
.\start-frontend.bat
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📁 Các file script được tạo

### Backend
- `install-backend.ps1` - Script cài đặt backend
- `start-backend.bat` - Khởi động backend
- `start-system.bat` - Khởi động toàn bộ hệ thống

### Frontend
- `frontend/install-nodejs-portable.ps1` - Script cài đặt Node.js portable
- `frontend/install-dependencies.bat` - Cài đặt npm dependencies
- `frontend/start-frontend.bat` - Khởi động frontend

## 🔧 Cấu hình

### Frontend (Vite)
- **Port**: 5173
- **Proxy**: API requests được proxy đến http://localhost:8000
- **Hot Reload**: Bật sẵn

### Backend (Google ADK)
- **Port**: 8000
- **Framework**: Google ADK Agents
- **Documentation**: Swagger UI tại /docs

## 🐛 Xử lý lỗi thường gặp

### Lỗi "npm not found"
- Chạy lại `install-nodejs-portable.ps1`
- Đảm bảo script chạy với quyền Administrator

### Lỗi "Python not found"
- Cài đặt Python từ https://www.python.org/downloads/
- Chọn "Add Python to PATH"

### Lỗi "Port already in use"
- Kiểm tra và dừng các process đang sử dụng port 5173 hoặc 8000
- Hoặc thay đổi port trong cấu hình

### Lỗi "Module not found"
- Chạy lại `install-dependencies.bat` cho frontend
- Chạy lại `install-backend.ps1` cho backend

## 📝 Ghi chú

- Hệ thống sử dụng **Node.js portable** - không cần cài đặt Node.js toàn cục
- Backend sử dụng **virtual environment** - cô lập dependencies
- Frontend có **hot reload** - tự động cập nhật khi thay đổi code
- API requests được **proxy** từ frontend đến backend

## 🆘 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Quyền Administrator
2. Python version (3.8+)
3. Kết nối internet (để tải dependencies)
4. Firewall/antivirus (có thể chặn port)

## 🎉 Hoàn tất

Sau khi cài đặt thành công, bạn có thể:
- Truy cập frontend tại http://localhost:5173
- Xem API docs tại http://localhost:8000/docs
- Phát triển và test các tính năng mới 