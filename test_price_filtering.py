#!/usr/bin/env python3
"""
Test script for client-side price filtering
"""

import asyncio
import json
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from tools.search_with_price_filter import search_products_with_price_filter, search_by_price_range


async def test_price_filtering():
    """Test client-side price filtering."""
    print("=== Testing Client-side Price Filtering ===")
    
    # Test different price ranges
    test_cases = [
        {"keywords": "thịt bò", "price_min": 100000, "price_max": 200000, "desc": "100k-200k VND"},
        {"keywords": "sữa", "price_min": 50000, "price_max": 150000, "desc": "50k-150k VND"},
        {"keywords": "gạo", "price_min": 200000, "desc": "Above 200k VND"},
        {"keywords": "bánh", "price_max": 100000, "desc": "Below 100k VND"},
    ]
    
    for test in test_cases:
        print(f"\n--- Testing: {test['desc']} ---")
        print(f"Keywords: '{test['keywords']}'")
        
        try:
            result = await search_products_with_price_filter(
                keywords=test["keywords"],
                price_min=test.get("price_min"),
                price_max=test.get("price_max"),
                limit=10
            )
            
            data = json.loads(result)
            products = data.get("products", [])
            
            print(f"Found {len(products)} products")
            print(f"Message: {data.get('message', 'N/A')}")
            
            # Show first few products with prices
            for i, product in enumerate(products[:3]):
                name = product.get("name", "N/A")
                price = product.get("price", {}).get("current", "N/A")
                print(f"  {i+1}. {name} - {price:,.0f} VND" if isinstance(price, (int, float)) else f"  {i+1}. {name} - {price}")
                
        except Exception as e:
            print(f"Error: {e}")


async def test_price_range_grouping():
    """Test price range grouping."""
    print("\n=== Testing Price Range Grouping ===")
    
    price_ranges = [
        {"name": "Dưới 50k VND", "max": 50000},
        {"name": "50k - 100k VND", "min": 50000, "max": 100000},
        {"name": "100k - 200k VND", "min": 100000, "max": 200000},
        {"name": "200k - 500k VND", "min": 200000, "max": 500000},
        {"name": "Trên 500k VND", "min": 500000},
    ]
    
    try:
        result = await search_by_price_range("thịt bò", price_ranges)
        
        print(f"Total products found: {result.get('total_products', 0)}")
        print(f"Message: {result.get('message', 'N/A')}")
        
        grouped_results = result.get("grouped_results", {})
        for range_name, range_data in grouped_results.items():
            count = range_data.get("count", 0)
            products = range_data.get("products", [])
            print(f"\n{range_name}: {count} sản phẩm")
            
            # Show first product in each range
            if products:
                first_product = products[0]
                name = first_product.get("name", "N/A")
                price = first_product.get("price", {}).get("current", "N/A")
                print(f"  Ví dụ: {name} - {price:,.0f} VND" if isinstance(price, (int, float)) else f"  Ví dụ: {name} - {price}")
                
    except Exception as e:
        print(f"Error: {e}")


async def test_category_with_price_filtering():
    """Test category filtering with price filtering."""
    print("\n=== Testing Category + Price Filtering ===")
    
    # Test with main category ID filter + price filter
    main_category_ids = ["MjUyMzQ="]  # Đồ hộp - Đồ khô
    
    try:
        result = await search_products_with_price_filter(
            keywords="",
            price_min=50000,
            price_max=200000,
            main_category_ids=main_category_ids,
            limit=10
        )
        
        data = json.loads(result)
        products = data.get("products", [])
        
        print(f"Found {len(products)} products in category with price 50k-200k VND")
        print(f"Message: {data.get('message', 'N/A')}")
        
        # Show products with categories and prices
        for i, product in enumerate(products[:5]):
            name = product.get("name", "N/A")
            category = product.get("category", "N/A")
            price = product.get("price", {}).get("current", "N/A")
            print(f"  {i+1}. {name} - {category} - {price:,.0f} VND" if isinstance(price, (int, float)) else f"  {i+1}. {name} - {category} - {price}")
            
    except Exception as e:
        print(f"Error: {e}")


async def main():
    """Run all price filtering tests."""
    print("Testing Client-side Price Filtering for Antsomi API")
    print("=" * 60)
    
    await test_price_filtering()
    await test_price_range_grouping()
    await test_category_with_price_filtering()
    
    print("\n" + "=" * 60)
    print("Price filtering tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
