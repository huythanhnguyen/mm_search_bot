import React from "react";
import { InputForm } from "@/components/InputForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RotateCcw, Bot, User } from "lucide-react";

import ProductGrid from "@/components/ProductGrid";
import { ThinkingProcess } from "@/components/ThinkingProcess";
import { TypingIndicator } from "@/components/TypingIndicator";
import { parseMessage, testMessageParser } from "@/utils/messageParser";
import { MessageWithAgent } from "@/types/chat";

interface ProcessedEvent {
  title: string;
  data: any;
}

interface ChatMessagesViewProps {
  messages: MessageWithAgent[];
  isLoading: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  onSubmit: (query: string, imageFile: File | null, audioFile: File | null) => void;
  onCancel: () => void;
  displayData: string | null;
  messageEvents: Map<string, ProcessedEvent[]>;
}

export function ChatMessagesView({
  messages,
  isLoading,
  scrollAreaRef,
  onSubmit,
  onCancel,
}: ChatMessagesViewProps) {
  // Test message parser on component mount (only in development)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ChatMessagesView] Component mounted, running test cases...');
      testMessageParser();
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-card/50">
        {/* Left side - empty for centering */}
        <div className="w-10 sm:w-16"></div>
        
        {/* Center - title */}
        <h1 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <span className="hidden xs:inline">MM Multi Agent</span>
          <span className="xs:hidden">MM Agent</span>
        </h1>
        
        {/* Right side - reset button */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] sm:min-w-auto sm:min-h-auto"
            aria-label="Reset conversation"
          >
            <RotateCcw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "human" ? "justify-end" : "justify-start"
            } animate-slide-up`}
          >
            <Card
              className={`max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl ${
                message.type === "human"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border"
              } shadow-sm`}
            >
              <CardContent className="p-2 sm:p-3 md:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    message.type === "human" 
                      ? "bg-primary-foreground/20" 
                      : "bg-primary/10"
                  }`}>
                    {message.type === "human" ? (
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                    {/* Agent badge for AI messages */}
                    {message.type === "ai" && message.agent && (
                      <Badge variant="secondary" className="text-xs">
                        {message.agent.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    )}
                    
                                         {/* Message content */}
                     <div className="space-y-2 sm:space-y-3">
                       {(() => {
                         const parsedMessage = parseMessage(message.content);
                         
                         // Debug logging only in development
                         if (process.env.NODE_ENV === 'development') {
                           console.log('[ChatMessagesView] Parsed message:', parsedMessage);
                           console.log('[ChatMessagesView] Message type:', parsedMessage.type);
                           console.log('[ChatMessagesView] Product data:', parsedMessage.productData);
                           console.log('[ChatMessagesView] Message productData:', message.productData);
                           console.log('[ChatMessagesView] Raw message content:', message.content.substring(0, 200) + '...');
                         }
                         
                         return (
                           <>
                             {/* Thinking Process - show in collapsible for AI messages */}
                             {message.type === "ai" && (
                               <ThinkingProcess 
                                 thinkingContent={message.content} 
                                 agent={message.agent}
                               />
                             )}
                             
                             {/* Text content - show completion message and other non-thinking content */}
                             {parsedMessage.text && parsedMessage.text.trim() && 
                              (!parsedMessage.text.includes('🔍') && 
                               !parsedMessage.text.includes('🔄') && 
                               !parsedMessage.text.includes('✅') && 
                               !parsedMessage.text.includes('**Phân tích:**') &&
                               !parsedMessage.text.includes('**Đang thực hiện:**') &&
                               !parsedMessage.text.includes('**Hoàn thành:**')) && (
                               <div className={`prose prose-sm max-w-none ${
                                 message.type === "human"
                                   ? "prose-invert text-primary-foreground"
                                   : "prose-gray text-card-foreground"
                               }`}>
                                 <ReactMarkdown
                                   remarkPlugins={[remarkGfm]}
                                   components={{
                                     // Custom styling for markdown elements
                                     p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                     ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                                     ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                                     li: ({ children }) => <li className="mb-1">{children}</li>,
                                     strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                     em: ({ children }) => <em className="italic">{children}</em>,
                                     code: ({ children }) => (
                                       <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                                         {children}
                                       </code>
                                     ),
                                     pre: ({ children }) => (
                                       <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                                         {children}
                                       </pre>
                                     ),
                                   }}
                                 >
                                   {parsedMessage.text}
                                 </ReactMarkdown>
                               </div>
                             )}
                             
                             {/* Product cards - show from real-time productData or parsed message */}
                             {(message.productData || parsedMessage.type === 'product-display') && (
                               <div className="mt-2 sm:mt-3 md:mt-4">
                                 {(() => {
                                   // Use real-time productData if available, otherwise use parsed message
                                   const productData = message.productData || parsedMessage.productData;
                                   return (
                                     <>
                                       {productData && productData.message && (
                                         <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                                           {productData.message}
                                         </p>
                                       )}
                                       {productData && productData.products && (
                                         <ProductGrid products={productData.products} />
                                       )}
                                     </>
                                   );
                                 })()}
                               </div>
                             )}
                           </>
                         );
                       })()}
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <TypingIndicator agent={messages.length > 0 ? messages[messages.length - 1]?.agent : "ai_agent"} />
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-card/50 p-2 sm:p-3 md:p-4">
        <InputForm 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
          context="chat"
        />
      </div>
    </div>
  );
} 