"""
Safety callbacks for the multi-tool agent system.
"""

from typing import Optional, Dict, Any
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.adk.tools.tool_context import ToolContext
from google.genai import types

from multi_tool_agent.shared_libraries.constants import BLOCKED_KEYWORDS, RESTRICTED_CITIES

def content_safety_guardrail(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    """
    Inspects the user message for inappropriate content.
    Blocks requests containing specific keywords.
    
    Args:
        callback_context: Context providing access to agent info and session state
        llm_request: The request about to be sent to the LLM
        
    Returns:
        LlmResponse if the request should be blocked, None to allow it
    """
    # Extract the text from the latest user message
    last_user_message_text = ""
    if llm_request.contents:
        for content in reversed(llm_request.contents):
            if content.role == 'user' and content.parts:
                if content.parts[0].text:
                    last_user_message_text = content.parts[0].text
                    break
    
    # Check for blocked keywords
    for keyword in BLOCKED_KEYWORDS:
        if keyword.lower() in last_user_message_text.lower():
            # Record the block in session state
            callback_context.state["safety_block_triggered"] = True
            
            # Return a response to block the request
            return LlmResponse(
                content=types.Content(
                    role="model",
                    parts=[types.Part(text="I cannot process requests containing inappropriate content.")],
                )
            )
    
    # Allow the request to proceed
    return None

def restricted_city_guardrail(
    tool: Any, args: Dict[str, Any], tool_context: ToolContext
) -> Optional[Dict]:
    """
    Blocks the get_weather tool from being used with restricted cities.
    
    Args:
        tool: The tool about to be called
        args: The arguments provided to the tool
        tool_context: Context for accessing and updating session state
        
    Returns:
        Dict if the tool call should be blocked, None to allow it
    """
    tool_name = tool.name
    
    # Only apply to the get_weather tool
    if tool_name == "get_weather" and "city" in args:
        city_arg = args["city"].lower()
        
        for city in RESTRICTED_CITIES:
            if city in city_arg:
                # Record the block in session state
                tool_context.state["tool_block_triggered"] = True
                
                # Return a custom error response
                return {
                    "status": "error",
                    "error_message": f"Access to weather information for '{args['city']}' is restricted."
                }
    
    # Allow the tool call to proceed
    return None 