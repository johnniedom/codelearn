/**
 * NotificationsPage
 *
 * Full-page view of all notifications with filtering.
 *
 * Features:
 * - List all notifications with read/unread state
 * - Mark as read on view
 * - Filter by category
 * - Clear all read notifications
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications';
import type { NotificationData, NotificationCategory } from '@/lib/notifications';

// =============================================================================
// Types
// =============================================================================

type FilterOption = 'all' | NotificationCategory;

// =============================================================================
// Filter Options
// =============================================================================

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'message', label: 'Messages' },
  { value: 'progress', label: 'Progress' },
  { value: 'achievement', label: 'Achievements' },
  { value: 'system', label: 'System' },
  { value: 'reminder', label: 'Reminders' },
];

// =============================================================================
// NotificationsPage Component
// =============================================================================

export function NotificationsPage() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  const handleNotificationClick = (notification: NotificationData) => {
    // Navigate to action URL if exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-lg font-semibold">Notifications</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filter notifications"
            aria-expanded={showFilters}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            {FILTER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedFilter === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(option.value)}
                className="flex-shrink-0"
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="py-4">
        <NotificationCenter
          showHeader={false}
          onNotificationClick={handleNotificationClick}
        />
      </main>
    </div>
  );
}

export default NotificationsPage;
