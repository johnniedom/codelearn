'use client';

/**
 * DraftList Page
 *
 * Browse and manage content drafts.
 *
 * Features:
 * - Filter tabs: All, Editing, In Review, Approved
 * - Search input (searchDrafts)
 * - List/grid of draft cards showing: title, type badge, status badge, last updated
 * - Click to edit (navigate to appropriate editor)
 * - Delete button per draft
 * - Empty state when no drafts
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  HelpCircle,
  Code,
  Clock,
  Plus,
  Trash2,
  Loader2,
  FolderOpen,
  Edit3,
  Eye,
  CheckCircle,
} from 'lucide-react';

import { cn, formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  getAuthorDrafts,
  searchDrafts,
  deleteDraft,
} from '@/lib/cms/draft-service';
import { useAuthStore } from '@/stores';
import type { ContentDraft, ContentType, DraftStatus } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

type FilterTab = 'all' | 'editing' | 'in_review' | 'approved';

// =============================================================================
// Constants
// =============================================================================

const FILTER_TABS: { value: FilterTab; label: string; status?: DraftStatus; icon: typeof Edit3 }[] = [
  { value: 'all', label: 'All', icon: FolderOpen },
  { value: 'editing', label: 'Editing', status: 'editing', icon: Edit3 },
  { value: 'in_review', label: 'In Review', status: 'review', icon: Eye },
  { value: 'approved', label: 'Approved', status: 'approved', icon: CheckCircle },
];

const CONTENT_TYPE_ICONS: Record<ContentType, typeof FileText> = {
  lesson: FileText,
  quiz: HelpCircle,
  exercise: Code,
  module: FolderOpen,
  package: FolderOpen,
};

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  lesson: 'bg-blue-100 text-blue-800',
  quiz: 'bg-purple-100 text-purple-800',
  exercise: 'bg-green-100 text-green-800',
  module: 'bg-orange-100 text-orange-800',
  package: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<DraftStatus, string> = {
  editing: 'bg-yellow-100 text-yellow-800',
  review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  published: 'bg-primary/10 text-primary',
};

const STATUS_LABELS: Record<DraftStatus, string> = {
  editing: 'Editing',
  review: 'In Review',
  approved: 'Approved',
  published: 'Published',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get editor route for content type
 */
function getEditorRoute(type: ContentType, id: string): string {
  switch (type) {
    case 'lesson':
      return `/cms/lessons/${id}`;
    case 'quiz':
      return `/cms/quizzes/${id}`;
    case 'exercise':
      return `/cms/exercises/${id}`;
    default:
      return `/cms/content/${id}`;
  }
}

// =============================================================================
// Draft Card Component
// =============================================================================

interface DraftCardProps {
  draft: ContentDraft;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function DraftCard({ draft, onClick, onDelete, isDeleting }: DraftCardProps) {
  const Icon = CONTENT_TYPE_ICONS[draft.contentType] ?? FileText;
  const typeColor = CONTENT_TYPE_COLORS[draft.contentType] ?? 'bg-gray-100 text-gray-800';
  const statusColor = STATUS_COLORS[draft.status] ?? 'bg-gray-100 text-gray-800';
  const statusLabel = STATUS_LABELS[draft.status] ?? draft.status;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${draft.title}"?`)) {
      onDelete();
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[120px]',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${draft.title} - ${draft.contentType}, status: ${statusLabel}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-md', typeColor)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {draft.contentType}
            </Badge>
          </div>
          <Badge className={cn('text-xs', statusColor)}>
            {statusLabel}
          </Badge>
        </div>
        <CardTitle className="text-sm sm:text-base line-clamp-2 mt-2">
          {draft.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatRelativeTime(new Date(draft.updatedAt))}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-10 w-10 sm:h-8 sm:w-8 text-text-muted hover:text-error"
            aria-label={`Delete ${draft.title}`}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function DraftList() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Get user ID
  const userId = profile?.userId ?? 'anonymous';

  // ==========================================================================
  // Load Drafts
  // ==========================================================================

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let results: ContentDraft[];

      if (searchQuery.trim()) {
        // Use search function (only takes authorId and query)
        results = await searchDrafts(userId, searchQuery);
      } else {
        // Get all user drafts
        results = await getAuthorDrafts(userId);
      }

      // Apply status filter (for both search results and all drafts)
      if (activeFilter !== 'all') {
        const statusFilter = FILTER_TABS.find((t) => t.value === activeFilter)?.status;
        if (statusFilter) {
          results = results.filter((d) => d.status === statusFilter);
        }
      }

      // Sort by last updated (newest first)
      results.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setDrafts(results);
    } catch (err) {
      console.error('[DraftList] Failed to load drafts:', err);
      setError('Failed to load drafts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, searchQuery, activeFilter]);

  // Load drafts on mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(loadDrafts, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [loadDrafts]);

  // ==========================================================================
  // Delete Handler
  // ==========================================================================

  const handleDelete = useCallback(
    async (draftId: string) => {
      setDeletingIds((prev) => new Set(prev).add(draftId));

      try {
        await deleteDraft(draftId);
        // Remove from local state
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      } catch (err) {
        console.error('[DraftList] Delete failed:', err);
        setError('Failed to delete draft. Please try again.');
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(draftId);
          return next;
        });
      }
    },
    []
  );

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const handleEditDraft = useCallback(
    (draft: ContentDraft) => {
      const route = getEditorRoute(draft.contentType, draft.id);
      navigate(route);
    },
    [navigate]
  );

  const handleCreateNew = useCallback(
    (type: ContentType) => {
      switch (type) {
        case 'lesson':
          navigate('/cms/lessons/new');
          break;
        case 'quiz':
          navigate('/cms/quizzes/new');
          break;
        case 'exercise':
          navigate('/cms/exercises/new');
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Drafts</h1>
          <p className="text-sm sm:text-base text-text-muted">Manage your content drafts and work in progress.</p>
        </div>

        {/* Create New Dropdown */}
        <div className="flex items-center gap-2">
          <Button onClick={() => handleCreateNew('lesson')} className="gap-2 min-h-[44px] sm:min-h-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Draft
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search drafts"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={activeFilter}
        onValueChange={(value) => setActiveFilter(value as FilterTab)}
      >
        <TabsList>
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Error */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error" role="alert">
          {error}
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="sr-only">Loading drafts...</span>
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
          <FolderOpen className="h-12 w-12 text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">No drafts found</h2>
          <p className="text-text-muted text-center max-w-md mb-6">
            {searchQuery
              ? `No drafts match "${searchQuery}". Try a different search term.`
              : 'Start creating content by clicking the button below.'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => handleCreateNew('lesson')} variant="outline" className="gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Create Lesson
            </Button>
            <Button onClick={() => handleCreateNew('quiz')} variant="outline" className="gap-2">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Create Quiz
            </Button>
            <Button onClick={() => handleCreateNew('exercise')} variant="outline" className="gap-2">
              <Code className="h-4 w-4" aria-hidden="true" />
              Create Exercise
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onClick={() => handleEditDraft(draft)}
              onDelete={() => handleDelete(draft.id)}
              isDeleting={deletingIds.has(draft.id)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && drafts.length > 0 && (
        <p className="text-sm text-text-muted">
          Showing {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}
    </div>
  );
}
