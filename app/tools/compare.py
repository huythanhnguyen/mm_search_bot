"""
Simple Compare Tool for MMVN - aligned with DDV structure
Fetches product details then emits unified product-display JSON
"""

import logging
import json
from typing import List
from google.adk.tools import ToolContext

logger = logging.getLogger(__name__)


def _safe_float(value, default=0.0):
    try:
        if isinstance(value, dict):
            for key in ["current", "final_price", "capacity", "value", "amount", "original"]:
                if key in value and isinstance(value[key], (int, float)):
                    return float(value[key])
            return default
        return float(value)
    except Exception:
        return default


def _to_minimal_product(product: dict) -> dict:
    images = product.get("media_gallery", []) or product.get("images", [])
    first_image = ""
    if isinstance(images, list) and images:
        first = images[0]
        first_image = first.get("url") if isinstance(first, dict) else first
    price_info = product.get("price_info") or product.get("price", {})
    current_price = (
        price_info.get("final_price")
        if isinstance(price_info, dict) and "final_price" in price_info
        else price_info.get("current", 0) if isinstance(price_info, dict) else 0
    )
    original_price = (
        price_info.get("regular_price") if isinstance(price_info, dict) else None
    )
    discount_percentage = 0
    if isinstance(price_info, dict):
        discount_percentage = price_info.get("discount_percentage", 0)

    return {
        "id": product.get("id", ""),
        "sku": product.get("sku", ""),
        "name": product.get("name", ""),
        "brand": product.get("brand") or product.get("manufacturer", ""),
        "category": product.get("category") or "",
        "price": {
            "current": current_price or 0,
            "original": original_price,
            "currency": "VND",
            "discount": f"{discount_percentage}%" if discount_percentage else None,
        },
        "image": {"url": first_image},
        "description": (
            product.get("short_description")
            or (product.get("description", {}) if isinstance(product.get("description"), dict) else product.get("description", ""))
            or ""
        ) if isinstance(product.get("short_description"), str) else (
            (product.get("description", {}).get("html", "") if isinstance(product.get("description"), dict) else product.get("description", ""))
        ),
        "productUrl": product.get("product_url") or product.get("url") or "",
        "availability": product.get("stock_status") or product.get("availability", "unknown"),
        "rating": {
            "average": (product.get("rating_summary") or {}).get("average", 0),
            "count": (product.get("rating_summary") or {}).get("count", 0),
        },
        "specs": product.get("specs") or {},
        "colors": product.get("colors", []),
        "storage_options": product.get("storage_options", []),
        "promotions": product.get("promotions", {}),
    }


async def compare_products(product_ids: List[str], tool_context: ToolContext) -> str:
    try:
        if len(product_ids) < 2:
            return "Cần ít nhất 2 sản phẩm để so sánh"
        if len(product_ids) > 5:
            return "Chỉ có thể so sánh tối đa 5 sản phẩm cùng lúc"

        from app.tools.cng.product_tools import get_product_detail as cng_get

        products_full = []
        for pid in product_ids:
            result = await cng_get(product_id=pid, tool_context=tool_context)
            if result.get("status") == "success" and result.get("product"):
                products_full.append(result["product"]) 

        if len(products_full) < 2:
            return "Không tìm đủ sản phẩm để so sánh"

        minimal_products = [_to_minimal_product(p) for p in products_full]

        # Compute quick summary
        cheapest = min(products_full, key=lambda p: _safe_float((p.get("price_info") or p.get("price", {}))))
        highest_rated = max(products_full, key=lambda p: _safe_float((p.get("rating_summary") or {}).get("average", 0)))
        battery_best = max(products_full, key=lambda p: _safe_float((p.get("specs", {}).get("battery") or {})))

        summary = (
            f"**So sánh {len(products_full)} sản phẩm:**\n"
            f"- Giá rẻ nhất: {cheapest.get('name', 'N/A')} ({_safe_float((cheapest.get('price_info') or cheapest.get('price', {}))):,.0f} VND)\n"
            f"- Đánh giá cao nhất: {highest_rated.get('name', 'N/A')} ({_safe_float((highest_rated.get('rating_summary') or {}).get('average', 0))}/5)\n"
            f"- Pin tốt nhất: {battery_best.get('name', 'N/A')} ({_safe_float((battery_best.get('specs', {}).get('battery') or {}))}mAh)\n"
        )

        json_response = {
            "type": "product-display",
            "message": summary,
            "products": minimal_products,
        }

        return json.dumps(json_response, ensure_ascii=False)
    except Exception as e:
        logger.exception("Compare error")
        return f"Lỗi khi so sánh sản phẩm: {str(e)}"


