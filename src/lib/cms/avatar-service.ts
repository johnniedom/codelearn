/**
 * Avatar Service
 *
 * Stores author avatars in the Cache API for offline access.
 * This enables avatars to work even when the user is offline,
 * which is crucial for CodeLearn's offline-first architecture.
 *
 * Storage Strategy:
 * - Uses Cache API (not IndexedDB) for efficient blob storage
 * - Images are stored as Response objects keyed by user ID
 * - Supports JPEG, PNG, and WebP formats up to 2MB
 * - Generates SVG data URLs for initials fallback (no storage needed)
 */

const AVATAR_CACHE_NAME = 'codelearn-avatars-v1';
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

type AllowedMimeType = (typeof ALLOWED_TYPES)[number];

export interface AvatarResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface AvatarValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file before storing it as an avatar
 */
export function validateAvatarFile(file: File): AvatarValidation {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large (${sizeMB}MB). Maximum size is 2MB.`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: JPEG, PNG, WebP.`,
    };
  }

  return { valid: true };
}

/**
 * Generate the cache key path for a user's avatar
 */
function getAvatarCacheKey(userId: string): string {
  return `/avatars/${userId}`;
}

/**
 * Store an avatar image in the Cache API
 *
 * @param userId - The unique identifier for the user
 * @param file - The image file to store
 * @returns Result object with success status and path or error
 */
export async function storeAvatar(
  userId: string,
  file: File
): Promise<AvatarResult> {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    return { success: false, error: 'Invalid user ID' };
  }

  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Check if Cache API is available
    if (typeof caches === 'undefined') {
      return {
        success: false,
        error: 'Cache API not available in this browser',
      };
    }

    const cache = await caches.open(AVATAR_CACHE_NAME);
    const cacheKey = getAvatarCacheKey(userId);

    // Convert File to Response for cache storage
    const arrayBuffer = await file.arrayBuffer();
    const response = new Response(arrayBuffer, {
      headers: {
        'Content-Type': file.type,
        'Content-Length': String(file.size),
        'X-Avatar-Filename': encodeURIComponent(file.name),
        'X-Avatar-Stored-At': new Date().toISOString(),
      },
    });

    // Store in cache (overwrites any existing avatar for this user)
    await cache.put(cacheKey, response);

    return {
      success: true,
      path: cacheKey,
    };
  } catch (error) {
    console.error('[AvatarService] Failed to store avatar:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to store avatar image',
    };
  }
}

/**
 * Get the URL for a cached avatar image
 *
 * Returns a blob URL that can be used as an image src.
 * The caller is responsible for revoking the URL when done
 * to prevent memory leaks.
 *
 * @param userId - The unique identifier for the user
 * @returns Blob URL string or null if not found
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
  if (!userId || typeof userId !== 'string') {
    return null;
  }

  try {
    if (typeof caches === 'undefined') {
      return null;
    }

    const cache = await caches.open(AVATAR_CACHE_NAME);
    const cacheKey = getAvatarCacheKey(userId);
    const response = await cache.match(cacheKey);

    if (!response) {
      return null;
    }

    // Create a blob URL from the cached response
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('[AvatarService] Failed to get avatar URL:', error);
    return null;
  }
}

/**
 * Delete an avatar from the cache
 *
 * @param userId - The unique identifier for the user
 */
export async function deleteAvatar(userId: string): Promise<void> {
  if (!userId || typeof userId !== 'string') {
    return;
  }

  try {
    if (typeof caches === 'undefined') {
      return;
    }

    const cache = await caches.open(AVATAR_CACHE_NAME);
    const cacheKey = getAvatarCacheKey(userId);
    await cache.delete(cacheKey);
  } catch (error) {
    console.error('[AvatarService] Failed to delete avatar:', error);
    // Silently fail - avatar deletion is not critical
  }
}

/**
 * Check if an avatar exists in the cache
 *
 * @param userId - The unique identifier for the user
 * @returns True if avatar exists, false otherwise
 */
export async function hasAvatar(userId: string): Promise<boolean> {
  if (!userId || typeof userId !== 'string') {
    return false;
  }

  try {
    if (typeof caches === 'undefined') {
      return false;
    }

    const cache = await caches.open(AVATAR_CACHE_NAME);
    const cacheKey = getAvatarCacheKey(userId);
    const response = await cache.match(cacheKey);
    return response !== undefined;
  } catch {
    return false;
  }
}

/**
 * Extract initials from a display name
 *
 * @param name - The display name to extract initials from
 * @returns 1-2 character initials string
 */
function extractInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }

  // Split by whitespace and filter empty strings
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    // Single word: return first 1-2 characters
    return parts[0].slice(0, 2).toUpperCase();
  }

  // Multiple words: first letter of first and last word
  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return (first + last).toUpperCase();
}

/**
 * Generate an SVG data URL for an initials avatar
 *
 * Creates a circular avatar with the user's initials on a colored background.
 * This is used as a fallback when no image is uploaded.
 *
 * @param name - The display name to extract initials from
 * @param bgColor - The background color (hex, rgb, or named color)
 * @returns SVG data URL string
 */
export function generateInitialsAvatar(name: string, bgColor: string): string {
  const initials = extractInitials(name);

  // Sanitize inputs to prevent XSS in SVG
  const safeBgColor = bgColor.replace(/[<>"'&]/g, '') || '#6B7280';
  const safeInitials = initials.replace(/[<>"'&]/g, '');

  // Determine text color based on background brightness
  // Simple luminance check for readability
  const textColor = getContrastTextColor(safeBgColor);

  // Generate SVG with proper viewBox for crisp rendering at any size
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="${safeBgColor}"/>
      <text
        x="50"
        y="50"
        dy="0.35em"
        text-anchor="middle"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="40"
        font-weight="600"
        fill="${textColor}"
      >${safeInitials}</text>
    </svg>
  `.trim();

  // Encode as data URL
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Calculate contrasting text color for a background
 *
 * Uses relative luminance to determine if white or dark text
 * provides better contrast.
 *
 * @param bgColor - Background color in hex format
 * @returns '#FFFFFF' for dark backgrounds, '#1F2937' for light backgrounds
 */
function getContrastTextColor(bgColor: string): string {
  // Default to white text if we can't parse the color
  if (!bgColor.startsWith('#') || bgColor.length < 7) {
    return '#FFFFFF';
  }

  try {
    // Parse hex color
    const hex = bgColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate relative luminance (ITU-R BT.709)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Use dark text on light backgrounds, white text on dark backgrounds
    return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

/**
 * Clear all cached avatars
 *
 * Useful for cache invalidation or storage cleanup.
 * Use with caution as this removes all user avatars.
 */
export async function clearAllAvatars(): Promise<void> {
  try {
    if (typeof caches === 'undefined') {
      return;
    }

    await caches.delete(AVATAR_CACHE_NAME);
  } catch (error) {
    console.error('[AvatarService] Failed to clear avatar cache:', error);
  }
}

/**
 * Get information about the avatar cache
 *
 * @returns Object with cache statistics or null if unavailable
 */
export async function getAvatarCacheInfo(): Promise<{
  count: number;
  keys: string[];
} | null> {
  try {
    if (typeof caches === 'undefined') {
      return null;
    }

    const cache = await caches.open(AVATAR_CACHE_NAME);
    const keys = await cache.keys();

    return {
      count: keys.length,
      keys: keys.map((req) => req.url),
    };
  } catch {
    return null;
  }
}
