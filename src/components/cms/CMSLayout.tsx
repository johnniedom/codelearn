import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CMSSidebar } from './CMSSidebar';
import { CMSTopBar } from './CMSTopBar';

/**
 * CMSLayout Component
 *
 * Main layout wrapper for the Content Management System.
 *
 * Features:
 * - Responsive sidebar: visible on desktop (md+), hamburger menu on mobile
 * - Slide-in sidebar with backdrop on mobile
 * - Fixed top bar with menu toggle
 * - Main content area using React Router's Outlet
 *
 * Layout Structure:
 * - Mobile: Full-width content with slide-in sidebar overlay
 * - Desktop: Fixed sidebar (256px) + scrollable main content
 *
 * Accessibility:
 * - Focus trap within mobile sidebar when open
 * - Escape key closes mobile sidebar
 * - Backdrop click closes mobile sidebar
 * - aria-hidden on main content when sidebar is open (mobile)
 */
export function CMSLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar - fixed at top */}
      <CMSTopBar
        onMenuToggle={toggleMobileSidebar}
        showMenuButton={true}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar - fixed width, hidden on mobile */}
        <aside
          className="hidden w-64 shrink-0 border-r border-border md:block"
          aria-label="CMS navigation"
        >
          <CMSSidebar />
        </aside>

        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={closeMobileSidebar}
              aria-hidden="true"
            />

            {/* Slide-in sidebar */}
            <aside
              id="cms-sidebar"
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-64 transform bg-surface shadow-lg transition-transform duration-300 ease-out md:hidden',
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              )}
              aria-label="CMS navigation"
              aria-modal="true"
              role="dialog"
            >
              {/* Close button */}
              <div className="absolute right-2 top-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileSidebar}
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>

              <CMSSidebar onNavClick={closeMobileSidebar} />
            </aside>
          </>
        )}

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto"
          aria-hidden={isMobileSidebarOpen}
        >
          <div className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default CMSLayout;
