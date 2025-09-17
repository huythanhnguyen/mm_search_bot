#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Factory tạo các instance API client với cấu hình nhất quán.
"""

import os
from typing import Optional, Dict, Any
import asyncio
import aiohttp

from .product import ProductAPI
from .cart import CartAPI
from .auth import AuthAPI
from .api_client import EcommerceAPIClient

class APIClientFactory:
    """Factory tạo các instance API client với cấu hình nhất quán."""
    
    # Singleton pattern để đảm bảo dùng chung cấu hình
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(APIClientFactory, cls).__new__(cls)
            # Lấy URL từ biến môi trường một lần duy nhất
            cls._instance.base_url = os.getenv("MM_ECOMMERCE_API_URL", "https://online.mmvietnam.com/graphql")
            cls._instance.timeout = 120  # Timeout mặc định - increased to handle slow external APIs
            cls._instance._clients = {}  # Cache các client đã tạo
        return cls._instance
    
    def get_product_api(self, custom_timeout: Optional[int] = None, loop: Optional[asyncio.AbstractEventLoop] = None) -> ProductAPI:
        """Trả về ProductAPI client với cấu hình đã được chuẩn hóa."""
        client_key = f"product_{custom_timeout}"
        if client_key not in self._clients:
            timeout = custom_timeout or self.timeout
            self._clients[client_key] = ProductAPI(self.base_url, timeout, loop)
        return self._clients[client_key]
    
    def get_cart_api(self, custom_timeout: Optional[int] = None, loop: Optional[asyncio.AbstractEventLoop] = None) -> CartAPI:
        """Trả về CartAPI client với cấu hình đã được chuẩn hóa."""
        client_key = f"cart_{custom_timeout}"
        if client_key not in self._clients:
            timeout = custom_timeout or self.timeout
            self._clients[client_key] = CartAPI(self.base_url, timeout, loop)
        return self._clients[client_key]
    
    def get_auth_api(self, custom_timeout: Optional[int] = None, loop: Optional[asyncio.AbstractEventLoop] = None) -> AuthAPI:
        """Trả về AuthAPI client với cấu hình đã được chuẩn hóa."""
        client_key = f"auth_{custom_timeout}"
        if client_key not in self._clients:
            timeout = custom_timeout or self.timeout
            self._clients[client_key] = AuthAPI(self.base_url, timeout, loop)
        return self._clients[client_key]
    
    def get_full_api_client(self, custom_timeout: Optional[int] = None, loop: Optional[asyncio.AbstractEventLoop] = None) -> EcommerceAPIClient:
        """Trả về EcommerceAPIClient đầy đủ với cấu hình đã được chuẩn hóa."""
        client_key = f"full_{custom_timeout}"
        if client_key not in self._clients:
            timeout = custom_timeout or self.timeout
            self._clients[client_key] = EcommerceAPIClient(self.base_url, timeout, loop)
        return self._clients[client_key]
    
    def set_auth_token(self, token: str) -> None:
        """Thiết lập token xác thực cho tất cả các client hiện có."""
        for client in self._clients.values():
            client.set_auth_token(token)
    
    def set_store_code(self, store_code: str) -> None:
        """Thiết lập mã cửa hàng cho tất cả các client hiện có."""
        for client in self._clients.values():
            client.set_store_code(store_code)
            
    async def close_all(self) -> None:
        """Đóng tất cả các client."""
        for client in self._clients.values():
            await client.close()
        self._clients = {} 