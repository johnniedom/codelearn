import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart2, Bell, Settings, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNotificationService, type NotificationEvent } from '@/lib/notifications';
import { useAuthStore } from '@/stores/authStore';

/**
 * Navigation Item Configuration
 */
interface NavItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Icon component */
  icon: React.ElementType;
  /** Accessible label for screen readers */
  ariaLabel: string;
  /** Whether to show notification badge */
  showBadge?: boolean;
}

/**
 * Default navigation items for the app
 * Updated for Phase 5: Added notifications and changed Profile to Settings
 */
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home,
    ariaLabel: 'Go to home page',
  },
  {
    id: 'courses',
    label: 'Courses',
    path: '/courses',
    icon: BookOpen,
    ariaLabel: 'Browse courses',
  },
  {
    id: 'dashboard',
    label: 'Progress',
    path: '/dashboard',
    icon: BarChart2,
    ariaLabel: 'View your learning progress',
  },
  {
    id: 'notifications',
    label: 'Alerts',
    path: '/notifications',
    icon: Bell,
    ariaLabel: 'View notifications',
    showBadge: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    ariaLabel: 'Open settings',
  },
];

/**
 * Navigation Item Component
 *
 * Individual navigation button with proper accessibility:
 * - aria-current="page" for active state
 * - 44px minimum touch target
 * - Focus-visible ring
 * - Notification badge support
 */
interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  badgeCount?: number;
}

function NavItemButton({ item, isActive, badgeCount }: NavItemProps) {
  const Icon = item.icon;
  const showBadge = item.showBadge;
  const displayCount = badgeCount ?? 0;

  return (
    <NavLink
      to={item.path}
      className={({ isActive: linkActive }) =>
        cn(
          // Base styles - 44px minimum touch target
          'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2',
          // Transition for smooth state changes
          'transition-colors duration-fast',
          // Focus states for keyboard navigation
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // Active state styling
          linkActive || isActive
            ? 'text-primary'
            : 'text-text-muted hover:text-text'
        )
      }
      aria-current={isActive ? 'page' : undefined}
      aria-label={
        showBadge
          ? `${item.ariaLabel}, ${displayCount} unread`
          : item.ariaLabel
      }
    >
      <span className="relative">
        <Icon className="h-5 w-5" aria-hidden="true" />
        {showBadge && (
          <span
            className="absolute -left-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        )}
      </span>
      <span className="text-xs font-medium">{item.label}</span>
    </NavLink>
  );
}

/**
 * BottomNav Props
 */
interface BottomNavProps {
  /** Custom navigation items (uses defaults if not provided) */
  items?: NavItem[];
  /** Additional class names */
  className?: string;
}

/**
 * BottomNav Component
 *
 * Bottom navigation bar for the CodeLearn PWA (mobile-first pattern).
 *
 * Features:
 * - aria-current="page" for active state
 * - 44px minimum touch targets
 * - React Router integration
 * - Notification badge with unread count (Phase 5)
 *
 * Accessibility:
 * - Semantic <nav> element with aria-label
 * - Proper focus management
 * - Keyboard navigation support
 * - Screen reader friendly labels
 * - Badge count announced to screen readers
 */
export function BottomNav({ items = DEFAULT_NAV_ITEMS, className }: BottomNavProps) {
  const location = useLocation();
  const { profile, canAccessCMS } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if user can access CMS (authors only)
  const showCMSLink = canAccessCMS();

  // Subscribe to notification count changes
  useEffect(() => {
    if (!profile?.userId) return;

    const loadUnreadCount = async () => {
      try {
        const service = getNotificationService();
        const count = await service.getUnreadCount(profile.userId);
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to load notification count:', error);
      }
    };

    loadUnreadCount();

    // Subscribe to changes
    const service = getNotificationService();
    const unsubscribe = service.subscribe((event: NotificationEvent) => {
      if (event.type === 'unread_count_changed') {
        const data = event.data as { count: number };
        setUnreadCount(data.count);
      }
    });

    return unsubscribe;
  }, [profile?.userId]);

  // Determine which item is active based on current path
  const getIsActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        // Fixed to bottom, full width with explicit height
        'fixed bottom-0 left-0 right-0 z-50 h-16',
        // Styling
        'border-t border-border bg-surface',
        // Safe area for notched devices
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="mx-auto flex h-full max-w-4xl items-center justify-around px-4">
        {items.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={getIsActive(item.path)}
            badgeCount={item.showBadge ? unreadCount : undefined}
          />
        ))}
        {showCMSLink && (
          <NavLink
            to="/cms"
            className={({ isActive }) =>
              cn(
                // Base styles - 44px minimum touch target
                'relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2',
                // Transition for smooth state changes
                'transition-colors duration-fast',
                // Focus states for keyboard navigation
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                // Active state styling
                isActive
                  ? 'text-primary'
                  : 'text-text-muted hover:text-text'
              )
            }
            aria-current={getIsActive('/cms') ? 'page' : undefined}
            aria-label="Content management system"
          >
            <PenTool className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">CMS</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

/**
 * Hook to determine if we should show bottom nav
 *
 * Returns false for certain routes where bottom nav
 * should be hidden (e.g., fullscreen lesson view)
 */
export function useShowBottomNav(): boolean {
  const location = useLocation();

  // Routes where bottom nav should be hidden
  const hiddenRoutes = [
    '/lessons/', // During active lesson
    '/exercises/', // During coding exercise
    '/quizzes/', // During quiz
  ];

  return !hiddenRoutes.some((route) => location.pathname.startsWith(route));
}

export default BottomNav;
