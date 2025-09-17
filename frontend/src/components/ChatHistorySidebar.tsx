import React, { useState, useEffect } from "react";
import { X, History, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSession, MessageWithAgent } from "@/types/chat";
import { SessionManager } from "@/components/SessionManager";
import { LoginPanel } from "@/components/LoginPanel";
import { CartPanel } from "@/components/CartPanel";
import { authService } from "@/services/authService";
import { cartService } from "@/services/cartService";
import { 
  createSessionFromMessages, 
  saveSessionsToStorage, 
  loadSessionsFromStorage,
  generateSmartSessionName,
  extractChatTopics
} from "@/utils/sessionUtils";

interface HumanMessage {
  id: string;
  content: string;
}

interface ChatHistorySidebarProps {
  humanMessages: HumanMessage[];
  currentMessages?: MessageWithAgent[];
  currentSessionId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSessionSelect?: (session: ChatSession) => void;
  onNewSession?: () => void;
}

export default function ChatHistorySidebar({
  humanMessages,
  currentMessages = [],
  currentSessionId = null,
  isOpen,
  onClose,
  onSessionSelect,
  onNewSession,
}: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showEnhanced, setShowEnhanced] = useState(true);
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [cartItemCount, setCartItemCount] = useState(0);

  // Load sessions on component mount
  useEffect(() => {
    const savedSessions = loadSessionsFromStorage();
    setSessions(savedSessions);
  }, []);

  // Load cart item count when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadCartItemCount();
    }
  }, [isOpen]);

  // Check authentication status periodically
  useEffect(() => {
    const checkAuthStatus = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadCartItemCount = async () => {
    try {
      const summary = await cartService.getCartSummary();
      setCartItemCount(summary.itemCount);
    } catch (error) {
      console.error('Failed to load cart item count:', error);
    }
  };

  // Save sessions when they change
  useEffect(() => {
    saveSessionsToStorage(sessions);
  }, [sessions]);

  // Auto-save current session when messages change
  useEffect(() => {
    if (currentMessages.length > 0) {
      const currentSession = createSessionFromMessages(currentMessages, currentSessionId || undefined);
      
      // Generate smart name if it's a new session or has default name
      if (!currentSessionId || currentSession.name === "Cuộc trò chuyện mới") {
        const smartName = generateSmartSessionName(currentMessages);
        currentSession.name = smartName;
        
        // Extract topics for tags
        const topics = extractChatTopics(currentMessages);
        if (topics.length > 0) {
          currentSession.tags = topics;
        }
        
        // Auto-categorize based on content
        if (topics.length > 0) {
          const primaryTopic = topics[0]; // Use the most frequent topic
          if (primaryTopic === 'Mua sắm') {
            currentSession.category = 'ecommerce';
          } else if (primaryTopic === 'Hỗ trợ') {
            currentSession.category = 'support';
          } else if (primaryTopic === 'Thông tin') {
            currentSession.category = 'general';
          } else if (primaryTopic === 'Đơn hàng') {
            currentSession.category = 'ecommerce';
          } else if (primaryTopic === 'Chính sách') {
            currentSession.category = 'support';
          }
        }
      }
      
      setSessions(prev => {
        const existingIndex = prev.findIndex(s => s.id === currentSession.id);
        if (existingIndex >= 0) {
          // Update existing session
          const updated = [...prev];
          updated[existingIndex] = currentSession;
          return updated;
        } else {
          // Add new session
          return [currentSession, ...prev];
        }
      });
    }
  }, [currentMessages, currentSessionId]);

  const handleSessionSelect = (session: ChatSession) => {
    onSessionSelect?.(session);
    onClose();
  };

  const handleNewSession = () => {
    onNewSession?.();
    onClose();
  };

  const handleSessionRename = (sessionId: string, newName: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, name: newName, updatedAt: Date.now() }
        : s
    ));
  };

  const handleSessionDelete = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleSessionArchive = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, isArchived: !s.isArchived, updatedAt: Date.now() }
        : s
    ));
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative top-0 left-0 h-full w-80 max-w-[85vw] sm:max-w-[320px] 
          bg-white border-r border-border z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${humanMessages.length === 0 && sessions.length === 0 ? 'lg:hidden' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEnhanced(!showEnhanced)}
              className="h-8 w-8 p-0"
              title={showEnhanced ? "Chế độ đơn giản" : "Chế độ nâng cao"}
            >
              {showEnhanced ? "📊" : "📝"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden h-10 w-10 p-0 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-accent"
              aria-label="Close chat history"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Auth & Cart Section - Moved to TOP */}
        <div className="border-b bg-white/80 p-3 sm:p-4 space-y-3">
          {/* Authentication Section */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowLoginPanel(true)}
              variant={isAuthenticated ? "default" : "outline"}
              className={`w-full justify-start ${
                isAuthenticated 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "border-blue-400/50 text-blue-600 hover:bg-blue-50"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              {isAuthenticated ? "Tài khoản" : "Đăng nhập"}
            </Button>
            
            {isAuthenticated && (
              <div className="text-xs text-muted-foreground px-2">
                Đã đăng nhập - {authService.getCurrentUser()?.email}
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="space-y-2">
            <Button
              onClick={() => setShowCartPanel(true)}
              variant="outline"
              className="w-full justify-start border-green-400/50 text-green-600 hover:bg-green-50 relative"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Giỏ hàng
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Button>
            
            <div className="text-xs text-muted-foreground px-2">
              {cartItemCount > 0 
                ? `${cartItemCount} sản phẩm trong giỏ` 
                : "Giỏ hàng trống"}
            </div>
          </div>
        </div>

        {/* Chat History Section */}
        <div className="px-3 sm:px-4 py-2 border-b bg-white/60">
          <h3 className="text-sm font-medium text-muted-foreground">Lịch sử trò chuyện</h3>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {showEnhanced ? (
            <div className="p-3 sm:p-4">
              <SessionManager
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                onSessionRename={handleSessionRename}
                onSessionDelete={handleSessionDelete}
                onSessionArchive={handleSessionArchive}
                compact={false}
              />
            </div>
          ) : (
            // Simple mode - original functionality
            <div className="p-3 sm:p-4 space-y-2">
              {humanMessages.length === 0 ? (
                <div className="text-muted-foreground text-sm text-center py-8">
                  Chưa có tin nhắn nào
                </div>
              ) : (
                humanMessages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded-lg bg-secondary hover:bg-accent transition-colors cursor-pointer border border-transparent hover:border-border touch-none min-h-[44px] flex items-start"
                  >
                    <p className="text-sm text-card-foreground line-clamp-3 leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Auth & Cart Modals */}
      <LoginPanel 
        isOpen={showLoginPanel} 
        onClose={() => {
          setShowLoginPanel(false);
          // Refresh auth state and cart after login/logout
          setIsAuthenticated(authService.isAuthenticated());
          loadCartItemCount();
        }} 
      />
      
      <CartPanel 
        isOpen={showCartPanel} 
        onClose={() => {
          setShowCartPanel(false);
          // Refresh cart count after adding items
          loadCartItemCount();
        }} 
      />
    </>
  );
} 