"""
Index file for MM general data.
This file provides a centralized way to access all MM data files.
"""

import os
import json
from pathlib import Path

# Define the paths
MM_DATA_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
MM_JSON_DIR = MM_DATA_DIR / "MM_general_data"

# Define the mapping of data categories to their respective files
MM_DATA_FILES = {
    "general_info": os.path.join(MM_JSON_DIR, "general_info.json"),
    "contact_info": os.path.join(MM_JSON_DIR, "contact_info.json"),
    "delivery_policy": os.path.join(MM_JSON_DIR, "delivery_policy.json"),
    "return_policy": os.path.join(MM_JSON_DIR, "return_policy.json"),
    "privacy_policy": os.path.join(MM_JSON_DIR, "privacy_policy.json"),
    "purchase_guide": os.path.join(MM_JSON_DIR, "purchase_guide.json"),
    "store_locations": os.path.join(MM_JSON_DIR, "store_locations.json"),
    "mm_data_overview": os.path.join(MM_JSON_DIR, "mm_data.json"),
}

def load_json_file(file_path):
    """Load a JSON file and return its contents."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

# Load all data files
MM_DATA = {
    category: load_json_file(file_path)
    for category, file_path in MM_DATA_FILES.items()
}

# Extract content from each data file for easier access
MM_CONTENT = {}
for category, data in MM_DATA.items():
    if data and "content" in data:
        MM_CONTENT[category] = data["content"]
    elif data:
        MM_CONTENT[category] = data

# Create a mapping of questions to their answers for quick lookup
MM_QA_MAPPING = {}
for category, content in MM_CONTENT.items():
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and "question" in item and "answer" in item:
                MM_QA_MAPPING[item["question"].lower()] = {
                    "answer": item["answer"],
                    "category": category
                }

def get_category_data(category):
    """Get data for a specific category."""
    return MM_DATA.get(category)

def get_all_categories():
    """Get a list of all available data categories."""
    return list(MM_DATA_FILES.keys())

def get_all_data():
    """Get all MM data."""
    return MM_DATA

def get_all_content():
    """Get all MM content."""
    return MM_CONTENT

def get_all_qa_pairs():
    """Get all question-answer pairs."""
    return MM_QA_MAPPING

def search_mm_data(query):
    """
    Search through MM data based on the query.
    
    Args:
        query: The search query string
        
    Returns:
        All data for the LLM to process and find relevant information
    """
    # Return all data and let the LLM decide which information is relevant
    return get_all_data()

def detect_language(text):
    """
    Detect the language of the input text.
    This is a simple implementation that checks for Vietnamese characters.
    
    Args:
        text: The input text
        
    Returns:
        'vi' for Vietnamese, 'en' for English
    """
    vietnamese_chars = set('àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ')
    text_lower = text.lower()
    
    # Check if any Vietnamese-specific characters are in the text
    if any(char in vietnamese_chars for char in text_lower):
        return 'vi'
    
    # Check for common Vietnamese words
    vietnamese_words = ['của', 'và', 'các', 'những', 'trong', 'cho', 'với', 'là', 'được', 'có']
    words = text_lower.split()
    if any(word in vietnamese_words for word in words):
        return 'vi'
    
    return 'en'  # Default to English 