import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatSession } from '@/types/chat';
import { formatRelativeTime } from '@/utils/sessionUtils';
import { 
  MessageCircle, 
  Clock, 
  Tag, 
  ShoppingCart, 
  Code, 
  HelpCircle, 
  Archive,
  MoreVertical,
  Edit3,
  Trash2,
  Save,
  X,
  Check
} from 'lucide-react';

interface SessionSummaryProps {
  session: ChatSession;
  isActive?: boolean;
  onClick?: () => void;
  onRename?: (sessionId: string, newName: string) => void;
  onDelete?: (sessionId: string) => void;
  onArchive?: (sessionId: string) => void;
  compact?: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'ecommerce':
      return <ShoppingCart className="w-4 h-4" />;
    case 'tech':
      return <Code className="w-4 h-4" />;
    case 'support':
      return <HelpCircle className="w-4 h-4" />;
    default:
      return <MessageCircle className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'ecommerce':
      return 'bg-green-100 text-green-800';
    case 'tech':
      return 'bg-blue-100 text-blue-800';
    case 'support':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'ecommerce':
      return 'Mua sắm';
    case 'tech':
      return 'Công nghệ';
    case 'support':
      return 'Hỗ trợ';
    default:
      return 'Chung';
  }
};

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  isActive = false,
  onClick,
  onRename,
  onDelete,
  onArchive,
  compact = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditName(session.name);
    setShowMenu(false);
  };

  const handleEditSave = () => {
    if (editName.trim() && editName !== session.name && onRename) {
      onRename(session.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName(session.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleAction = (action: string) => {
    setShowMenu(false);
    
    switch (action) {
      case 'edit':
        handleEditStart();
        break;
      case 'archive':
        onArchive?.(session.id);
        break;
      case 'delete':
        if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
          onDelete?.(session.id);
        }
        break;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
        isActive 
          ? 'border-primary bg-accent/50' 
          : 'border hover:border-border'
      } ${session.isArchived ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <CardContent className={`${compact ? 'p-3' : 'p-4'}`}>
        <div className="space-y-3">
          {/* Header with title and menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSave();
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCancel();
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <h3 className={`font-medium text-card-foreground line-clamp-2 ${
                  compact ? 'text-sm' : 'text-base'
                }`}>
                  {session.name}
                  {session.isArchived && (
                    <Archive className="inline-block w-3 h-3 ml-1 text-muted-foreground" />
                  )}
                </h3>
              )}
            </div>
            
            {/* Menu button */}
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('edit');
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      Đổi tên
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('archive');
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    >
                      <Archive className="w-3 h-3" />
                      {session.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction('delete');
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {session.summary && !compact && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {session.summary}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Category badge */}
              <Badge 
                variant="secondary" 
                className={`${getCategoryColor(session.category || 'general')} text-xs`}
              >
                {getCategoryIcon(session.category || 'general')}
                <span className="ml-1">{getCategoryLabel(session.category || 'general')}</span>
              </Badge>

              {/* Message count */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                <span>{session.messageCount}</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(session.updatedAt)}</span>
            </div>
          </div>

          {/* Tags */}
          {session.tags && session.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {session.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs px-1.5 py-0.5"
                >
                  <Tag className="w-2 h-2 mr-1" />
                  {tag}
                </Badge>
              ))}
              {session.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{session.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 