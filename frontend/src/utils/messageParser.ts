import { ProductDisplayMessage } from '@/types/product';

export interface ParsedMessage {
  type: 'text' | 'product-display';
  text: string;
  productData?: ProductDisplayMessage;
}

export function parseMessage(content: string): ParsedMessage {
  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[MessageParser] Parsing message:', content.substring(0, 200) + '...');
  }
  
  // Try multiple JSON detection patterns
  let jsonText = '';
  
  // Pattern 1: JSON in markdown code blocks (```json...```)
  const markdownJsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (markdownJsonMatch) {
    jsonText = markdownJsonMatch[1];
    if (process.env.NODE_ENV === 'development') {
      console.log('[MessageParser] Found markdown JSON:', jsonText.substring(0, 100) + '...');
    }
  } else {
    // Pattern 2: JSON in plain code blocks (```...```)
    const plainCodeMatch = content.match(/```\s*(\{[\s\S]*?\})\s*```/);
    if (plainCodeMatch) {
      jsonText = plainCodeMatch[1];
      if (process.env.NODE_ENV === 'development') {
        console.log('[MessageParser] Found plain code JSON:', jsonText.substring(0, 100) + '...');
      }
    } else {
      // Pattern 3: Standalone JSON object (no code blocks) - improved pattern
      const standaloneJsonMatch = content.match(/(\{[\s\S]*?"type"\s*:\s*"product-display"[\s\S]*?"products"\s*:\s*\[[\s\S]*?\][\s\S]*?\})/);
      if (standaloneJsonMatch) {
        jsonText = standaloneJsonMatch[1];
        if (process.env.NODE_ENV === 'development') {
          console.log('[MessageParser] Found standalone JSON:', jsonText.substring(0, 100) + '...');
        }
      } else {
        // Pattern 4: Multi-line JSON without code blocks (more flexible)
        const lines = content.split('\n');
        let jsonStart = -1;
        let jsonEnd = -1;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('{') && (line.includes('"type"') || line.includes('"product-display"') || i < lines.length - 1 && lines[i + 1].includes('"type"'))) {
            jsonStart = i;
            braceCount = 1;
          } else if (jsonStart >= 0) {
            for (let char of line) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
            }
            if (braceCount === 0) {
              jsonEnd = i;
              break;
            }
          }
        }
        
        if (jsonStart >= 0 && jsonEnd >= 0) {
          jsonText = lines.slice(jsonStart, jsonEnd + 1).join('\n');
          if (process.env.NODE_ENV === 'development') {
            console.log('[MessageParser] Found multi-line JSON:', jsonText.substring(0, 100) + '...');
          }
        } else {
          // Pattern 5: Try to find any JSON object that might contain products
          const anyJsonMatch = content.match(/(\{[\s\S]*?"products"\s*:\s*\[[\s\S]*?\][\s\S]*?\})/);
          if (anyJsonMatch) {
            jsonText = anyJsonMatch[1];
            if (process.env.NODE_ENV === 'development') {
              console.log('[MessageParser] Found JSON with products array:', jsonText.substring(0, 100) + '...');
            }
          } else {
            // Pattern 6: Look for JSON-like structure with product-display type
            const productDisplayMatch = content.match(/\{[^{}]*"type"\s*:\s*"product-display"[^{}]*\}/);
            if (productDisplayMatch) {
              // Try to extract the full JSON object
              const startIndex = content.indexOf(productDisplayMatch[0]);
              let braceCount = 0;
              let endIndex = startIndex;
              
              for (let i = startIndex; i < content.length; i++) {
                if (content[i] === '{') braceCount++;
                if (content[i] === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    endIndex = i;
                    break;
                  }
                }
              }
              
              if (endIndex > startIndex) {
                jsonText = content.substring(startIndex, endIndex + 1);
                if (process.env.NODE_ENV === 'development') {
                  console.log('[MessageParser] Found product-display JSON structure:', jsonText.substring(0, 100) + '...');
                }
              }
            } else {
              // Pattern 7: Look for JSON starting with { and containing product-display
              let startIdx = content.indexOf('{');
              if (startIdx !== -1) {
                let braceCount = 0;
                let endIdx = startIdx;
                
                for (let i = startIdx; i < content.length; i++) {
                  if (content[i] === '{') braceCount++;
                  if (content[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      endIdx = i;
                      break;
                    }
                  }
                }
                
                if (endIdx > startIdx) {
                  const potentialJson = content.substring(startIdx, endIdx + 1);
                  if (potentialJson.includes('"type"') && potentialJson.includes('"product-display"')) {
                    jsonText = potentialJson;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('[MessageParser] Found JSON by brace matching:', jsonText.substring(0, 100) + '...');
                    }
                  }
                }
              }
              
              if (!jsonText) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('[MessageParser] No JSON pattern found in message');
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Try to parse the detected JSON
  if (jsonText) {
    try {
      // Handle escaped JSON strings (common in last_coordinator_response)
      let cleanJsonText = jsonText;
      
      // Remove escape characters if present
      if (cleanJsonText.includes('\\n')) {
        cleanJsonText = cleanJsonText.replace(/\\n/g, '\n');
      }
      if (cleanJsonText.includes('\\"')) {
        cleanJsonText = cleanJsonText.replace(/\\"/g, '"');
      }
      if (cleanJsonText.includes('\\\\')) {
        cleanJsonText = cleanJsonText.replace(/\\\\/g, '\\');
      }
      
      const parsedData = JSON.parse(cleanJsonText);
      if (process.env.NODE_ENV === 'development') {
        console.log('[MessageParser] Successfully parsed JSON:', parsedData);
      }
      
      // Check if it's a product display message
      if (parsedData.type === 'product-display' && parsedData.products && Array.isArray(parsedData.products)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[MessageParser] Detected product-display with', parsedData.products.length, 'products');
        }
        
        // Clean the text by removing the JSON part
        let cleanText = content;
        if (markdownJsonMatch) {
          cleanText = content.replace(/```json[\s\S]*?```/g, '').trim();
        } else {
          cleanText = content.replace(jsonText, '').trim();
        }
        
        // If cleanText is empty or contains only whitespace/newlines, use the message from the JSON
        if (!cleanText || cleanText.match(/^\s*$/) || cleanText === jsonText) {
          cleanText = parsedData.message || '';
        }
        
        // Remove duplicate content - if cleanText contains the same content as JSON message
        if (cleanText && parsedData.message && cleanText.includes(parsedData.message)) {
          cleanText = parsedData.message;
        }
        
        // Handle thinking/processing messages that might be duplicated
        // Handle both markdown and non-markdown thinking patterns
        if (cleanText && (cleanText.includes('🔍 **Phân tích:**') || cleanText.includes('🔍 Phân tích:'))) {
          // Extract the first occurrence of the thinking pattern (both markdown and non-markdown)
          const thinkingPatterns = [
            /🔍 \*\*Phân tích:\*\*[^🔄]*🔄 \*\*Đang thực hiện:\*\*[^✅]*✅ \*\*Hoàn thành:\*\*[^🔍]*/,
            /🔍 Phân tích:[^🔄]*🔄 Đang thực hiện:[^✅]*✅ Hoàn thành:[^🔍]*/,
            /🔍 \*\*Phân tích:\*\*[^🔄]*🔄 \*\*Đang thực hiện:\*\*/,
            /🔍 Phân tích:[^🔄]*🔄 Đang thực hiện:[^🔍]*/
          ];
          
          for (const pattern of thinkingPatterns) {
            const match = cleanText.match(pattern);
            if (match) {
              cleanText = match[0];
              break;
            }
          }
        }
        
        // Remove completely duplicate content patterns
        // Split by common thinking separators and take only unique parts (both markdown and non-markdown)
        if (cleanText && (cleanText.includes('🔍 **Phân tích:**') || cleanText.includes('🔍 Phân tích:') || 
                         cleanText.includes('🔄 **Đang thực hiện:**') || cleanText.includes('🔄 Đang thực hiện:') ||
                         cleanText.includes('✅ **Hoàn thành:**') || cleanText.includes('✅ Hoàn thành:'))) {
          const parts = cleanText.split(/(?=🔍 \*\*Phân tích:\*\*|🔍 Phân tích:|🔄 \*\*Đang thực hiện:\*\*|🔄 Đang thực hiện:|✅ \*\*Hoàn thành:\*\*|✅ Hoàn thành:)/);
          const uniqueParts = parts.filter((part, index, arr) => {
            if (!part.trim()) return false;
            // Check if this part is a duplicate of any previous part
            return !arr.slice(0, index).some(prevPart => 
              prevPart.trim() && part.trim() === prevPart.trim()
            );
          });
          cleanText = uniqueParts.join('').trim();
        }
        
        // Additional cleanup for thinking messages that might have repeated patterns
        if (cleanText && (cleanText.includes('🔍 **Phân tích:**') || cleanText.includes('🔍 Phân tích:'))) {
          // Remove any duplicate thinking patterns that might be concatenated (both markdown and non-markdown)
          const thinkingPatterns = [
            /🔍 \*\*Phân tích:\*\*[^🔍]*/g,
            /🔍 Phân tích:[^🔍]*/g
          ];
          
          for (const pattern of thinkingPatterns) {
            const matches = cleanText.match(pattern);
            if (matches && matches.length > 1) {
              // Take only the first complete thinking pattern
              const firstMatch = matches[0];
              const nextPatternIndex = cleanText.indexOf(matches[0].includes('**') ? '🔍 **Phân tích:**' : '🔍 Phân tích:', firstMatch.length);
              if (nextPatternIndex > 0) {
                cleanText = cleanText.substring(0, nextPatternIndex).trim();
              }
              break;
            }
          }
        }
        
        return {
          type: 'product-display',
          text: cleanText,
          productData: parsedData
        };
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('[MessageParser] JSON is not product-display type or missing products array:', parsedData.type, parsedData.products);
        }
      }
    } catch (error) {
      console.warn('[MessageParser] Failed to parse JSON:', error);
      console.warn('[MessageParser] JSON text was:', jsonText);
    }
  }
  
  // Default to text message
  if (process.env.NODE_ENV === 'development') {
    console.log('[MessageParser] Returning as text message');
  }
  
  // Clean thinking content from final text display
  let cleanContent = content;
  
  // Remove thinking patterns from final display - but keep completion message
  const thinkingPatterns = [
    /🔍 \*\*Phân tích:\*\*[^🔄]*🔄 \*\*Đang thực hiện:\*\*[^🔍]*/g,
    /🔍 Phân tích:[^🔄]*🔄 Đang thực hiện:[^🔍]*/g
  ];
  
  for (const pattern of thinkingPatterns) {
    cleanContent = cleanContent.replace(pattern, '');
  }
  
  // Clean up extra whitespace and newlines
  cleanContent = cleanContent.replace(/\n\s*\n/g, '\n').trim();
  
  // Remove duplicate content patterns
  // Check if the content contains the same text repeated
  if (cleanContent) {
    // First, check if the entire content is duplicated
    const halfLength = Math.floor(cleanContent.length / 2);
    const firstHalf = cleanContent.substring(0, halfLength);
    const secondHalf = cleanContent.substring(halfLength);
    
    // If first half and second half are very similar (allowing for minor differences)
    if (firstHalf.trim() === secondHalf.trim()) {
      cleanContent = firstHalf.trim();
    } else {
      // Check for duplicate lines
      const lines = cleanContent.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        // Check if first and second lines are identical
        if (lines[0] === lines[1]) {
          // Remove duplicate lines
          const uniqueLines = [lines[0]];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i] !== lines[i-1]) {
              uniqueLines.push(lines[i]);
            }
          }
          cleanContent = uniqueLines.join('\n');
        }
        
        // Check for duplicate paragraphs (same content repeated)
        const paragraphs = cleanContent.split(/\n\s*\n/).filter(p => p.trim());
        if (paragraphs.length >= 2) {
          const uniqueParagraphs = [paragraphs[0]];
          for (let i = 1; i < paragraphs.length; i++) {
            if (paragraphs[i] !== paragraphs[i-1]) {
              uniqueParagraphs.push(paragraphs[i]);
            }
          }
          cleanContent = uniqueParagraphs.join('\n\n');
        }
      }
    }
  }
  
  return {
    type: 'text',
    text: cleanContent || content // Fallback to original if cleaned is empty
  };
}

