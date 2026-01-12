/**
 * Content Package Loader
 *
 * Loads content packages from Cache API for offline-first access.
 *
 * Features:
 * - Load courses, modules, lessons from cache
 * - JSON schema validation
 * - Manifest parsing for course structure
 * - Asset URL resolution from Cache API
 */

import type {
  PackageManifest,
  Course,
  Module,
  Lesson,
  Quiz,
  CodeExercise,
  CourseListItem,
  LessonListItem,
  LessonStatus,
} from '@/types/content';

// =============================================================================
// Constants
// =============================================================================

/** Cache name for content packages */
const CONTENT_CACHE_NAME = 'codelearn-content-v1';

/** Base URL for content in cache */
const CONTENT_BASE_URL = '/content';

// =============================================================================
// Types
// =============================================================================

/** Result of loading a content package */
export interface PackageLoadResult {
  success: boolean;
  manifest?: PackageManifest;
  course?: Course;
  error?: string;
}

/** Result of loading a lesson */
export interface LessonLoadResult {
  success: boolean;
  lesson?: Lesson;
  error?: string;
}

/** Result of loading a quiz */
export interface QuizLoadResult {
  success: boolean;
  quiz?: Quiz;
  error?: string;
}

// =============================================================================
// Cache Helpers
// =============================================================================

/**
 * Get the content cache instance
 */
async function getContentCache(): Promise<Cache | null> {
  try {
    if (!('caches' in window)) {
      console.warn('Cache API not available');
      return null;
    }
    return await caches.open(CONTENT_CACHE_NAME);
  } catch (error) {
    console.error('Failed to open content cache:', error);
    return null;
  }
}

/**
 * Fetch a JSON file from the cache
 */
async function fetchFromCache<T>(path: string): Promise<T | null> {
  try {
    const cache = await getContentCache();
    if (!cache) return null;

    const url = `${CONTENT_BASE_URL}/${path}`;
    const response = await cache.match(url);

    if (!response) {
      console.warn(`Content not found in cache: ${path}`);
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`Failed to fetch content from cache: ${path}`, error);
    return null;
  }
}

/**
 * Check if a file exists in the cache
 */
