"""
Unit tests for CNG (Click and Get) tools.
"""

import unittest
from unittest.mock import patch, MagicMock

from multi_tool_agent.tools.cng import (
    SearchProductsTool, GetProductDetailTool,
    CreateCartTool, AddToCartTool, ViewCartTool, 
    UpdateCartItemTool, RemoveCartItemTool,
    PlaceOrderTool, CheckOrderStatusTool
)

class TestProductTools(unittest.TestCase):
    """Test case for Product tools."""
    
    @patch('multi_tool_agent.tools.cng.product_tools.api_search_products')
    def test_search_products_success(self, mock_api_search):
        """Test successful product search."""
        # Setup mock response
        mock_api_search.return_value = {
            "status": "success",
            "products": [
                {"id": "prod1", "name": "Test Product 1", "price": 19.99},
                {"id": "prod2", "name": "Test Product 2", "price": 29.99}
            ],
            "total": 2
        }
        
        # Create tool and call it
        search_tool = SearchProductsTool()
        result = search_tool(query="test product")
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["total_results"], 2)
        self.assertEqual(len(result["products"]), 2)
        self.assertEqual(result["products"][0]["name"], "Test Product 1")
        
        # Verify API was called with correct parameters
        mock_api_search.assert_called_once_with(
            query="test product",
            category=None,
            price_min=None,
            price_max=None,
            sort_by=None,
            page=1,
            limit=10
        )
    
    @patch('multi_tool_agent.tools.cng.product_tools.api_search_products')
    def test_search_products_error(self, mock_api_search):
        """Test product search error handling."""
        # Setup mock response
        mock_api_search.return_value = {
            "status": "error",
            "error_message": "API error occurred"
        }
        
        # Create tool and call it
        search_tool = SearchProductsTool()
        result = search_tool(query="test product")
        
        # Verify results
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["error_message"], "API error occurred")
    
    @patch('multi_tool_agent.tools.cng.product_tools.api_get_product_detail')
    def test_get_product_detail_success(self, mock_api_detail):
        """Test successful product detail retrieval."""
        # Setup mock response
        mock_api_detail.return_value = {
            "status": "success",
            "product": {
                "id": "prod1",
                "name": "Test Product 1",
                "price": 19.99,
                "description": "This is a test product",
                "images": ["image1.jpg", "image2.jpg"]
            }
        }
        
        # Create tool and call it
        detail_tool = GetProductDetailTool()
        result = detail_tool(product_id="prod1")
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["product"]["name"], "Test Product 1")
        self.assertEqual(result["product"]["description"], "This is a test product")
        
        # Verify API was called with correct parameters
        mock_api_detail.assert_called_once_with(product_id="prod1")
    
    @patch('multi_tool_agent.tools.cng.product_tools.api_get_product_detail')
    def test_get_product_detail_error(self, mock_api_detail):
        """Test product detail error handling."""
        # Setup mock response
        mock_api_detail.return_value = {
            "status": "error",
            "error_message": "Product not found"
        }
        
        # Create tool and call it
        detail_tool = GetProductDetailTool()
        result = detail_tool(product_id="invalid_id")
        
        # Verify results
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["error_message"], "Product not found")


class TestCartTools(unittest.TestCase):
    """Test case for Cart tools."""
    
    @patch('multi_tool_agent.tools.cng.cart_tools.api_create_cart')
    def test_create_cart_success(self, mock_api_create):
        """Test successful cart creation."""
        # Setup mock response
        mock_api_create.return_value = {
            "status": "success",
            "cart_id": "cart123"
        }
        
        # Create tool and call it
        tool_context = MagicMock()
        tool_context.state = {}
        
        create_tool = CreateCartTool()
        result = create_tool(tool_context=tool_context)
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["cart_id"], "cart123")
        
        # Verify cart ID was saved to session state
        self.assertEqual(tool_context.state["cart_id"], "cart123")
    
    @patch('multi_tool_agent.tools.cng.cart_tools.api_add_to_cart')
    @patch('multi_tool_agent.tools.cng.cart_tools.api_create_cart')
    def test_add_to_cart_success(self, mock_api_create, mock_api_add):
        """Test successful add to cart."""
        # Setup mock responses
        mock_api_create.return_value = {
            "status": "success",
            "cart_id": "cart123"
        }
        mock_api_add.return_value = {
            "status": "success",
            "cart_item": {
                "id": "item1",
                "product_id": "prod1",
                "quantity": 2,
                "price": 19.99
            }
        }
        
        # Create tool and call it
        tool_context = MagicMock()
        tool_context.state = {}
        
        add_tool = AddToCartTool()
        result = add_tool(product_id="prod1", quantity=2, tool_context=tool_context)
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["cart_item"]["product_id"], "prod1")
        self.assertEqual(result["cart_item"]["quantity"], 2)
        
        # Verify cart ID was saved to session state
        self.assertEqual(tool_context.state["cart_id"], "cart123")


class TestCheckoutTools(unittest.TestCase):
    """Test case for Checkout tools."""
    
    @patch('multi_tool_agent.tools.cng.checkout_tools.api_place_order')
    def test_place_order_success(self, mock_api_place_order):
        """Test successful order placement."""
        # Setup mock response
        mock_api_place_order.return_value = {
            "status": "success",
            "order_id": "order123",
            "order_details": {
                "total": 49.98,
                "items": 2,
                "status": "pending"
            }
        }
        
        # Create tool and call it
        tool_context = MagicMock()
        tool_context.state = {"cart_id": "cart123"}
        
        place_order_tool = PlaceOrderTool()
        result = place_order_tool(tool_context=tool_context)
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["order_id"], "order123")
        
        # Verify order ID was saved to session state and cart ID was removed
        self.assertEqual(tool_context.state["last_order_id"], "order123")
        self.assertNotIn("cart_id", tool_context.state)
    
    @patch('multi_tool_agent.tools.cng.checkout_tools.api_check_order_status')
    def test_check_order_status_success(self, mock_api_status):
        """Test successful order status check."""
        # Setup mock response
        mock_api_status.return_value = {
            "status": "success",
            "order": {
                "id": "order123",
                "status": "processing",
                "created_at": "2023-07-04T12:34:56Z",
                "total": 49.98
            }
        }
        
        # Create tool and call it
        tool_context = MagicMock()
        tool_context.state = {"last_order_id": "order123"}
        
        status_tool = CheckOrderStatusTool()
        result = status_tool(tool_context=tool_context)
        
        # Verify results
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["order"]["id"], "order123")
        self.assertEqual(result["order"]["status"], "processing")


if __name__ == '__main__':
    unittest.main() 