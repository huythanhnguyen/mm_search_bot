#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Configuration settings for the API client.
"""

import os

class Config:
    """Configuration settings for the API client."""
    
    # Store code for MM Ecommerce
    STORE_CODE = os.getenv("MM_STORE_CODE", "b2c_10010_vi")
    
    # API URL 
    API_URL = os.getenv("MM_ECOMMERCE_API_URL", "https://online.mmvietnam.com/graphql")
    
    # Retry settings
    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAY = 1  # seconds
    
    # Default timeout
    DEFAULT_TIMEOUT = 120  # seconds - increased from 30 to handle slow external API calls
    
    # GraphQL queries for common operations
    GRAPHQL_QUERIES = {
        "create_guest_cart": """
        mutation {
          createGuestCart {
            cart {
              id
            }
          }
        }
        """,
        
        "create_empty_cart": """
        mutation CreateCartAfterSignIn {
          cartId: createEmptyCart
        }
        """
    } 