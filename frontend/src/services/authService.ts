import { 
  LoginCredentials, 
  AuthResponse, 
  GenerateTokenResponse, 
  StoreConfigResponse, 
  User,
  AuthToken
} from '@/types/auth';

class AuthService {
  private readonly API_BASE = 'https://online.mmvietnam.com/graphql';
  private readonly BACKEND_API_BASE = '/api'; // Use backend proxy to avoid CORS
  private readonly STORE_HEADER = 'b2c_10010_vi';
  private readonly TOKEN_STORAGE_KEY = 'mm_auth_token';
  private readonly USER_STORAGE_KEY = 'mm_user_info';
  
  private tokenLifetimeHours = 1; // default, will be fetched from API

  constructor() {
    this.initializeTokenLifetime();
  }

  /**
   * Initialize token lifetime from store config
   */
  private async initializeTokenLifetime(): Promise<void> {
    try {
      const config = await this.getStoreConfig();
      this.tokenLifetimeHours = config.customer_access_token_lifetime;
    } catch (error) {
      console.warn('Failed to fetch token lifetime config, using default 1 hour:', error);
    }
  }

  /**
   * Get store configuration including token lifetime
   */
  private async getStoreConfig(): Promise<{ customer_access_token_lifetime: number }> {
    const query = `
      query GetStoreConfigData {
        storeConfig {
          customer_access_token_lifetime
        }
      }
    `;

    try {
      // Try without Store header first to avoid CORS preflight
      const response = await fetch(`${this.API_BASE}?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: StoreConfigResponse = await response.json();
      return result.data.storeConfig;
    } catch (error) {
      // Fallback: default token lifetime 
      console.warn('Failed to fetch store config, using default 1 hour:', error);
      return { customer_access_token_lifetime: 1 };
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // TEMPORARY MOCK IMPLEMENTATION TO AVOID CORS ISSUES
    // TODO: Implement proper backend proxy for C&G GraphQL API calls
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Basic validation
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email và mật khẩu không được để trống'
        };
      }

      // Mock successful authentication (accept any non-empty credentials)
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = Date.now() + (this.tokenLifetimeHours * 60 * 60 * 1000);
      
      // Store mock token with expiration
      const authToken: AuthToken = {
        token: mockToken,
        expiresAt,
        userId: credentials.email
      };

      this.storeToken(authToken);

      // Get user info (mock)
      const user: User = {
        id: credentials.email,
        email: credentials.email,
        firstname: credentials.email.split('@')[0].charAt(0).toUpperCase() + credentials.email.split('@')[0].slice(1),
      };

      this.storeUser(user);

      return {
        success: true,
        token: mockToken,
        user
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Đăng nhập thất bại'
      };
    }
  }

  /**
   * Logout user and clear stored data
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.USER_STORAGE_KEY);
  }

  /**
   * Check if user is currently authenticated with valid token
   */
  isAuthenticated(): boolean {
    const authToken = this.getStoredToken();
    if (!authToken) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > authToken.expiresAt) {
      this.logout(); // Clear expired token
      return false;
    }

    return true;
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    const authToken = this.getStoredToken();
    if (authToken && Date.now() <= authToken.expiresAt) {
      return authToken.token;
    }
    return null;
  }

  /**
   * Get current user information
   */
  getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }

    const userJson = localStorage.getItem(this.USER_STORAGE_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Store': this.STORE_HEADER,
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Store authentication token
   */
  private storeToken(authToken: AuthToken): void {
    localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(authToken));
  }

  /**
   * Store user information
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
  }

  /**
   * Get stored authentication token
   */
  private getStoredToken(): AuthToken | null {
    const tokenJson = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    if (tokenJson) {
      try {
        return JSON.parse(tokenJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Refresh token if needed (check expiration and extend)
   */
  async refreshTokenIfNeeded(): Promise<boolean> {
    const authToken = this.getStoredToken();
    if (!authToken) {
      return false;
    }

    // If token expires within 5 minutes, consider it needs refresh
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() + fiveMinutes > authToken.expiresAt) {
      // In a real implementation, you would call a refresh token endpoint
      // For now, we'll just extend the current token
      const newExpiresAt = Date.now() + (this.tokenLifetimeHours * 60 * 60 * 1000);
      const refreshedToken: AuthToken = {
        ...authToken,
        expiresAt: newExpiresAt
      };
      
      this.storeToken(refreshedToken);
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService; 