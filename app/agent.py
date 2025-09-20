"""
Simple MMVN Root Agent (single-agent) aligned with DDV structure.
Capabilities: search, explore detail, compare, memory.
"""

import logging
from google.adk.agents import Agent
from google.adk.tools import FunctionTool, load_memory
from google.adk.memory import InMemoryMemoryService

# Keep using existing constants if available; fallback to flash model name
try:
    from app.shared_libraries.constants import MODEL_GEMINI_2_5_FLASH_LITE as PRIMARY_MODEL
except Exception:
    PRIMARY_MODEL = "gemini-2.5-flash-lite"

# Prompts: use a concise instruction similar to DDV but for MMVN
MMVN_AGENT_INSTRUCTION = """Bạn là Trợ lý mua sắm MMVN. Luôn dùng công cụ để:
- Tìm kiếm sản phẩm (search_products)
- Xem chi tiết (explore_product)
- So sánh (compare_products)
- Truy vấn thông tin từ cuộc trò chuyện trước (load_memory) khi cần thiết
- Phản hồi bằng ngôn ngữ của câu hỏi, search luôn bằng tiếng Việt 
- Gọi công cụ và phản hồi JSON product-display từ công cụ để frontend hiển thị.

Khi người dùng hỏi về sản phẩm đã thảo luận trước đó hoặc cần thông tin từ cuộc trò chuyện trước, hãy sử dụng load_memory để tìm kiếm thông tin liên quan.

QUAN TRỌNG: Luôn tìm kiếm trong memory trước khi trả lời để đảm bảo câu trả lời bám sát với chủ đề và context đã thảo luận trước đó."""

# Import simple tools we added
from app.tools.search import search_products
from app.tools.explore import explore_product
from app.tools.compare import compare_products
from app.memory_agent import MMVNMemoryAgent

logger = logging.getLogger(__name__)

# Create memory-enhanced agent
root_agent = MMVNMemoryAgent(
    model=PRIMARY_MODEL,
    name="mmvn_memory_agent",
    instruction=MMVN_AGENT_INSTRUCTION,
    tools=[
        search_products,
        explore_product,
        compare_products,
        load_memory,  # Add memory tool
    ],
    output_key="product_memory_agent",
)

# Required export for ADK web UI
agent = root_agent
