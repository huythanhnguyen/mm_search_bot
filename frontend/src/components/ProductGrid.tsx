import React from 'react';
import ProductCard from '@/components/ProductCard';
import { ProductGridProps } from '@/types/product';
import { cartService } from '@/services/cartService';

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  onAddToCart, 
  onViewDetails 
}) => {
  
  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductGrid] Received products:', products);
    console.log('[ProductGrid] Products type:', typeof products);
    console.log('[ProductGrid] Products length:', products?.length);
    console.log('[ProductGrid] Products array:', Array.isArray(products));
  }
  
  const handleAddToCart = async (product: any) => {
    try {
      const result = await cartService.addToCart({
        sku: product.sku,
        quantity: 1,
        useArtNo: true
      });
      
      if (result.success) {
        console.log('Product added to cart:', product.name);
        // Could show a toast notification here
      } else {
        console.error('Failed to add to cart:', result.error);
        // Could show error notification here
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    
    // Call parent handler if provided
    onAddToCart?.(product);
  };

  const handleViewDetails = (product: any) => {
    console.log('Viewing product details:', product.name);
    onViewDetails?.(product);
  };

  // Validate products array
  if (!products || !Array.isArray(products) || products.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductGrid] No valid products to display:', products);
    }
    return (
      <div className="text-center py-8 text-gray-500">
        Không có sản phẩm nào để hiển thị
      </div>
    );
  }
  
  // Filter out invalid products
  const validProducts = products.filter(product => 
    product && 
    product.id && 
    product.name && 
    product.price
  );
  
  if (validProducts.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ProductGrid] No valid products after filtering:', products);
    }
    return (
      <div className="text-center py-8 text-gray-500">
        Sản phẩm không hợp lệ
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid container with responsive columns: 2 products/row mobile, 3 products/row desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
        {validProducts.map((product, index) => (
          <div 
            key={product.id} 
            className="w-full min-w-0 animate-slide-up"
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              onViewDetails={handleViewDetails}
            />
          </div>
        ))}
      </div>
      
      {/* Product count info */}
      <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 px-2">
        Hiển thị {validProducts.length} sản phẩm
        {validProducts.length !== products.length && (
          <span className="text-orange-500 ml-2 block sm:inline">
            ({products.length - validProducts.length} sản phẩm không hợp lệ đã bị loại bỏ)
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductGrid; 