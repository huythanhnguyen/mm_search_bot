"""
Antsomi CDP 365 API Smart Search Tool for MMVN
Uses the new Antsomi search engine for better product discovery.
"""

import logging
import json
from typing import Optional, Dict, Any, List
import unicodedata
from google.adk.tools import ToolContext
import aiohttp
import urllib.parse

logger = logging.getLogger(__name__)

# Antsomi CDP 365 API Configuration
ANTISOMI_BASE_URL = "https://search.ants.tech"
ANTISOMI_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwb3J0YWxJZCI6IjU2NDg5MjM3MyIsIm5hbWUiOiJNZWdhIE1hcmtldCJ9.iXymLjrJn-QVPO6gOV3MW8zJ4-u0Ih2L4qSOBZdIM24"
DEFAULT_USER_ID = "564996752"  # Default user ID for testing
DEFAULT_STORE_ID = "10010"
DEFAULT_PRODUCT_TYPE = "B2C"


def _to_minimal_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Antsomi API product response to minimal format expected by frontend."""
    # Extract price information
    current_price = 0
    original_price = None
    discount_percentage = None
    
    try:
        price_str = str(product.get("price", "0"))
        original_price_str = str(product.get("original_price", "0"))
        
        current_price = float(price_str) if price_str.replace(".", "").isdigit() else 0
        original_price = float(original_price_str) if original_price_str.replace(".", "").isdigit() else None
        
        # Calculate discount if original price is higher
        if original_price and original_price > current_price:
            discount_amount = original_price - current_price
            discount_percentage = f"{round((discount_amount / original_price) * 100)}%"
    except Exception:
        pass

    # Build product URL from page_url field
    product_url = product.get("page_url", "")
    
    # Extract image URL
    image_url = product.get("image_url", "")

    # Build minimal product object
    minimal: Dict[str, Any] = {
        "id": product.get("id", ""),
        "sku": product.get("sku", ""),
        "name": product.get("title", ""),
        "price": {
            "current": current_price,
            "original": original_price,
            "currency": "VND",
            "discount": discount_percentage,
        },
        "image": {"url": image_url},
        "description": "",  # Antsomi API doesn't provide description
        "productUrl": product_url,
        "category": product.get("category", ""),
        "status": product.get("status", ""),
    }
    
    return minimal


def _strip_accents(text: str) -> str:
    """Remove accents from Vietnamese text for better search matching."""
    try:
        return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
    except Exception:
        return text


async def _antsomi_request(session: aiohttp.ClientSession, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Make request to Antsomi API with proper authentication."""
    url = f"{ANTISOMI_BASE_URL}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {ANTISOMI_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with session.get(url, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as resp:
        resp.raise_for_status()
        return await resp.json()


async def suggest_keywords(query: str, user_id: str = DEFAULT_USER_ID) -> List[str]:
    """Get keyword suggestions from Antsomi API."""
    try:
        params = {
            "q": query,
            "user_id": user_id,
            "store_id": DEFAULT_STORE_ID,
            "product_type": DEFAULT_PRODUCT_TYPE
        }
        
        async with aiohttp.ClientSession() as session:
            data = await _antsomi_request(session, "suggest", params)
        
        suggestions = data.get("suggestions", [])
        return [s.get("keyword", "") for s in suggestions if s.get("keyword")]
    except Exception as e:
        logger.warning(f"Failed to get keyword suggestions: {e}")
        return []


async def search_products_antsomi(query: str, user_id: str = DEFAULT_USER_ID, 
                                 filters: Optional[Dict[str, Any]] = None,
                                 page: int = 1, limit: int = 20) -> Dict[str, Any]:
    """Search products using Antsomi Smart Search API."""
    try:
        params = {
            "q": query,
            "user_id": user_id,
            "store_id": DEFAULT_STORE_ID,
            "product_type": DEFAULT_PRODUCT_TYPE,
            "page": page,
            "limit": limit
        }
        
        # Add filters if provided
        if filters:
            params["filters"] = json.dumps(filters)
        
        async with aiohttp.ClientSession() as session:
            data = await _antsomi_request(session, "smart_search", params)
        
        return data
    except Exception as e:
        logger.error(f"Antsomi search failed: {e}")
        return {"results": [], "total": "0", "type": "", "categories": {}}


async def search_products(keywords: str, tool_context: ToolContext, filters: Optional[dict] = None) -> str:
    """Main search function using Antsomi CDP 365 API Smart Search."""
    try:
        logger.info("[Antsomi] Smart search: %s", keywords)
        
        # First, try to get keyword suggestions to improve search
        suggestions = await suggest_keywords(keywords)
        search_query = keywords
        
        # If we have suggestions, use the first one that's different from original
        if suggestions and suggestions[0] != keywords:
            search_query = suggestions[0]
            logger.info(f"Using suggested keyword: {search_query}")
        
        # Search products using Antsomi API
        search_result = await search_products_antsomi(search_query, filters=filters, limit=50)
        
        results = search_result.get("results", [])
        total = search_result.get("total", "0")
        search_type = search_result.get("type", "")
        categories = search_result.get("categories", {})
        
        # Convert to minimal product format
        minimal_products = [_to_minimal_product(p) for p in results]
        
        # Sort by category name (empty last), then by product name
        minimal_products.sort(key=lambda x: ((x.get("category") or "") == "", (x.get("category") or ""), x.get("name") or ""))
        
        # Build response message
        if search_type == "sku":
            message = f"Tìm thấy sản phẩm theo SKU '{keywords}'"
        else:
            message = f"Tìm thấy {len(results)} sản phẩm phù hợp với '{keywords}'"
            if total != "0" and int(total) > len(results):
                message += f" (tổng cộng {total} sản phẩm)"
        
        json_response = {
            "type": "product-display",
            "message": message,
            "products": minimal_products,
            "search_metadata": {
                "total": total,
                "search_type": search_type,
                "categories": categories,
                "suggestions": suggestions[:5] if suggestions else []
            }
        }
        
        # If no results, try fallback searches
        if not minimal_products:
            fallback_queries = []
            
            # 1) Remove accents
            no_acc = _strip_accents(keywords)
            if no_acc and no_acc != keywords:
                fallback_queries.append(no_acc)
            
            # 2) Keep only first two words
            words = keywords.split()
            if len(words) > 2:
                fallback_queries.append(' '.join(words[:2]))
            
            # 3) Single first word
            if words:
                fallback_queries.append(words[0])
            
            # Try fallback queries
            for fallback_query in fallback_queries:
                logger.info(f"Trying fallback search: {fallback_query}")
                fallback_result = await search_products_antsomi(fallback_query, limit=50)
                fallback_products = fallback_result.get("results", [])
                
                if fallback_products:
                    minimal_products = [_to_minimal_product(p) for p in fallback_products]
                    minimal_products.sort(key=lambda x: ((x.get("category") or "") == "", (x.get("category") or ""), x.get("name") or ""))
                    
                    json_response["message"] = f"Tìm thấy {len(fallback_products)} sản phẩm phù hợp với '{fallback_query}'"
                    json_response["products"] = minimal_products
                    break
        
        return json.dumps(json_response, ensure_ascii=False)
        
    except Exception as e:
        logger.exception("Antsomi search error")
        return f"Lỗi khi tìm kiếm sản phẩm: {str(e)}"


