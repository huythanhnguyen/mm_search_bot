#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
API Client Module for MM Ecommerce.

This package provides API clients for accessing MM Ecommerce GraphQL API.
"""

__version__ = '1.0.0'

# Import main classes for easy access
from .api_client import EcommerceAPIClient
from .product import ProductAPI
from .cart import CartAPI
from .auth import AuthAPI
from .base import APIClientBase

__all__ = [
    'EcommerceAPIClient',
    'APIClientBase',
    'ProductAPI',
    'CartAPI',
    'AuthAPI'
] 