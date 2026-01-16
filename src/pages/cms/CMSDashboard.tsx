import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { getDraftCounts, getAuthorDrafts } from '@/lib/cms/draft-service';
import type { ContentDraft, DraftStatus, ContentType } from '@/lib/db';

// =============================================================================
// Types
// =============================================================================

interface DraftCounts {
  editing: number;
  review: number;
  approved: number;
  published: number;
}

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  isLoading?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the total count of all drafts
 */
const getTotalDrafts = (counts: DraftCounts): number =>
  counts.editing + counts.review + counts.approved + counts.published;

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString();
};

/**
 * Get badge variant based on draft status
 */
const getStatusBadgeVariant = (status: DraftStatus): 'default' | 'secondary' | 'success' | 'warning' | 'outline' => {
  switch (status) {
    case 'editing':
      return 'secondary';
    case 'review':
      return 'warning';
    case 'approved':
      return 'default';
    case 'published':
      return 'success';
    default:
      return 'outline';
  }
};

/**
 * Get content type label
 */
const getContentTypeLabel = (type: ContentType): string => {
  switch (type) {
    case 'lesson':
      return 'Lesson';
    case 'quiz':
      return 'Quiz';
    case 'exercise':
      return 'Exercise';
    case 'module':
      return 'Module';
    case 'package':
      return 'Package';
    default:
      return 'Content';
  }
};

// =============================================================================
// Components
// =============================================================================

/**
 * Stats card component displaying a metric with optional variant styling
 */
const StatsCard = ({ title, value, description, isLoading, variant = 'default' }: StatsCardProps) => {
  const variantStyles = {
    default: 'border-border',
    primary: 'border-primary/50 bg-primary/5',
    success: 'border-success/50 bg-success/5',
    warning: 'border-warning/50 bg-warning/5',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <Skeleton className="h-7 sm:h-8 w-12 sm:w-16" />
        ) : (
          <p className="text-2xl sm:text-3xl font-bold">{value}</p>
        )}
        {description && (
          <p className="text-xs text-text-muted mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Quick action button for creating new content
 */
interface QuickActionButtonProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const QuickActionButton = ({ to, icon, label }: QuickActionButtonProps) => (
  <Button asChild variant="outline" className="flex-1 h-auto min-h-[56px] py-3 sm:py-4 flex-col gap-2">
    <Link to={to}>
      {icon}
      <span className="text-xs sm:text-sm font-medium">{label}</span>
    </Link>
  </Button>
);

/**
 * Draft list item component
 */
interface DraftListItemProps {
  draft: ContentDraft;
}

/**
 * Get the editor route for a draft based on its content type
 */
const getEditorRoute = (draft: ContentDraft): string => {
  switch (draft.contentType) {
    case 'lesson':
      return `/cms/lessons/${draft.id}`;
    case 'quiz':
      return `/cms/quizzes/${draft.id}`;
    case 'exercise':
      return `/cms/exercises/${draft.id}`;
    default:
      return `/cms/content`;
  }
};

const DraftListItem = ({ draft }: DraftListItemProps) => (
  <Link
    to={getEditorRoute(draft)}
    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg hover:bg-surface-secondary transition-colors group gap-2 sm:gap-3 min-h-[56px]"
    aria-label={`Edit ${draft.title || 'Untitled'} - ${getContentTypeLabel(draft.contentType)}, status: ${draft.status}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 rounded bg-surface-secondary flex items-center justify-center text-text-muted group-hover:bg-surface">
        <ContentTypeIcon type={draft.contentType} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate text-sm sm:text-base">{draft.title || 'Untitled'}</p>
        <p className="text-xs text-text-muted">
          {formatRelativeTime(new Date(draft.updatedAt))}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0 pl-13 sm:pl-0">
      <Badge variant={getStatusBadgeVariant(draft.status)} className="text-xs">
        {draft.status}
      </Badge>
      <Badge variant="outline" className="capitalize text-xs hidden sm:inline-flex">
        {getContentTypeLabel(draft.contentType)}
      </Badge>
    </div>
  </Link>
);

/**
 * Content type icon component using SVG icons
 */
const ContentTypeIcon = ({ type, className = '' }: { type: ContentType; className?: string }) => {
  const iconClass = `w-4 h-4 ${className}`;

  switch (type) {
    case 'lesson':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'quiz':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'exercise':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    case 'module':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'package':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

/**
 * Loading skeleton for recent drafts
 */
const RecentDraftsSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded" />
          <div>
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Empty state when there are no drafts
 */
const EmptyDraftsState = () => (
  <div className="text-center py-8">
    <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <p className="text-text-muted text-sm">No drafts yet</p>
    <p className="text-text-muted text-xs mt-1">Create your first piece of content to get started</p>
  </div>
);

/**
 * Error state component
 */
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <div className="text-center py-8">
    <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="text-error text-sm font-medium">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Try Again
      </Button>
    )}
  </div>
);

// =============================================================================
// Main Component
// =============================================================================

export default function CMSDashboard() {
  const { profile } = useAuthStore();
  const [counts, setCounts] = useState<DraftCounts>({
    editing: 0,
    review: 0,
    approved: 0,
    published: 0,
  });
  const [recentDrafts, setRecentDrafts] = useState<ContentDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!profile?.userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch draft counts and recent drafts in parallel
      const [draftCounts, drafts] = await Promise.all([
        getDraftCounts(profile.userId),
        getAuthorDrafts(profile.userId),
      ]);

      setCounts(draftCounts);
      // Get the 5 most recent drafts
      setRecentDrafts(drafts.slice(0, 5));
    } catch (err) {
      console.error('[CMSDashboard] Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-muted mt-1">
          Welcome back{profile?.preferredName ? `, ${profile.preferredName}` : ''}. Manage your content from here.
        </p>
      </div>

      {/* Stats Cards */}
      <section aria-label="Draft statistics">
        <h2 className="sr-only">Draft Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Total Drafts"
            value={getTotalDrafts(counts)}
            isLoading={isLoading}
            variant="primary"
          />
          <StatsCard
            title="Published"
            value={counts.published}
            isLoading={isLoading}
            variant="success"
          />
          <StatsCard
            title="In Review"
            value={counts.review}
            isLoading={isLoading}
            variant="warning"
          />
          <StatsCard
            title="Editing"
            value={counts.editing}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickActionButton
            to="/cms/lessons/new"
            icon={<ContentTypeIcon type="lesson" className="w-6 h-6" />}
            label="Create Lesson"
          />
          <QuickActionButton
            to="/cms/quizzes/new"
            icon={<ContentTypeIcon type="quiz" className="w-6 h-6" />}
            label="Create Quiz"
          />
          <QuickActionButton
            to="/cms/exercises/new"
            icon={<ContentTypeIcon type="exercise" className="w-6 h-6" />}
            label="Create Exercise"
          />
        </div>
      </section>

      {/* Recent Drafts */}
      <section aria-label="Recent drafts">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Drafts</CardTitle>
            {recentDrafts.length > 0 && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/cms/content">View All</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {error ? (
              <ErrorState message={error} onRetry={loadDashboardData} />
            ) : isLoading ? (
              <RecentDraftsSkeleton />
            ) : recentDrafts.length === 0 ? (
              <EmptyDraftsState />
            ) : (
              <div className="space-y-1">
                {recentDrafts.map((draft) => (
                  <DraftListItem key={draft.id} draft={draft} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
