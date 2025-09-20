"""
Enhanced Search Tool with Client-side Price Filtering
Since Antsomi API price filtering doesn't work, implement client-side filtering
"""

import logging
import json
from typing import Optional, Dict, Any, List
from .search import search_products_antsomi, _to_minimal_product

logger = logging.getLogger(__name__)


async def search_products_with_price_filter(
    keywords: str, 
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    main_category_ids: Optional[List[str]] = None,
    limit: int = 50
) -> str:
    """
    Search products with client-side price filtering.
    
    Args:
        keywords: Search keywords
        price_min: Minimum price filter (VND)
        price_max: Maximum price filter (VND)
        main_category_ids: List of main category IDs to filter by
        limit: Maximum number of results to return
    """
    try:
        logger.info(f"[Enhanced Search] Keywords: {keywords}, Price: {price_min}-{price_max}")
        
        # Build server-side filters (only what works)
        server_filters = {}
        if main_category_ids:
            server_filters["main_category_id"] = {"in": main_category_ids}
        
        # Get more results from server to allow for client-side filtering
        server_limit = limit * 3 if price_min or price_max else limit
        
        # Search using Antsomi API
        search_result = await search_products_antsomi(
            keywords, 
            filters=server_filters, 
            limit=server_limit
        )
        
        results = search_result.get("results", [])
        total = search_result.get("total", "0")
        search_type = search_result.get("type", "")
        categories = search_result.get("categories", {})
        
        # Apply client-side price filtering
        filtered_results = []
        for product in results:
            try:
                price_str = str(product.get("price", "0"))
                price = float(price_str) if price_str.replace(".", "").isdigit() else 0
                
                # Apply price filters
                if price_min is not None and price < price_min:
                    continue
                if price_max is not None and price > price_max:
                    continue
                
                filtered_results.append(product)
                
                # Stop if we have enough results
                if len(filtered_results) >= limit:
                    break
                    
            except Exception as e:
                logger.warning(f"Error processing product price: {e}")
                continue
        
        # Convert to minimal product format
        minimal_products = [_to_minimal_product(p) for p in filtered_results]
        
        # Sort by category name (empty last), then by product name
        minimal_products.sort(key=lambda x: ((x.get("category") or "") == "", (x.get("category") or ""), x.get("name") or ""))
        
        # Build response message
        price_info = ""
        if price_min is not None or price_max is not None:
            price_range = []
            if price_min is not None:
                price_range.append(f"từ {price_min:,.0f} VND")
            if price_max is not None:
                price_range.append(f"đến {price_max:,.0f} VND")
            price_info = f" (giá {' '.join(price_range)})"
        
        if search_type == "sku":
            message = f"Tìm thấy sản phẩm theo SKU '{keywords}'{price_info}"
        else:
            message = f"Tìm thấy {len(filtered_results)} sản phẩm phù hợp với '{keywords}'{price_info}"
            if total != "0" and int(total) > len(filtered_results):
                message += f" (tổng cộng {total} sản phẩm)"
        
        json_response = {
            "type": "product-display",
            "message": message,
            "products": minimal_products,
            "search_metadata": {
                "total": total,
                "search_type": search_type,
                "categories": categories,
                "filters_applied": {
                    "price_min": price_min,
                    "price_max": price_max,
                    "main_category_ids": main_category_ids
                }
            }
        }
        
        return json.dumps(json_response, ensure_ascii=False)
        
    except Exception as e:
        logger.exception("Enhanced search error")
        return f"Lỗi khi tìm kiếm sản phẩm: {str(e)}"


def get_available_categories() -> List[Dict[str, Any]]:
    """
    Get list of available main categories with their IDs.
    This would typically come from a configuration or API call.
    """
    # These are example categories - in practice, you'd get these from an API
    return [
        {"id": "MjUyMzQ=", "name": "Đồ hộp - Đồ khô", "count": 47},
        {"id": "MjUwMzE=", "name": "Dầu ăn - Gia vị - Nước chấm", "count": 37},
        {"id": "MjUwMzI=", "name": "Thịt - Cá - Hải sản", "count": 25},
        {"id": "MjUwMzM=", "name": "Rau củ quả", "count": 30},
        {"id": "MjUwMzQ=", "name": "Sữa - Bơ - Trứng", "count": 20},
    ]


async def search_by_price_range(
    keywords: str,
    price_ranges: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Search products and group by price ranges.
    
    Args:
        keywords: Search keywords
        price_ranges: List of price range definitions
            [{"name": "Dưới 50k", "max": 50000}, {"name": "50k-100k", "min": 50000, "max": 100000}]
    
    Returns:
        Dictionary with results grouped by price ranges
    """
    try:
        # Get all results first
        search_result = await search_products_antsomi(keywords, limit=200)
        all_products = search_result.get("results", [])
        
        # Group by price ranges
        grouped_results = {}
        for range_def in price_ranges:
            range_name = range_def["name"]
            price_min = range_def.get("min")
            price_max = range_def.get("max")
            
            filtered_products = []
            for product in all_products:
                try:
                    price_str = str(product.get("price", "0"))
                    price = float(price_str) if price_str.replace(".", "").isdigit() else 0
                    
                    # Check if price fits in range
                    if price_min is not None and price < price_min:
                        continue
                    if price_max is not None and price > price_max:
                        continue
                    
                    filtered_products.append(product)
                except Exception:
                    continue
            
            # Convert to minimal format
            minimal_products = [_to_minimal_product(p) for p in filtered_products[:20]]
            grouped_results[range_name] = {
                "count": len(filtered_products),
                "products": minimal_products
            }
        
        return {
            "type": "price-grouped-display",
            "message": f"Kết quả tìm kiếm '{keywords}' theo khoảng giá",
            "grouped_results": grouped_results,
            "total_products": len(all_products)
        }
        
    except Exception as e:
        logger.exception("Price range search error")
        return {"error": f"Lỗi khi tìm kiếm theo khoảng giá: {str(e)}"}
