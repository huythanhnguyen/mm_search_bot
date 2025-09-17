import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatSession, SessionFilters, SessionSearchResult } from '@/types/chat';
import { SessionSummary } from './SessionSummary';
import { searchSessions, formatRelativeTime } from '@/utils/sessionUtils';
import { 
  Search, 
  Filter, 
  Plus, 
  Archive, 
  Trash2, 
  Edit3, 
  Calendar,
  Tag,
  MoreHorizontal,
  ChevronDown,
  X
} from 'lucide-react';

interface SessionManagerProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  onSessionRename: (sessionId: string, newName: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionArchive: (sessionId: string) => void;
  compact?: boolean;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onSessionRename,
  onSessionDelete,
  onSessionArchive,
  compact = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SessionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter sessions
  const { filteredSessions, searchResults } = useMemo(() => {
    let filtered = [...sessions];

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(s => s.category === filters.category);
    }

    if (filters.isArchived !== undefined) {
      filtered = filtered.filter(s => s.isArchived === filters.isArchived);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(s => 
        s.updatedAt >= filters.dateRange!.start && 
        s.updatedAt <= filters.dateRange!.end
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(s => 
        s.tags?.some(tag => filters.tags!.includes(tag))
      );
    }

    // Apply search
    let searchResults: SessionSearchResult[] = [];
    if (searchQuery.trim()) {
      searchResults = searchSessions(filtered, searchQuery);
      filtered = searchResults.map(r => r.session);
    }

    // Sort by update time (newest first)
    filtered.sort((a, b) => b.updatedAt - a.updatedAt);

    return { filteredSessions: filtered, searchResults };
  }, [sessions, searchQuery, filters]);

  // Get unique categories and tags for filtering
  const availableCategories = useMemo(() => {
    const categories = new Set(sessions.map(s => s.category).filter(Boolean));
    return Array.from(categories);
  }, [sessions]);

  const availableTags = useMemo(() => {
    const tags = new Set(sessions.flatMap(s => s.tags || []));
    return Array.from(tags);
  }, [sessions]);

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof SessionFilters];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <div className="space-y-4">
      {/* Header with New Session button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          Lịch sử chat
        </h2>
        <Button 
          size="sm" 
          onClick={onNewSession}
          className="h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          Mới
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm cuộc trò chuyện..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 h-9"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full justify-between h-8"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        {showFilters && (
          <Card>
            <CardContent className="p-3 space-y-3">
              {/* Category filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Danh mục
                </label>
                <div className="flex flex-wrap gap-1">
                  {availableCategories.map(category => (
                    <Badge
                      key={category}
                      variant={filters.category === category ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        category: prev.category === category ? undefined : category
                      }))}
                    >
                      {category === 'ecommerce' ? 'Mua sắm' : 
                       category === 'tech' ? 'Công nghệ' :
                       category === 'support' ? 'Hỗ trợ' : 'Chung'}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Archive filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Trạng thái
                </label>
                <div className="flex gap-2">
                  <Badge
                    variant={filters.isArchived === false ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      isArchived: prev.isArchived === false ? undefined : false
                    }))}
                  >
                    Hoạt động
                  </Badge>
                  <Badge
                    variant={filters.isArchived === true ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      isArchived: prev.isArchived === true ? undefined : true
                    }))}
                  >
                    <Archive className="w-3 h-3 mr-1" />
                    Lưu trữ
                  </Badge>
                </div>
              </div>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full h-7"
                >
                  <X className="w-3 h-3 mr-1" />
                  Xóa bộ lọc
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có cuộc trò chuyện nào'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <SessionSummary
              key={session.id}
              session={session}
              isActive={session.id === currentSessionId}
              onClick={() => onSessionSelect(session)}
              onRename={onSessionRename}
              onDelete={onSessionDelete}
              onArchive={onSessionArchive}
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Session stats */}
      {!compact && (
        <div className="text-xs text-muted-foreground text-center">
          {filteredSessions.length} / {sessions.length} cuộc trò chuyện
        </div>
      )}
    </div>
  );
}; 