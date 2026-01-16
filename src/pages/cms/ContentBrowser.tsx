'use client';

/**
 * ContentBrowser Page
 *
 * Browse and manage CMS content with search, filter, and view options.
 *
 * Features:
 * - Search input at top
 * - Filter tabs: All, Lessons, Quizzes, Exercises
 * - View toggle: Tree / Grid
 * - Tree view with ContentTree component
 * - Grid view with ContentCard components
 * - Empty state when no content exists
 * - Click navigates to appropriate editor
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Grid3X3,
  List,
  FileText,
  HelpCircle,
  Code,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { searchContent, type SearchOptions } from '@/lib/cms/content-index';
import type { ContentIndexEntry, ContentType } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

type FilterTab = 'all' | 'lesson' | 'quiz' | 'exercise';
type ViewMode = 'tree' | 'grid';

interface TreeNode extends ContentIndexEntry {
  children: TreeNode[];
  isExpanded: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const FILTER_TABS: { value: FilterTab; label: string; icon: typeof FileText }[] = [
  { value: 'all', label: 'All', icon: FolderOpen },
  { value: 'lesson', label: 'Lessons', icon: FileText },
  { value: 'quiz', label: 'Quizzes', icon: HelpCircle },
  { value: 'exercise', label: 'Exercises', icon: Code },
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build tree structure from flat content entries
 */
function buildTree(entries: ContentIndexEntry[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create nodes with empty children arrays
  for (const entry of entries) {
    nodeMap.set(entry.id, {
      ...entry,
      children: [],
      isExpanded: false,
    });
  }

  // Build parent-child relationships
  for (const entry of entries) {
    const node = nodeMap.get(entry.id)!;
    if (entry.parentId && nodeMap.has(entry.parentId)) {
      nodeMap.get(entry.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by order
  const sortChildren = (nodes: TreeNode[]): void => {
    nodes.sort((a, b) => a.order - b.order);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };
  sortChildren(roots);

  return roots;
}

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
// Sub-Components
// =============================================================================

interface ContentCardProps {
  entry: ContentIndexEntry;
  onClick: () => void;
}

function ContentCard({ entry, onClick }: ContentCardProps) {
  const Icon = CONTENT_TYPE_ICONS[entry.type] ?? FileText;
  const colorClass = CONTENT_TYPE_COLORS[entry.type] ?? 'bg-gray-100 text-gray-800';

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${entry.type}: ${entry.title}`}
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
            <div className={cn('p-2 rounded-md', colorClass)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {entry.type}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-sm sm:text-base line-clamp-2 mt-2">{entry.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
        {entry.summary && (
          <CardDescription className="line-clamp-2 text-xs sm:text-sm">
            {entry.summary}
          </CardDescription>
        )}
        {entry.keywords && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.keywords.split(' ').slice(0, 3).map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  onToggle: (id: string) => void;
  onClick: (entry: ContentIndexEntry) => void;
}

function TreeItem({ node, depth, onToggle, onClick }: TreeItemProps) {
  const Icon = CONTENT_TYPE_ICONS[node.type] ?? FileText;
  const colorClass = CONTENT_TYPE_COLORS[node.type] ?? 'bg-gray-100 text-gray-800';
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-3 sm:py-2 px-3 rounded-md cursor-pointer transition-colors min-h-[48px] sm:min-h-0',
          'hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        onClick={() => onClick(node)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(node);
          }
        }}
        role="treeitem"
        tabIndex={0}
        aria-expanded={hasChildren ? node.isExpanded : undefined}
        aria-label={`${node.type}: ${node.title}`}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-1.5 sm:p-0.5 hover:bg-border rounded min-w-[28px] min-h-[28px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
          >
            {node.isExpanded ? (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-muted" />
            )}
          </button>
        ) : (
          <span className="w-7 sm:w-5" aria-hidden="true" />
        )}

        <div className={cn('p-1.5 rounded', colorClass)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>

        <span className="flex-1 truncate text-sm font-medium">{node.title}</span>

        <Badge variant="secondary" className="capitalize text-xs shrink-0 hidden sm:inline-flex">
          {node.type}
        </Badge>
      </div>

      {hasChildren && node.isExpanded && (
        <div role="group">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function ContentBrowser() {
  const navigate = useNavigate();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [content, setContent] = useState<ContentIndexEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load content
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchOptions: SearchOptions = {};

      // Apply type filter
      if (activeFilter !== 'all') {
        searchOptions.type = activeFilter as ContentType;
      }

      let results: ContentIndexEntry[];

      if (searchQuery.trim()) {
        // Use search function when there's a query
        results = await searchContent(searchQuery, searchOptions);
      } else {
        // Get tree structure for browsing
        // Note: getContentTree requires packageSlug, so we'll get all content
        // In a real app, you'd either have a default package or list all packages
        results = await searchContent('', searchOptions);

        // If no search results from empty search, try getting all content
        if (results.length === 0) {
          // Fallback: search with a very broad term or implement getAllContent
          results = [];
        }
      }

      // Filter by type if needed (search might return all types)
      if (activeFilter !== 'all') {
        results = results.filter((item) => item.type === activeFilter);
      }

      setContent(results);
    } catch (err) {
      console.error('[ContentBrowser] Failed to load content:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeFilter]);

  // Load content on mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(loadContent, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [loadContent]);

  // Build tree structure for tree view
  const treeData = useMemo(() => {
    const tree = buildTree(content);
    // Apply expanded state
    const applyExpanded = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => ({
        ...node,
        isExpanded: expandedNodes.has(node.id),
        children: applyExpanded(node.children),
      }));
    };
    return applyExpanded(tree);
  }, [content, expandedNodes]);

  // Toggle tree node expansion
  const handleToggleNode = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Navigate to editor
  const handleItemClick = useCallback(
    (entry: ContentIndexEntry) => {
      const route = getEditorRoute(entry.type, entry.id);
      navigate(route);
    },
    [navigate]
  );

  // Navigate to create new content
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Browser</h1>
          <p className="text-text-muted">Browse and manage your educational content.</p>
        </div>

        {/* Create New Dropdown */}
        <div className="flex items-center gap-2">
          <Button onClick={() => handleCreateNew('lesson')} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Lesson
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search content"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted sr-only sm:not-sr-only">View:</span>
          <div className="flex rounded-md border border-border">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-0"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid3X3 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tree')}
              className="rounded-l-none border-0 border-l border-border"
              aria-label="Tree view"
              aria-pressed={viewMode === 'tree'}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
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

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="sr-only">Loading content...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-error mb-4">{error}</p>
          <Button onClick={loadContent} variant="outline">
            Try Again
          </Button>
        </div>
      ) : content.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
          <FolderOpen className="h-12 w-12 text-text-muted mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">No content found</h2>
          <p className="text-text-muted text-center max-w-md mb-6">
            {searchQuery
              ? `No content matches "${searchQuery}". Try a different search term.`
              : 'Get started by creating your first piece of content.'}
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
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {content.map((entry) => (
            <ContentCard
              key={entry.id}
              entry={entry}
              onClick={() => handleItemClick(entry)}
            />
          ))}
        </div>
      ) : (
        <div
          className="border border-border rounded-lg bg-background"
          role="tree"
          aria-label="Content tree"
        >
          {treeData.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              depth={0}
              onToggle={handleToggleNode}
              onClick={handleItemClick}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && !error && content.length > 0 && (
        <p className="text-sm text-text-muted">
          Showing {content.length} item{content.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      )}
    </div>
  );
}
