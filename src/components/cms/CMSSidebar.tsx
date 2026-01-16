import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Navigation item configuration for CMS sidebar
 */
interface CMSNavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route path */
  path: string;
  /** Emoji icon */
  icon: string;
  /** Accessible description */
  ariaLabel: string;
  /** Whether this is an exact match route */
  end?: boolean;
}

/**
 * CMS navigation items with emoji icons
 */
const CMS_NAV_ITEMS: CMSNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/cms',
    icon: '\u{1F4CA}', // 📊
    ariaLabel: 'CMS Dashboard overview',
    end: true,
  },
  {
    id: 'content',
    label: 'Content',
    path: '/cms/content',
    icon: '\u{1F4C1}', // 📁
    ariaLabel: 'Browse and manage content',
  },
  {
    id: 'lessons',
    label: 'Lessons',
    path: '/cms/lessons',
    icon: '\u{1F4D6}', // 📖
    ariaLabel: 'Manage lessons',
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    path: '/cms/quizzes',
    icon: '\u{2753}', // ❓
    ariaLabel: 'Manage quizzes',
  },
  {
    id: 'exercises',
    label: 'Exercises',
    path: '/cms/exercises',
    icon: '\u{1F4BB}', // 💻
    ariaLabel: 'Manage coding exercises',
  },
  {
    id: 'assets',
    label: 'Assets',
    path: '/cms/assets',
    icon: '\u{1F5BC}', // 🖼️
    ariaLabel: 'Manage media assets',
  },
  {
    id: 'drafts',
    label: 'Drafts',
    path: '/cms/drafts',
    icon: '\u{1F4DD}', // 📝
    ariaLabel: 'View draft content',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/cms/settings',
    icon: '\u{2699}', // ⚙️
    ariaLabel: 'Author settings',
  },
];

/**
 * CMSSidebar Props
 */
interface CMSSidebarProps {
  /** Callback when a nav item is clicked (useful for mobile menu close) */
  onNavClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * CMSSidebar Component
 *
 * Navigation sidebar for the Content Management System.
 *
 * Features:
 * - NavLink integration with active state styling
 * - Emoji icons for visual identification
 * - Proper accessibility with ARIA labels
 * - Focus-visible states for keyboard navigation
 * - 44px minimum touch targets for mobile
 *
 * Accessibility:
 * - Semantic <nav> element with aria-label
 * - aria-current="page" for active items
 * - Keyboard navigable
 * - Screen reader friendly labels
 */
export function CMSSidebar({ onNavClick, className }: CMSSidebarProps) {
  return (
    <nav
      aria-label="CMS navigation"
      className={cn('flex h-full flex-col bg-surface', className)}
    >
      {/* Sidebar header */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-lg font-semibold text-text">Content Manager</h2>
      </div>

      {/* Navigation list */}
      <ul className="flex-1 space-y-1 overflow-y-auto p-2" role="list">
        {CMS_NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.path}
              end={item.end}
              onClick={onNavClick}
              className={({ isActive }) =>
                cn(
                  // Base styles - 44px minimum touch target
                  'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2',
                  // Transition for smooth state changes
                  'transition-colors duration-150',
                  // Focus states for keyboard navigation
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  // Active vs inactive styling
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-muted hover:bg-surface-secondary hover:text-text'
                )
              }
              aria-label={item.ariaLabel}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="text-lg"
                    role="img"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                  {/* Visual indicator for active state */}
                  {isActive && (
                    <span
                      className="ml-auto h-2 w-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Sidebar footer */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-text-muted">
          CodeLearn CMS v1.0
        </p>
      </div>
    </nav>
  );
}

export default CMSSidebar;
