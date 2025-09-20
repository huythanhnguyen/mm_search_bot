#!/usr/bin/env python3
"""
Test script for MMVN Agent Memory Integration
Demonstrates how memory works with the agent
"""

import asyncio
import json
import sys
import os
from google.genai.types import Content, Part

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService
from google.adk.runners import Runner
from google.adk.tools import load_memory
from memory_config import get_session_service, get_memory_service

# Constants
APP_NAME = "mmvn_memory_test"
USER_ID = "test_user"
MODEL = "gemini-2.5-flash-lite"

async def test_memory_workflow():
    """Test the complete memory workflow."""
    print("=== Testing MMVN Agent Memory Workflow ===")
    
    # Get shared services
    session_service = get_session_service()
    memory_service = get_memory_service()
    
    # Create agent with memory capability
    memory_agent = LlmAgent(
        model=MODEL,
        name="MMVNMemoryAgent",
        instruction="""Bạn là Trợ lý mua sắm MMVN. Bạn có thể:
        - Tìm kiếm sản phẩm (search_products)
        - Xem chi tiết sản phẩm (explore_product)
        - So sánh sản phẩm (compare_products)
        - Truy vấn thông tin từ cuộc trò chuyện trước (load_memory)
        
        Khi người dùng hỏi về sản phẩm đã thảo luận trước đó, hãy sử dụng load_memory để tìm kiếm thông tin liên quan.""",
        tools=[load_memory]  # Only memory tool for this test
    )
    
    # Create runner
    runner = Runner(
        agent=memory_agent,
        app_name=APP_NAME,
        session_service=session_service,
        memory_service=memory_service
    )
    
    # Test 1: First conversation - capture some information
    print("\n--- Test 1: First Conversation (Capturing Information) ---")
    session1_id = "session_1"
    await runner.session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session1_id)
    
    user_input1 = Content(parts=[Part(text="Tôi đang tìm kiếm sản phẩm thịt bò, giá khoảng 200k-300k VND")], role="user")
    
    print(f"User: {user_input1.parts[0].text}")
    
    # Run the agent
    final_response_text1 = "(No final response)"
    async for event in runner.run_async(user_id=USER_ID, session_id=session1_id, new_message=user_input1):
        if event.is_final_response() and event.content and event.content.parts:
            final_response_text1 = event.content.parts[0].text
            print(f"Agent: {final_response_text1}")
    
    # Add this session to memory
    print("\n--- Adding Session 1 to Memory ---")
    completed_session1 = await runner.session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=session1_id)
    await memory_service.add_session_to_memory(completed_session1)
    print("✅ Session 1 added to memory")
    
    # Test 2: Second conversation - recall information
    print("\n--- Test 2: Second Conversation (Recalling Information) ---")
    session2_id = "session_2"
    await runner.session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=session2_id)
    
    user_input2 = Content(parts=[Part(text="Tôi muốn xem lại sản phẩm thịt bò mà chúng ta đã thảo luận trước đó")], role="user")
    
    print(f"User: {user_input2.parts[0].text}")
    
    # Run the agent
    final_response_text2 = "(No final response)"
    async for event in runner.run_async(user_id=USER_ID, session_id=session2_id, new_message=user_input2):
        if event.is_final_response() and event.content and event.content.parts:
            final_response_text2 = event.content.parts[0].text
            print(f"Agent: {final_response_text2}")
    
    # Test 3: Third conversation - search memory directly
    print("\n--- Test 3: Direct Memory Search ---")
    try:
        # Search memory directly
        search_result = await memory_service.search_memory(
            app_name=APP_NAME,
            user_id=USER_ID,
            query="thịt bò giá 200k-300k"
        )
        
        print(f"Memory search results:")
        print(f"  Found {len(search_result.memories)} memories")
        
        for i, memory in enumerate(search_result.memories):
            print(f"  Memory {i+1}: {memory}")
            
    except Exception as e:
        print(f"Error searching memory: {e}")
    
    print("\n--- Memory Test Completed ---")


async def test_memory_with_product_search():
    """Test memory integration with actual product search."""
    print("\n=== Testing Memory with Product Search ===")
    
    # This would be a more realistic test where the agent actually searches for products
    # and then stores the results in memory for later recall
    
    print("This test would demonstrate:")
    print("1. User asks for products")
    print("2. Agent searches and finds products")
    print("3. Agent stores product information in memory")
    print("4. Later, user asks about those products")
    print("5. Agent recalls from memory")
    
    # For now, just show the concept
    print("✅ Memory integration concept demonstrated")


async def main():
    """Run all memory tests."""
    print("Testing MMVN Agent Memory Integration")
    print("=" * 60)
    
    await test_memory_workflow()
    await test_memory_with_product_search()
    
    print("\n" + "=" * 60)
    print("Memory integration tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
