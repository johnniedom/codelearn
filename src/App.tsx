import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import type { UserRole } from '@/types/roles';

import { TopBar } from '@/components/navigation/TopBar';
import { BottomNav, useShowBottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { useAuthStore } from '@/stores/authStore';
import { OfflineGuide, useOfflineGuide } from '@/components/onboarding';
import { initializeSyncService } from '@/lib/sync';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ProfileSelectPage = lazy(() => import('@/pages/ProfileSelectPage'));

// Content pages (Phase 3)
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const QuizPage = lazy(() => import('@/pages/QuizPage'));

// Workbench pages (Phase 4)
const ExercisePage = lazy(() => import('@/pages/ExercisePage'));

// Phase 5 pages (Sync & Polish)
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

// CMS Pages (Phase 2)
const CMSLayout = lazy(() => import('@/components/cms/CMSLayout'));
const CMSDashboard = lazy(() => import('@/pages/cms/CMSDashboard'));
const ContentBrowser = lazy(() => import('@/pages/cms/ContentBrowser'));
const LessonEditor = lazy(() => import('@/pages/cms/LessonEditor'));
const QuizEditor = lazy(() => import('@/pages/cms/QuizEditor'));
const ExerciseEditor = lazy(() => import('@/pages/cms/ExerciseEditor'));
const AssetManager = lazy(() => import('@/pages/cms/AssetManager'));
const DraftList = lazy(() => import('@/pages/cms/DraftList'));
const AuthorSettings = lazy(() => import('@/pages/cms/AuthorSettings'));

/**
 * Page Loading Fallback
 *
 * Uses skeleton screens for better perceived performance.
 */
function PageLoader() {
  return (
    <div className="min-h-screen bg-background px-4 pt-4">
      <PageSkeleton />
    </div>
  );
}

/**
 * Protected Route Wrapper
 *
 * Redirects to profile select if not authenticated.
 * Redirects to PIN entry if session is locked.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLocked, isInitialized, profile, checkSessionValidity } = useAuthStore();
  const location = useLocation();

  // Check session validity on each render
  useEffect(() => {
    if (isAuthenticated) {
      checkSessionValidity();
    }
  }, [isAuthenticated, checkSessionValidity]);

  // Wait for auth store to initialize
  if (!isInitialized) {
    return <PageLoader />;
  }

  // Not authenticated - redirect to profile select
  if (!isAuthenticated || !profile) {
    return <Navigate to="/profiles" state={{ from: location }} replace />;
  }

  // Session is locked - redirect to login for PIN re-entry
  if (isLocked) {
    return <Navigate to="/login" state={{ userId: profile.userId, from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Role Protected Route Wrapper
 *
 * Restricts access based on user role.
 * Must be used inside a ProtectedRoute to ensure authentication.
 */
function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { profile } = useAuthStore();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Public Route Wrapper
 *
 * Redirects to home if already authenticated (for login/register pages).
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLocked, isInitialized } = useAuthStore();

  // Wait for auth store to initialize
  if (!isInitialized) {
    return <PageLoader />;
  }

  // Already authenticated and not locked - redirect to home
  if (isAuthenticated && !isLocked) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * App Layout Component
 *
 * Provides consistent layout with TopBar and BottomNav.
 * BottomNav visibility is controlled by route.
 * Includes offline guide onboarding (Phase 5).
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  const showBottomNav = useShowBottomNav();
  const { isAuthenticated, isLocked } = useAuthStore();
  const { shouldShow: showOfflineGuide, dismiss: dismissOfflineGuide } = useOfflineGuide();

  // Hide bottom nav on auth pages and workbench
  const location = useLocation();
  const isAuthPage = ['/profiles', '/login', '/register'].includes(location.pathname);
  const isWorkbenchPage = location.pathname.startsWith('/exercises/');
  const shouldShowBottomNav = showBottomNav && isAuthenticated && !isLocked && !isAuthPage && !isWorkbenchPage;

  // Full-width layout for workbench and CMS pages
  const isCMSPage = location.pathname.startsWith('/cms');
  const isFullWidthPage = isWorkbenchPage || isCMSPage;

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      {/* Top navigation with offline indicator */}
      <TopBar />

      {/* Main content area with padding for fixed navs */}
      <main
        id="main-content"
        className={`flex-1 pt-16 ${shouldShowBottomNav ? 'pb-20' : ''}`}
        tabIndex={-1}
      >
        {/* Centered container for desktop with max-width (unless full-width page) */}
        {isFullWidthPage ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-lg px-4 lg:max-w-2xl">
            {children}
          </div>
        )}
      </main>

      {/* Bottom navigation (hidden on certain routes) */}
      {shouldShowBottomNav && <BottomNav />}

      {/* Offline guide onboarding (Phase 5) - shows once on first offline */}
      {showOfflineGuide && <OfflineGuide onDismiss={dismissOfflineGuide} />}
    </div>
  );
}

/**
 * Auth Initializer
 *
 * Initializes auth store and sync service on app mount.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Initialize sync service (Phase 5)
  useEffect(() => {
    initializeSyncService().catch(console.error);
  }, []);

  return <>{children}</>;
}

/**
 * App Component
 *
 * Root component with routing configuration.
 *
 * Features:
 * - Error Boundary wrapping for graceful error handling
 * - Lazy loading with Suspense for code splitting
 * - Consistent layout with navigation
 * - Proper accessibility landmarks
 * - Protected routes for authenticated content
 * - Public routes for auth pages
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AuthInitializer>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes (accessible without auth) */}
              <Route
                path="/profiles"
                element={
                  <PublicRoute>
                    <ProfileSelectPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={<LoginPage />}
              />

              {/* Protected routes (require authentication) */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />

              {/* Content routes (Phase 3) */}
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <CoursesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:courseSlug"
                element={
                  <ProtectedRoute>
                    <CourseDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lessons/:courseSlug/:moduleId/:lessonId"
                element={
                  <ProtectedRoute>
                    <LessonPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quizzes/:courseSlug/:moduleId/:quizId"
                element={
                  <ProtectedRoute>
                    <QuizPage />
                  </ProtectedRoute>
                }
              />

              {/* Exercise/Workbench routes (Phase 4) */}
              <Route
                path="/exercises/:courseSlug/:moduleId/:exerciseId"
                element={
                  <ProtectedRoute>
                    <ExercisePage />
                  </ProtectedRoute>
                }
              />

              {/* Phase 5 routes: Sync & Polish */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* CMS routes (Author role required) */}
              <Route
                path="/cms"
                element={
                  <ProtectedRoute>
                    <RoleProtectedRoute allowedRoles={['author', 'teacher']}>
                      <CMSLayout />
                    </RoleProtectedRoute>
                  </ProtectedRoute>
                }
              >
                <Route index element={<CMSDashboard />} />
                <Route path="content" element={<ContentBrowser />} />
                <Route path="lessons/:id?" element={<LessonEditor />} />
                <Route path="quizzes/:id?" element={<QuizEditor />} />
                <Route path="exercises/:id?" element={<ExerciseEditor />} />
                <Route path="assets" element={<AssetManager />} />
                <Route path="drafts" element={<DraftList />} />
                <Route path="settings" element={<AuthorSettings />} />
              </Route>

              {/* Legacy route redirects */}
              <Route
                path="/progress"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route
                path="/profile"
                element={<Navigate to="/settings" replace />}
              />

              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </AuthInitializer>
    </ErrorBoundary>
  );
}
