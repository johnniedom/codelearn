import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to detect online/offline status with proper handling.
 *
 * This hook provides more reliable connectivity detection than just
 * navigator.onLine by:
 * 1. Using the navigator.onLine as a baseline
 * 2. Listening to online/offline events
 * 3. Optionally pinging a known endpoint to verify true connectivity
 *
 * Note: navigator.onLine can report false positives (e.g., connected to
 * WiFi but no internet), so for critical operations, verify with an
 * actual network request.
 */
export function useOnlineStatus(): boolean {
  // Initialize with the current navigator.onLine state
  // Using a function to avoid SSR issues where navigator might not exist
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Assume online during SSR
  });

  // Handler for online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  // Handler for offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also listen to visibilitychange to re-check status when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsOnline(navigator.onLine);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleOnline, handleOffline]);

  return isOnline;
}

/**
 * Extended hook that also provides a method to verify connectivity
 * by attempting to reach a specific endpoint.
 *
 * Useful for verifying hub connectivity in the CodeLearn context.
 */
export function useOnlineStatusWithVerification(pingUrl?: string) {
  const isOnline = useOnlineStatus();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyConnectivity = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      setIsVerified(false);
      return false;
    }

    if (!pingUrl) {
      setIsVerified(isOnline);
      return isOnline;
    }

    setIsVerifying(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      await fetch(pingUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Allow checking even without CORS headers
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsVerified(true);
      return true;
    } catch {
      setIsVerified(false);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isOnline, pingUrl]);

  // Auto-verify when coming online
  useEffect(() => {
    if (isOnline && pingUrl) {
      verifyConnectivity();
    } else if (!isOnline) {
      setIsVerified(false);
    }
  }, [isOnline, pingUrl, verifyConnectivity]);

  return {
    isOnline,
    isVerified,
    isVerifying,
    verifyConnectivity,
  };
}

export default useOnlineStatus;
