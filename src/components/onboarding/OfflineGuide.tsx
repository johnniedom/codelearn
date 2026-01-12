/**
 * OfflineGuide Component
 *
 * "What You Can Do Offline" onboarding guide.
 * Shows once on first offline detection per audit requirements.
 *
 * Features:
 * - Checklist of offline capabilities
 * - One-time display (persisted in localStorage)
 * - Dismissible
 * - Accessible
 */

import { useState, useEffect } from 'react';
import {
  BookOpen,
  FileQuestion,
  Code,
  Save,
  CheckCircle,
  X,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

interface OfflineGuideProps {
  /** Callback when guide is dismissed */
  onDismiss?: () => void;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// LocalStorage Key
// =============================================================================

const OFFLINE_GUIDE_SHOWN_KEY = 'codelearn_offline_guide_shown';

// =============================================================================
// Offline Capabilities
// =============================================================================

interface Capability {
  icon: React.ElementType;
  title: string;
  description: string;
}

const OFFLINE_CAPABILITIES: Capability[] = [
  {
    icon: BookOpen,
    title: 'Read lessons',
    description: 'All downloaded lessons are available offline',
  },
  {
    icon: FileQuestion,
    title: 'Take quizzes',
    description: 'Complete quizzes and see results immediately',
  },
  {
    icon: Code,
    title: 'Solve coding exercises',
    description: 'Write and run Python code without internet',
  },
  {
    icon: Save,
    title: 'Save your progress',
    description: 'Your work is saved and will sync when connected',
  },
];

// =============================================================================
// OfflineGuide Component
// =============================================================================

export function OfflineGuide({ onDismiss, className }: OfflineGuideProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if guide has been shown before
    const hasShown = localStorage.getItem(OFFLINE_GUIDE_SHOWN_KEY);
    if (!hasShown) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(OFFLINE_GUIDE_SHOWN_KEY, 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-guide-title"
    >
      <div className="mx-4 mb-4 w-full max-w-md rounded-xl bg-surface p-6 shadow-xl sm:mb-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <WifiOff className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2
                id="offline-guide-title"
                className="text-lg font-semibold text-text"
              >
                Working Offline
              </h2>
              <p className="text-sm text-text-muted">
                No internet? No problem!
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label="Close guide"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Capabilities list */}
        <div className="mt-6 space-y-4">
          <p className="text-sm text-text-muted">
            Here&apos;s what you can do offline:
          </p>

          <ul className="space-y-3">
            {OFFLINE_CAPABILITIES.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <Icon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-text">{capability.title}</p>
                    <p className="text-sm text-text-muted">
                      {capability.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sync reminder */}
        <div className="mt-6 rounded-lg bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">
                Remember to sync!
              </p>
              <p className="text-yellow-700">
                When you&apos;re back online, your progress will automatically
                share with your class.
              </p>
            </div>
          </div>
        </div>

        {/* Dismiss button */}
        <Button className="mt-6 w-full" onClick={handleDismiss}>
          Got it!
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// useOfflineGuide Hook
// =============================================================================

/**
 * Hook to manage offline guide visibility
 * Shows guide on first offline detection
 */
export function useOfflineGuide() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      const hasShown = localStorage.getItem(OFFLINE_GUIDE_SHOWN_KEY);
      if (!hasShown) {
        setShouldShow(true);
      }
    };

    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(OFFLINE_GUIDE_SHOWN_KEY, 'true');
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
}

export default OfflineGuide;
