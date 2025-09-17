#!/usr/bin/env python3
"""
Backend runner for MM Multi Agent system.
This script starts the Google ADK agent server.
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are available."""
    try:
        import google.adk.agents
        print("✅ Google ADK dependencies found")
        return True
    except ImportError:
        print("❌ Google ADK not found. Please install google-adk first:")
        print("pip install google-adk")
        return False

def main():
    print("🚀 Starting MM Multi Agent Backend...")
    
    # Change to the correct directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    print(f"📁 Working directory: {script_dir}")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    print("🌐 Starting server on http://localhost:8000")
    print("📊 Docs available at http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Use the ADK server command
        cmd = [
            sys.executable, "-m", "google.adk.agents.run_server",
            "--agent_file", "agent.py",
            "--host", "0.0.0.0",
            "--port", "8000"
        ]
        
        subprocess.run(cmd, check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)

if __name__ == "__main__":
    main() 