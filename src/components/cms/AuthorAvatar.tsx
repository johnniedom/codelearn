/**
 * AuthorAvatar Component
 *
 * Displays an author avatar with support for three types:
 * 1. Initials - Auto-generated SVG with name initials on colored background
 * 2. Icon - Emoji displayed on colored background
 * 3. Image - User-uploaded image stored in Cache API
 *
 * When editable, provides an upload overlay for changing the avatar image.
 *
 * Features:
 * - Circular avatar with consistent sizing (sm/md/lg)
 * - Hover overlay for editable mode with upload trigger
 * - File validation (type, size) before upload
 * - Accessible with proper ARIA labels
 * - Graceful fallback chain: image -> icon -> initials
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  storeAvatar,
  getAvatarUrl,
  deleteAvatar,
  generateInitialsAvatar,
  validateAvatarFile,
} from '@/lib/cms/avatar-service';

export type AvatarType = 'initials' | 'icon' | 'image';
export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AuthorAvatarProps {
  /** User ID for avatar storage */
  userId: string;
  /** Display name for initials generation */
  displayName: string;
  /** Type of avatar to display */
  avatarType: AvatarType;
  /** Icon emoji (for 'icon' type) or cached path (for 'image' type) */
  avatarData: string | null;
  /** Background color for initials/icon avatars */
  avatarBgColor: string | null;
  /** Size variant: sm=32px, md=48px, lg=80px */
  size?: AvatarSize;
  /** Enable edit mode with upload overlay */
  editable?: boolean;
  /** Callback when avatar changes */
  onAvatarChange?: (type: AvatarType, data: string | null) => void;
  /** Additional class names */
  className?: string;
}

/** Size dimensions in pixels for each variant */
const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 80,
};

/** Tailwind classes for each size variant */
const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
};

/** Font size classes for initials/icons */
const FONT_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl',
};

export function AuthorAvatar({
  userId,
  displayName,
  avatarType,
  avatarData,
  avatarBgColor,
  size = 'md',
  editable = false,
  onAvatarChange,
  className,
}: AuthorAvatarProps) {
  // Image URL for cached avatars (created from blob)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default background color if none provided
  const bgColor = avatarBgColor ?? '#6B7280';

  // Load cached image URL when component mounts or type changes
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function loadImageUrl() {
      if (avatarType !== 'image' || !avatarData) {
        setImageUrl(null);
        return;
      }

      try {
        const url = await getAvatarUrl(userId);
        if (isMounted && url) {
          objectUrl = url;
          setImageUrl(url);
        }
      } catch (err) {
        console.error('[AuthorAvatar] Failed to load image:', err);
        if (isMounted) {
          setImageUrl(null);
        }
      }
    }

    loadImageUrl();

    // Cleanup: revoke object URL to prevent memory leaks
    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [userId, avatarType, avatarData]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset file input for re-selection of same file
      event.target.value = '';

      // Validate file before upload
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid file');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await storeAvatar(userId, file);

        if (result.success && result.path) {
          // Get the new image URL
          const newUrl = await getAvatarUrl(userId);

          // Revoke old URL if it exists
          if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
          }

          setImageUrl(newUrl);
          onAvatarChange?.('image', result.path);
        } else {
          setError(result.error ?? 'Failed to save avatar');
        }
      } catch (err) {
        console.error('[AuthorAvatar] Upload failed:', err);
        setError('Failed to upload image');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, imageUrl, onAvatarChange]
  );

  // Handle avatar removal (revert to initials)
  const handleRemoveAvatar = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteAvatar(userId);

      // Revoke old URL if it exists
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      setImageUrl(null);
      onAvatarChange?.('initials', null);
    } catch (err) {
      console.error('[AuthorAvatar] Remove failed:', err);
      setError('Failed to remove avatar');
    } finally {
      setIsLoading(false);
    }
  }, [userId, imageUrl, onAvatarChange]);

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Render avatar content based on type
  const renderAvatarContent = () => {
    // Loading state
    if (isLoading) {
      return (
        <AvatarFallback
          className={cn('bg-surface', SIZE_CLASSES[size])}
          style={{ backgroundColor: bgColor }}
        >
          <Loader2
            className={cn('animate-spin text-white', size === 'sm' ? 'h-3 w-3' : 'h-5 w-5')}
            aria-hidden="true"
          />
        </AvatarFallback>
      );
    }

    // Image type with valid URL
    if (avatarType === 'image' && imageUrl) {
      return (
        <>
          <AvatarImage
            src={imageUrl}
            alt={`${displayName}'s avatar`}
            className="object-cover"
          />
          <AvatarFallback
            className={SIZE_CLASSES[size]}
            style={{ backgroundColor: bgColor }}
          >
            {/* Fallback to initials while image loads */}
            <img
              src={generateInitialsAvatar(displayName, bgColor)}
              alt=""
              className="h-full w-full"
              aria-hidden="true"
            />
          </AvatarFallback>
        </>
      );
    }

    // Icon type (emoji)
    if (avatarType === 'icon' && avatarData) {
      return (
        <AvatarFallback
          className={cn(SIZE_CLASSES[size], FONT_SIZE_CLASSES[size])}
          style={{ backgroundColor: bgColor }}
        >
          <span role="img" aria-label={`${displayName}'s icon`}>
            {avatarData}
          </span>
        </AvatarFallback>
      );
    }

    // Default: Initials
    return (
      <AvatarFallback className={SIZE_CLASSES[size]}>
        <img
          src={generateInitialsAvatar(displayName, bgColor)}
          alt={`${displayName}'s initials`}
          className="h-full w-full"
        />
      </AvatarFallback>
    );
  };

  // Render edit overlay
  const renderEditOverlay = () => {
    if (!editable || isLoading) return null;

    const showOverlay = isHovered;
    const sizeNum = SIZE_MAP[size];

    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-200',
          'bg-black/60',
          showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!showOverlay}
      >
        <div className="flex gap-1">
          {/* Upload button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'text-white hover:bg-white/20 hover:text-white',
              sizeNum < 48 ? 'h-6 w-6' : 'h-8 w-8'
            )}
            onClick={triggerFileInput}
            aria-label="Upload new avatar"
          >
            {avatarType === 'image' ? (
              <Camera className={sizeNum < 48 ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden="true" />
            ) : (
              <Upload className={sizeNum < 48 ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden="true" />
            )}
          </Button>

          {/* Remove button (only show if there's an uploaded image) */}
          {avatarType === 'image' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'text-white hover:bg-white/20 hover:text-white',
                sizeNum < 48 ? 'h-6 w-6' : 'h-8 w-8'
              )}
              onClick={handleRemoveAvatar}
              aria-label="Remove avatar"
            >
              <X className={sizeNum < 48 ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <Avatar
        className={cn(
          SIZE_CLASSES[size],
          'ring-2 ring-border',
          editable && 'cursor-pointer'
        )}
        aria-label={`${displayName}'s avatar`}
      >
        {renderAvatarContent()}
      </Avatar>

      {renderEditOverlay()}

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="sr-only"
          aria-label="Choose avatar image file"
        />
      )}

      {/* Error message */}
      {error && (
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-error px-2 py-0.5 text-xs text-white"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default AuthorAvatar;
