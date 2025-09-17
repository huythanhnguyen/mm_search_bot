import React, { useState } from 'react';
import { ProductCardData } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ExternalLink, Plus, Minus } from 'lucide-react';
import Modal from '@/components/ui/modal';
import { cartService } from '@/services/cartService';

interface ProductDetailModalProps {
  product: ProductCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: ProductCardData, quantity: number) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  if (!product) return null;

  // Format price to Vietnamese currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Calculate discount percentage
  const discountPercentage = product.price.discount 
    ? parseFloat(product.price.discount.replace('%', ''))
    : (product.price.original 
        ? Math.round(((product.price.original - product.price.current) / product.price.original) * 100)
        : 0);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const result = await cartService.addToCart({
        sku: product.sku,
        quantity: quantity,
        useArtNo: true
      });
      
      if (result.success) {
        console.log(`Added ${quantity} of ${product.name} to cart`);
        onAddToCart?.(product, quantity);
        // Could show success notification here
      } else {
        console.error('Failed to add to cart:', result.error);
        // Could show error notification here
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewOnSite = () => {
    if (product.productUrl) {
      window.open(product.productUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const totalPrice = product.price.current * quantity;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Chi tiết sản phẩm"
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
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
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">Không có hình ảnh</span>
                </div>
              )}
              
              {/* Loading skeleton */}
              {imageLoading && !imageError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}

              {/* Discount badge */}
              {discountPercentage > 0 && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white text-sm">
                  -{discountPercentage}%
                </Badge>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>

            {/* Price Information */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(product.price.current)}
                    </span>
                    {product.price.original && discountPercentage > 0 && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(product.price.original)}
                      </span>
                    )}
                  </div>
                  {discountPercentage > 0 && (
                    <div className="text-sm text-red-600 font-medium">
                      Tiết kiệm {formatPrice(product.price.original! - product.price.current)} ({discountPercentage}%)
                    </div>
                  )}
                  {product.unit && (
                    <div className="text-sm text-gray-600">
                      Đơn vị: {product.unit}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {product.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quantity Selector */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Số lượng</h3>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {quantity > 1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Tổng giá: {formatPrice(totalPrice)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addingToCart ? 'Đang thêm...' : `Thêm ${quantity} vào giỏ hàng`}
              </Button>
              
              <Button
                onClick={handleViewOnSite}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Xem trên website MM
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal; 