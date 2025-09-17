import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ThinkingProcessProps {
  thinkingContent: string;
  agent?: string;
}

export function ThinkingProcess({ thinkingContent, agent }: ThinkingProcessProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if content contains thinking patterns
  const hasThinkingContent = thinkingContent.includes('🔍') || 
                            thinkingContent.includes('🔄') || 
                            thinkingContent.includes('✅') ||
                            thinkingContent.includes('**Phân tích:**') ||
                            thinkingContent.includes('**Đang thực hiện:**') ||
                            thinkingContent.includes('**Hoàn thành:**');

  if (!hasThinkingContent) {
    return null;
  }

  // Extract and clean thinking content - only show logic, not JSON
  const extractThinkingLogic = (content: string): string => {
    let cleanContent = content;
    
    // Remove all JSON blocks completely - more comprehensive patterns
    cleanContent = cleanContent.replace(/```json[\s\S]*?```/g, '');
    cleanContent = cleanContent.replace(/```\s*\{[\s\S]*?\}\s*```/g, '');
    
    // Remove product-display JSON objects - more specific patterns
    cleanContent = cleanContent.replace(/\{[^{}]*"type"\s*:\s*"product-display"[^{}]*"products"\s*:[\s\S]*?\}/g, '');
    cleanContent = cleanContent.replace(/\{[^{}]*"products"\s*:[\s\S]*?"type"\s*:\s*"product-display"[^{}]*\}/g, '');
    
    // Remove any remaining JSON-like structures
    cleanContent = cleanContent.replace(/\{[^{}]*"type"[^{}]*"message"[^{}]*\}/g, '');
    cleanContent = cleanContent.replace(/\{[^{}]*"products"[^{}]*\}/g, '');
    cleanContent = cleanContent.replace(/\{[^{}]*"id"[^{}]*"sku"[^{}]*"name"[^{}]*\}/g, '');
    
    // Remove any lines that start with { or contain JSON-like content
    const lines = cleanContent.split('\n').filter(line => {
      const trimmedLine = line.trim();
      return !trimmedLine.startsWith('{') && 
             !trimmedLine.includes('"type"') && 
             !trimmedLine.includes('"products"') &&
             !trimmedLine.includes('"id"') &&
             !trimmedLine.includes('"sku"') &&
             !trimmedLine.includes('"name"') &&
             !trimmedLine.includes('"price"') &&
             !trimmedLine.includes('"image"') &&
             !trimmedLine.includes('"description"') &&
             !trimmedLine.includes('"productUrl"') &&
             !trimmedLine.includes('"currency"') &&
             !trimmedLine.includes('"current"') &&
             !trimmedLine.includes('"url"');
    });
    cleanContent = lines.join('\n');
    
    // Extract thinking patterns with better regex - focus on the specific patterns requested
    const thinkingPatterns = [
      // Pattern 1: Full pattern with markdown including completion
      /🔍 \*\*Phân tích:\*\*[^🔄]*🔄 \*\*Đang thực hiện:\*\*[^✅]*✅ \*\*Hoàn thành:\*\*[^🔍]*/g,
      // Pattern 2: Full pattern without markdown including completion
      /🔍 Phân tích:[^🔄]*🔄 Đang thực hiện:[^✅]*✅ Hoàn thành:[^🔍]*/g,
      // Pattern 3: Individual patterns with completion
      /🔍 \*\*Phân tích:\*\*[^🔄]*🔄 \*\*Đang thực hiện:\*\*[^✅]*✅ \*\*Hoàn thành:\*\*/g,
      /🔍 Phân tích:[^🔄]*🔄 Đang thực hiện:[^✅]*✅ Hoàn thành:/g,
      // Pattern 4: Individual patterns without completion
      /🔍 \*\*Phân tích:\*\*[^🔄]*🔄 \*\*Đang thực hiện:\*\*/g,
      /🔍 Phân tích:[^🔄]*🔄 Đang thực hiện:/g,
      // Pattern 5: Just analysis and execution
      /🔍 \*\*Phân tích:\*\*[^🔍🔄✅]*🔄 \*\*Đang thực hiện:\*\*[^🔍🔄✅]*/g,
      /🔍 Phân tích:[^🔍🔄✅]*🔄 Đang thực hiện:[^🔍🔄✅]*/g
    ];
    
    let extractedContent = '';
    for (const pattern of thinkingPatterns) {
      const matches = cleanContent.match(pattern);
      if (matches) {
        extractedContent = matches.join('\n\n');
        break;
      }
    }
    
    // If no thinking patterns found, try to extract individual lines including completion
    if (!extractedContent.trim()) {
      const lines = cleanContent.split('\n').filter(line => {
        const trimmedLine = line.trim();
        return trimmedLine.includes('🔍') || 
               trimmedLine.includes('🔄') || 
               trimmedLine.includes('✅') ||
               trimmedLine.includes('**Phân tích:**') ||
               trimmedLine.includes('**Đang thực hiện:**') ||
               trimmedLine.includes('**Hoàn thành:**');
      });
      
      if (lines.length > 0) {
        extractedContent = lines.join('\n');
      }
    }
    
    // Clean up and format - remove extra whitespace and newlines
    extractedContent = extractedContent
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '') // Remove leading/trailing whitespace
      .trim();
    
    // Only show "Đang xử lý..." if no thinking content found
    return extractedContent || 'Đang xử lý...';
  };

  const thinkingLogic = extractThinkingLogic(thinkingContent);

  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
      <CardContent className="p-2 sm:p-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Brain className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {agent ? `${agent.replace('_', ' ')} Process` : 'Thinking Process'}
            </span>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {isExpanded ? 'Hide' : 'Show'}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white rounded border text-xs sm:text-sm text-gray-600 font-mono overflow-x-auto">
            <div className="whitespace-pre-wrap break-words">
              {thinkingLogic}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
