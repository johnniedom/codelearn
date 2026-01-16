'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ContentIndexEntry, ContentType } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

interface ContentTreeProps {
  /** Array of content items to display in tree structure */
  items: ContentIndexEntry[];
  /** Callback when an item is selected */
  onSelect?: (item: ContentIndexEntry) => void;
  /** Currently selected item ID */
  selectedId?: string;
  /** Additional class names */
  className?: string;
}

interface TreeNodeProps {
  item: ContentIndexEntry;
  children: ContentIndexEntry[];
  allItems: ContentIndexEntry[];
  depth: number;
  onSelect?: (item: ContentIndexEntry) => void;
  selectedId?: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Content type icons using Unicode emoji
 * Using escape sequences for consistent rendering
 */
const CONTENT_TYPE_ICONS: Record<ContentType, string> = {
  package: '\u{1F4DA}', // course (using package type)
  module: '\u{1F4E6}',  // module
  lesson: '\u{1F4D6}',  // lesson
  quiz: '\u{2753}',     // quiz
  exercise: '\u{1F4BB}', // exercise
};

/**
 * Content type labels for accessibility
 */
const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  package: 'Course',
  module: 'Module',
  lesson: 'Lesson',
  quiz: 'Quiz',
  exercise: 'Exercise',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build a hierarchical tree structure from flat content items
 * Groups items by parentId for efficient lookup
 */
function buildChildrenMap(items: ContentIndexEntry[]): Map<string | null, ContentIndexEntry[]> {
  const childrenMap = new Map<string | null, ContentIndexEntry[]>();

  for (const item of items) {
    const parentKey = item.parentId;
    const existing = childrenMap.get(parentKey) ?? [];
    existing.push(item);
    childrenMap.set(parentKey, existing);
  }

  // Sort children by order within each group
  for (const [key, children] of childrenMap) {
    children.sort((a, b) => a.order - b.order);
    childrenMap.set(key, children);
  }

  return childrenMap;
}

/**
 * Get direct children of an item
 */
function getChildren(
  item: ContentIndexEntry,
  childrenMap: Map<string | null, ContentIndexEntry[]>
): ContentIndexEntry[] {
  return childrenMap.get(item.id) ?? [];
}

// =============================================================================
// TreeNode Component
// =============================================================================

/**
 * Individual tree node with expand/collapse functionality
 */
function TreeNode({
  item,
  children,
  allItems,
  depth,
  onSelect,
  selectedId,
  expandedIds,
  onToggleExpand,
}: TreeNodeProps) {
  const isSelected = selectedId === item.id;
  const isExpanded = expandedIds.has(item.id);
  const hasChildNodes = children.length > 0;

  // Calculate indentation based on depth
  const paddingLeft = depth * 20 + 8;

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect?.(item);
        break;
      case 'ArrowRight':
        if (hasChildNodes && !isExpanded) {
          event.preventDefault();
          onToggleExpand(item.id);
        }
        break;
      case 'ArrowLeft':
        if (hasChildNodes && isExpanded) {
          event.preventDefault();
          onToggleExpand(item.id);
        }
        break;
    }
  };

  /**
   * Handle click on the row (selects the item)
   */
  const handleClick = () => {
    onSelect?.(item);
  };

  /**
   * Handle click on expand/collapse chevron
   */
  const handleToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleExpand(item.id);
  };

  // Build children map from all items for recursive rendering
  const childrenMap = React.useMemo(() => buildChildrenMap(allItems), [allItems]);

  return (
    <li role="treeitem" aria-expanded={hasChildNodes ? isExpanded : undefined}>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ paddingLeft: `${paddingLeft}px` }}
        className={cn(
          // Base styles - 44px minimum touch target
          'flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2 py-2 text-left',
          // Transition for smooth state changes
          'transition-colors duration-150',
          // Focus states for keyboard navigation
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // Selected vs unselected styling
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-text hover:bg-surface-secondary'
        )}
        aria-selected={isSelected}
        aria-label={`${CONTENT_TYPE_LABELS[item.type]}: ${item.title}`}
      >
        {/* Expand/Collapse chevron */}
        <span
          className={cn(
            'flex h-5 w-5 flex-shrink-0 items-center justify-center',
            hasChildNodes ? 'cursor-pointer' : 'invisible'
          )}
          onClick={hasChildNodes ? handleToggleClick : undefined}
          aria-hidden="true"
        >
          {hasChildNodes && (
            <svg
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isExpanded && 'rotate-90'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </span>

        {/* Content type icon */}
        <span
          className="flex-shrink-0 text-base"
          role="img"
          aria-label={CONTENT_TYPE_LABELS[item.type]}
        >
          {CONTENT_TYPE_ICONS[item.type]}
        </span>

        {/* Title */}
        <span className="flex-1 truncate text-sm">{item.title}</span>

        {/* Selected indicator */}
        {isSelected && (
          <span
            className="ml-auto h-2 w-2 flex-shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Render children recursively when expanded */}
      {hasChildNodes && isExpanded && (
        <ul role="group" className="mt-0.5">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              children={getChildren(child, childrenMap)}
              allItems={allItems}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// =============================================================================
// ContentTree Component
// =============================================================================

/**
 * ContentTree Component
 *
 * Displays a hierarchical tree view of content items based on parentId relationships.
 *
 * Features:
 * - Hierarchical tree structure based on parentId
 * - Collapsible nodes with chevron icons
 * - Content type icons for visual identification
 * - Indentation for nested items
 * - Highlight for selected item
 * - Click to select functionality
 * - Keyboard navigation (Arrow keys, Enter, Space)
 *
 * Accessibility:
 * - Semantic tree structure with proper ARIA roles
 * - aria-expanded for collapsible nodes
 * - aria-selected for current selection
 * - Keyboard navigable with focus-visible states
 * - Screen reader friendly labels
 *
 * @example
 * ```tsx
 * <ContentTree
 *   items={contentItems}
 *   onSelect={(item) => console.log('Selected:', item)}
 *   selectedId="item-123"
 * />
 * ```
 */
export function ContentTree({
  items,
  onSelect,
  selectedId,
  className,
}: ContentTreeProps) {
  // Track expanded node IDs
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => {
    // Initially expand top-level items (those without parents)
    const topLevel = items.filter((item) => item.parentId === null);
    return new Set(topLevel.map((item) => item.id));
  });

  // Build children map for efficient lookup
  const childrenMap = React.useMemo(() => buildChildrenMap(items), [items]);

  // Get root items (items without a parent)
  const rootItems = React.useMemo(() => {
    return childrenMap.get(null) ?? [];
  }, [childrenMap]);

  /**
   * Toggle expand/collapse state for a node
   */
  const handleToggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle empty state
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-surface p-4',
          className
        )}
      >
        <p className="text-sm text-text-muted">No content items to display</p>
      </div>
    );
  }

  return (
    <nav
      aria-label="Content tree navigation"
      className={cn('rounded-lg bg-surface', className)}
    >
      <ul role="tree" className="space-y-0.5 p-2">
        {rootItems.map((item) => (
          <TreeNode
            key={item.id}
            item={item}
            children={getChildren(item, childrenMap)}
            allItems={items}
            depth={0}
            onSelect={onSelect}
            selectedId={selectedId}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </ul>
    </nav>
  );
}

export type { ContentTreeProps };
export default ContentTree;
