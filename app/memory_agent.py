"""
MMVN Agent with Memory Integration
Implements self.search_memory() method for better memory utilization
"""

import logging
from google.adk.agents import Agent
from google.adk.tools import FunctionTool, load_memory
from google.genai import types

logger = logging.getLogger(__name__)

class MMVNMemoryAgent(Agent):
    """
    MMVN Agent with enhanced memory capabilities.
    Automatically searches memory before responding to ensure context-aware responses.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Use object.__setattr__ to bypass Pydantic validation
        object.__setattr__(self, 'memory_search_enabled', True)
    
    async def run(self, request: types.Content, **kwargs) -> types.Content:
        """
        Enhanced run method that automatically searches memory for context.
        """
        try:
            # Get the user's latest message
            user_query = request.parts[0].text if request.parts else ""
            
            # Search memory for relevant context if enabled
            memory_context = ""
            if self.memory_search_enabled and user_query:
                try:
                    search_result = await self.search_memory(query=user_query)
                    if search_result and search_result.memories:
                        # Summarize memory context
                        memory_context = self._summarize_memory_context(search_result.memories)
                        logger.info(f"Found {len(search_result.memories)} relevant memories")
                    else:
                        logger.info("No relevant memories found")
                except Exception as e:
                    logger.warning(f"Memory search failed: {e}")
                    memory_context = ""
            
            # Create enhanced prompt with memory context
            if memory_context:
                enhanced_prompt = f"""Dựa trên thông tin từ cuộc trò chuyện trước:

{memory_context}

Bây giờ hãy trả lời câu hỏi của người dùng: {user_query}

Hãy đảm bảo câu trả lời bám sát với chủ đề và context đã thảo luận trước đó."""
            else:
                enhanced_prompt = user_query
            
            # Create new request with enhanced prompt
            enhanced_request = types.Content(
                parts=[types.Part(text=enhanced_prompt)],
                role=request.role
            )
            
            # Call parent run method with enhanced request
            return await super().run(enhanced_request, **kwargs)
            
        except Exception as e:
            logger.error(f"Error in MMVNMemoryAgent.run: {e}")
            # Fallback to original request
            return await super().run(request, **kwargs)
    
    def _summarize_memory_context(self, memories) -> str:
        """
        Summarize memory context for better prompt integration.
        """
        if not memories:
            return ""
        
        # Group memories by relevance and summarize
        context_parts = []
        
        for i, memory in enumerate(memories[:3]):  # Limit to top 3 memories
            if memory:
                # Extract key information from memory
                memory_text = str(memory)
                if len(memory_text) > 200:
                    memory_text = memory_text[:200] + "..."
                
                context_parts.append(f"- {memory_text}")
        
        if context_parts:
            return "Thông tin liên quan từ cuộc trò chuyện trước:\n" + "\n".join(context_parts)
        
        return ""
    
    def disable_memory_search(self):
        """Disable automatic memory search."""
        object.__setattr__(self, 'memory_search_enabled', False)
        logger.info("Memory search disabled")
    
    def enable_memory_search(self):
        """Enable automatic memory search."""
        object.__setattr__(self, 'memory_search_enabled', True)
        logger.info("Memory search enabled")