export function extractProductData(content: string): ProductDisplayMessage | null {
  const parsedMessage = parseMessage(content);
  return parsedMessage.type === 'product-display' ? parsedMessage.productData || null : null;
}

export function cleanMessageText(content: string): string {
  // Remove JSON blocks from message content using the same logic as parseMessage
  let cleanedContent = content;
  
  // Remove markdown JSON blocks
  cleanedContent = cleanedContent.replace(/```json[\s\S]*?```/g, '');
  
  // Remove plain code blocks that might contain JSON
  cleanedContent = cleanedContent.replace(/```\s*\{[\s\S]*?\}\s*```/g, '');
  
  // Remove standalone JSON objects
  cleanedContent = cleanedContent.replace(/\{[^{}]*"type"\s*:\s*"product-display"[^{}]*"products"\s*:[\s\S]*?\}/g, '');
  
  return cleanedContent.trim();
}

// Test function for debugging (only in development)
export function testMessageParser() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const testCases = [
    {
      name: 'Simple product display JSON',
      content: '{"type": "product-display", "message": "Test", "products": []}',
      expected: 'product-display'
    },
    {
      name: 'Duplicate greeting message',
      content: 'Chào bạn! Rất vui được gặp bạn. Tôi có thể giúp bạn tìm hiểu thông tin về MM Mega Market Việt Nam.\nChào bạn! Rất vui được gặp bạn. Tôi có thể giúp bạn tìm hiểu thông tin về MM Mega Market Việt Nam.',
      expected: 'text'
    }
  ];
  
  testCases.forEach(testCase => {
    const result = parseMessage(testCase.content);
    console.log(`[Test] ${testCase.name}:`, {
      expected: testCase.expected,
      actual: result.type,
      success: result.type === testCase.expected
    });
  });
} 