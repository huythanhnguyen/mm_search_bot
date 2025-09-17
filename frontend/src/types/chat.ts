import { ProductDisplayMessage } from './product';

// Chat message types
export interface MessageWithAgent {
  type: "human" | "ai";
  content: string;
  id: string;
  agent?: string;
  finalReportWithCitations?: boolean;
  timestamp?: number;
  productData?: ProductDisplayMessage; // Add support for real-time product data
}

// Session types for enhanced chat history
export interface ChatSession {
  id: string;
  name: string;
  summary?: string;
  messages: MessageWithAgent[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  category?: string;
  isArchived?: boolean;
  tags?: string[];
}

// Session group types
export interface SessionGroup {
  id: string;
  name: string;
  sessions: ChatSession[];
  createdAt: number;
  color?: string;
}

// Search and filter types
export interface SessionSearchResult {
  session: ChatSession;
  matchType: 'name' | 'summary' | 'content';
  matchedMessage?: MessageWithAgent;
  relevanceScore: number;
}

export interface SessionFilters {
  category?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  tags?: string[];
  isArchived?: boolean;
  searchQuery?: string;
}

// UI state types
export interface ChatHistoryState {
  sessions: ChatSession[];
  groups: SessionGroup[];
  currentSessionId: string | null;
  selectedFilters: SessionFilters;
  searchResults: SessionSearchResult[];
  isSearching: boolean;
}

// Utility types
export interface SessionSummaryOptions {
  maxLength: number;
  includeKeywords: boolean;
  language: 'vi' | 'en';
}

export interface SessionNamingOptions {
  useFirstMessage: boolean;
  useKeywords: boolean;
  maxLength: number;
  fallbackPattern: string;
} 