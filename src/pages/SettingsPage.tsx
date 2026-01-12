/**
 * SettingsPage
 *
 * Application settings and configuration.
 *
 * Features:
 * - Hub connection settings
 * - Storage usage display
 * - Clear cache option
 * - About/version info
 * - Notification preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  HardDrive,
  Trash2,
  Bell,
  Info,
  ChevronRight,
  RefreshCw,
  Check,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSyncStore } from '@/stores/syncStore';
import { getDeviceState, updateStorageQuota } from '@/lib/db';
import useOnlineStatus from '@/hooks/useOnlineStatus';

// =============================================================================
// Types
// =============================================================================

interface StorageInfo {
  used: number;
  quota: number;
  percentUsed: number;
}

// =============================================================================
// Format Bytes
// =============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// =============================================================================
// SettingsPage Component
// =============================================================================

export function SettingsPage() {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { hubUrl, setHubUrl, isHubReachable, discoverHub, lastSyncAt } = useSyncStore();

  const [deviceId, setDeviceId] = useState('');
  const [hubInput, setHubInput] = useState(hubUrl || '');
  const [isCheckingHub, setIsCheckingHub] = useState(false);
  const [hubCheckResult, setHubCheckResult] = useState<'success' | 'error' | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // Get device ID
      const deviceState = await getDeviceState();
      setDeviceId(deviceState.deviceId);

      // Get storage info
      const storageInfo = await updateStorageQuota();
      setStorage(storageInfo);
    };

    loadData();
  }, []);

  // Handle hub URL update
  const handleSaveHubUrl = useCallback(async () => {
    const url = hubInput.trim();
    setHubUrl(url || null);

    if (url) {
      setIsCheckingHub(true);
      setHubCheckResult(null);

      try {
        const reachable = await discoverHub();
        setHubCheckResult(reachable ? 'success' : 'error');
      } catch {
        setHubCheckResult('error');
      } finally {
        setIsCheckingHub(false);
      }
    }
  }, [hubInput, setHubUrl, discoverHub]);

  // Clear cache
  const handleClearCache = useCallback(async () => {
    if (!confirm('This will clear all cached content. Your progress will not be affected. Continue?')) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear Cache API caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          if (name.startsWith('content-')) {
            await caches.delete(name);
          }
        }
      }

      // Refresh storage info
      const storageInfo = await updateStorageQuota();
      setStorage(storageInfo);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  }, []);

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
          <h1 className="flex-1 text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="space-y-6 p-4">
        {/* Hub Connection */}
        <section
          className="rounded-xl border border-border bg-surface p-4"
          aria-labelledby="hub-heading"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 id="hub-heading" className="font-semibold text-text">
                Hub Connection
              </h2>
              <p className="text-sm text-text-muted">
                Connect to your class hub to sync progress
              </p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center">
              {isHubReachable ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : isOnline ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <Smartphone className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="hub-url" className="text-sm font-medium">
                Hub URL
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="hub-url"
                  type="url"
                  placeholder="http://codelearn.local"
                  value={hubInput}
                  onChange={(e) => setHubInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveHubUrl}
                  disabled={isCheckingHub}
                  className="gap-2"
                >
                  {isCheckingHub ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              {hubCheckResult === 'success' && (
                <p className="mt-1 text-sm text-green-600">
                  Connected to hub successfully
                </p>
              )}
              {hubCheckResult === 'error' && (
                <p className="mt-1 text-sm text-red-600">
                  Could not connect to hub. Check the URL and try again.
                </p>
              )}
            </div>

            {lastSyncAt && (
              <p className="text-sm text-text-muted">
                Last synced: {new Date(lastSyncAt).toLocaleString()}
              </p>
            )}
          </div>
        </section>

        {/* Storage */}
        <section
          className="rounded-xl border border-border bg-surface p-4"
          aria-labelledby="storage-heading"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <HardDrive className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 id="storage-heading" className="font-semibold text-text">
                Storage
              </h2>
              <p className="text-sm text-text-muted">
                Manage offline content storage
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {storage && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Used</span>
                  <span className="font-medium text-text">
                    {formatBytes(storage.used)} / {formatBytes(storage.quota)}
                  </span>
                </div>
                <Progress
                  value={storage.percentUsed}
                  className={cn(
                    'h-2',
                    storage.percentUsed > 80 && '[&>div]:bg-orange-500',
                    storage.percentUsed > 95 && '[&>div]:bg-red-500'
                  )}
                />
                {storage.percentUsed > 80 && (
                  <p className="text-sm text-orange-600">
                    Storage is getting full. Consider clearing some content.
                  </p>
                )}
              </>
            )}

            <Button
              variant="outline"
              className="mt-2 w-full gap-2"
              onClick={handleClearCache}
              disabled={isClearing}
            >
              {isClearing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Clear Cached Content
            </Button>
          </div>
        </section>

        {/* Notifications */}
        <section
          className="rounded-xl border border-border bg-surface p-4"
          aria-labelledby="notifications-heading"
        >
          <button
            className="flex w-full items-center gap-3"
            onClick={() => navigate('/notifications')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h2 id="notifications-heading" className="font-semibold text-text">
                Notifications
              </h2>
              <p className="text-sm text-text-muted">
                Manage notification preferences
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-text-muted" />
          </button>
        </section>

        {/* About */}
        <section
          className="rounded-xl border border-border bg-surface p-4"
          aria-labelledby="about-heading"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Info className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h2 id="about-heading" className="font-semibold text-text">
                About CodeLearn
              </h2>
              <p className="text-sm text-text-muted">Version 1.0.0</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-text-muted">
            <p>
              <span className="font-medium text-text">Device ID:</span>{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                {deviceId.slice(0, 8)}...
              </code>
            </p>
            <p>
              CodeLearn is an offline-first learning app designed for students
              in areas with limited connectivity.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SettingsPage;
