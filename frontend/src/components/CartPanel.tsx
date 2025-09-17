import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Plus, Minus, Trash2, X, Package } from 'lucide-react';
import { cartService } from '@/services/cartService';
import { authService } from '@/services/authService';

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  image?: string;
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartSummary, setCartSummary] = useState({ itemCount: 0, totalPrice: 0 });

  // Load cart data when panel opens
  useEffect(() => {
    if (isOpen) {
      loadCartData();
    }
  }, [isOpen]);

  const loadCartData = async () => {
    setIsLoading(true);
    try {
      // Load cart summary
      const summary = await cartService.getCartSummary();
      setCartSummary(summary);
      
      // Load cart items from API (remove mock data)
      // TODO: Replace with actual API call when available
      // const items = await cartService.getCartItems();
      // setCartItems(items);
      
      // For now, show empty cart
      setCartItems([]);
    } catch (error) {
      console.error('Failed to load cart data:', error);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, delta: number) => {
    try {
      const item = cartItems.find(i => i.id === itemId);
      if (!item) return;
      
      const newQuantity = item.quantity + delta;
      if (newQuantity < 1) {
        // Remove item if quantity becomes 0
        await handleRemoveItem(itemId);
      } else {
        // Update quantity
        const updatedItems = cartItems.map(i => 
          i.id === itemId ? { ...i, quantity: newQuantity } : i
        );
        setCartItems(updatedItems);
        
        // Update cart summary
        const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const newCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        setCartSummary({ itemCount: newCount, totalPrice: newTotal });
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updatedItems = cartItems.filter(i => i.id !== itemId);
      setCartItems(updatedItems);
      
      // Update cart summary
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartSummary({ itemCount: newCount, totalPrice: newTotal });
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      setCartItems([]);
      setCartSummary({ itemCount: 0, totalPrice: 0 });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const isAuthenticated = authService.isAuthenticated();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-2 border-blue-500/20 max-h-[90vh] overflow-hidden">
        {/* Header with close button */}
        <CardHeader className="text-center border-b bg-blue-50 relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg font-bold text-blue-600">
              Giỏ hàng
            </CardTitle>
            {cartSummary.itemCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                ({cartSummary.itemCount} sản phẩm)
              </Badge>
            )}
          </div>
          
          {/* Disclaimer */}
          <p className="text-xs text-red-600">
            * Không áp dụng đổi trả đối với mặt hàng tươi sống, thực phẩm đông lạnh.
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center p-8">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Giỏ hàng trống</p>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="border-b p-4 hover:bg-gray-50">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                        <Package className="w-8 h-8 text-gray-400 mx-auto mt-4" />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">
                          {item.name}
                        </h4>
                        
                        {/* Pricing */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-bold text-red-600 text-sm">
                            {item.price.toLocaleString('vi-VN')} ₫
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-gray-500 text-xs line-through">
                              {item.originalPrice.toLocaleString('vi-VN')} ₫
                            </span>
                          )}
                        </div>
                        
                        {/* Quantity Control */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-blue-100 rounded-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="h-6 w-6 p-0 hover:bg-blue-200"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-2 text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="h-6 w-6 p-0 hover:bg-blue-200"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {/* Subtotal */}
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Thành tiền</p>
                            <p className="font-bold text-red-600 text-sm">
                              {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                            </p>
                          </div>
                        </div>
                        
                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-6 px-2 text-blue-600 hover:text-red-600 text-xs mt-1"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="border-t p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-blue-600 hover:text-red-600 text-sm"
                  >
                    Xóa tất cả
                  </Button>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Thành tiền</p>
                    <p className="font-bold text-red-600 text-lg">
                      {cartSummary.totalPrice.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    // Navigate to full cart page
                    onClose();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Xem giỏ hàng
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 