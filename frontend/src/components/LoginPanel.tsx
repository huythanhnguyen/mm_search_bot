import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, LogOut, User } from 'lucide-react';
import { authService } from '@/services/authService';
import { cartService } from '@/services/cartService';
import { User as UserType } from '@/types/auth';

interface LoginPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPanel({ isOpen, onClose }: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  // Update auth state when component mounts or auth changes
  useState(() => {
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      const currentUser = authService.getCurrentUser();
      setIsAuthenticated(authenticated);
      setUser(currentUser);
    };

    checkAuth();
    
    // Check auth state periodically in case token expires
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.login({ email: email.trim(), password });
      
      if (result.success) {
        setUser(result.user || null);
        setIsAuthenticated(true);
        setEmail('');
        setPassword('');
        
        // Handle cart state change after login
        await cartService.handleAuthChange(true);
        
        // Close login panel after successful login
        onClose();
      } else {
        setError(result.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // Handle cart state change after logout
      await cartService.handleAuthChange(false);
      
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-2 border-blue-500/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-bold text-blue-600">
            {isAuthenticated ? 'Thông tin tài khoản' : 'Đăng nhập'}
          </CardTitle>
          <CardDescription>
            {isAuthenticated 
              ? 'Quản lý tài khoản MMVN Product Advisor'
              : 'Đăng nhập để sử dụng đầy đủ tính năng'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isAuthenticated && user ? (
            // Logged in state
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Email:</span>
                </div>
                <p className="text-sm text-gray-700 ml-6">
                  {user.email}
                </p>
                
                {user.firstname && (
                  <>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Tên:</span>
                    </div>
                    <p className="text-sm text-gray-700 ml-6">
                      {user.firstname} {user.lastname || ''}
                    </p>
                  </>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 border-red-400/50 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </Button>
                <Button
                  onClick={onClose}
                  variant="default"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            // Login form
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading || !email.trim() || !password.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 