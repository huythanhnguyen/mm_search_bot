#!/usr/bin/env python3
"""
Simple test for MMVN Agent Memory Integration
Tests memory service without LLM calls
"""

import asyncio
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService
from google.genai.types import Content, Part

async def test_memory_service():
    """Test memory service functionality."""
    print("=== Testing InMemoryMemoryService ===")
    
    # Create services
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService()
    
    # Test 1: Create a session
    print("\n--- Test 1: Creating Session ---")
    app_name = "mmvn_test"
    user_id = "test_user"
    session_id = "test_session"
    
    await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)
    print("✅ Session created successfully")
    
    # Test 2: Add events to session
    print("\n--- Test 2: Adding Events to Session ---")
    
    # Add user message
    user_message = Content(parts=[Part(text="Tôi đang tìm kiếm sản phẩm thịt bò")], role="user")
    await session_service.add_event(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        event=user_message
    )
    print("✅ User message added")
    
    # Add agent response
    agent_response = Content(parts=[Part(text="Tôi đã tìm thấy 5 sản phẩm thịt bò phù hợp")], role="assistant")
    await session_service.add_event(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        event=agent_response
    )
    print("✅ Agent response added")
    
    # Test 3: Get completed session
    print("\n--- Test 3: Getting Completed Session ---")
    completed_session = await session_service.get_session(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id
    )
    print(f"✅ Session retrieved with {len(completed_session.events)} events")
    
    # Test 4: Add session to memory
    print("\n--- Test 4: Adding Session to Memory ---")
    await memory_service.add_session_to_memory(completed_session)
    print("✅ Session added to memory")
    
    # Test 5: Search memory
    print("\n--- Test 5: Searching Memory ---")
    search_queries = [
        "thịt bò",
        "sản phẩm",
        "tìm kiếm",
        "không liên quan"
    ]
    
    for query in search_queries:
        try:
            result = await memory_service.search_memory(
                app_name=app_name,
                user_id=user_id,
                query=query
            )
            print(f"  Query: '{query}' -> Found {len(result.memories)} memories")
            
            for i, memory in enumerate(result.memories):
                print(f"    Memory {i+1}: {memory[:100]}...")
                
        except Exception as e:
            print(f"  Query: '{query}' -> Error: {e}")
    
    print("\n--- Memory Service Test Completed ---")


async def test_memory_with_multiple_sessions():
    """Test memory with multiple sessions."""
    print("\n=== Testing Memory with Multiple Sessions ===")
    
    # Create services
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService()
    
    app_name = "mmvn_multi_test"
    user_id = "test_user"
    
    # Create multiple sessions
    sessions_data = [
        {
            "session_id": "session_1",
            "user_msg": "Tôi tìm sản phẩm thịt bò",
            "agent_msg": "Tìm thấy 3 sản phẩm thịt bò"
        },
        {
            "session_id": "session_2", 
            "user_msg": "Tôi tìm sản phẩm sữa",
            "agent_msg": "Tìm thấy 5 sản phẩm sữa"
        },
        {
            "session_id": "session_3",
            "user_msg": "Tôi tìm sản phẩm gạo",
            "agent_msg": "Tìm thấy 4 sản phẩm gạo"
        }
    ]
    
    # Create and add sessions to memory
    for session_data in sessions_data:
        print(f"\n--- Creating Session: {session_data['session_id']} ---")
        
        await session_service.create_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_data["session_id"]
        )
        
        # Add user message
        user_msg = Content(parts=[Part(text=session_data["user_msg"])], role="user")
        await session_service.add_event(
            app_name=app_name,
            user_id=user_id,
            session_id=session_data["session_id"],
            event=user_msg
        )
        
        # Add agent response
        agent_msg = Content(parts=[Part(text=session_data["agent_msg"])], role="assistant")
        await session_service.add_event(
            app_name=app_name,
            user_id=user_id,
            session_id=session_data["session_id"],
            event=agent_msg
        )
        
        # Add to memory
        completed_session = await session_service.get_session(
            app_name=app_name,
            user_id=user_id,
            session_id=session_data["session_id"]
        )
        await memory_service.add_session_to_memory(completed_session)
        print(f"✅ Session {session_data['session_id']} added to memory")
    
    # Test searching across all sessions
    print("\n--- Testing Search Across All Sessions ---")
    search_queries = [
        "thịt bò",
        "sữa", 
        "gạo",
        "sản phẩm"
    ]
    
    for query in search_queries:
        result = await memory_service.search_memory(
            app_name=app_name,
            user_id=user_id,
            query=query
        )
        print(f"  Query: '{query}' -> Found {len(result.memories)} memories")
        
        for i, memory in enumerate(result.memories):
            print(f"    Memory {i+1}: {memory[:80]}...")
    
    print("\n--- Multiple Sessions Test Completed ---")


async def main():
    """Run all memory tests."""
    print("Testing MMVN Agent Memory Integration (Simple)")
    print("=" * 60)
    
    await test_memory_service()
    await test_memory_with_multiple_sessions()
    
    print("\n" + "=" * 60)
    print("Memory integration tests completed!")


if __name__ == "__main__":
    asyncio.run(main())
