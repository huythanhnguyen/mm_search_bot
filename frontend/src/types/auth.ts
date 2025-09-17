export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname?: string;
  phone?: string;
  isSubscribed?: boolean;
}

export interface AuthToken {
  token: string;
  expiresAt: number; // timestamp
  userId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface TokenLifetimeConfig {
  customer_access_token_lifetime: number; // in hours
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// C&G API specific types
export interface GenerateTokenResponse {
  data: {
    generateCustomerToken: {
      token: string;
    };
  };
  errors?: Array<{
    message: string;
    extensions?: {
      category: string;
    };
  }>;
}

export interface StoreConfigResponse {
  data: {
    storeConfig: {
      customer_access_token_lifetime: number;
    };
  };
} 