"""
Simple Search Tool for MMVN - direct GraphQL call to online.mmvietnam.com
Only uses parameters documented in CnG API Doc.
"""

import logging
import json
from typing import Optional, Dict, Any, List
import unicodedata
from google.adk.tools import ToolContext
import aiohttp
import urllib.parse

logger = logging.getLogger(__name__)

GRAPHQL_ENDPOINT = "https://online.mmvietnam.com/graphql"
DEFAULT_STORE = "b2c_10010_vi"


def _build_product_url(product: Dict[str, Any]) -> str:
    if product.get("url_key") and product.get("url_suffix"):
        return f"https://online.mmvietnam.com/product/{product['url_key']}{product['url_suffix']}"
    if product.get("url_key"):
        return f"https://online.mmvietnam.com/product/{product['url_key']}.html"
    if product.get("url_path"):
        return f"https://online.mmvietnam.com{product['url_path']}"
    return ""


def _to_minimal_product(product: Dict[str, Any]) -> Dict[str, Any]:
    # Prefer GraphQL fields
    small_image = product.get("small_image", {})
    image_url = small_image.get("url") if isinstance(small_image, dict) else ""

    # Prices from GraphQL
    current_price = 0
    original_price = None
    discount_percentage = None
    try:
        max_price = product.get("price_range", {}).get("maximum_price", {})
        final_price = max_price.get("final_price", {})
        current_price = final_price.get("value", 0)
        regular_amount = product.get("price", {}).get("regularPrice", {}).get("amount", {})
        original_price = regular_amount.get("value")
        percent_off = max_price.get("discount", {}).get("percent_off")
        if isinstance(percent_off, (int, float)) and percent_off > 0:
            discount_percentage = f"{round(percent_off)}%"
    except Exception:
        pass

    # Description normalization
    description = ""
    if isinstance(product.get("description"), dict):
        description = product.get("description", {}).get("html", "")
    elif isinstance(product.get("description"), str):
        description = product.get("description", "")

    # Category name from categories.items[0].name if present
    category_name = ""
    categories_list = product.get("categories")
    categories_all: List[Dict[str, Any]] = []
    if isinstance(categories_list, list):
        categories_all = [
            {"name": c.get("name"), "uid": c.get("uid"), "url_path": c.get("url_path")}
            for c in categories_list if isinstance(c, dict)
        ]
        if categories_all:
            category_name = categories_all[0].get("name") or ""

    # Only include attributes that the frontend uses and GraphQL actually provides
    minimal: Dict[str, Any] = {
        "id": product.get("id", ""),
        "sku": product.get("sku", ""),
        "name": product.get("name", ""),
        "price": {
            "current": current_price or 0,
            "original": original_price,
            "currency": "VND",
            "discount": discount_percentage,
        },
        "image": {"url": image_url},
        "description": description,
        "productUrl": _build_product_url(product),
    }
    # Optional unit for display if present
    if product.get("unit_ecom"):
        minimal["unit"] = product.get("unit_ecom")
    if category_name:
        minimal["category"] = category_name
    if categories_all:
        minimal["categories_all"] = categories_all
    return minimal


def _strip_accents(text: str) -> str:
    try:
        return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    except Exception:
        return text


async def _graphql_get(session: aiohttp.ClientSession, query: str) -> Dict[str, Any]:
    params = {"query": query}
    url = GRAPHQL_ENDPOINT + "?" + urllib.parse.urlencode(params)
    headers = {"Store": DEFAULT_STORE}
    async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as resp:
        resp.raise_for_status()
        return await resp.json()


async def search_products(keywords: str, tool_context: ToolContext, filters: Optional[dict] = None) -> str:
    """Search products using GraphQL 'products(search: ...)'. No extra unsupported params."""
    try:
        logger.info("[MMVN] GraphQL search: %s", keywords)

        # Build GraphQL per docs
        safe_query = keywords.replace('"', '\\"')
        gql = (
            "query ProductSearch { products(search: \"%s\", sort: { relevance: DESC }) { items { "
            "id sku name url_key url_suffix url_path "
            "price { regularPrice { amount { currency value } } } "
            "price_range { maximum_price { final_price { currency value } discount { percent_off } } } "
            "small_image { url } unit_ecom description { html } "
            "categories { items { name uid url_path } } "
            "} total_count } }"
        ) % safe_query

        async with aiohttp.ClientSession() as session:
            data = await _graphql_get(session, gql)

        items: List[Dict[str, Any]] = data.get("data", {}).get("products", {}).get("items", [])

        # Normalize fields expected by UI
        normalized = []
        for item in items:
            # categories is an array at this endpoint
            normalized.append({
                **item,
                "categories": item.get("categories") if isinstance(item.get("categories"), list) else []
            })

        minimal_products = [_to_minimal_product(p) for p in normalized[:50]]
        # Sort by category name only (empty last), then by product name
        minimal_products.sort(key=lambda x: ((x.get("category") or "") == "", (x.get("category") or ""), x.get("name") or ""))

        json_response = {
            "type": "product-display",
            "message": f"Tìm thấy {len(normalized)} sản phẩm phù hợp với '{keywords}'",
            "products": minimal_products,
        }

        # If no results, fallback with simplified queries
        if not minimal_products:
            variations: List[str] = []
            # 1) Remove accents
            no_acc = _strip_accents(keywords)
            if no_acc and no_acc != keywords:
                variations.append(no_acc)
            # 2) Keep only first two tokens
            toks = [t for t in keywords.split() if t]
            if len(toks) > 2:
                variations.append(' '.join(toks[:2]))
            # 3) Single first token
            if toks:
                variations.append(toks[0])

            for vq in variations:
                safe_vq = vq.replace('"', '\\"')
                gql_v = (
                    "query ProductSearch { products(search: \"%s\", sort: { relevance: DESC }) { items { "
                    "id sku name url_key url_suffix url_path "
                    "price { regularPrice { amount { currency value } } } "
                    "price_range { maximum_price { final_price { currency value } discount { percent_off } } } "
                    "small_image { url } unit_ecom description { html } "
                    "categories { name uid url_path } "
                    "} total_count } }"
                ) % safe_vq
                data = await _graphql_get(aiohttp.ClientSession(), gql_v)
                items = data.get("data", {}).get("products", {}).get("items", [])
                normalized = [{**it, "categories": it.get("categories") if isinstance(it.get("categories"), list) else []} for it in items]
                minimal_products = [_to_minimal_product(p) for p in normalized[:50]]
                minimal_products.sort(key=lambda x: ((x.get("category") or "") == "", (x.get("category") or ""), x.get("name") or ""))
                if minimal_products:
                    json_response["message"] = f"Tìm thấy {len(normalized)} sản phẩm phù hợp với '{vq}'"
                    json_response["products"] = minimal_products
                    break

        return json.dumps(json_response, ensure_ascii=False)
    except Exception as e:
        logger.exception("Search error")
        return f"Lỗi khi tìm kiếm sản phẩm: {str(e)}"


