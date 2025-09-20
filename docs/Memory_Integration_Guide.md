# Hướng dẫn Tích hợp Memory cho MMVN Agent

## Tổng quan

MMVN Agent đã được trang bị khả năng sử dụng **InMemoryMemoryService** để lưu trữ và truy vấn thông tin từ các cuộc trò chuyện trước đó.

## Cấu trúc Memory

### 1. **InMemoryMemoryService**
- Lưu trữ thông tin trong bộ nhớ ứng dụng
- Không cần setup phức tạp
- Phù hợp cho prototyping và development
- Dữ liệu sẽ mất khi restart ứng dụng

### 2. **load_memory Tool**
- Tool tích hợp sẵn của Google ADK
- Cho phép agent truy vấn memory
- Tự động tìm kiếm thông tin liên quan

## Cách hoạt động

### 1. **Lưu trữ thông tin vào Memory**
```python
# Khi một session hoàn thành, thông tin được lưu vào memory
await memory_service.add_session_to_memory(completed_session)
```

### 2. **Truy vấn Memory**
```python
# Agent sử dụng load_memory tool để tìm kiếm thông tin
search_result = await memory_service.search_memory(
    app_name=APP_NAME,
    user_id=USER_ID,
    query="thịt bò giá 200k-300k"
)
```

## Cấu hình Agent

### 1. **Agent đã được cập nhật**
```python
root_agent = Agent(
    model=PRIMARY_MODEL,
    name="mmvn_simple_agent",
    instruction=MMVN_AGENT_INSTRUCTION,
    tools=[
        search_products,
        explore_product,
        compare_products,
        load_memory,  # ✅ Memory tool đã được thêm
    ],
    output_key="product_simple_agent",
)
```

### 2. **Instruction đã được cập nhật**
Agent được hướng dẫn sử dụng memory khi:
- Người dùng hỏi về sản phẩm đã thảo luận trước đó
- Cần thông tin từ cuộc trò chuyện trước
- Tìm kiếm context liên quan

## Sử dụng trong Runner

### 1. **Cấu hình Runner với Memory**
```python
from app.memory_config import get_session_service, get_memory_service

runner = Runner(
    agent=your_agent,
    app_name=APP_NAME,
    session_service=get_session_service(),  # Shared session service
    memory_service=get_memory_service()    # Shared memory service
)
```

### 2. **Lưu Session vào Memory**
```python
# Sau khi session hoàn thành
completed_session = await runner.session_service.get_session(
    app_name=APP_NAME, 
    user_id=USER_ID, 
    session_id=session_id
)
await memory_service.add_session_to_memory(completed_session)
```

## Ví dụ sử dụng

### 1. **Cuộc trò chuyện đầu tiên**
```
User: "Tôi đang tìm kiếm sản phẩm thịt bò, giá khoảng 200k-300k VND"
Agent: [Tìm kiếm sản phẩm và hiển thị kết quả]
→ Thông tin được lưu vào memory
```

### 2. **Cuộc trò chuyện sau**
```
User: "Tôi muốn xem lại sản phẩm thịt bò mà chúng ta đã thảo luận trước đó"
Agent: [Sử dụng load_memory để tìm kiếm thông tin cũ]
→ Trả về thông tin từ memory
```

## Lợi ích

### 1. **Trải nghiệm người dùng tốt hơn**
- Agent nhớ được sở thích của người dùng
- Có thể tham khảo cuộc trò chuyện trước
- Tạo cảm giác liên tục trong cuộc trò chuyện

### 2. **Tìm kiếm thông minh hơn**
- Có thể tìm kiếm dựa trên context trước đó
- Hiểu được ý định của người dùng tốt hơn
- Đưa ra gợi ý phù hợp hơn

## Hạn chế

### 1. **InMemoryMemoryService**
- Dữ liệu mất khi restart
- Không phù hợp cho production
- Chỉ phù hợp cho development/testing

### 2. **Performance**
- Tìm kiếm cơ bản (keyword matching)
- Không có semantic search
- Có thể chậm với dữ liệu lớn

## Nâng cấp trong tương lai

### 1. **VertexAiMemoryBankService**
- Persistent memory
- Semantic search
- Phù hợp cho production
- Cần Google Cloud setup

### 2. **Custom Memory Service**
- Tích hợp với database
- Custom search logic
- Phù hợp với yêu cầu cụ thể

## Test Memory

Chạy test để kiểm tra memory integration:

```bash
python test_memory_integration.py
```

## Kết luận

MMVN Agent đã được trang bị đầy đủ khả năng memory với InMemoryMemoryService. Agent có thể:

✅ Lưu trữ thông tin từ cuộc trò chuyện  
✅ Truy vấn thông tin từ memory  
✅ Sử dụng context trước đó để trả lời  
✅ Tạo trải nghiệm liên tục cho người dùng  

Để sử dụng trong production, nên cân nhắc nâng cấp lên VertexAiMemoryBankService hoặc custom memory service.
