import { MessageWithAgent, ChatSession, SessionSummaryOptions, SessionNamingOptions, SessionSearchResult } from '@/types/chat';

// Session naming utilities
export const generateSessionName = (
  messages: MessageWithAgent[], 
  options: SessionNamingOptions = {
    useFirstMessage: true,
    useKeywords: true,
    maxLength: 50,
    fallbackPattern: 'Cuộc trò chuyện {date}'
  }
): string => {
  if (messages.length === 0) {
    return options.fallbackPattern.replace('{date}', new Date().toLocaleDateString('vi-VN'));
  }

  const firstHumanMessage = messages.find(m => m.type === 'human');
  
  if (options.useFirstMessage && firstHumanMessage) {
    let name = firstHumanMessage.content.trim();
    
    // Clean up the message for naming
    name = name.replace(/[^\w\s\u00C0-\u1EF9]/g, ''); // Keep Vietnamese characters
    name = name.split('\n')[0]; // Take first line only
    
    if (name.length > options.maxLength) {
      name = name.substring(0, options.maxLength - 3) + '...';
    }
    
    return name || options.fallbackPattern.replace('{date}', new Date().toLocaleDateString('vi-VN'));
  }

  if (options.useKeywords) {
    const keywords = extractKeywords(messages);
    if (keywords.length > 0) {
      const name = keywords.slice(0, 3).join(' ');
      return name.length > options.maxLength 
        ? name.substring(0, options.maxLength - 3) + '...'
        : name;
    }
  }

  return options.fallbackPattern.replace('{date}', new Date().toLocaleDateString('vi-VN'));
};

/**
 * Generate a smart session name based on chat content
 */
export function generateSmartSessionName(messages: MessageWithAgent[], maxLength: number = 40): string {
  if (messages.length === 0) {
    return "Cuộc trò chuyện mới";
  }

  // Try to find the first human message
  const firstHumanMessage = messages.find(m => m.type === "human");
  if (!firstHumanMessage) {
    return "Cuộc trò chuyện mới";
  }

  let content = firstHumanMessage.content.trim();
  
  // Remove common prefixes and clean up
  content = content
    .replace(/^(xin chào|chào|hi|hello|hey)/i, '')
    .replace(/^(bạn có thể|bạn có|bạn|can you|could you|please)/i, '')
    .replace(/^[,\s]+/, '')
    .replace(/[,\s]+$/, '')
    .trim();

  // If content is too short, try to find keywords
  if (content.length < 10) {
    // Look for product-related keywords
    const productKeywords = ['sản phẩm', 'mua', 'giá', 'thịt', 'rau', 'trái cây', 'đồ uống', 'bánh kẹo'];
    const foundKeyword = productKeywords.find(keyword => 
      messages.some(m => m.content.toLowerCase().includes(keyword))
    );
    
    if (foundKeyword) {
      content = `Tìm kiếm ${foundKeyword}`;
    } else {
      // Look for other patterns
      if (messages.some(m => m.content.toLowerCase().includes('thông tin'))) {
        content = "Hỏi đáp thông tin";
      } else if (messages.some(m => m.content.toLowerCase().includes('giúp'))) {
        content = "Yêu cầu hỗ trợ";
      } else if (messages.some(m => m.content.toLowerCase().includes('đặt hàng'))) {
        content = "Đặt hàng";
      } else {
        content = "Hỏi đáp thông tin";
      }
    }
  }

  // Capitalize first letter
  if (content.length > 0) {
    content = content.charAt(0).toUpperCase() + content.slice(1);
  }

  // Truncate if too long
  if (content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + "...";
  }

  return content || "Cuộc trò chuyện mới";
}

/**
 * Extract main topics from chat messages
 */
