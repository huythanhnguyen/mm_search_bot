import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  agent?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ agent }) => {
  return (
    <div className="flex justify-start animate-slide-up">
      <Card className="bg-card border shadow-sm max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-3xl">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
              {/* Agent badge */}
              {agent && (
                <Badge variant="secondary" className="text-xs">
                  {agent.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              )}
              
              {/* Enhanced typing animation with smooth movement */}
              <div className="flex items-center space-x-1">
                <div 
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full animate-typing-dot"
                  style={{
                    animationDelay: '0ms'
                  }}
                ></div>
                <div 
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary/70 rounded-full animate-typing-dot"
                  style={{
                    animationDelay: '200ms'
                  }}
                ></div>
                <div 
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary/40 rounded-full animate-typing-dot"
                  style={{
                    animationDelay: '400ms'
                  }}
                ></div>
              </div>
              
              {/* Loading text */}
              <p className="text-xs sm:text-sm text-muted-foreground">
                Đang xử lý...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
