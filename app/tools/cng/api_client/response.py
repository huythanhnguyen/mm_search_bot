#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Định dạng phản hồi chuẩn cho tất cả các API client và tool wrapper.
"""

from typing import Dict, Any, TypeVar, Generic, Optional, List, Union

T = TypeVar('T')

class APIResponse(Generic[T]):
    """Định dạng phản hồi chuẩn cho tất cả các API client và tool wrapper."""
    
    def __init__(
        self, 
        success: bool, 
        data: Optional[T] = None, 
        message: Optional[str] = None,
        error: Optional[Union[str, Exception]] = None
    ):
        self.success = success
        self.data = data
        self.message = message
        self.error = error
    
    def to_dict(self) -> Dict[str, Any]:
        """Chuyển đổi phản hồi thành dictionary."""
        result = {
            "success": self.success
        }
        
        if self.data is not None:
            result["data"] = self.data
            
        if self.message is not None:
            result["message"] = self.message
            
        if self.error is not None:
            if isinstance(self.error, Exception):
                result["error"] = str(self.error)
            else:
                result["error"] = self.error
                
        return result
    
    def to_tool_response(self) -> Dict[str, Any]:
        """
        Chuyển đổi phản hồi API thành định dạng tool response.
        Giúp tương thích với định dạng hiện tại các tool đang sử dụng.
        """
        if self.success:
            return {
                "status": "success",
                "data": self.data,
                "message": self.message
            }
        else:
            error_msg = self.message
            if self.error and not error_msg:
                error_msg = str(self.error) if isinstance(self.error, Exception) else self.error
                
            return {
                "status": "error",
                "error_message": error_msg or "Unknown error occurred"
            }
    
    @classmethod
    def success_response(cls, data: Optional[T] = None, message: Optional[str] = None) -> 'APIResponse[T]':
        """Tạo phản hồi thành công."""
        return cls(success=True, data=data, message=message)
    
    @classmethod
    def error_response(cls, message: str, error: Optional[Union[str, Exception]] = None) -> 'APIResponse[T]':
        """Tạo phản hồi lỗi."""
        return cls(success=False, message=message, error=error)
    
    @classmethod
    def from_exception(cls, exception: Exception, message: Optional[str] = None) -> 'APIResponse[T]':
        """Tạo phản hồi lỗi từ exception."""
        error_message = message or f"An error occurred: {str(exception)}"
        return cls(success=False, message=error_message, error=exception)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'APIResponse[Any]':
        """Tạo phản hồi từ dictionary."""
        return cls(
            success=data.get("success", False),
            data=data.get("data"),
            message=data.get("message"),
            error=data.get("error")
        )
    
    @classmethod
    def from_tool_response(cls, response: Dict[str, Any]) -> 'APIResponse[Any]':
        """
        Tạo phản hồi API từ định dạng tool response.
        Giúp chuyển đổi ngược từ định dạng tool hiện tại sang định dạng API.
        """
        success = response.get("status") == "success"
        
        if success:
            return cls(
                success=True,
                data=response.get("data"),
                message=response.get("message")
            )
        else:
            return cls(
                success=False,
                message=response.get("error_message"),
                error=response.get("error_message")
            )


# Hàm tiện ích để xử lý lỗi trong API client
async def safe_api_call(func, *args, **kwargs):
    """
    Wrapper an toàn cho các hàm API, tự động xử lý exception.
    
    Args:
        func: Hàm API cần gọi
        *args, **kwargs: Tham số cho hàm
    
    Returns:
        APIResponse: Phản hồi chuẩn từ API call
    """
    try:
        result = await func(*args, **kwargs)
        
        # Nếu kết quả đã là APIResponse, trả về luôn
        if isinstance(result, APIResponse):
            return result
            
        # Nếu kết quả là dict với key 'success', chuyển đổi thành APIResponse
        if isinstance(result, dict) and "success" in result:
            return APIResponse.from_dict(result)
            
        # Mặc định giả định là kết quả thành công
        return APIResponse.success_response(data=result)
    except Exception as e:
        return APIResponse.from_exception(e) 