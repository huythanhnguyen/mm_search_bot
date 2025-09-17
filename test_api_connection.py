#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script to check API connection and product search functionality.
"""

import asyncio
import sys
import os

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from multi_tool_agent.tools.cng.api_client.client_factory import APIClientFactory
from multi_tool_agent.tools.cng.api_client.response import safe_api_call

async def test_api_connection():
    """Test API connection and basic functionality."""
    print("🔍 Testing API connection...")
    
    try:
        # Create API client
        factory = APIClientFactory()
        api_client = factory.get_product_api()
        
        print(f"✅ API Client created successfully")
        print(f"📡 Base URL: {api_client.base_url}")
        print(f"⏱️ Timeout: {api_client.timeout}")
        
        # Test product search
        print("\n🔍 Testing product search...")
        search_result = await safe_api_call(
            api_client.search_products,
            "thịt lợn",
            10,
            1
        )
        
        print(f"Search result success: {search_result.success}")
        if search_result.success:
            data = search_result.data
            products = data.get("products", {})
            items = products.get("items", [])
            total_count = products.get("total_count", 0)
            
            print(f"✅ Search successful!")
            print(f"📊 Total products found: {total_count}")
            print(f"📦 Products in current page: {len(items)}")
            
            if items:
                print(f"📋 First product: {items[0].get('name', 'N/A')}")
                print(f"💰 Price: {items[0].get('price', {}).get('regularPrice', {}).get('amount', {}).get('value', 'N/A')}")
            else:
                print("⚠️ No products found")
        else:
            print(f"❌ Search failed: {search_result.message}")
            return False
        
        # Test suggest products
        print("\n🔍 Testing suggest products...")
        suggest_result = await safe_api_call(
            api_client.suggest_products,
            "thịt lợn",
            page_size=10,
            current_page=1
        )
        
        print(f"Suggest result success: {suggest_result.success}")
        if suggest_result.success:
            data = suggest_result.data
            products = data.get("products", {})
            items = products.get("items", [])
            total_count = products.get("total_count", 0)
            
            print(f"✅ Suggest successful!")
            print(f"📊 Total products found: {total_count}")
            print(f"📦 Products in current page: {len(items)}")
        else:
            print(f"❌ Suggest failed: {suggest_result.message}")
        
        # Close the client
        await api_client.close()
        print("\n✅ All tests completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_product_tools():
    """Test the product tools directly."""
    print("\n🔍 Testing product tools...")
    
    try:
        from multi_tool_agent.tools.cng.product_tools import search_products
        
        # Test search_products function
        result = await search_products("thịt lợn", limit=5)
        
        print(f"Tool result status: {result.get('status')}")
        if result.get('status') == 'success':
            products = result.get('products', [])
            total_results = result.get('total_results', 0)
            
            print(f"✅ Tool test successful!")
            print(f"📊 Total results: {total_results}")
            print(f"📦 Products returned: {len(products)}")
            
            if products:
                print(f"📋 First product: {products[0].get('name', 'N/A')}")
        else:
            print(f"❌ Tool test failed: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during tool testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_agent_routing():
    """Test if the agent routing is working correctly."""
    print("\n🔍 Testing agent routing...")
    
    try:
        # Import the root agent
        from multi_tool_agent.agent import root_agent
        
        print(f"✅ Root agent loaded successfully")
        print(f"📋 Agent name: {root_agent.name}")
        print(f"📋 Sub-agents: {[agent.name for agent in root_agent.sub_agents]}")
        
        # Check if product_search_agent is in sub_agents
        product_search_agent = None
        for agent in root_agent.sub_agents:
            if agent.name == "product_search_agent":
                product_search_agent = agent
                break
        
        if product_search_agent:
            print(f"✅ Product search agent found")
            # Handle tools that might be functions or objects
            tool_names = []
            for tool in product_search_agent.tools:
                if hasattr(tool, 'name'):
                    tool_names.append(tool.name)
                elif hasattr(tool, '__name__'):
                    tool_names.append(tool.__name__)
                else:
                    tool_names.append(str(tool))
            print(f"📋 Tools: {tool_names}")
        else:
            print(f"❌ Product search agent not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error during agent routing test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_agent_execution():
    """Test if the agent can actually execute a search request."""
    print("\n🔍 Testing agent execution...")
    
    try:
        # Import the product search agent directly
        from multi_tool_agent.sub_agents.product_search.agent import product_search_agent
        
        print(f"✅ Product search agent loaded directly")
        print(f"📋 Agent name: {product_search_agent.name}")
        
        # Test if the agent has the right tools
        tool_names = []
        for tool in product_search_agent.tools:
            if hasattr(tool, 'name'):
                tool_names.append(tool.name)
            elif hasattr(tool, '__name__'):
                tool_names.append(tool.__name__)
            else:
                tool_names.append(str(tool))
        print(f"📋 Tools: {tool_names}")
        
        # Check if search_products tool is available
        search_tool_found = False
        for tool in product_search_agent.tools:
            tool_name = getattr(tool, 'name', getattr(tool, '__name__', str(tool)))
            if 'search_products' in tool_name:
                search_tool_found = True
                break
        
        if search_tool_found:
            print(f"✅ Search products tool found")
        else:
            print(f"❌ Search products tool not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error during agent execution test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function."""
    print("🚀 Starting API connection tests...")
    
    # Test 1: API Connection
    api_success = await test_api_connection()
    
    # Test 2: Product Tools
    tools_success = await test_product_tools()
    
    # Test 3: Agent Routing
    routing_success = await test_agent_routing()
    
    # Test 4: Agent Execution
    execution_success = await test_agent_execution()
    
    # Summary
    print("\n" + "="*50)
    print("📊 TEST SUMMARY")
    print("="*50)
    print(f"API Connection: {'✅ PASS' if api_success else '❌ FAIL'}")
    print(f"Product Tools: {'✅ PASS' if tools_success else '❌ FAIL'}")
    print(f"Agent Routing: {'✅ PASS' if routing_success else '❌ FAIL'}")
    print(f"Agent Execution: {'✅ PASS' if execution_success else '❌ FAIL'}")
    
    if api_success and tools_success and routing_success and execution_success:
        print("\n🎉 All tests passed! The system is working correctly.")
        print("\n🔍 The issue might be in the agent's decision-making logic.")
        print("   The agent knows what to do but doesn't execute the tools.")
    else:
        print("\n⚠️ Some tests failed. Please check the configuration.")

if __name__ == "__main__":
    asyncio.run(main()) 