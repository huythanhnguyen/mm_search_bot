"""
Product-related tools for CNG Agent.

These tools provide functionality for searching products and retrieving product details.
"""

from typing import Dict, List, Optional, Any, Union
import json
import asyncio
from google.adk.tools.tool_context import ToolContext

# Sử dụng client factory thay vì tạo instance trực tiếp
from app.tools.cng.api_client.client_factory import APIClientFactory
from app.tools.cng.api_client.response import APIResponse, safe_api_call

# Tạo API client từ factory
api_client = APIClientFactory().get_product_api()


def construct_product_url(product: dict) -> str:
    """
    Tạo URL cho sản phẩm dựa trên các trường có sẵn.
    
    Args:
        product: Dictionary chứa thông tin sản phẩm
        
    Returns:
        str: URL của sản phẩm hoặc None nếu không thể tạo
    """
    # Luôn ưu tiên tạo URL với domain online.mmvietnam.com để đảm bảo nhất quán
    # thay vì dùng canonical_url có thể thay đổi theo environment
    if product.get("url_key") and product.get("url_suffix"):
        # Construct URL using url_key and url_suffix with /product/ prefix
        return f"https://online.mmvietnam.com/product/{product['url_key']}{product['url_suffix']}"
    elif product.get("url_key"):
        # Construct URL using only url_key with default suffix and /product/ prefix
        return f"https://online.mmvietnam.com/product/{product['url_key']}.html"
    elif product.get("url_path"):
        # Use url_path if available
        return f"https://online.mmvietnam.com{product['url_path']}"
    elif product.get("canonical_url"):
        # Fallback to canonical_url chỉ khi không có các trường khác
        # nhưng thay thế domain để đảm bảo nhất quán
        canonical = product["canonical_url"]
        if "mmpro.vn" in canonical or "mmvietnam.com" in canonical:
            # Replace domain with online.mmvietnam.com
            import re
            canonical = re.sub(r'https?://[^/]+', 'https://online.mmvietnam.com', canonical)
        return canonical
    return None

