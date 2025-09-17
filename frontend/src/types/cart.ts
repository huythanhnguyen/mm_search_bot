export interface CartItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: {
    regularPrice: {
      amount: {
        currency: string;
        value: number;
      };
    };
  };
  price_range: {
    maximum_price: {
      final_price: {
        currency: string;
        value: number;
      };
      discount?: {
        amount_off: number;
        percent_off: number;
      };
    };
  };
  small_image?: {
    url: string;
  };
  unit_ecom?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  currency: string;
  isGuest: boolean;
}

export interface AddToCartRequest {
  sku: string;
  quantity: number;
  useArtNo?: boolean;
}

export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
}

// C&G API specific types
export interface CreateCartResponse {
  data: {
    cartId?: string; // for logged-in users
    createGuestCart?: {
      cart: {
        id: string;
      };
    }; // for guest users
  };
}

export interface AddProductsToCartResponse {
  data: {
    addProductsToCart: {
      cart: {
        itemsV2: {
          items: Array<{
            product: {
              name: string;
              sku: string;
            };
          }>;
        };
      };
      user_errors: Array<{
        code: string;
        message: string;
      }>;
    };
  };
}

export interface CartItemInput {
  quantity: number;
  sku: string;
}

export interface CartApiError {
  code: string;
  message: string;
} 