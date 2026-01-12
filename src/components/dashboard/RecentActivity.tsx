/**
 * RecentActivity Component
 *
 * Displays a timeline of recent learning activities.
 *
 * Features:
 * - Activity timeline
 * - Activity type icons
 * - Relative timestamps
 * - Navigation to related content
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileQuestion,
  Code,
  Award,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';

// =============================================================================
// Types
// =============================================================================

interface RecentActivityProps {
  /** Maximum number of activities to show */
  maxItems?: number;
  /** Additional class names */
  className?: string;
}

type ActivityType = 'lesson' | 'quiz' | 'exercise' | 'achievement';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  timestamp: Date;
  score?: number;
  courseId?: string;
  moduleId?: string;
  contentId?: string;
}

// =============================================================================
// Activity Type Configuration
// =============================================================================

interface ActivityConfig {
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  label: string;
}

const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  lesson: {
    icon: BookOpen,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-100',
    label: 'Completed lesson',
  },
  quiz: {
    icon: FileQuestion,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-100',
    label: 'Completed quiz',
  },
  exercise: {
    icon: Code,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-100',
    label: 'Solved exercise',
  },
  achievement: {
    icon: Award,
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-100',
    label: 'Earned achievement',
  },
};

// =============================================================================
// Relative Time Formatter
// =============================================================================

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// Load Activities
// =============================================================================

async function loadActivities(userId: string, limit: number): Promise<Activity[]> {
  const activities: Activity[] = [];

  // Load progress (lessons completed)
  const progressRecords = await db.progress
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('completedAt');

  for (const p of progressRecords.slice(0, limit)) {
    activities.push({
      id: `lesson-${p.id}`,
      type: 'lesson',
      title: `Lesson ${p.lessonId}`,
      subtitle: `Course ${p.courseId}`,
      timestamp: p.completedAt,
      score: p.score ?? undefined,
      courseId: p.courseId,
      moduleId: p.moduleId,
      contentId: p.lessonId,
    });
  }

  // Load quiz attempts
  const quizRecords = await db.quizAttempts
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('completedAt');

  for (const q of quizRecords.slice(0, limit)) {
    activities.push({
      id: `quiz-${q.attemptId}`,
      type: 'quiz',
      title: `Quiz ${q.quizId}`,
      subtitle: `Score: ${q.score}/${q.maxScore}`,
      timestamp: q.completedAt,
      score: q.score,
      courseId: q.courseId,
      moduleId: q.moduleId,
      contentId: q.quizId,
    });
  }

  // Sort by timestamp descending and limit
  return activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// =============================================================================
// RecentActivity Component
// =============================================================================

export function RecentActivity({
  maxItems = 5,
  className,
}: RecentActivityProps) {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.userId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await loadActivities(profile.userId, maxItems);
        setActivities(data);
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [profile?.userId, maxItems]);

  const handleActivityClick = (activity: Activity) => {
    if (!activity.courseId || !activity.moduleId || !activity.contentId) return;

    switch (activity.type) {
      case 'lesson':
        navigate(`/lessons/${activity.courseId}/${activity.moduleId}/${activity.contentId}`);
        break;
      case 'quiz':
        navigate(`/quizzes/${activity.courseId}/${activity.moduleId}/${activity.contentId}`);
        break;
      case 'exercise':
        navigate(`/exercises/${activity.courseId}/${activity.moduleId}/${activity.contentId}`);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-3 p-3">
            <div className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-8 text-center',
          className
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mt-4 font-medium text-text">No activity yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Start learning to see your activity here
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {activities.map((activity) => {
        const config = ACTIVITY_CONFIG[activity.type];
        const Icon = config.icon;
        const isClickable = activity.courseId && activity.moduleId && activity.contentId;

        return (
          <div
            key={activity.id}
            className={cn(
              'group flex items-center gap-3 rounded-lg p-3 transition-colors',
              isClickable && 'cursor-pointer hover:bg-gray-50'
            )}
            onClick={() => isClickable && handleActivityClick(activity)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleActivityClick(activity);
              }
            }}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                config.bgClass
              )}
            >
              <Icon className={cn('h-5 w-5', config.colorClass)} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text">{activity.title}</p>
              <p className="text-sm text-text-muted">
                {activity.subtitle || config.label}
              </p>
            </div>

            {/* Time and arrow */}
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>{getRelativeTime(activity.timestamp)}</span>
              {isClickable && (
                <ChevronRight
                  className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RecentActivity;
