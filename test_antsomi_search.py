#!/usr/bin/env python3
"""
Test script for Antsomi CDP 365 API Smart Search integration
"""

import asyncio
import json
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from tools.search import search_products, suggest_keywords, search_products_antsomi


async def test_suggest_keywords():
    """Test keyword suggestions API."""
    print("=== Testing Keyword Suggestions ===")
    test_queries = ["thịt bò", "gạo", "sữa", "bánh"]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        try:
            suggestions = await suggest_keywords(query)
            print(f"Suggestions: {suggestions}")
        except Exception as e:
            print(f"Error: {e}")


async def test_search_products():
    """Test product search API."""
    print("\n=== Testing Product Search ===")
    test_queries = ["thịt bò", "gạo ST25", "sữa tươi", "bánh mì"]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        try:
            result = await search_products_antsomi(query, limit=5)
            print(f"Total results: {result.get('total', '0')}")
            print(f"Search type: {result.get('type', '')}")
            print(f"Number of products: {len(result.get('results', []))}")
            
            # Show first product if available
            products = result.get('results', [])
            if products:
                first_product = products[0]
                print(f"First product: {first_product.get('title', 'N/A')}")
                print(f"SKU: {first_product.get('sku', 'N/A')}")
                print(f"Price: {first_product.get('price', 'N/A')} VND")
        except Exception as e:
            print(f"Error: {e}")


async def test_main_search_function():
    """Test the main search function that returns JSON."""
    print("\n=== Testing Main Search Function ===")
    test_queries = ["thịt bò", "gạo", "sữa"]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        try:
            # Mock tool_context
            class MockToolContext:
                pass
            
            result = await search_products(query, MockToolContext())
            data = json.loads(result)
            
            print(f"Message: {data.get('message', 'N/A')}")
            print(f"Number of products: {len(data.get('products', []))}")
            print(f"Search metadata: {data.get('search_metadata', {})}")
            
            # Show first product if available
            products = data.get('products', [])
            if products:
                first_product = products[0]
                print(f"First product: {first_product.get('name', 'N/A')}")
                print(f"SKU: {first_product.get('sku', 'N/A')}")
                print(f"Price: {first_product.get('price', {}).get('current', 'N/A')} VND")
        except Exception as e:
            print(f"Error: {e}")


async def main():
    """Run all tests."""
    print("Testing Antsomi CDP 365 API Smart Search Integration")
    print("=" * 60)
    
    await test_suggest_keywords()
    await test_search_products()
    await test_main_search_function()
    
    print("\n" + "=" * 60)
    print("Test completed!")


if __name__ == "__main__":
    asyncio.run(main())