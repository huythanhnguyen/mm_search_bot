"""
Multi-tool Agent using Google ADK.
"""

# Import root agent from the local agent.py file
from .agent import root_agent

# This is required for ADK web UI to find the agent
agent = root_agent 