export function extractChatTopics(messages: MessageWithAgent[]): string[] {
  const topics: string[] = [];
  
  // Look for common patterns in messages
  const patterns = [
    { regex: /sản phẩm|mua|giá|thịt|rau|trái cây|đồ uống|bánh kẹo|đồ gia dụng|thực phẩm/gi, label: 'Mua sắm' },
    { regex: /thông tin|giới thiệu|về|công ty|cửa hàng|chi nhánh|địa chỉ/gi, label: 'Thông tin' },
    { regex: /hỗ trợ|giúp|vấn đề|lỗi|khó khăn|thắc mắc/gi, label: 'Hỗ trợ' },
    { regex: /đặt hàng|thanh toán|giao hàng|vận chuyển|shipping|delivery/gi, label: 'Đơn hàng' },
    { regex: /chính sách|quy định|điều khoản|hướng dẫn/gi, label: 'Chính sách' }
  ];

  // Count matches for each pattern
  const patternCounts = new Map<string, number>();
  
  for (const message of messages) {
    for (const pattern of patterns) {
      if (pattern.regex.test(message.content)) {
        const count = patternCounts.get(pattern.label) || 0;
        patternCounts.set(pattern.label, count + 1);
      }
    }
  }

  // Sort by frequency and take top 3
  const sortedPatterns = Array.from(patternCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  return sortedPatterns;
}

// Session summarization
export const generateSessionSummary = (
  messages: MessageWithAgent[],
  options: SessionSummaryOptions = {
    maxLength: 150,
    includeKeywords: true,
    language: 'vi'
  }
): string => {
  if (messages.length === 0) return '';

  const humanMessages = messages.filter(m => m.type === 'human');
  const aiMessages = messages.filter(m => m.type === 'ai');
  
  // Extract main topics
  const topics = extractTopics(messages);
  const keywords = extractKeywords(messages);
  
  let summary = '';
  
  if (options.language === 'vi') {
    summary = `Cuộc trò chuyện với ${humanMessages.length} câu hỏi và ${aiMessages.length} phản hồi.`;
    
    if (topics.length > 0) {
      summary += ` Chủ đề chính: ${topics.slice(0, 2).join(', ')}.`;
    }
    
    if (options.includeKeywords && keywords.length > 0) {
      summary += ` Từ khóa: ${keywords.slice(0, 3).join(', ')}.`;
    }
  } else {
    summary = `Conversation with ${humanMessages.length} questions and ${aiMessages.length} responses.`;
    
    if (topics.length > 0) {
      summary += ` Main topics: ${topics.slice(0, 2).join(', ')}.`;
    }
    
    if (options.includeKeywords && keywords.length > 0) {
      summary += ` Keywords: ${keywords.slice(0, 3).join(', ')}.`;
    }
  }
  
  return summary.length > options.maxLength 
    ? summary.substring(0, options.maxLength - 3) + '...'
    : summary;
};

// Extract keywords from messages
const extractKeywords = (messages: MessageWithAgent[]): string[] => {
  const commonWords = new Set([
    'tôi', 'bạn', 'là', 'có', 'và', 'của', 'trong', 'để', 'với', 'này', 'đó',
    'được', 'cho', 'như', 'về', 'một', 'các', 'hay', 'sẽ', 'cần', 'gì', 'ai',
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
    'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
    'what', 'how', 'when', 'where', 'why', 'can', 'could', 'would', 'should'
  ]);

  const allText = messages
    .map(m => m.content.toLowerCase())
    .join(' ')
    .replace(/[^\w\s\u00C0-\u1EF9]/g, ' ');

  const words = allText
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

// Extract topics from messages
const extractTopics = (messages: MessageWithAgent[]): string[] => {
  const keywords = extractKeywords(messages);
  
  // Group keywords into topics (simplified approach)
  const ecommerceKeywords = ['sản phẩm', 'giá', 'mua', 'bán', 'đặt hàng', 'giỏ hàng', 'thanh toán', 'product', 'price', 'buy', 'order', 'cart', 'payment'];
  const techKeywords = ['code', 'lập trình', 'phần mềm', 'website', 'ứng dụng', 'programming', 'software', 'application', 'development'];
  const generalKeywords = ['hỏi', 'trả lời', 'giúp', 'hỗ trợ', 'question', 'answer', 'help', 'support'];
  
  const topics: string[] = [];
  
  if (keywords.some(k => ecommerceKeywords.includes(k))) {
    topics.push('Mua sắm');
  }
  
  if (keywords.some(k => techKeywords.includes(k))) {
    topics.push('Công nghệ');
  }
  
  if (keywords.some(k => generalKeywords.includes(k))) {
    topics.push('Hỗ trợ chung');
  }
  
  return topics.length > 0 ? topics : ['Trò chuyện'];
};

// Session categorization
export const categorizeSession = (messages: MessageWithAgent[]): string => {
  const topics = extractTopics(messages);
  
  if (topics.includes('Mua sắm')) return 'ecommerce';
  if (topics.includes('Công nghệ')) return 'tech';
  if (topics.includes('Hỗ trợ chung')) return 'support';
  
  return 'general';
};

// Search functionality
export const searchSessions = (
  sessions: ChatSession[],
  query: string
): SessionSearchResult[] => {
  if (!query.trim()) return [];
  
  const results: SessionSearchResult[] = [];
  const searchTerms = query.toLowerCase().split(/\s+/);
  
  sessions.forEach(session => {
    let relevanceScore = 0;
    let matchType: 'name' | 'summary' | 'content' = 'content';
    let matchedMessage: MessageWithAgent | undefined;
    
    // Search in session name
    const nameMatch = searchTerms.every(term => 
      session.name.toLowerCase().includes(term)
    );
    if (nameMatch) {
      relevanceScore += 100;
      matchType = 'name';
    }
    
    // Search in summary
    if (session.summary) {
      const summaryMatch = searchTerms.every(term => 
        session.summary!.toLowerCase().includes(term)
      );
      if (summaryMatch) {
        relevanceScore += 50;
        if (matchType === 'content') matchType = 'summary';
      }
    }
    
    // Search in message content
    session.messages.forEach(message => {
      const contentMatch = searchTerms.some(term => 
        message.content.toLowerCase().includes(term)
      );
      if (contentMatch) {
        relevanceScore += 10;
        if (!matchedMessage) matchedMessage = message;
      }
    });
    
    if (relevanceScore > 0) {
      results.push({
        session,
        matchType,
        matchedMessage,
        relevanceScore
      });
    }
  });
  
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

// Date utilities
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  
  if (diff < minute) return 'Vừa xong';
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`;
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`;
  if (diff < week) return `${Math.floor(diff / day)} ngày trước`;
  if (diff < month) return `${Math.floor(diff / week)} tuần trước`;
  
  return new Date(timestamp).toLocaleDateString('vi-VN');
};

// Session storage utilities
export const saveSessionsToStorage = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem('chatSessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save sessions to storage:', error);
  }
};

export const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem('chatSessions');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load sessions from storage:', error);
    return [];
  }
};

// Create session from current messages
export const createSessionFromMessages = (
  messages: MessageWithAgent[],
  sessionId?: string
): ChatSession => {
  const now = Date.now();
  
  return {
    id: sessionId || `session_${now}`,
    name: generateSessionName(messages),
    summary: generateSessionSummary(messages),
    messages: messages.map(m => ({ ...m, timestamp: m.timestamp || now })),
    createdAt: now,
    updatedAt: now,
    messageCount: messages.length,
    category: categorizeSession(messages),
    isArchived: false,
    tags: extractKeywords(messages).slice(0, 5)
  };
}; 