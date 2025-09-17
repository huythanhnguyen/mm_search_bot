export interface ProductCardData {
  id: string;
  sku: string;
  name: string;
  price: {
    current: number;
    original?: number;
    currency: string;
    discount?: string;
  };
  image: {
    url: string;
    // Removed alt since it's not available in API
  };
  description?: string; // Optional since description.html can be empty
  productUrl: string; // Link to C&G product page
  unit?: string; // Optional unit_ecom field
  // Removed availability, rating, tags - these don't exist in API
}

export interface ProductDisplayMessage {
  type: 'product-display';
  message: string;
  products: ProductCardData[];
}

export interface ProductGridProps {
  products: ProductCardData[];
  onAddToCart?: (product: ProductCardData) => void;
  onViewDetails?: (product: ProductCardData) => void;
}

export interface ProductCardProps {
  product: ProductCardData;
  onAddToCart?: (product: ProductCardData) => void;
  onViewDetails?: (product: ProductCardData) => void;
} 