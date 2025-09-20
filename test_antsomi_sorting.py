#!/usr/bin/env python3
"""
Test script for Antsomi CDP 365 API sorting capabilities
"""

import asyncio
import json
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from tools.search import search_products_antsomi


async def test_sorting_parameters():
    """Test different sorting parameters."""
    print("=== Testing Antsomi API Sorting Parameters ===")
    
    # Test different sorting parameters
    sort_tests = [
        {"sort": "price_asc", "desc": "Price ascending"},
        {"sort": "price_desc", "desc": "Price descending"},
        {"sort": "name_asc", "desc": "Name ascending"},
        {"sort": "name_desc", "desc": "Name descending"},
        {"sort": "relevance", "desc": "Relevance"},
        {"sort": "newest", "desc": "Newest first"},
        {"sort": "popular", "desc": "Most popular"},
        {"sortby": "price", "order": "asc", "desc": "Sortby price asc"},
        {"sortby": "price", "order": "desc", "desc": "Sortby price desc"},
        {"order": "asc", "desc": "Order asc only"},
        {"order": "desc", "desc": "Order desc only"},
    ]
    
    for test in sort_tests:
        print(f"\n--- Testing: {test['desc']} ---")
        
        try:
            # Build parameters
            params = {
                "q": "thịt bò",
                "user_id": "564996752",
                "store_id": "10010",
                "product_type": "B2C",
                "limit": 5
            }
            
            # Add sorting parameters
            for key, value in test.items():
                if key not in ["desc"]:
                    params[key] = value
            
            # Make request
            from tools.search import _antsomi_request
            async with __import__('aiohttp').ClientSession() as session:
                result = await _antsomi_request(session, "smart_search", params)
            
            products = result.get("results", [])
            print(f"Found {len(products)} products")
            
            if products:
                # Show first 3 products with their prices
                for i, product in enumerate(products[:3]):
                    title = product.get("title", "N/A")
                    price = product.get("price", "N/A")
                    print(f"  {i+1}. {title} - {price} VND")
                
                # Check if sorting worked by analyzing price order
                if "price" in test.get("sort", "") or "price" in test.get("sortby", ""):
                    prices = []
                    for product in products:
                        try:
                            price_str = str(product.get("price", "0"))
                            price = float(price_str) if price_str.replace(".", "").isdigit() else 0
                            prices.append(price)
                        except:
                            pass
                    
                    if len(prices) > 1:
                        is_asc = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
                        is_desc = all(prices[i] >= prices[i+1] for i in range(len(prices)-1))
                        
                        if is_asc:
                            print(f"  ✅ Prices are in ascending order: {prices}")
                        elif is_desc:
                            print(f"  ✅ Prices are in descending order: {prices}")
                        else:
                            print(f"  ❌ Prices are not sorted: {prices}")
            
        except Exception as e:
            print(f"  ❌ Error: {e}")


async def test_default_sorting():
    """Test default sorting behavior."""
    print("\n=== Testing Default Sorting Behavior ===")
    
    try:
        # Get results without any sort parameters
        result = await search_products_antsomi("thịt bò", limit=10)
        products = result.get("results", [])
        
        print(f"Found {len(products)} products with default sorting")
        
        if products:
            # Analyze the order
            prices = []
            names = []
            
            for product in products:
                try:
                    price_str = str(product.get("price", "0"))
                    price = float(price_str) if price_str.replace(".", "").isdigit() else 0
                    prices.append(price)
                except:
                    prices.append(0)
                
                name = product.get("title", "")
                names.append(name)
            
            print("First 5 products:")
            for i, product in enumerate(products[:5]):
                title = product.get("title", "N/A")
                price = product.get("price", "N/A")
                print(f"  {i+1}. {title} - {price} VND")
            
            # Check if there's any pattern
            print(f"\nPrice range: {min(prices):,.0f} - {max(prices):,.0f} VND")
            
            # Check if prices are sorted
            is_asc = all(prices[i] <= prices[i+1] for i in range(len(prices)-1))
            is_desc = all(prices[i] >= prices[i+1] for i in range(len(prices)-1))
            
            if is_asc:
                print("  📊 Default sorting: Prices ascending")
            elif is_desc:
                print("  📊 Default sorting: Prices descending")
            else:
                print("  📊 Default sorting: Not by price")
                
    except Exception as e:
        print(f"Error: {e}")


async def test_sorting_with_filters():
    """Test sorting combined with filters."""
    print("\n=== Testing Sorting with Filters ===")
    
    try:
        # Test sorting with category filter
        filters = {"main_category_id": {"in": ["MjUyMzQ="]}}
        
        # Test different sort parameters with filters
        sort_tests = [
            {"sort": "price_asc"},
            {"sort": "price_desc"},
            {"sortby": "price", "order": "asc"},
        ]
        
        for sort_test in sort_tests:
            print(f"\nTesting: {sort_test}")
            
            # Build parameters
            params = {
                "q": "",
                "user_id": "564996752",
                "store_id": "10010",
                "product_type": "B2C",
                "limit": 5,
                "filters": json.dumps(filters)
            }
            params.update(sort_test)
            
            # Make request
            from tools.search import _antsomi_request
            async with __import__('aiohttp').ClientSession() as session:
                result = await _antsomi_request(session, "smart_search", params)
            
            products = result.get("results", [])
            print(f"  Found {len(products)} products")
            
            if products:
                prices = []
                for product in products:
                    try:
                        price_str = str(product.get("price", "0"))
                        price = float(price_str) if price_str.replace(".", "").isdigit() else 0
                        prices.append(price)
                    except:
                        pass
                
                if prices:
                    print(f"  Price range: {min(prices):,.0f} - {max(prices):,.0f} VND")
                    print(f"  Prices: {prices}")
                
    except Exception as e:
        print(f"Error: {e}")


async def test_response_metadata():
    """Test response metadata for sorting information."""
    print("\n=== Testing Response Metadata ===")
    
    try:
        result = await search_products_antsomi("thịt bò", limit=5)
        
        print("Response structure:")
        print(f"  Total: {result.get('total', 'N/A')}")
        print(f"  Type: {result.get('type', 'N/A')}")
        print(f"  Query original: {result.get('query_original', 'N/A')}")
        
        categories = result.get("categories", {})
        if categories:
            print("  Categories:")
            for cat_type, cat_list in categories.items():
                if isinstance(cat_list, list) and cat_list:
                    print(f"    {cat_type}: {len(cat_list)} items")
                    for cat in cat_list[:2]:  # Show first 2
                        if isinstance(cat, dict):
                            name = cat.get("name", "N/A")
                            count = cat.get("count", "N/A")
                            print(f"      - {name} ({count})")
        
        # Check if there's any sorting info in response
        print("\nLooking for sorting information in response...")
        response_str = json.dumps(result, indent=2)
        if "sort" in response_str.lower():
            print("  ✅ Found 'sort' in response")
        else:
            print("  ❌ No 'sort' information found in response")
            
    except Exception as e:
        print(f"Error: {e}")


async def main():
    """Run all sorting tests."""
    print("Testing Antsomi CDP 365 API Sorting Capabilities")
    print("=" * 60)
    
    await test_sorting_parameters()
    await test_default_sorting()
    await test_sorting_with_filters()
    await test_response_metadata()
    
    print("\n" + "=" * 60)
    print("Sorting tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
