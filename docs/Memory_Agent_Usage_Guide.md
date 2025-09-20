# Hướng dẫn Sử dụng MMVN Memory Agent

## Tổng quan

MMVN Agent đã được nâng cấp với khả năng **tự động tìm kiếm memory** trước khi trả lời, đảm bảo câu trả lời bám sát với chủ đề và context đã thảo luận trước đó.

## Cách hoạt động

### 1. **Automatic Memory Search**
Agent tự động gọi `self.search_memory()` trước khi trả lời:
```python
# Trong MMVNMemoryAgent.run()
search_result = await self.search_memory(query=user_query)
```

### 2. **Memory Context Summarization**
Agent tóm tắt thông tin từ memory để tạo context:
```python
def _summarize_memory_context(self, memories) -> str:
    # Tóm tắt top 3 memories liên quan nhất
    # Tạo prompt context cho LLM
```

### 3. **Enhanced Prompt**
Agent tạo prompt với memory context:
```python
enhanced_prompt = f"""Dựa trên thông tin từ cuộc trò chuyện trước:

{memory_context}

Bây giờ hãy trả lời câu hỏi của người dùng: {user_query}

Hãy đảm bảo câu trả lời bám sát với chủ đề và context đã thảo luận trước đó."""
```

## Cấu trúc Files

### 1. **`app/agent.py`** - Main Agent
```python
# Sử dụng MMVNMemoryAgent thay vì Agent thông thường
root_agent = MMVNMemoryAgent(
    model=PRIMARY_MODEL,
    name="mmvn_memory_agent",
    instruction=MMVN_AGENT_INSTRUCTION,
    tools=[search_products, explore_product, compare_products, load_memory],
    output_key="product_memory_agent",
)
```

### 2. **`app/memory_agent.py`** - Custom Agent Class
```python
class MMVNMemoryAgent(Agent):
    async def run(self, request: types.Content, **kwargs) -> types.Content:
        # 1. Tìm kiếm memory
        # 2. Tóm tắt context
        # 3. Tạo enhanced prompt
        # 4. Gọi parent run method
```

### 3. **`app/runner_config.py`** - Runner Configuration
```python
def create_memory_runner(agent, app_name: str = "mmvn_app"):
    # Tạo Runner với memory service
    # Đảm bảo session và memory được chia sẻ
```

## Sử dụng trong Production

### 1. **Cấu hình Runner**
```python
from app.runner_config import create_memory_runner
from app.agent import agent

# Tạo runner với memory
runner = create_memory_runner(agent, "mmvn_production")
```

### 2. **Chạy Agent với Memory**
```python
from app.runner_config import run_with_memory

# Chạy agent với automatic memory integration
response = await run_with_memory(
    agent=agent,
    user_id="user123",
    session_id="session456",
    user_message=user_input,
    app_name="mmvn_app"
)
```

### 3. **Manual Memory Management**
```python
from app.runner_config import add_session_to_memory

# Thêm session vào memory sau khi hoàn thành
add_session_to_memory(runner, user_id, session_id)
```

## Ví dụ Workflow

### 1. **Cuộc trò chuyện đầu tiên**
```
User: "Tôi đang tìm kiếm sản phẩm thịt bò, giá khoảng 200k-300k VND"
Agent: [Tìm kiếm sản phẩm và hiển thị kết quả]
→ Session được lưu vào memory
```

### 2. **Cuộc trò chuyện sau**
```
User: "Tôi muốn xem lại sản phẩm thịt bò mà chúng ta đã thảo luận trước đó"
Agent: [Tự động tìm kiếm memory]
→ Tìm thấy: "thịt bò, giá 200k-300k VND"
→ Tạo enhanced prompt với context
→ Trả lời dựa trên context trước đó
```

### 3. **Cuộc trò chuyện liên quan**
```
User: "Sản phẩm nào trong số đó có giá rẻ nhất?"
Agent: [Tìm kiếm memory về thịt bò]
→ Hiểu được "số đó" = sản phẩm thịt bò đã thảo luận
→ Trả lời dựa trên context
```

## Lợi ích

### 1. **Context-Aware Responses**
- Agent hiểu được context từ cuộc trò chuyện trước
- Trả lời bám sát với chủ đề đã thảo luận
- Tạo cảm giác liên tục trong cuộc trò chuyện

### 2. **Automatic Memory Integration**
- Không cần gọi `load_memory` tool manually
- Tự động tìm kiếm memory trước mỗi response
- Tối ưu hóa prompt với context

### 3. **Better User Experience**
- Người dùng không cần nhắc lại context
- Agent nhớ được sở thích và yêu cầu trước đó
- Trả lời chính xác và liên quan hơn

## Cấu hình Memory

### 1. **InMemoryMemoryService** (Hiện tại)
- Lưu trữ trong bộ nhớ ứng dụng
- Phù hợp cho development và testing
- Dữ liệu mất khi restart

### 2. **VertexAiMemoryBankService** (Tương lai)
- Persistent memory
- Semantic search
- Phù hợp cho production

## Test Memory Agent

Chạy test để kiểm tra memory agent:

```bash
# Test memory agent workflow
python test_memory_agent.py

# Test memory integration
python test_memory_integration.py

# Test simple memory service
python test_memory_simple.py
```

## Troubleshooting

### 1. **Memory không hoạt động**
- Kiểm tra memory service được cấu hình đúng
- Đảm bảo session được lưu vào memory
- Check logs để xem lỗi

### 2. **Context không chính xác**
- Kiểm tra memory search query
- Điều chỉnh summarization logic
- Test với different memory scenarios

### 3. **Performance issues**
- Giới hạn số lượng memories được tóm tắt
- Optimize memory search queries
- Consider caching strategies

## Kết luận

MMVN Memory Agent đã được trang bị đầy đủ khả năng:

✅ **Automatic memory search** trước mỗi response  
✅ **Context summarization** để tối ưu prompt  
✅ **Enhanced prompts** với memory context  
✅ **Seamless integration** với existing tools  
✅ **Better user experience** với context-aware responses  

Agent sẽ tự động tìm kiếm và sử dụng thông tin từ cuộc trò chuyện trước để đảm bảo câu trả lời bám sát với chủ đề người dùng hỏi.
