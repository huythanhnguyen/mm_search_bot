import {
  Cart,
  CartItem,
  AddToCartRequest,
  CreateCartResponse,
  AddProductsToCartResponse,
  CartItemInput,
  CartApiError
} from '@/types/cart';
import { authService } from './authService';

class CartService {
  private readonly API_BASE = 'https://online.mmvietnam.com/graphql';
  private readonly CART_STORAGE_KEY = 'mm_cart_id';
  
  // TEMPORARY: Mock cart functionality to avoid CORS issues
  // TODO: Implement proper backend proxy for C&G GraphQL API calls
  private cartId: string | null = null;
  private mockCartItems: CartItem[] = [];

  constructor() {
    this.loadCartId();
  }

  /**
   * Create a new cart based on authentication status
   */
  async createCart(): Promise<string> {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      return this.createAuthenticatedCart();
    } else {
      return this.createGuestCart();
    }
  }

  /**
   * Create cart for authenticated user (MOCK)
   */
  private async createAuthenticatedCart(): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockCartId = `auth_cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.cartId = mockCartId;
    this.storeCartId(mockCartId);
    
    console.log('Created mock authenticated cart:', mockCartId);
    return mockCartId;
  }

  /**
   * Create cart for guest user (MOCK)
   */
  private async createGuestCart(): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockCartId = `guest_cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.cartId = mockCartId;
    this.storeCartId(mockCartId);
    
    console.log('Created mock guest cart:', mockCartId);
    return mockCartId;
  }

  /**
   * Add product to cart (MOCK)
   */
  async addToCart(request: AddToCartRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // Ensure we have a cart
      if (!this.cartId) {
        this.cartId = await this.createCart();
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      // Basic validation
      if (!request.sku || request.quantity <= 0) {
        return {
          success: false,
          error: 'SKU và số lượng phải hợp lệ'
        };
      }

      // Create mock cart item
      const mockPrice = 100000 + Math.floor(Math.random() * 500000);
      const mockItem: CartItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sku: request.sku,
        quantity: request.quantity,
        name: `Sản phẩm ${request.sku}`, // Mock product name
        price: {
          regularPrice: {
            amount: {
              currency: 'VND',
              value: mockPrice
            }
          }
        },
        price_range: {
          maximum_price: {
            final_price: {
              currency: 'VND',
              value: mockPrice
            }
          }
        }
      };

      // Don't add to mock cart items - just return success
      console.log('Added item to cart:', request);
      return { success: true };

    } catch (error) {
      console.error('Add to cart error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng'
      };
    }
  }

  /**
   * Get current cart items (MOCK)
   */
  async getCartItems(): Promise<CartItem[]> {
    // Return empty array - no mock data
    return [];
  }

  /**
   * Get cart summary (MOCK)
   */
  async getCartSummary(): Promise<{ itemCount: number; totalPrice: number }> {
    // Return empty cart - no mock data
    return { itemCount: 0, totalPrice: 0 };
  }

  /**
   * Clear current cart
   */
  clearCart(): void {
    this.cartId = null;
    localStorage.removeItem(this.CART_STORAGE_KEY);
  }

  /**
   * Get current cart ID
   */
  getCurrentCartId(): string | null {
    return this.cartId;
  }

  /**
   * Store cart ID in localStorage
   */
  private storeCartId(cartId: string): void {
    localStorage.setItem(this.CART_STORAGE_KEY, cartId);
  }

  /**
   * Load cart ID from localStorage
   */
  private loadCartId(): void {
    const storedCartId = localStorage.getItem(this.CART_STORAGE_KEY);
    if (storedCartId) {
      this.cartId = storedCartId;
    }
  }

  /**
   * Handle authentication status change
   * When user logs in/out, we may need to merge or clear cart
   */
  async handleAuthChange(isAuthenticated: boolean): Promise<void> {
    if (isAuthenticated) {
      // User just logged in - could merge guest cart with user cart
      // For now, just clear the cart and create a new authenticated cart
      this.clearCart();
      await this.createCart();
    } else {
      // User logged out - convert to guest cart
      this.clearCart();
      await this.createCart();
    }
  }

  /**
   * Add product by article number (convenience method)
   */
  async addProductByArtNo(artNo: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> {
    return this.addToCart({
      sku: artNo,
      quantity,
      useArtNo: true
    });
  }

  /**
   * Add product by full SKU (convenience method)
   */
  async addProductBySku(sku: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> {
    return this.addToCart({
      sku,
      quantity,
      useArtNo: false
    });
  }

  /**
   * Get product quantity in cart
   */
  async getProductQuantity(sku: string): Promise<number> {
    // Return 0 - no mock data
    return 0;
  }

  /**
   * Update product quantity in cart
   */
  async updateQuantity(sku: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('Updated item quantity:', { sku, quantity });
      return { success: true };

    } catch (error) {
      console.error('Update quantity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể cập nhật số lượng'
      };
    }
  }

  /**
   * Remove product from cart
   */
  async removeFromCart(sku: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('Removed item from cart:', sku);
      return { success: true };

    } catch (error) {
      console.error('Remove from cart error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Không thể xóa sản phẩm khỏi giỏ hàng'
      };
    }
  }
}

// Export singleton instance
export const cartService = new CartService();
export default cartService; 