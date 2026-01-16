import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * CMSTopBar Props
 */
interface CMSTopBarProps {
  /** Callback to toggle mobile sidebar */
  onMenuToggle?: () => void;
  /** Whether to show the mobile menu button */
  showMenuButton?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * CMSTopBar Component
 *
 * Top navigation bar for the Content Management System.
 *
 * Features:
 * - Mobile menu toggle button (md breakpoint and below)
 * - Search input (placeholder/non-functional for now)
 * - "Back to App" link to return to main application
 * - Author name display from auth store
 *
 * Accessibility:
 * - Semantic <header> element
 * - Proper ARIA labels for interactive elements
 * - Focus-visible states
 * - 44px minimum touch targets
 */
export function CMSTopBar({
  onMenuToggle,
  showMenuButton = true,
  className,
}: CMSTopBarProps) {
  const profile = useAuthStore((state) => state.profile);
  const authorName = profile?.preferredName ?? 'Author';

  return (
    <header
      className={cn(
        'flex h-14 items-center justify-between border-b border-border bg-surface px-4',
        className
      )}
    >
      {/* Left section: Menu toggle (mobile) and search */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle - only visible below md breakpoint */}
        {showMenuButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded="false"
            aria-controls="cms-sidebar"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}

        {/* Search input - placeholder for now */}
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search content..."
            className="h-9 w-64 pl-9 text-sm"
            aria-label="Search CMS content"
            disabled
          />
        </div>

        {/* Mobile search button - shown on small screens */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          aria-label="Search content"
          disabled
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Right section: Back to app and author info */}
      <div className="flex items-center gap-4">
        {/* Back to App link */}
        <Link
          to="/"
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
            'text-text-muted transition-colors duration-150',
            'hover:bg-surface-secondary hover:text-text',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
          )}
          aria-label="Return to main application"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back to App</span>
        </Link>

        {/* Author info */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          {/* Author avatar placeholder */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
            aria-hidden="true"
          >
            {authorName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-text sm:block">
            {authorName}
          </span>
        </div>
      </div>
    </header>
  );
}

export default CMSTopBar;
