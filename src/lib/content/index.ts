/**
 * Content Library Exports
 *
 * Re-exports all content-related functionality for convenient imports.
 */

// Package loader
export {
  loadManifest,
  loadCourse,
  loadModule,
  loadLesson,
  loadQuiz,
  loadExercise,
  listInstalledCourses,
  getCourseLessons,
  getAssetUrl,
  existsInCache,
  storeContent,
  storeAsset,
  deletePackage,
  getContentCacheSize,
  validateManifest,
  validateCourse,
  validateLesson,
  type PackageLoadResult,
  type LessonLoadResult,
  type QuizLoadResult,
} from './package-loader';

// Progress tracker
export {
  recordLessonCompletion,
  recordQuizAttempt,
  getCourseProgress,
  getModuleProgress,
  getLessonProgress,
  getCompletedLessonIds,
  getQuizAttempts,
  getBestQuizScore,
  getLearningStats,
  verifyProgressChain,
  type CourseProgress,
  type ModuleProgress,
  type LessonProgress,
} from './progress-tracker';
