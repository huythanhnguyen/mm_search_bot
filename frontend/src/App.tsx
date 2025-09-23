import { useState, useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatMessagesView } from "@/components/ChatMessagesView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, Bot } from 'lucide-react';
import ChatHistorySidebar from "@/components/ChatHistorySidebar";

// Import types from the new types file
import { MessageWithAgent, ChatSession, ChatHistoryState } from '@/types/chat';
import { 
  createSessionFromMessages, 
  saveSessionsToStorage, 
  loadSessionsFromStorage,
  generateSmartSessionName,
  extractChatTopics
} from '@/utils/sessionUtils';
import { extractProductData } from '@/utils/messageParser';
import { SessionManager } from '@/components/SessionManager';

// Update DisplayData to be a string type
type DisplayData = string | null;

interface ProcessedEvent {
  title: string;
  data: any;
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [appName, setAppName] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithAgent[]>([]);
  const [displayData, setDisplayData] = useState<DisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageEvents, setMessageEvents] = useState<Map<string, ProcessedEvent[]>>(new Map());
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const currentAgentRef = useRef('');
  const accumulatedTextRef = useRef("");
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  // Get API base URL from environment variable or fallback
  const getApiBase = () => {
    if ((import.meta as any).env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL;
    }
    if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      return "/api";
    }
    // Align with DDV style: production API path under /api
    return "/api";
  };
  
  const API_BASE = getApiBase();
  
  console.log('[API_BASE] Using API base URL:', API_BASE);
  console.log('[API_BASE] Environment VITE_API_BASE_URL:', (import.meta as any).env?.VITE_API_BASE_URL);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<{ totalTokenCount: number | null }>(() => ({ totalTokenCount: null }));

  // Sidebar can now stay open on welcome screen for consistent UX

  const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries: number = 10,
    maxDuration: number = 120000 // 2 minutes
  ): Promise<any> => {
    const startTime = Date.now();
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (Date.now() - startTime > maxDuration) {
        throw new Error(`Retry timeout after ${maxDuration}ms`);
      }
      
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };

  const createSession = async (): Promise<{userId: string, sessionId: string, appName: string}> => {
    const generatedSessionId = uuidv4();
    const url = `${API_BASE}/apps/app/users/u_999/sessions/${generatedSessionId}`;
    
    console.log('[CREATE_SESSION] Attempting to create session at:', url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    
    console.log('[CREATE_SESSION] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CREATE_SESSION] Error response:', errorText);
      throw new Error(`Failed to create session: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log('[CREATE_SESSION] Success response:', data);
    return {
      userId: data.userId,
      sessionId: data.id,
      appName: data.appName
    };
  };

  const checkBackendHealth = async (): Promise<boolean> => {
    try {
      console.log('[BACKEND_HEALTH] Checking backend health at:', `${API_BASE}/docs`);
      // Use the docs endpoint or root endpoint to check if backend is ready
      const response = await fetch(`${API_BASE}/docs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      console.log('[BACKEND_HEALTH] Response status:', response.status);
      return response.ok;
    } catch (error) {
      console.log("[BACKEND_HEALTH] Backend not ready yet:", error);
      return false;
    }
  };

  // Function to extract text and metadata from SSE data
  const extractDataFromSSE = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      let textParts: string[] = [];
      let agent = '';
      let finalReportWithCitations = undefined;
      let lastCoordinatorResponse = undefined;
      let functionCall = null;
      let functionResponse = null;
      let sources = null;
      // Extract usage metadata if present
      try {
        const usage = (parsed as any).usageMetadata || (parsed as any).usage || (parsed as any).metadata?.usage;
        const detailsArr = usage?.promptTokensDetails || usage?.tokenDetails || [];
        const detail = Array.isArray(detailsArr) && detailsArr.length > 0 ? detailsArr[0] : undefined;
        const total = detail?.totalTokenCount ?? usage?.totalTokenCount ?? null;
        if (typeof total === 'number') {
          setTokenUsage({ totalTokenCount: total });
        }
      } catch {}

      // Check if content.parts exists and has text
      if (parsed.content && parsed.content.parts) {
        textParts = parsed.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text);
        
        // Check for function calls
        const functionCallPart = parsed.content.parts.find((part: any) => part.functionCall);
        if (functionCallPart) {
          functionCall = functionCallPart.functionCall;
        }
        
        // Check for function responses
        const functionResponsePart = parsed.content.parts.find((part: any) => part.functionResponse);
        if (functionResponsePart) {
          functionResponse = functionResponsePart.functionResponse;
        }
      }

      // Extract agent information
      if (parsed.author) {
        agent = parsed.author;
        console.log('[SSE EXTRACT] Agent:', agent); // DEBUG: Log agent
      }

      // Extract final report with citations
      if (
        parsed.actions &&
        parsed.actions.stateDelta &&
        parsed.actions.stateDelta.final_report_with_citations
      ) {
        finalReportWithCitations = parsed.actions.stateDelta.final_report_with_citations;
        console.log('[SSE EXTRACT] Found final report with citations:', finalReportWithCitations.substring(0, 200) + '...');
      }

      // Extract last coordinator response (contains product display JSON)
      if (
        parsed.actions &&
        parsed.actions.stateDelta &&
        parsed.actions.stateDelta.last_coordinator_response
      ) {
        lastCoordinatorResponse = parsed.actions.stateDelta.last_coordinator_response;
        console.log('[SSE EXTRACT] Found last coordinator response:', lastCoordinatorResponse.substring(0, 200) + '...');
      }

      // Extract website count from research agents
      let sourceCount = 0;
      if (parsed.actions && parsed.actions.stateDelta) {
        // Count sources from various fields that might contain website information
        const stateDelta = parsed.actions.stateDelta;
        if (stateDelta.sources) sourceCount += Array.isArray(stateDelta.sources) ? stateDelta.sources.length : 0;
        if (stateDelta.search_results) sourceCount += Array.isArray(stateDelta.search_results) ? stateDelta.search_results.length : 0;
        if (stateDelta.knowledge_sources) sourceCount += Array.isArray(stateDelta.knowledge_sources) ? stateDelta.knowledge_sources.length : 0;
      }

      if (sourceCount > 0) {
        sources = sourceCount;
      }

      return { textParts, agent, finalReportWithCitations, lastCoordinatorResponse, functionCall, functionResponse, sources };
    } catch (error) {
      console.error('[SSE EXTRACT] Error parsing SSE data:', error);
      return { textParts: [], agent: '', finalReportWithCitations: undefined, lastCoordinatorResponse: undefined, functionCall: null, functionResponse: null, sources: null };
    }
  };

  // const getEventTitle = (functionName: string): string => {
  //   const titleMap: { [key: string]: string } = {
  //     // CNG agent functions
  //     'search_products': '🔍 Tìm kiếm sản phẩm',
  //     'get_product_detail': '📦 Chi tiết sản phẩm',
  //     'create_cart': '🛒 Tạo giỏ hàng',
  //     'add_to_cart': '➕ Thêm vào giỏ',
  //     'view_cart': '👀 Xem giỏ hàng',
  //     'update_cart_item': '✏️ Cập nhật giỏ',
  //     'remove_cart_item': '❌ Xóa khỏi giỏ',
  //     'place_order': '📋 Đặt hàng',
  //     'check_order_status': '📊 Trạng thái đơn',
  //     
  //     // Other agent functions
  //     'get_time': '⏰ Thời gian',
  //     'get_weather': '🌤️ Thời tiết',
  //     'greeting_tool': '👋 Chào hỏi',
  //     'farewell_tool': '👋 Tạm biệt',
  //     'transfer_to_agent': '🔄 Chuyển agent'
  //   };

  //   return titleMap[functionName] || `🔧 ${functionName}`;
  // };

  const processSseEventData = (jsonData: string, aiMessageId: string) => {
    const { textParts, agent, finalReportWithCitations, lastCoordinatorResponse, functionCall, functionResponse, sources } = extractDataFromSSE(jsonData);

    if (agent && agent !== currentAgentRef.current) {
      currentAgentRef.current = agent;
    }

    if (functionCall) {
      const functionCallTitle = `Function Call: ${functionCall.name}`;
      console.log('[SSE HANDLER] Adding Function Call timeline event:', functionCallTitle);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: functionCallTitle,
        data: { type: 'functionCall', name: functionCall.name, args: functionCall.args, id: functionCall.id }
      }]));
    }

    if (functionResponse) {
      const functionResponseTitle = `Function Response: ${functionResponse.name}`;
      console.log('[SSE HANDLER] Adding Function Response timeline event:', functionResponseTitle);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: functionResponseTitle,
        data: { type: 'functionResponse', name: functionResponse.name, response: functionResponse.response, id: functionResponse.id }
      }]));

      // Immediately set productData if the tool returned product-display JSON
      try {
        const resultText = functionResponse.response?.result as string | undefined;
        if (resultText && resultText.trim().startsWith('{') && resultText.trim().endsWith('}')) {
          const parsed = JSON.parse(resultText);
          if (parsed && parsed.type === 'product-display' && Array.isArray(parsed.products)) {
            setMessages(prev => {
              const updated = [...prev];
              const aiMessageIndex = updated.findIndex(m => m.id === aiMessageId);
              if (aiMessageIndex !== -1) {
                updated[aiMessageIndex] = {
                  ...updated[aiMessageIndex],
                  productData: parsed,
                  finalReportWithCitations: true
                };
              }
              return updated;
            });
          }
        }
      } catch (e) {
        console.warn('[SSE HANDLER] Failed to parse functionResponse result as JSON', e);
      }
    }

    if (textParts.length > 0) {
      const newText = textParts.join(' ');
      console.log('[SSE HANDLER] Text parts found:', textParts);
      
      if (newText.trim()) {
        accumulatedTextRef.current += newText;
        console.log('[SSE HANDLER] Accumulated text:', accumulatedTextRef.current);
        
        // Update the AI message with accumulated text (no product data extraction during streaming)
        setMessages(prev => {
          const updated = [...prev];
          const aiMessageIndex = updated.findIndex(m => m.id === aiMessageId);
          if (aiMessageIndex !== -1) {
            console.log('[SSE HANDLER] Updating message with accumulated text:', accumulatedTextRef.current.substring(0, 200) + '...');
            updated[aiMessageIndex] = {
              ...updated[aiMessageIndex],
              content: accumulatedTextRef.current,
              agent: agent || updated[aiMessageIndex].agent
            };
          }
          return updated;
        });
      }
    }

    // Handle last coordinator response (contains product display JSON)
    if (lastCoordinatorResponse) {
      console.log('[SSE HANDLER] Last coordinator response found, updating message');
      console.log('[SSE HANDLER] Last coordinator response content:', lastCoordinatorResponse);
      
      setMessages(prev => {
        const updated = [...prev];
        const aiMessageIndex = updated.findIndex(m => m.id === aiMessageId);
        if (aiMessageIndex !== -1) {
          // Extract product data from last coordinator response
          const productData = extractProductData(lastCoordinatorResponse);
          
          updated[aiMessageIndex] = {
            ...updated[aiMessageIndex],
            content: lastCoordinatorResponse,
            finalReportWithCitations: true,
            agent: agent || updated[aiMessageIndex].agent,
            productData: productData || undefined
          };
        }
        return updated;
      });
    }

    if (finalReportWithCitations) {
      console.log('[SSE HANDLER] Final report found, updating message');
      console.log('[SSE HANDLER] Final report content:', finalReportWithCitations);
      
      setMessages(prev => {
        const updated = [...prev];
        const aiMessageIndex = updated.findIndex(m => m.id === aiMessageId);
        if (aiMessageIndex !== -1) {
          // Check if the final report contains product display data
          const hasProductData = finalReportWithCitations.includes('"type"') && 
                                finalReportWithCitations.includes('"product-display"') && 
                                finalReportWithCitations.includes('"products"');
          
          console.log('[SSE HANDLER] Final report has product data:', hasProductData);
          
          // If final report has product data, use it directly
          // Otherwise, combine with accumulated text
          let finalContent = finalReportWithCitations;
          if (!hasProductData && accumulatedTextRef.current.trim()) {
            finalContent = accumulatedTextRef.current + '\n\n' + finalReportWithCitations;
          }
          
          // Extract product data from final content only when complete
          const productData = extractProductData(finalContent);
          
          updated[aiMessageIndex] = {
            ...updated[aiMessageIndex],
            content: finalContent,
            finalReportWithCitations: true,
            agent: agent || updated[aiMessageIndex].agent,
            productData: productData || undefined
          };
        }
        return updated;
      });
    }

    if (sources) {
      console.log(`[SSE HANDLER] Found ${sources} sources, adding timeline event`);
      setMessageEvents(prev => new Map(prev).set(aiMessageId, [...(prev.get(aiMessageId) || []), {
        title: `📚 Tìm thấy ${sources} nguồn thông tin`,
        data: { type: 'sources', count: sources }
      }]));
    }
  };

  const runAgent = async (query: string, imageFile?: File, audioFile?: File, sessionData?: {userId: string, sessionId: string, appName: string}): Promise<string> => {
    console.log('[RUN AGENT] Starting with query:', query);
    
    // Use provided session data or current state
    const currentUserId = sessionData?.userId || userId;
    const currentSessionId = sessionData?.sessionId || sessionId;
    const currentAppName = sessionData?.appName || appName;
    
    if (!currentUserId || !currentSessionId || !currentAppName) {
      throw new Error("Session not initialized");
    }
    
    console.log('[RUN AGENT] Using session:', { currentUserId, currentSessionId, currentAppName });

    // Create parts array
    const parts: any[] = [{ text: query }];
    
    // Add image if provided
    if (imageFile) {
      const base64Image = await fileToBase64(imageFile);
      parts.push({
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }
      });
    }
    
    // Add audio if provided
    if (audioFile) {
      const base64Audio = await fileToBase64(audioFile);
      parts.push({
        inlineData: {
          mimeType: audioFile.type,
          data: base64Audio.split(',')[1] // Remove data:audio/...;base64, prefix
        }
      });
    }

    const requestBody = {
      appName: currentAppName,
      userId: currentUserId,
      sessionId: currentSessionId,
      newMessage: {
        parts,
        role: "user"
      },
      streaming: false
    };

    console.log('[RUN AGENT] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${API_BASE}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[RUN AGENT] API Error:', response.status, errorText);
      if (response.status === 404 && errorText.includes('Session not found')) {
        throw new Error('SESSION_NOT_FOUND');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const bodyText = await response.text();
    console.log('[RUN AGENT] Non-streaming response:', bodyText.substring(0, 500) + '...');

    // Try to parse as JSON array (ADK non-streaming events)
    let productData: any = null;
    let finalText = '';
    try {
      const responseData = JSON.parse(bodyText);
      if (Array.isArray(responseData)) {
        for (const event of responseData) {
          if (event.content?.parts) {
            for (const part of event.content.parts) {
              const fr = part.functionResponse;
              if (fr?.response?.result && typeof fr.response.result === 'string') {
                const result = fr.response.result.trim();
                if (result.startsWith('{') && result.endsWith('}')) {
                  try {
                    const parsed = JSON.parse(result);
                    if (parsed?.type === 'product-display' && Array.isArray(parsed.products)) {
                      productData = parsed;
                    }
                  } catch (e) {
                    console.warn('[RUN AGENT] Failed to parse function result JSON', e);
                  }
                }
              } else if (part.text) {
                finalText = part.text;
              }
            }
          }
          // Capture usage metadata from each event if present
          try {
            const usage = (event as any).usageMetadata || (event as any).usage || (event as any).metadata?.usage;
            const detailsArr = usage?.promptTokensDetails || usage?.tokenDetails || [];
            const detail = Array.isArray(detailsArr) && detailsArr.length > 0 ? detailsArr[0] : undefined;
            const total = detail?.totalTokenCount ?? usage?.totalTokenCount ?? null;
            if (typeof total === 'number') {
              setTokenUsage({ totalTokenCount: total });
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn('[RUN AGENT] Failed to parse non-stream response as JSON array');
      finalText = bodyText;
    }

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      type: 'ai',
      content: finalText || bodyText,
      id: aiMessageId,
      agent: currentAgentRef.current,
      productData: productData || undefined,
      finalReportWithCitations: !!productData
    }]);
    return finalText || bodyText;
  };

  const handleStartNewChat = useCallback(async () => {
    try {
      const sessionData = await retryWithBackoff(createSession);
      setUserId(sessionData.userId);
      setSessionId(sessionData.sessionId);
      setAppName(sessionData.appName);
      setMessages([]);
      setMessageEvents(new Map());
      setDisplayData(null);
      setTokenUsage({ totalTokenCount: null });
      // Persist sessions if needed
      saveSessionsToStorage([]);
    } catch (e) {
      console.error('[NEW_CHAT] Failed to start new chat', e);
    }
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = useCallback(async (query: string, imageFile: File | null = null, audioFile: File | null = null) => {
    if (!query.trim() && !imageFile && !audioFile) return;

    setIsLoading(true);
    try {
      // Create session if it doesn't exist
      let currentUserId = userId;
      let currentSessionId = sessionId;
      let currentAppName = appName;
      
      if (!currentSessionId || !currentUserId || !currentAppName) {
        console.log('Creating new session...');
        const sessionData = await retryWithBackoff(createSession);
        currentUserId = sessionData.userId;
        currentSessionId = sessionData.sessionId;
        currentAppName = sessionData.appName;
        
        setUserId(currentUserId);
        setSessionId(currentSessionId);
        setAppName(currentAppName);
        console.log('Session created successfully:', { currentUserId, currentSessionId, currentAppName });
      }

      // Add user message to chat
      const userMessageId = Date.now().toString();
      let displayContent = "";
      
      if (query) {
        displayContent = query;
      } else if (audioFile) {
        displayContent = "🎤 Voice message";
      } else if (imageFile) {
        displayContent = "📷 Image";
      }
      
      // If both text and audio, show both
      if (query && audioFile) {
        displayContent = `${query} 🎤`;
      } else if (query && imageFile) {
        displayContent = `${query} 📷`;
      } else if (audioFile && imageFile) {
        displayContent = "🎤 Voice message 📷";
      } else if (query && audioFile && imageFile) {
        displayContent = `${query} 🎤📷`;
      }

      const userMessage: MessageWithAgent = {
        type: "human",
        content: displayContent,
        id: userMessageId,
      };

      setMessages(prev => [...prev, userMessage]);

      // Get agent response
      await runAgent(query || "Process this media", imageFile || undefined, audioFile || undefined, {
        userId: currentUserId!,
        sessionId: currentSessionId!,
        appName: currentAppName!
      });

    } catch (error) {
      console.error('[HANDLE_SUBMIT] Error during submit:', error);
      
      // Handle session not found error by recreating session and retrying
      if (error instanceof Error && error.message === 'SESSION_NOT_FOUND') {
        console.log('[HANDLE_SUBMIT] Session not found, creating new session and retrying...');
        try {
          // Reset session
          setSessionId(null);
          setUserId(null);
          setAppName(null);
          
          // Create new session
          const sessionData = await retryWithBackoff(createSession);
          setUserId(sessionData.userId);
          setSessionId(sessionData.sessionId);
          setAppName(sessionData.appName);
          
          // Retry the request with new session
          await runAgent(query || "Process this media", imageFile || undefined, audioFile || undefined, sessionData);
          return; // Success, exit function
        } catch (retryError) {
          console.error('[HANDLE_SUBMIT] Failed to recreate session:', retryError);
          error = retryError instanceof Error ? retryError : new Error('Failed to recreate session');
        }
      }
      
      let errorContent = `Xin lỗi, đã có lỗi xảy ra: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      // Add specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Failed to create session')) {
          errorContent = `Lỗi kết nối backend: Không thể tạo session. Vui lòng kiểm tra kết nối và thử lại.`;
        } else if (error.message.includes('Failed to fetch')) {
          errorContent = `Lỗi kết nối: Không thể kết nối tới backend. Vui lòng kiểm tra kết nối mạng.`;
        }
      }
      
      const errorMessage: MessageWithAgent = {
        type: "ai",
        content: errorContent,
        id: (Date.now() + 2).toString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionId, appName, API_BASE]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const checkBackend = async () => {
      setIsCheckingBackend(true);
      
      // Check if backend is ready with retry logic
      const maxAttempts = 60; // 2 minutes with 2-second intervals
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const isReady = await checkBackendHealth();
        if (isReady) {
          setIsBackendReady(true);
          setIsCheckingBackend(false);
          return;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
      }
      
      // If we get here, backend didn't come up in time
      setIsCheckingBackend(false);
      console.error("Backend failed to start within 2 minutes");
    };
    
    checkBackend();
  }, []);

  const handleCancel = useCallback(() => {
    setMessages([]);
    setDisplayData(null);
    setMessageEvents(new Map());
    // Reset session to create new one
    setSessionId(null);
    setUserId(null);
    setAppName(null);
    // Reset refs
    currentAgentRef.current = '';
    accumulatedTextRef.current = '';
  }, []);

  const BackendLoadingScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative bg-background">
      <Card className="w-full max-w-2xl border-2 border-primary/20 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-blue-600 flex items-center justify-center gap-3">
              MMVN Product Advisor
            </h1>
            
            <div className="flex flex-col items-center space-y-4">
              {/* Spinning animation */}
              <div className="relative">
                <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-accent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xl text-muted-foreground">
                  Đang khởi động backend...
                </p>
                <p className="text-sm text-muted-foreground/80">
                  Quá trình này có thể mất vài phút lần đầu khởi động
                </p>
              </div>
              
              {/* Animated dots */}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Derive humanMessages for sidebar
  const humanMessages = messages.filter((m) => m.type === "human").map((m) => ({ id: m.id, content: m.content }));

  // Session management handlers
  const handleSessionSelect = (session: ChatSession) => {
    setMessages(session.messages);
    setSessionId(session.id);
  };

  const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    setDisplayData(null);
    setMessageEvents(new Map());
    currentAgentRef.current = '';
    accumulatedTextRef.current = "";
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased">
      {/* Sidebar */}
      <ChatHistorySidebar
        humanMessages={humanMessages}
        currentMessages={messages}
        currentSessionId={sessionId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        {/* Mobile menu button */}
        <button
          className="lg:hidden absolute top-3 left-3 z-50 p-3 rounded-lg bg-card/90 backdrop-blur-md border shadow-lg hover:bg-card transition-colors touch-none min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>

        {isCheckingBackend ? (
          <BackendLoadingScreen />
        ) : !isBackendReady ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background">
            <Card className="border-2 border-destructive/20 shadow-lg">
              <CardContent className="p-8 text-center space-y-4">
                <h2 className="text-2xl font-bold text-destructive">Backend Không Khả Dụng</h2>
                <p className="text-muted-foreground">
                  Không thể kết nối với backend tại {API_BASE}
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="mt-4"
                >
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : messages.length === 0 ? (
          <WelcomeScreen
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            onCancel={handleCancel}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {tokenUsage.totalTokenCount !== null && tokenUsage.totalTokenCount >= 2000 && (
              <div className="p-3 sticky top-0 z-40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <Card>
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
                    <div className="text-sm">
                      <div className="font-medium">Đoạn chat đã quá dài</div>
                      <div className="text-muted-foreground">Tổng số token hiện tại là {tokenUsage.totalTokenCount?.toLocaleString?.() || tokenUsage.totalTokenCount}. Vui lòng bắt đầu đoạn chat mới để tiếp tục.</div>
                    </div>
                    <Button onClick={handleStartNewChat}>
                      Bắt đầu đoạn chat mới
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            <ChatMessagesView
              messages={messages}
              isLoading={isLoading}
              scrollAreaRef={scrollAreaRef as React.RefObject<HTMLDivElement>}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              displayData={displayData}
              messageEvents={messageEvents}
            />
          </div>
        )}
      </div>
    </div>
  );
} 