export async function existsInCache(path: string): Promise<boolean> {
  try {
    const cache = await getContentCache();
    if (!cache) return false;

    const url = `${CONTENT_BASE_URL}/${path}`;
    const response = await cache.match(url);
    return response !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get the URL for an asset in the cache
 *
 * Returns a URL that can be used in src attributes.
 * For offline access, this will be a cached URL.
 */
export function getAssetUrl(packageSlug: string, assetPath: string): string {
  return `${CONTENT_BASE_URL}/${packageSlug}/${assetPath}`;
}

// =============================================================================
// Package Loading
// =============================================================================

/**
 * Load a content package manifest
 */
export async function loadManifest(packageSlug: string): Promise<PackageManifest | null> {
  return fetchFromCache<PackageManifest>(`${packageSlug}/manifest.json`);
}

/**
 * Load a course from a content package
 */
export async function loadCourse(packageSlug: string): Promise<Course | null> {
  return fetchFromCache<Course>(`${packageSlug}/course.json`);
}

/**
 * Load a module from a content package
 */
export async function loadModule(
  packageSlug: string,
  moduleId: string
): Promise<Module | null> {
  return fetchFromCache<Module>(`${packageSlug}/modules/${moduleId}/module.json`);
}

/**
 * Load a lesson from a content package
 */
export async function loadLesson(
  packageSlug: string,
  moduleId: string,
  lessonId: string
): Promise<Lesson | null> {
  return fetchFromCache<Lesson>(
    `${packageSlug}/modules/${moduleId}/lessons/${lessonId}/lesson.json`
  );
}

/**
 * Load a quiz from a content package
 */
export async function loadQuiz(
  packageSlug: string,
  moduleId: string,
  quizId: string
): Promise<Quiz | null> {
  return fetchFromCache<Quiz>(
    `${packageSlug}/modules/${moduleId}/assessments/${quizId}.json`
  );
}

/**
 * Load a code exercise from a content package
 */
export async function loadExercise(
  packageSlug: string,
  moduleId: string,
  lessonId: string,
  exerciseId: string
): Promise<CodeExercise | null> {
  return fetchFromCache<CodeExercise>(
    `${packageSlug}/modules/${moduleId}/lessons/${lessonId}/exercises/${exerciseId}.json`
  );
}

// =============================================================================
// Content Discovery
// =============================================================================

/**
 * List all installed course packages
 *
 * Scans the cache for manifest.json files to find installed courses.
 */
export async function listInstalledCourses(): Promise<CourseListItem[]> {
  try {
    const cache = await getContentCache();
    if (!cache) return [];

    const keys = await cache.keys();
    const courses: CourseListItem[] = [];

    // Find all manifest files
    const manifestUrls = keys
      .filter((req) => req.url.endsWith('/manifest.json'))
      .map((req) => req.url);

    for (const manifestUrl of manifestUrls) {
      try {
        // Extract package slug from URL
        const urlParts = manifestUrl.split('/');
        const slugIndex = urlParts.indexOf('content') + 1;
        const packageSlug = urlParts[slugIndex];

        if (!packageSlug) continue;

        // Load the course
        const course = await loadCourse(packageSlug);
        if (!course) continue;

        courses.push({
          id: course.id,
          slug: course.slug,
          title: course.title.default,
          description: course.description.default,
          thumbnail: course.thumbnail ? getAssetUrl(packageSlug, course.thumbnail.path) : undefined,
          icon: course.icon,
          difficulty: course.difficulty,
          lessonsCount: course.structure.lessonCount,
          completedLessons: 0, // Will be populated from progress tracker
          estimatedHours: course.duration.totalHours,
        });
      } catch (error) {
        console.warn('Failed to load course from manifest:', manifestUrl, error);
      }
    }

    return courses;
  } catch (error) {
    console.error('Failed to list installed courses:', error);
    return [];
  }
}

/**
 * Get lessons for a course
 *
 * Returns a flat list of lessons across all modules.
 */
export async function getCourseLessons(
  packageSlug: string,
  completedLessonIds: Set<string> = new Set()
): Promise<LessonListItem[]> {
  try {
    const course = await loadCourse(packageSlug);
    if (!course) return [];

    const lessons: LessonListItem[] = [];
    let previousCompleted = true; // First lesson is always available

    for (const moduleRef of course.modules) {
      const module = await loadModule(packageSlug, moduleRef.moduleId);
      if (!module) continue;

      for (const lessonRef of module.lessons) {
        const lesson = await loadLesson(packageSlug, moduleRef.moduleId, lessonRef.lessonId);
        if (!lesson) continue;

        // Determine lesson status
        let status: LessonStatus;
        const isCompleted = completedLessonIds.has(lesson.id);

        if (isCompleted) {
          status = 'completed';
        } else if (previousCompleted || course.settings.allowNonLinearProgress) {
          status = 'available';
        } else {
          status = 'locked';
        }

        // Check if this is the "in-progress" lesson (first available non-completed)
        if (status === 'available' && !lessons.some((l) => l.status === 'in-progress')) {
          status = 'in-progress';
        }

        lessons.push({
          id: lesson.id,
          title: lesson.title.default,
          duration: lesson.estimatedMinutes,
          status,
          moduleId: lesson.moduleId,
          courseId: lesson.courseId,
        });

        previousCompleted = isCompleted;
      }
    }

    return lessons;
  } catch (error) {
    console.error('Failed to get course lessons:', error);
    return [];
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a package manifest
 *
 * Performs basic structural validation.
 * Full JSON schema validation would use a library like Ajv.
 */
export function validateManifest(manifest: unknown): manifest is PackageManifest {
  if (!manifest || typeof manifest !== 'object') return false;

  const m = manifest as Record<string, unknown>;

  // Check required fields
  if (m.schemaVersion !== '1.0.0') return false;
  if (!m.package || typeof m.package !== 'object') return false;
  if (!m.integrity || typeof m.integrity !== 'object') return false;

  const pkg = m.package as Record<string, unknown>;
  if (typeof pkg.id !== 'string') return false;
  if (typeof pkg.slug !== 'string') return false;
  if (typeof pkg.version !== 'string') return false;

  return true;
}

/**
 * Validate a course object
 */
export function validateCourse(course: unknown): course is Course {
  if (!course || typeof course !== 'object') return false;

  const c = course as Record<string, unknown>;

  // Check required fields
  if (c.schemaVersion !== '1.0.0') return false;
  if (typeof c.id !== 'string') return false;
  if (typeof c.slug !== 'string') return false;
  if (!c.title || typeof (c.title as { default?: string }).default !== 'string') return false;
  if (!Array.isArray(c.modules)) return false;

  return true;
}

/**
 * Validate a lesson object
 */
export function validateLesson(lesson: unknown): lesson is Lesson {
  if (!lesson || typeof lesson !== 'object') return false;

  const l = lesson as Record<string, unknown>;

  // Check required fields
  if (l.schemaVersion !== '1.0.0') return false;
  if (typeof l.id !== 'string') return false;
  if (typeof l.moduleId !== 'string') return false;
  if (typeof l.courseId !== 'string') return false;
  if (!l.title || typeof (l.title as { default?: string }).default !== 'string') return false;
  if (!Array.isArray(l.content)) return false;

  return true;
}

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Store content in cache
 *
 * Used when downloading content packages from the hub.
 */
export async function storeContent(
  path: string,
  content: unknown
): Promise<boolean> {
  try {
    const cache = await getContentCache();
    if (!cache) return false;

    const url = `${CONTENT_BASE_URL}/${path}`;
    const response = new Response(JSON.stringify(content), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await cache.put(url, response);
    return true;
  } catch (error) {
    console.error('Failed to store content in cache:', error);
    return false;
  }
}

/**
 * Store an asset (binary file) in cache
 */
export async function storeAsset(
  path: string,
  blob: Blob
): Promise<boolean> {
  try {
    const cache = await getContentCache();
    if (!cache) return false;

    const url = `${CONTENT_BASE_URL}/${path}`;
    const response = new Response(blob, {
      headers: {
        'Content-Type': blob.type,
        'Content-Length': blob.size.toString(),
      },
    });

    await cache.put(url, response);
    return true;
  } catch (error) {
    console.error('Failed to store asset in cache:', error);
    return false;
  }
}

/**
 * Delete a content package from cache
 */
export async function deletePackage(packageSlug: string): Promise<boolean> {
  try {
    const cache = await getContentCache();
    if (!cache) return false;

    const keys = await cache.keys();
    const prefix = `${CONTENT_BASE_URL}/${packageSlug}/`;

    const deletePromises = keys
      .filter((req) => req.url.includes(prefix))
      .map((req) => cache.delete(req));

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Failed to delete package from cache:', error);
    return false;
  }
}

/**
 * Get cache storage usage for content
 */
export async function getContentCacheSize(): Promise<number> {
  try {
    const cache = await getContentCache();
    if (!cache) return 0;

    const keys = await cache.keys();
    let totalSize = 0;

    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to get content cache size:', error);
    return 0;
  }
}