async def search_products(
    query: str,
    category: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    sort_by: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Search for products using various filters and sorting options.
    
    Args:
        query: Search query text
        category: Optional category to filter by
        price_min: Optional minimum price filter
        price_max: Optional maximum price filter
        sort_by: Optional sorting parameter (e.g., "price_asc", "price_desc", "newest", "popular")
        page: Page number for pagination (starts at 1)
        limit: Number of results per page
        tool_context: Optional context for accessing and updating session state
        
    Returns:
        dict: Dictionary containing search results with 'status' and either 'products' or 'error_message'
    """
    # Save search parameters to session state if context provided
    if tool_context:
        tool_context.state["last_product_search"] = {
            "query": query,
            "category": category,
            "price_min": price_min,
            "price_max": price_max,
            "sort_by": sort_by,
            "page": page,
            "limit": limit
        }
    
    try:
        # Use a simpler query first - based directly on the MM API documentation
        # This increases chances of success if some fields have issues
        simple_query_result = await safe_api_call(
            api_client.search_products, 
            query, 
            limit, 
            page
        )
        
        if simple_query_result.success:
            products_data = simple_query_result.data.get("products", {})
            products = products_data.get("items", [])
            
            # Tăng khả năng nhìn thấy SKU trong kết quả và thêm URL sản phẩm
            processed_products = []
            for product in products:
                processed_product = product.copy()
                # Đảm bảo SKU được hiển thị như một trường riêng biệt trong kết quả
                if "sku" in product:
                    processed_product["product_code"] = product["sku"]  # Thêm trường rõ ràng hơn
                
                # Construct product URL using helper function
                product_url = construct_product_url(product)
                if product_url:
                    processed_product["product_url"] = product_url
                
                processed_products.append(processed_product)
            
            return {
                "status": "success",
                "total_results": products_data.get("total_count", 0),
                "page": page,
                "limit": limit,
                "products": processed_products,
                "note": "Sử dụng product_code (SKU) để lấy thông tin chi tiết sản phẩm với get_product_detail. Mỗi sản phẩm có product_url để truy cập trực tiếp."
            }
        
        # Nếu truy vấn đơn giản thất bại, thử với bộ lọc nâng cao
        # Prepare filters based on parameters
        filters = {}
        if category:
            filters["category_id"] = {"eq": category}
        
        price_filter = {}
        if price_min is not None:
            price_filter["from"] = price_min
        if price_max is not None:
            price_filter["to"] = price_max
        
        if price_filter:
            filters["price"] = price_filter
        
        # Prepare sort parameter
        sort = None
        if sort_by:
            if sort_by == "price_asc":
                sort = {"price": "ASC"}
            elif sort_by == "price_desc":
                sort = {"price": "DESC"}
            elif sort_by == "newest":
                sort = {"created_at": "DESC"}
            elif sort_by == "popular":
                sort = {"relevance": "DESC"}
        
        # Call the API client using safe_api_call
        result = await safe_api_call(
            api_client.suggest_products,
            base_query=query,
            filters=filters,
            sort=sort,
            page_size=limit,
            current_page=page
        )
        
        if result.success:
            products_data = result.data.get("products", {})
            products = products_data.get("items", [])
            
            # Tăng khả năng nhìn thấy SKU trong kết quả và thêm URL sản phẩm
            processed_products = []
            for product in products:
                processed_product = product.copy()
                if "sku" in product:
                    processed_product["product_code"] = product["sku"]
                
                # Construct product URL using helper function
                product_url = construct_product_url(product)
                if product_url:
                    processed_product["product_url"] = product_url
                
                processed_products.append(processed_product)
            
            return {
                "status": "success",
                "total_results": products_data.get("total_count", 0),
                "page": page,
                "limit": limit,
                "products": processed_products,
                "note": "Sử dụng product_code (SKU) để lấy thông tin chi tiết sản phẩm với get_product_detail. Mỗi sản phẩm có product_url để truy cập trực tiếp."
            }
        else:
            # If advanced query fails too, try one last approach - search by art_no
            # This is useful if the query is an article number
            art_no_result = await safe_api_call(api_client.get_product_by_art_no, query)
            
            if art_no_result.success:
                products_data = art_no_result.data.get("products", {})
                products = products_data.get("items", [])
                
                # Tăng khả năng nhìn thấy SKU trong kết quả và thêm URL sản phẩm
                processed_products = []
                for product in products:
                    processed_product = product.copy()
                    if "sku" in product:
                        processed_product["product_code"] = product["sku"]
                    
                    # Construct product URL using helper function
                    product_url = construct_product_url(product)
                    if product_url:
                        processed_product["product_url"] = product_url
                    
                    processed_products.append(processed_product)
                
                if products:
                    return {
                        "status": "success",
                        "total_results": products_data.get("total_count", 0),
                        "page": 1,
                        "limit": len(processed_products),
                        "products": processed_products,
                        "note": "Sử dụng product_code (SKU) để lấy thông tin chi tiết sản phẩm với get_product_detail. Mỗi sản phẩm có product_url để truy cập trực tiếp."
                    }
                
            # If all approaches fail, return error using the standardized format
            return APIResponse.error_response(
                message=result.message or "Failed to search products", 
                error=result.error
            ).to_tool_response()
            
    except Exception as e:
        # Use the standardized error response
        return APIResponse.from_exception(
            exception=e,
            message=f"Failed to search products: {str(e)}"
        ).to_tool_response()


async def get_product_detail(
    product_id: str,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Get detailed information about a specific product.
    
    Args:
        product_id: The ID or SKU of the product to retrieve details for
        tool_context: Optional context for accessing and updating session state
        
    Returns:
        dict: Dictionary containing product details with 'status' and either 'product' or 'error_message'
    """
    # Save product ID to session state if context provided
    if tool_context:
        tool_context.state["last_viewed_product_id"] = product_id
    
    try:
        # Ưu tiên tìm kiếm bằng SKU
        if "_" in product_id:  # Nếu product_id có định dạng SKU (ví dụ: "415883_24158831")
            sku = product_id
            result = await safe_api_call(api_client.get_product_by_sku, sku)
        elif product_id.startswith("p"):  # Giả định ID bắt đầu bằng 'p' là SKU
            result = await safe_api_call(api_client.get_product_by_sku, product_id)
        else:
            # Thử tìm sản phẩm bằng ID
            # Trước tiên, tìm kiếm để lấy SKU
            search_result = await safe_api_call(
                api_client.search_products, 
                "", 
                1, 
                1,
                {"id": {"eq": product_id}}
            )
            
            if search_result.success:
                products = search_result.data.get("products", {})
                items = products.get("items", [])
                
                if items and len(items) > 0:
                    # Lấy SKU từ kết quả tìm kiếm
                    sku = items[0].get("sku")
                    if sku:
                        # Sử dụng SKU để lấy chi tiết sản phẩm
                        result = await safe_api_call(api_client.get_product_by_sku, sku)
                    else:
                        # Nếu không có SKU, thử dùng article number
                        result = await safe_api_call(api_client.get_product_by_art_no, product_id)
                else:
                    # Nếu không tìm thấy, thử dùng article number
                    result = await safe_api_call(api_client.get_product_by_art_no, product_id)
            else:
                # Nếu không tìm thấy, thử dùng article number
                result = await safe_api_call(api_client.get_product_by_art_no, product_id)
        
        if result.success:
            products = result.data.get("products", {})
            items = products.get("items", [])
            
            if items and len(items) > 0:
                product = items[0]
                
                # Construct product URL using helper function
                product_url = construct_product_url(product)
                if product_url:
                    product["product_url"] = product_url
                
                return {
                    "status": "success",
                    "product": product
                }
            else:
                return APIResponse.error_response(
                    message=f"Product with ID {product_id} not found"
                ).to_tool_response()
        else:
            return APIResponse.error_response(
                message=result.message or f"Failed to get product details for {product_id}",
                error=result.error
            ).to_tool_response()
            
    except Exception as e:
        return APIResponse.from_exception(
            exception=e,
            message=f"Failed to get product details: {str(e)}"
        ).to_tool_response()


async def search_multiple_products(
    queries: List[str],
    category: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    sort_by: Optional[str] = None,
    combine_mode: str = "union",
    page: int = 1,
    limit: int = 10,
    tool_context: Optional[ToolContext] = None
) -> Dict[str, Any]:
    """
    Search for products using multiple queries with various filters and sorting options.
    
    Args:
        queries: List of search query texts
        category: Optional category to filter by
        price_min: Optional minimum price filter
        price_max: Optional maximum price filter
        sort_by: Optional sorting parameter (e.g., "price_asc", "price_desc", "newest", "popular")
        combine_mode: How to combine results ("union" or "intersection")
        page: Page number for pagination (starts at 1)
        limit: Number of results per page
        tool_context: Optional context for accessing and updating session state
        
    Returns:
        dict: Dictionary containing search results with 'status' and either 'products' or 'error_message'
    """
    # Save search parameters to session state if context provided
    if tool_context:
        tool_context.state["last_multiple_product_search"] = {
            "queries": queries,
            "category": category,
            "price_min": price_min,
            "price_max": price_max,
            "sort_by": sort_by,
            "combine_mode": combine_mode,
            "page": page,
            "limit": limit
        }
    
    try:
        # Prepare filters based on parameters
        filters = {}
        if category:
            filters["category_id"] = {"eq": category}
        
        price_filter = {}
        if price_min is not None:
            price_filter["from"] = price_min
        if price_max is not None:
            price_filter["to"] = price_max
        
        if price_filter:
            filters["price"] = price_filter
        
        # Prepare sort parameter
        sort = None
        if sort_by:
            if sort_by == "price_asc":
                sort = {"price": "ASC"}
            elif sort_by == "price_desc":
                sort = {"price": "DESC"}
            elif sort_by == "newest":
                sort = {"created_at": "DESC"}
            elif sort_by == "popular":
                sort = {"relevance": "DESC"}
        
        # Implement custom search across multiple keywords
        # since we're avoiding the dependency on the EcommerceAPIClient
        results = []
        total_count = 0
        seen_ids = set()
        
        # Search for each query in parallel, using safe_api_call
        search_tasks = []
        for keyword in queries:
            task = asyncio.create_task(
                safe_api_call(
                    api_client.suggest_products,
                    base_query=keyword,
                    filters=filters,
                    sort=sort,
                    page_size=limit,
                    current_page=page
                )
            )
            search_tasks.append(task)
        
        # Wait for all searches to complete
        search_results = await asyncio.gather(*search_tasks)
        
        # Process results based on combine_mode
        if combine_mode == "intersection":
            # Only keep products that appear in ALL queries
            product_sets = []
            for result in search_results:
                if result.success:
                    products = result.data.get("products", {})
                    items = products.get("items", [])
                    product_ids = {item.get("id") for item in items if item.get("id")}
                    product_sets.append(product_ids)
            
            if product_sets:
                common_ids = set.intersection(*product_sets)
                # Get product information from common IDs
                for result in search_results:
                    if result.success:
                        products = result.data.get("products", {})
                        items = products.get("items", [])
                        for item in items:
                            item_id = item.get("id")
                            if item_id in common_ids and item_id not in seen_ids:
                                results.append(item)
                                seen_ids.add(item_id)
                                total_count += 1
        else:  # union mode
            # Merge all products, removing duplicates
            for result in search_results:
                if result.success:
                    products = result.data.get("products", {})
                    items = products.get("items", [])
                    for item in items:
                        item_id = item.get("id")
                        if item_id and item_id not in seen_ids:
                            results.append(item)
                            seen_ids.add(item_id)
                            total_count += 1
        
        # Thêm xử lý URL cho kết quả
        processed_results = []
        for product in results:
            processed_product = product.copy()
            if "sku" in product:
                processed_product["product_code"] = product["sku"]
            
            # Construct product URL using helper function
            product_url = construct_product_url(product)
            if product_url:
                processed_product["product_url"] = product_url
            
            processed_results.append(processed_product)
        
        # Apply final pagination
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, len(processed_results))
        paged_results = processed_results[start_idx:end_idx]
        
        return {
            "status": "success",
            "total_results": total_count,
            "page": page,
            "limit": limit,
            "products": paged_results,
            "note": "Sử dụng product_code (SKU) để lấy thông tin chi tiết sản phẩm với get_product_detail. Mỗi sản phẩm có product_url để truy cập trực tiếp."
        }
            
    except Exception as e:
        return APIResponse.from_exception(
            exception=e,
            message=f"Failed to search multiple products: {str(e)}"
        ).to_tool_response()


# Define tool classes that wrap the functions - this maintains compatibility with the existing code
class SearchProductsTool:
    """Tool for searching products by various criteria."""
    
    # Add required properties for Google ADK compatibility
    __name__ = "search_products"
    name = "search_products"
    description = "Search for products using various filters and sorting options. Returns products with SKU and product URLs that can be used with get_product_detail."
    
    def __call__(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(search_products(*args, **kwargs))


class GetProductDetailTool:
    """Tool for retrieving detailed information about a specific product."""
    
    # Add required properties for Google ADK compatibility
    __name__ = "get_product_detail"
    name = "get_product_detail"
    description = "Get detailed information about a specific product including product URL. Use the SKU from search_products results (e.g., '415883_24158831') for best results."
    
    def __call__(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(get_product_detail(*args, **kwargs))


class SearchMultipleProductsTool:
    """Tool for searching multiple product queries at once."""
    
    # Add required properties for Google ADK compatibility
    __name__ = "search_multiple_products"
    name = "search_multiple_products"
    description = "Search for products using multiple queries with various filters and sorting options. Returns products with SKU and product URLs."
    
    def __call__(self, *args, **kwargs):
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(search_multiple_products(*args, **kwargs)) 