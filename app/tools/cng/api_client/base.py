#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Lớp cơ sở cho API Client
"""

import logging
import aiohttp
import asyncio
import json
import ssl
from typing import Dict, Any, Optional, Union
from urllib.parse import urljoin

from tenacity import retry, stop_after_attempt, wait_exponential
from .config import Config

logger = logging.getLogger(__name__)

class APIClientBase:
    """
    Lớp cơ sở cho các API Client, cung cấp các phương thức chung.
    """
    
    def __init__(
        self,
        base_url: str,
        timeout: Optional[Union[int, aiohttp.ClientTimeout]] = None,
        loop: Optional[asyncio.AbstractEventLoop] = None
    ):
        """
        Khởi tạo API client cơ sở.
        
        Args:
            base_url: URL cơ sở của API.
            timeout: Timeout cho requests, có thể là số giây hoặc ClientTimeout object.
            loop: Event loop tùy chọn, mặc định sẽ lấy loop hiện tại.
        """
        self.base_url = base_url.rstrip("/")
        
        if isinstance(timeout, int):
            self.timeout = aiohttp.ClientTimeout(total=timeout)
        elif isinstance(timeout, aiohttp.ClientTimeout):
            self.timeout = timeout
        else:
            self.timeout = aiohttp.ClientTimeout(total=120)  # Default 120s - increased to handle slow external APIs
            
        self._session = None
        self._loop = loop or asyncio.get_event_loop()
        self._auth_token = None
        self._store_code = Config.STORE_CODE
        self._cart_id = None  # Thêm _cart_id vào lớp cơ sở để tránh vòng lặp import
    
    async def create_session(self) -> aiohttp.ClientSession:
        """
        Tạo một session mới.
        
        Returns:
            aiohttp.ClientSession: Session mới được tạo.
        """
        try:
            # Kiểm tra và lấy event loop hiện tại
            try:
                self._loop = asyncio.get_running_loop()
            except RuntimeError:
                # Nếu không có loop đang chạy, tạo loop mới
                self._loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self._loop)
            
            # Tạo SSL context để xử lý certificate verification
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # Tạo connector với SSL context
            connector = aiohttp.TCPConnector(ssl=ssl_context)
                
            session = aiohttp.ClientSession(
                timeout=self.timeout,
                loop=self._loop,
                connector=connector
            )
            return session
        except Exception as e:
            logger.error(f"Lỗi khi tạo session mới: {str(e)}")
            raise
            
    async def _get_session(self) -> aiohttp.ClientSession:
        """
        Lấy hoặc tạo một session mới.
        
        Returns:
            aiohttp.ClientSession: Session hiện tại hoặc mới.
        """
        if self._session is None or self._session.closed:
            self._session = await self.create_session()
        return self._session
        
    async def ensure_session(self):
        """Đảm bảo session được khởi tạo và sẵn sàng sử dụng."""
        try:
            if self._session is None or self._session.closed:
                self._session = await self.create_session()
        except Exception as e:
            logger.error(f"Lỗi khi đảm bảo session: {str(e)}")
            raise
    
    async def close(self):
        """Đóng session hiện tại nếu có."""
        if self._session and not self._session.closed:
            try:
                await self._session.close()
            except Exception as e:
                logger.error(f"Lỗi khi đóng session: {str(e)}")
            finally:
                self._session = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.ensure_session()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    def _get_headers(self) -> Dict[str, str]:
        """
        Tạo headers cho request.
        
        Returns:
            Dict[str, str]: Headers.
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Store": self._store_code  # Header Store cho MM Ecommerce
        }
        
        # Thêm token xác thực nếu có
        if self._auth_token:
            headers["Authorization"] = f"Bearer {self._auth_token}"
        
        return headers
    
    def set_auth_token(self, token: str):
        """
        Đặt token xác thực.
        
        Args:
            token: Token xác thực.
        """
        self._auth_token = token
    
    def clear_auth_token(self):
        """Xóa token xác thực."""
        self._auth_token = None
    
    def set_store_code(self, store_code: str):
        """
        Đặt mã cửa hàng.
        
        Args:
            store_code: Mã cửa hàng (ví dụ: b2c_10010_vi).
        """
        self._store_code = store_code
    
    @retry(
        stop=stop_after_attempt(Config.MAX_RETRY_ATTEMPTS),
        wait=wait_exponential(multiplier=1, min=Config.RETRY_DELAY, max=10)
    )
    async def execute_graphql(
        self, 
        query: str, 
        variables: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[int] = None,
        method: str = "POST"
    ) -> Dict[str, Any]:
        """
        Thực hiện truy vấn GraphQL.
        
        Args:
            query: Truy vấn GraphQL.
            variables: Biến cho truy vấn (tùy chọn).
            headers: Headers bổ sung (tùy chọn).
            timeout: Timeout cho request (tùy chọn).
            method: Phương thức HTTP, mặc định là POST. Các API search nên dùng GET.
            
        Returns:
            Dict[str, Any]: Kết quả từ API.
            
        Raises:
            Exception: Nếu có lỗi xảy ra.
        """
        _headers = self._get_headers()
        if headers:
            _headers.update(headers)
        
        if timeout:
            _timeout = aiohttp.ClientTimeout(total=timeout)
        else:
            _timeout = self.timeout
        
        # Đảm bảo session được khởi tạo
        try:
            if self._session is None or self._session.closed:
                await self.ensure_session()
                
            # Chuẩn bị payload
            payload = {
                "query": query
            }
            
            if variables:
                payload["variables"] = variables
            
            # Thực hiện request
            api_url = self.base_url
            
            if method.upper() == "POST":
                async with self._session.post(
                    api_url, 
                    json=payload, 
                    headers=_headers, 
                    timeout=_timeout
                ) as response:
                    return await self._process_response(response)
            elif method.upper() == "GET":
                # Nếu là GET, chuyển payload thành query string
                params = {'query': query}
                if variables:
                    params['variables'] = json.dumps(variables)
                
                async with self._session.get(
                    api_url, 
                    params=params,
                    headers=_headers, 
                    timeout=_timeout
                ) as response:
                    return await self._process_response(response)
            else:
                raise ValueError(f"Phương thức HTTP không được hỗ trợ: {method}")
                
        except aiohttp.ClientError as e:
            logger.error(f"Lỗi HTTP khi thực hiện truy vấn GraphQL: {str(e)}")
            return {
                "success": False,
                "message": f"HTTP error: {str(e)}",
                "code": "HTTP_ERROR"
            }
        except asyncio.TimeoutError:
            logger.error("Timeout khi thực hiện truy vấn GraphQL")
            return {
                "success": False,
                "message": "Timeout when executing GraphQL query",
                "code": "TIMEOUT"
            }
        except Exception as e:
            logger.error(f"Lỗi không xác định khi thực hiện truy vấn GraphQL: {str(e)}")
            return {
                "success": False,
                "message": f"Unknown error: {str(e)}",
                "code": "UNKNOWN_ERROR"
            }
    
    async def _process_response(self, response: aiohttp.ClientResponse) -> Dict[str, Any]:
        """
        Xử lý response từ API.
        
        Args:
            response: Response từ API.
            
        Returns:
            Dict[str, Any]: Kết quả đã xử lý.
        """
        try:
            status = response.status
            response_json = await response.json()
            
            # Kiểm tra lỗi HTTP
            if status >= 400:
                return {
                    "success": False,
                    "status": status,
                    "message": f"HTTP error: {status}",
                    "data": response_json,
                    "code": f"HTTP_{status}"
                }
            
            # Kiểm tra lỗi GraphQL
            errors = response_json.get("errors", [])
            if errors:
                error_messages = [error.get("message", "Unknown error") for error in errors]
                error_codes = [error.get("extensions", {}).get("category", "GRAPHQL_ERROR") for error in errors]
                
                return {
                    "success": False,
                    "message": ", ".join(error_messages),
                    "errors": errors,
                    "code": error_codes[0] if error_codes else "GRAPHQL_ERROR"
                }
            
            # Trả về kết quả thành công
            return {
                "success": True,
                "data": response_json.get("data", {}),
                "message": "Success"
            }
            
        except Exception as e:
            logger.error(f"Lỗi khi xử lý response: {str(e)}")
            return {
                "success": False,
                "message": f"Error processing response: {str(e)}",
                "code": "RESPONSE_ERROR"
            } 