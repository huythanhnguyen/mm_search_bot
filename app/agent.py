"""
Simple MMVN Root Agent (single-agent) aligned with DDV structure.
Capabilities: search, explore detail, compare.
"""

import logging
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

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
- Phản hồi bằng ngôn ngữ của câu hỏi, search luôn bằng tiếng Việt 
- Gọi công cụ và phản hồi JSON product-display từ công cụ để frontend hiển thị."""

# Import simple tools we added
from app.tools.search import search_products
from app.tools.explore import explore_product
from app.tools.compare import compare_products

logger = logging.getLogger(__name__)

root_agent = Agent(
    model=PRIMARY_MODEL,
    name="mmvn_simple_agent",
    instruction=MMVN_AGENT_INSTRUCTION,
    tools=[
        search_products,
        explore_product,
        compare_products,
    ],
    output_key="product_simple_agent",
)

# Required export for ADK web UI
agent = root_agent
