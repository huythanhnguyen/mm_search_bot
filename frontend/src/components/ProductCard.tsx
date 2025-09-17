import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Heart } from 'lucide-react';
import { ProductCardProps } from '@/types/product';
import ProductDetailModal from '@/components/ProductDetailModal';
import { cartService } from '@/services/cartService';

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails 
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [isInCart, setIsInCart] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load current cart quantity for this product
  useEffect(() => {
    loadCartQuantity();
  }, [product.sku]);

  const loadCartQuantity = async () => {
    try {
      const quantity = await cartService.getProductQuantity(product.sku);
      setCartQuantity(quantity);
      setIsInCart(quantity > 0);
    } catch (error) {
      console.error('Failed to load cart quantity:', error);
    }
  };

  // Format price to Vietnamese style
  const formatPrice = (price: number) => {
    return `${price.toLocaleString('vi-VN')} ₫`;
  };

  // Calculate discount percentage
  const discountPercentage = product.price.original 
    ? Math.round(((product.price.original - product.price.current) / product.price.original) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (isInCart) {
      // If already in cart, show quantity controls
      return;
    }

    setIsUpdating(true);
    try {
      const result = await cartService.addToCart({
        sku: product.sku,
        quantity: 1,
        useArtNo: true
      });
      
      if (result.success) {
        setCartQuantity(1);
        setIsInCart(true);
        onAddToCart?.(product);
      } else {
        console.error('Failed to add to cart:', result.error);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setIsUpdating(true);
    try {
      if (newQuantity === 0) {
        // Remove from cart
        const result = await cartService.removeFromCart(product.sku);
        if (result.success) {
          setCartQuantity(0);
          setIsInCart(false);
        }
      } else {
        // Update quantity
        const result = await cartService.updateQuantity(product.sku, newQuantity);
        if (result.success) {
          setCartQuantity(newQuantity);
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewDetails = () => {
    setIsModalOpen(true);
    onViewDetails?.(product);
  };

  return (
    <>
      <Card 
        className="h-full transition-all duration-200 hover:shadow-lg border border-gray-200 bg-white rounded-lg overflow-hidden"
      >
        <CardContent className="p-4 h-full flex flex-col">
          {/* Product Image */}
          <div className="relative mb-4 overflow-hidden rounded-lg bg-gray-50">
            <div className="aspect-square w-full">
              {!imageError ? (
                <img
                  src={product.image.url}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-sm">Không có hình ảnh</span>
                </div>
              )}
              
              {/* Loading skeleton */}
              {imageLoading && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
            </div>

            {/* Discount badge */}
            {discountPercentage > 0 && (
              <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                -{discountPercentage}%
              </Badge>
            )}

            {/* Favorite button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-white rounded-full"
            >
              <Heart className="h-4 w-4 text-gray-600" />
            </Button>
          </div>

          {/* Product Info */}
          <div className="flex-1 flex flex-col">
            {/* Product Name */}
            <h3 className="font-medium text-sm text-gray-900 mb-3 line-clamp-2 leading-5 min-h-[2.5rem]">
              {product.name}
            </h3>

            {/* Original Price */}
            {product.price.original && discountPercentage > 0 && (
              <div className="text-xs text-gray-500 line-through mb-1">
                {formatPrice(product.price.original)}
              </div>
            )}

            {/* Current Price */}
            <div className="text-lg font-bold text-red-600 mb-2">
              {formatPrice(product.price.current)}
            </div>

            {/* Promotion info */}
            {typeof product.description === 'string' && product.description.includes('Mua 2 tình tiên') && (
              <div className="text-xs text-red-600 mb-2 flex items-center">
                <span className="mr-1">🎯</span>
                Mua 2 tính tiên 1
              </div>
            )}

            {/* Unit/Package info */}
            {product.unit && (
              <div className="text-xs text-gray-500 mb-4">
                {product.unit}
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="mt-auto">
              {!isInCart ? (
                <Button
                  onClick={handleAddToCart}
                  disabled={isUpdating}
                  className="w-full bg-[#0272BA] hover:bg-[#0261A3] text-white text-lg font-medium py-3 px-7 rounded border-0 shadow-md transition-all duration-300 cursor-pointer"
                  style={{
                    padding: '11px 29px',
                    borderRadius: '4px',
                    fontSize: '18px',
                    fontWeight: '500',
                    lineHeight: 'normal',
                    width: '100%',
                    transition: 'all .3s',
                    border: '1px solid rgba(0, 0, 0, 0)',
                    boxShadow: '0 2px 3px 0 rgba(16, 16, 16, 0.09)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Mua
                </Button>
              ) : (
                <div className="space-y-2">
                  {/* Enhanced Quantity Controls - Exact same size as buy button with balanced ends */}
                  <div 
                    className="flex items-center justify-between bg-[#0272BA] rounded border-0 shadow-md w-full relative"
                    style={{
                      padding: '11px 29px',
                      borderRadius: '4px',
                      height: '48px', // Exact same height as buy button
                      boxShadow: '0 2px 3px 0 rgba(16, 16, 16, 0.09)',
                      border: '1px solid rgba(0, 0, 0, 0)'
                    }}
                  >
                    {/* Minus Button - Positioned at extreme left end */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(cartQuantity - 1)}
                      disabled={isUpdating}
                      className="h-6 w-6 p-0 bg-white text-[#0272BA] hover:bg-gray-100 rounded-full border-0 shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation absolute left-2"
                      style={{
                        minWidth: '24px',
                        minHeight: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        border: '1px solid white'
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    {/* Quantity Display - Centered input field */}
                    <div className="flex-1 flex items-center justify-center">
                      <Input
                        type="number"
                        value={cartQuantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 99) {
                            handleQuantityChange(value);
                          }
                        }}
                        className="w-16 h-6 text-center border-0 bg-transparent text-white font-medium text-base placeholder-white/80"
                        min="0"
                        max="99"
                        placeholder="0"
                        style={{ 
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                      />
                    </div>
                    
                    {/* Plus Button - Positioned at extreme right end */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQuantityChange(cartQuantity + 1)}
                      disabled={isUpdating || cartQuantity >= 99}
                      className="h-6 w-6 p-0 bg-white text-[#0272BA] hover:bg-gray-100 rounded-full border-0 shadow-sm flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation disabled:opacity-50 absolute right-2"
                      style={{
                        minWidth: '24px',
                        minHeight: '24px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        border: '1px solid white'
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* View Details Link */}
              <button
                onClick={handleViewDetails}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 w-full text-center underline"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

    {/* Product Detail Modal */}
    <ProductDetailModal
      product={product}
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onAddToCart={(product, quantity) => {
        console.log(`Added ${quantity} of ${product.name} to cart from modal`);
        onAddToCart?.(product);
      }}
    />
    </>
  );
};

export default ProductCard; 