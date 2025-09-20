#!/usr/bin/env python3
"""
Test script for MMVN Memory Agent
Demonstrates automatic memory search and context-aware responses
"""

import asyncio
import json
import sys
import os
from google.genai.types import Content, Part

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService
from memory_agent import MMVNMemoryAgent
from runner_config import create_memory_runner, add_session_to_memory

# Constants
APP_NAME = "mmvn_memory_test"
USER_ID = "test_user"
MODEL = "gemini-2.5-flash-lite"

async def test_memory_agent_workflow():
    """Test the complete memory agent workflow."""
    print("=== Testing MMVN Memory Agent Workflow ===")
    
    # Create services
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService()
    
    # Create memory agent
    memory_agent = MMVNMemoryAgent(
        model=MODEL,
        name="MMVNMemoryAgent",
        instruction="""Bạn là Trợ lý mua sắm MMVN. Bạn có thể:
        - Tìm kiếm sản phẩm (search_products)
        - Xem chi tiết sản phẩm (explore_product)
        - So sánh sản phẩm (compare_products)
        - Truy vấn thông tin từ cuộc trò chuyện trước (load_memory)
        
        Luôn tìm kiếm trong memory trước khi trả lời để đảm bảo câu trả lời bám sát với chủ đề và context đã thảo luận trước đó.""",
        tools=[]  # No tools for this test
    )
    
    # Create runner
    runner = create_memory_runner(memory_agent, APP_NAME)
    
    # Test 1: First conversation - capture information
    print("\n--- Test 1: First Conversation (Capturing Information) ---")
    session1_id = "session_1"
    
    user_input1 = Content(parts=[Part(text="Tôi đang tìm kiếm sản phẩm thịt bò, giá khoảng 200k-300k VND")], role="user")
    print(f"User: {user_input1.parts[0].text}")
    
    # Run the agent
    try:
        final_response_text1 = "(No final response)"
        async for event in runner.run_async(user_id=USER_ID, session_id=session1_id, new_message=user_input1):
            if event.is_final_response() and event.content and event.content.parts:
                final_response_text1 = event.content.parts[0].text
                print(f"Agent: {final_response_text1}")
        
        # Add session to memory
        print("\n--- Adding Session 1 to Memory ---")
        add_session_to_memory(runner, USER_ID, session1_id)
        print("✅ Session 1 added to memory")
        
    except Exception as e:
        print(f"Error in first conversation: {e}")
    
    # Test 2: Second conversation - test memory recall
    print("\n--- Test 2: Second Conversation (Testing Memory Recall) ---")
    session2_id = "session_2"
    
    user_input2 = Content(parts=[Part(text="Tôi muốn xem lại sản phẩm thịt bò mà chúng ta đã thảo luận trước đó")], role="user")
    print(f"User: {user_input2.parts[0].text}")
    
    # Run the agent
    try:
        final_response_text2 = "(No final response)"
        async for event in runner.run_async(user_id=USER_ID, session_id=session2_id, new_message=user_input2):
            if event.is_final_response() and event.content and event.content.parts:
                final_response_text2 = event.content.parts[0].text
                print(f"Agent: {final_response_text2}")
        
        # Add session to memory
        print("\n--- Adding Session 2 to Memory ---")
        add_session_to_memory(runner, USER_ID, session2_id)
        print("✅ Session 2 added to memory")
        
    except Exception as e:
        print(f"Error in second conversation: {e}")
    
    # Test 3: Direct memory search
    print("\n--- Test 3: Direct Memory Search ---")
    try:
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
    
    print("\n--- Memory Agent Test Completed ---")


async def test_memory_agent_with_tools():
    """Test memory agent with actual tools."""
    print("\n=== Testing Memory Agent with Tools ===")
    
    # This would test the agent with actual search tools
    # For now, just show the concept
    print("This test would demonstrate:")
    print("1. User asks for products")
    print("2. Agent searches memory for context")
    print("3. Agent searches for products with context")
    print("4. Agent provides context-aware response")
    print("5. Session is saved to memory")
    
    print("✅ Memory agent with tools concept demonstrated")


async def test_memory_summarization():
    """Test memory context summarization."""
    print("\n=== Testing Memory Context Summarization ===")
    
    # Create a mock memory agent to test summarization
    class MockMemoryAgent(MMVNMemoryAgent):
        def __init__(self):
            pass
        
        def _summarize_memory_context(self, memories):
            return super()._summarize_memory_context(memories)
    
    mock_agent = MockMemoryAgent()
    
    # Test with different memory scenarios
    test_memories = [
        ["Tôi đang tìm kiếm sản phẩm thịt bò, giá khoảng 200k-300k VND"],
        ["Tìm thấy 5 sản phẩm thịt bò phù hợp", "Giá từ 150k đến 350k VND"],
        ["Người dùng quan tâm đến thịt bò Úc", "Sản phẩm chất lượng cao", "Giá cả hợp lý"]
    ]
    
    for i, memories in enumerate(test_memories):
        print(f"\nTest {i+1}: {len(memories)} memories")
        summary = mock_agent._summarize_memory_context(memories)
        print(f"Summary: {summary}")
    
    print("\n--- Memory Summarization Test Completed ---")


async def main():
    """Run all memory agent tests."""
    print("Testing MMVN Memory Agent Integration")
    print("=" * 60)
    
    await test_memory_agent_workflow()
    await test_memory_agent_with_tools()
    await test_memory_summarization()
    
    print("\n" + "=" * 60)
    print("Memory agent tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
