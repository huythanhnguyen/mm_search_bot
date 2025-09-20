#!/usr/bin/env python3
"""
Test script for Antsomi CDP 365 API filtering capabilities
Focus on price filtering and other attributes
"""

import asyncio
import json
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from tools.search import search_products_antsomi


async def test_price_filters():
    """Test price filtering capabilities."""
    print("=== Testing Price Filters ===")
    
    # Test different price ranges
    price_tests = [
        {"min": 50000, "max": 100000, "desc": "50k-100k VND"},
        {"min": 100000, "max": 200000, "desc": "100k-200k VND"},
        {"min": 200000, "max": 500000, "desc": "200k-500k VND"},
        {"min": 500000, "desc": "Above 500k VND"},
        {"max": 100000, "desc": "Below 100k VND"},
    ]
    
    for test in price_tests:
        print(f"\nTesting price range: {test['desc']}")
        
        # Build price filter
        price_filter = {}
        if "min" in test:
            price_filter["gte"] = test["min"]
        if "max" in test:
            price_filter["lte"] = test["max"]
        
        filters = {"price": price_filter} if price_filter else {}
        
        try:
            result = await search_products_antsomi("thịt bò", filters=filters, limit=10)
            products = result.get("results", [])
            
            print(f"Found {len(products)} products")
            
            if products:
                # Check actual prices
                prices = []
                for product in products:
                    try:
                        price = float(product.get("price", 0))
                        prices.append(price)
                    except:
                        pass
                
                if prices:
                    min_price = min(prices)
                    max_price = max(prices)
                    avg_price = sum(prices) / len(prices)
                    print(f"Price range: {min_price:,.0f} - {max_price:,.0f} VND")
                    print(f"Average price: {avg_price:,.0f} VND")
                    
                    # Show first few products
                    for i, product in enumerate(products[:3]):
                        print(f"  {i+1}. {product.get('title', 'N/A')} - {product.get('price', 'N/A')} VND")
        except Exception as e:
            print(f"Error: {e}")


async def test_category_filters():
    """Test category filtering capabilities."""
    print("\n=== Testing Category Filters ===")
    
    # Test different category filters
    category_tests = [
        {"categories": ["Thịt", "Cá"], "desc": "Thịt, Cá"},
        {"main_category_ids": ["MjUyMzQ="], "desc": "Main category ID"},
        {"categories": ["Sữa", "Bơ"], "desc": "Sữa, Bơ"},
    ]
    
    for test in category_tests:
        print(f"\nTesting categories: {test['desc']}")
        
        filters = {}
        if "categories" in test:
            filters["category"] = {"in": test["categories"]}
        if "main_category_ids" in test:
            filters["main_category_id"] = {"in": test["main_category_ids"]}
        
        try:
            result = await search_products_antsomi("", filters=filters, limit=10)
            products = result.get("results", [])
            
            print(f"Found {len(products)} products")
            
            if products:
                # Show categories
                categories = set()
                for product in products:
                    cat = product.get("category", "")
                    if cat:
                        categories.add(cat)
                
                print(f"Categories found: {list(categories)}")
                
                # Show first few products
                for i, product in enumerate(products[:3]):
                    print(f"  {i+1}. {product.get('title', 'N/A')} - {product.get('category', 'N/A')}")
        except Exception as e:
            print(f"Error: {e}")


async def test_combined_filters():
    """Test combined filtering capabilities."""
    print("\n=== Testing Combined Filters ===")
    
    # Test price + category combination
    filters = {
        "price": {"gte": 100000, "lte": 300000},
        "category": {"in": ["Thịt", "Cá"]}
    }
    
    print("Testing: Price 100k-300k VND + Thịt/Cá categories")
    
    try:
        result = await search_products_antsomi("", filters=filters, limit=10)
        products = result.get("results", [])
        
        print(f"Found {len(products)} products")
        
        if products:
            # Show products with prices and categories
            for i, product in enumerate(products[:5]):
                price = product.get("price", "N/A")
                category = product.get("category", "N/A")
                title = product.get("title", "N/A")
                print(f"  {i+1}. {title} - {price} VND - {category}")
    except Exception as e:
        print(f"Error: {e}")


async def test_unsupported_filters():
    """Test filters that might not be supported."""
    print("\n=== Testing Potentially Unsupported Filters ===")
    
    unsupported_tests = [
        {"brand": {"in": ["Vinamilk", "TH True Milk"]}, "desc": "Brand filter"},
        {"status": {"in": ["Active", "In Stock"]}, "desc": "Status filter"},
        {"unit": {"in": ["Gói", "Hộp"]}, "desc": "Unit filter"},
        {"promotion_name": {"in": ["Khuyến mãi"]}, "desc": "Promotion filter"},
    ]
    
    for test in unsupported_tests:
        print(f"\nTesting: {test['desc']}")
        
        try:
            result = await search_products_antsomi("sữa", filters=test, limit=5)
            products = result.get("results", [])
            
            print(f"Found {len(products)} products")
            
            if products:
                print("Filter might be supported!")
                for i, product in enumerate(products[:2]):
                    print(f"  {i+1}. {product.get('title', 'N/A')}")
            else:
                print("No results - filter might not be supported")
        except Exception as e:
            print(f"Error (likely unsupported): {e}")


async def main():
    """Run all filter tests."""
    print("Testing Antsomi CDP 365 API Filtering Capabilities")
    print("=" * 60)
    
    await test_price_filters()
    await test_category_filters()
    await test_combined_filters()
    await test_unsupported_filters()
    
    print("\n" + "=" * 60)
    print("Filter testing completed!")


if __name__ == "__main__":
    asyncio.run(main())
