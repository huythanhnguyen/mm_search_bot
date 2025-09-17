# MM Ecommerce API Client

Thư viện client cho API GraphQL của MM Ecommerce, được thiết kế để sử dụng trong hệ thống Multi-Agent.

## Cấu trúc thư viện

- `api_client.py`: Client tổng hợp kết hợp tất cả các module API
- `product.py`: Client chuyên biệt cho các thao tác liên quan đến sản phẩm 
- `cart.py`: Client chuyên biệt cho các thao tác liên quan đến giỏ hàng
- `auth.py`: Client chuyên biệt cho các thao tác xác thực người dùng
- `base.py`: Lớp cơ sở cung cấp các chức năng chung
- `config.py`: Cấu hình hệ thống
- `client_factory.py`: Factory để tạo và quản lý các instance client
- `response.py`: Định dạng phản hồi chuẩn hóa

## Tính năng chính

- Hỗ trợ đầy đủ GraphQL API của MM Ecommerce
- Xử lý lỗi mạnh mẽ
- Quản lý session và authentication
- Cấu trúc modular giúp dễ mở rộng
- Factory pattern để quản lý client một cách tập trung
- Định dạng phản hồi chuẩn hóa

## Cách sử dụng

### 1. Factory Pattern

Sử dụng `APIClientFactory` để khởi tạo các client APIs:

```python
from multi_tool_agent.tools.cng.api_client.client_factory import APIClientFactory

# Khởi tạo factory một lần duy nhất
factory = APIClientFactory()

# Lấy product API client 
product_api = factory.get_product_api()

# Lấy cart API client
cart_api = factory.get_cart_api()

# Lấy full client tổng hợp
full_api = factory.get_full_api_client()

# Thiết lập token xác thực cho tất cả các client
factory.set_auth_token("your_auth_token")

# Thiết lập mã cửa hàng cho tất cả các client
factory.set_store_code("your_store_code")
```

### 2. Standardized Response

Sử dụng định dạng phản hồi chuẩn `APIResponse`:

```python
from multi_tool_agent.tools.cng.api_client.response import APIResponse, safe_api_call

# Tạo phản hồi thành công
success_response = APIResponse.success_response(
    data={"products": [...]},
    message="Tìm kiếm sản phẩm thành công"
)

# Tạo phản hồi lỗi
error_response = APIResponse.error_response(
    message="Không tìm thấy sản phẩm",
    error="Product not found"
)

# Tạo phản hồi từ exception
except_response = APIResponse.from_exception(
    exception=e,
    message="Lỗi khi tìm kiếm sản phẩm"
)

# Chuyển đổi phản hồi thành dictionary
response_dict = success_response.to_dict()

# Chuyển đổi phản hồi sang định dạng tool response
tool_response = success_response.to_tool_response()
```

### 3. Safe API Call

Sử dụng wrapper `safe_api_call` để xử lý exception tự động:

```python
from multi_tool_agent.tools.cng.api_client.response import safe_api_call

# Gọi API với xử lý lỗi tự động
result = await safe_api_call(
    api_client.search_products,
    query="smartphone",
    page_size=10,
    current_page=1
)

if result.success:
    # Xử lý kết quả thành công
    products = result.data.get("products", {})
else:
    # Xử lý lỗi
    error_message = result.message
    error_details = result.error
```

## Tích hợp với Tool Wrapper

Khi phát triển tool wrapper, hãy sử dụng factory để có được client API và safe_api_call để gọi API:

```python
from multi_tool_agent.tools.cng.api_client.client_factory import APIClientFactory
from multi_tool_agent.tools.cng.api_client.response import APIResponse, safe_api_call

# Khởi tạo API client từ factory
api_client = APIClientFactory().get_product_api()

async def my_tool_function(param1, param2):
    try:
        # Gọi API với xử lý lỗi tự động
        result = await safe_api_call(
            api_client.some_method,
            param1,
            param2
        )
        
        if result.success:
            # Xử lý kết quả thành công
            return {
                "status": "success",
                "data": result.data
            }
        else:
            # Chuyển đổi kết quả lỗi theo định dạng tool
            return result.to_tool_response()
    except Exception as e:
        # Xử lý exception theo định dạng tool
        return APIResponse.from_exception(e).to_tool_response()
```

## Lợi ích

1. **Quản lý tập trung**: Cấu hình và khởi tạo client tại một nơi duy nhất
2. **Nhất quán**: Định dạng phản hồi thống nhất giữa các API và tool wrapper
3. **Xử lý lỗi tốt hơn**: Bắt và xử lý exception tự động
4. **Mã nguồn dễ bảo trì**: Giảm mã trùng lặp, tăng tính mô-đun hóa
5. **Hiệu suất cao hơn**: Cache client để tránh tạo nhiều instance không cần thiết 