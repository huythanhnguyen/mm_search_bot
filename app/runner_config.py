"""
Runner configuration for MMVN Agent with Memory
Ensures proper memory service integration
"""

import logging
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService
from memory_config import get_session_service, get_memory_service

logger = logging.getLogger(__name__)

def create_memory_runner(agent, app_name: str = "mmvn_app"):
    """
    Create a Runner with proper memory service configuration.
    
    Args:
        agent: The agent to run
        app_name: Application name for session management
    
    Returns:
        Configured Runner instance
    """
    try:
        # Get shared services
        session_service = get_session_service()
        memory_service = get_memory_service()
        
        # Create runner with memory service
        runner = Runner(
            agent=agent,
            app_name=app_name,
            session_service=session_service,
            memory_service=memory_service
        )
        
        logger.info(f"Created memory-enabled runner for app: {app_name}")
        return runner
        
    except Exception as e:
        logger.error(f"Error creating memory runner: {e}")
        # Fallback to basic runner
        return Runner(
            agent=agent,
            app_name=app_name
        )

def add_session_to_memory(runner, user_id: str, session_id: str):
    """
    Add a completed session to memory.
    This should be called when a session is complete.
    
    Args:
        runner: The runner instance
        user_id: User ID
        session_id: Session ID
    """
    try:
        # Get the completed session
        completed_session = runner.session_service.get_session(
            app_name=runner.app_name,
            user_id=user_id,
            session_id=session_id
        )
        
        # Add to memory
        runner.memory_service.add_session_to_memory(completed_session)
        logger.info(f"Added session {session_id} to memory for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error adding session to memory: {e}")

async def run_with_memory(agent, user_id: str, session_id: str, user_message, app_name: str = "mmvn_app"):
    """
    Run agent with automatic memory integration.
    
    Args:
        agent: The agent to run
        user_id: User ID
        session_id: Session ID
        user_message: User message
        app_name: Application name
    
    Returns:
        Agent response
    """
    try:
        # Create memory-enabled runner
        runner = create_memory_runner(agent, app_name)
        
        # Create session if not exists
        try:
            await runner.session_service.create_session(
                app_name=app_name,
                user_id=user_id,
                session_id=session_id
            )
        except:
            # Session might already exist
            pass
        
        # Run the agent
        response = None
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=user_message
        ):
            if event.is_final_response() and event.content and event.content.parts:
                response = event.content.parts[0].text
                break
        
        # Add session to memory after completion
        add_session_to_memory(runner, user_id, session_id)
        
        return response
        
    except Exception as e:
        logger.error(f"Error running agent with memory: {e}")
        return f"Lỗi khi chạy agent: {str(e)}"
