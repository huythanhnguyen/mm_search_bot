"""
Memory configuration for MMVN Agent
Sets up InMemoryMemoryService and SessionService for memory capabilities
"""

import logging
from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService

logger = logging.getLogger(__name__)

# Create shared services for memory and session management
# These should be shared across runners to share state and memory
session_service = InMemorySessionService()
memory_service = InMemoryMemoryService()

def get_session_service():
    """Get the shared session service instance."""
    return session_service

def get_memory_service():
    """Get the shared memory service instance."""
    return memory_service

def add_session_to_memory(session):
    """
    Add a completed session to memory.
    This should be called when a session is complete or has significant information.
    """
    try:
        # This would be called by the application logic
        # when a session is considered complete
        logger.info(f"Adding session {session.session_id} to memory")
        # Note: This is a placeholder - actual implementation would be in the runner
        pass
    except Exception as e:
        logger.error(f"Error adding session to memory: {e}")

def search_memory(app_name: str, user_id: str, query: str):
    """
    Search memory for relevant information.
    This is typically called by the load_memory tool.
    """
    try:
        logger.info(f"Searching memory for query: {query}")
        # This would be called by the load_memory tool
        # Note: This is a placeholder - actual implementation would be in the tool
        pass
    except Exception as e:
        logger.error(f"Error searching memory: {e}")
