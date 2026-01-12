/**
 * CodeLearn Content Package Type Definitions
 *
 * These types define the complete schema system for CodeLearn content packages,
 * enabling offline-first educational content delivery for the CodeLearn PWA platform.
 *
 * @packageDocumentation
 */

// =============================================================================
// PRIMITIVE TYPES AND ENUMERATIONS
// =============================================================================

/** ISO 8601 timestamp string (e.g., "2026-01-07T14:30:00Z") */
export type ISO8601Timestamp = string;

/** Semantic version string (e.g., "1.2.3") */
export type SemVer = string;

/** Duration in seconds */
export type DurationSeconds = number;

/** File size in bytes */
export type FileSizeBytes = number;

/** SHA-256 hash as 64-character hex string */
export type SHA256Hash = string;

/** Relative path within package (e.g., "assets/images/img-001.png") */
export type RelativePath = string;

/** Locale code following BCP 47 (e.g., "en", "sw", "fr") */
export type LocaleCode = string;

/** Supported programming languages for code exercises */
export type ProgrammingLanguage =
  | 'python'
  | 'javascript'
  | 'html'
  | 'css'
  | 'html-css'
  | 'sql';

/** Grade level enumeration */
export type GradeLevel =
  | 'grade-1' | 'grade-2' | 'grade-3' | 'grade-4'
  | 'grade-5' | 'grade-6' | 'grade-7' | 'grade-8'
  | 'grade-9' | 'grade-10' | 'grade-11' | 'grade-12'
  | 'undergraduate' | 'adult' | 'all';

/** Difficulty level for content and exercises */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/** Content status for editorial workflow */
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

/** Question types for assessments */
export type QuestionType =
  | 'multiple-choice'
  | 'multiple-select'
  | 'true-false'
  | 'fill-blank'
  | 'fill-blank-options'
  | 'matching'
  | 'ordering'
  | 'code-output'
  | 'code-completion'
  | 'code-challenge';

/** Content block types within lessons */
export type ContentBlockType =
  | 'text'
  | 'code'
  | 'image'
  | 'video'
  | 'audio'
  | 'callout'
  | 'exercise'
  | 'quiz-inline'
  | 'divider';

/** Callout box types */
export type CalloutType = 'info' | 'tip' | 'warning' | 'error' | 'example';

/** Bloom's taxonomy levels for learning objectives */
export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

// =============================================================================
// REUSABLE COMPONENTS
// =============================================================================

/**
 * Localized string supporting multiple languages.
 * The `default` field contains the primary content.
 */
export interface LocalizedString {
  /** Default/primary content (required) */
  default: string;
  /** Translations keyed by locale code */
  translations?: Record<LocaleCode, string>;
}

/** Author or contributor information */
export interface Author {
  name: string;
  email?: string;
  organization?: string;
  url?: string;
}

/** Learning objective with Bloom's taxonomy classification */
export interface LearningObjective {
  id: string;
  description: LocalizedString;
  /** Bloom's taxonomy level */
  level?: BloomLevel;
}

/** Prerequisite reference for courses, modules, or lessons */
export interface Prerequisite {
  /** Type of prerequisite */
  type: 'course' | 'module' | 'lesson' | 'skill';
  /** Reference ID */
  refId: string;
  /** Human-readable description */
  description: LocalizedString;
  /** Is this strictly required or recommended? */
  required: boolean;
}

/** Reference to an asset file within the package */
export interface AssetReference {
  /** Unique asset ID within package */
  assetId: string;
  /** Relative path to file */
  path: RelativePath;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: FileSizeBytes;
  /** SHA-256 checksum */
  checksum: SHA256Hash;
  /** Alt text for accessibility */
  altText?: LocalizedString;
}

/** Time range for video/audio segments */
export interface TimeRange {
  startSeconds: number;
  endSeconds: number;
}

/** Progress checkpoint within a lesson */
export interface ProgressCheckpoint {
  id: string;
  /** Percentage through content (0-100) */
  percentComplete: number;
  /** Optional timestamp for video/audio */
  timestamp?: DurationSeconds;
}

// =============================================================================
// PACKAGE MANIFEST
// =============================================================================

/**
 * Package manifest - the entry point for any content package.
 * Located at: manifest.json
 */
export interface PackageManifest {
  /** Schema version for this manifest format */
  schemaVersion: '1.0.0';

  /** Package metadata */
  package: {
    /** Globally unique package ID (UUID v4) */
    id: string;
    /** URL-safe slug for the package */
    slug: string;
    /** Semantic version of this package */
    version: SemVer;
    /** When this version was created */
    createdAt: ISO8601Timestamp;
    /** When this version was last modified */
    updatedAt: ISO8601Timestamp;
    /** Previous version (for delta updates) */
    previousVersion?: SemVer;
  };

  /** Content signing for security */
  signature: {
    /** Signing algorithm */
    algorithm: 'ed25519';
    /** Public key ID (for key rotation) */
    keyId: string;
    /** Base64-encoded signature of package hash */
    value: string;
    /** ISO timestamp of signing */
    signedAt: ISO8601Timestamp;
    /** Identifier of the signing authority */
    signedBy: string;
  };

  /** Integrity verification */
  integrity: {
    /** Hash algorithm used */
    algorithm: 'sha256';
    /** Hash of course.json */
    courseHash: SHA256Hash;
    /** Hash of all module hashes concatenated */
    modulesHash: SHA256Hash;
    /** Hash of all asset hashes concatenated */
    assetsHash: SHA256Hash;
    /** Combined package hash */
    packageHash: SHA256Hash;
  };

  /** Storage and sync information */
  storage: {
    /** Total package size in bytes */
    totalSizeBytes: FileSizeBytes;
    /** Size breakdown by content type */
    breakdown: {
      contentJson: FileSizeBytes;
      images: FileSizeBytes;
      audio: FileSizeBytes;
      video: FileSizeBytes;
      other: FileSizeBytes;
    };
    /** Minimum required free space to install */
    requiredFreeSpace: FileSizeBytes;
    /** Estimated download time at 1 Mbps */
    estimatedDownloadSeconds: DurationSeconds;
  };

  /** Package dependencies */
  dependencies: {
    /** Minimum CodeLearn app version */
    minAppVersion: SemVer;
    /** Other required packages */
    requiredPackages: Array<{
      packageId: string;
      minVersion: SemVer;
    }>;
    /** Optional enhancement packages */
    optionalPackages: Array<{
      packageId: string;
      description: string;
    }>;
  };

  /** Sync metadata */
  sync: {
    /** Priority for sync queue (higher = sync first) */
    priority: number;
    /** Can this package be partially synced? */
    supportsPartialSync: boolean;
    /** Chunk size for partial sync in bytes */
    chunkSizeBytes?: FileSizeBytes;
    /** List of files for incremental updates */
    fileManifest: Array<{
      path: RelativePath;
      sizeBytes: FileSizeBytes;
      checksum: SHA256Hash;
      modifiedAt: ISO8601Timestamp;
    }>;
  };

  /** Hub-specific metadata */
  hub: {
    /** Which hub(s) this package is approved for */
    approvedHubs?: string[];
    /** Access restrictions */
    accessLevel: 'public' | 'registered' | 'enrolled';
    /** Expiration date for time-limited content */
    expiresAt?: ISO8601Timestamp;
  };
}

// =============================================================================
// COURSE
// =============================================================================

/**
 * Course - the top-level content container.
 * Located at: course.json
 */
export interface Course {
  schemaVersion: '1.0.0';

  /** Course identification */
  id: string;
  slug: string;

  /** Display information */
  title: LocalizedString;
  shortTitle: LocalizedString;
  description: LocalizedString;

  /** Visual assets */
  thumbnail: AssetReference;
  coverImage?: AssetReference;
  icon?: string;

  /** Authorship */
  authors: Author[];
  contributors?: Author[];
  publisher?: {
    name: string;
    url?: string;
    logo?: AssetReference;
  };

  /** Classification */
  category: string;
  tags: string[];
  targetAudience: {
    gradeLevels: GradeLevel[];
    ageRange?: { min: number; max: number };
    description?: LocalizedString;
  };
  difficulty: DifficultyLevel;

  /** Learning design */
  learningObjectives: LearningObjective[];
  prerequisites: Prerequisite[];
  skillsGained: string[];

  /** Course structure summary */
  structure: {
    moduleCount: number;
    lessonCount: number;
    assessmentCount: number;
    exerciseCount: number;
  };

  /** Time estimates */
  duration: {
    totalHours: number;
    weeklyHours: number;
    weeksToComplete: number;
  };

  /** Module references (ordered) */
  modules: Array<{
    moduleId: string;
    path: RelativePath;
  }>;

  /** Completion requirements */
  completion: {
    requiredModules: string[];
    minOverallScore: number;
    certificateEnabled: boolean;
    certificateTemplate?: string;
  };

  /** Settings */
  settings: {
    allowNonLinearProgress: boolean;
    showTimeEstimates: boolean;
    discussionEnabled: boolean;
    autoPlayNarration: boolean;
  };

  /** Metadata */
  locale: LocaleCode;
  supportedLocales: LocaleCode[];
  status: ContentStatus;
  publishedAt?: ISO8601Timestamp;

  /** Legal */
  license?: {
    type: string;
    url?: string;
    attribution?: string;
  };
}

// =============================================================================
// MODULE
// =============================================================================

/**
 * Module - groups related lessons within a course.
 * Located at: modules/{module-id}/module.json
 */
export interface Module {
  schemaVersion: '1.0.0';

  id: string;
  courseId: string;
  orderIndex: number;

  title: LocalizedString;
  shortTitle: LocalizedString;
  description: LocalizedString;

  thumbnail?: AssetReference;
  icon?: string;

  learningObjectives: LearningObjective[];
  prerequisites: Prerequisite[];

  estimatedMinutes: number;

  lessons: Array<{
    lessonId: string;
    path: RelativePath;
    required: boolean;
  }>;

  assessment?: {
    quizId: string;
    path: RelativePath;
    availability: 'always' | 'after-lessons' | 'hidden';
    required: boolean;
    passingScore: number;
  };

  unlockConditions: {
    type: 'none' | 'previous-module' | 'specific-modules' | 'score-threshold';
    requiredModuleIds?: string[];
    minAverageScore?: number;
  };

  completion: {
    lessonThreshold: number;
    requireAssessment: boolean;
  };

  status: ContentStatus;
}

// =============================================================================
// LESSON
// =============================================================================

/**
 * Lesson - the primary learning content container.
 * Located at: modules/{module-id}/lessons/{lesson-id}/lesson.json
 */
export interface Lesson {
  schemaVersion: '1.0.0';

  id: string;
  moduleId: string;
  courseId: string;
  orderIndex: number;

  title: LocalizedString;
  shortTitle: LocalizedString;
  description: LocalizedString;

  thumbnail?: AssetReference;

  learningObjectives: LearningObjective[];

  estimatedMinutes: number;
  readingMinutes?: number;
  videoMinutes?: number;
  practiceMinutes?: number;

  difficulty: DifficultyLevel;

  /** Main content - ordered array of content blocks */
  content: ContentBlock[];

  /** Audio narration for the lesson */
  narration?: {
    audioFile: AssetReference;
    syncPoints: Array<{
      contentBlockId: string;
      startSeconds: number;
      endSeconds: number;
    }>;
    transcript?: LocalizedString;
  };

  summary?: {
    keyPoints: LocalizedString[];
    nextSteps?: LocalizedString;
  };

  resources?: Array<{
    title: LocalizedString;
    type: 'article' | 'video' | 'tool' | 'book' | 'other';
    url?: string;
    note?: LocalizedString;
  }>;

  navigation: {
    previousLessonId?: string;
    nextLessonId?: string;
    allowSkip: boolean;
  };

  progress: {
    completionCriteria: 'view' | 'scroll-end' | 'time-spent' | 'quiz-pass' | 'exercise-pass';
    minTimeSeconds?: number;
    requiredBlocks?: string[];
    checkpoints: ProgressCheckpoint[];
  };

  status: ContentStatus;
}

// =============================================================================
// CONTENT BLOCKS
// =============================================================================

/** Base interface for all content blocks */
export interface ContentBlockBase {
  id: string;
  type: ContentBlockType;
  orderIndex: number;
  required?: boolean;
}

/** Text block with Markdown content */
export interface TextBlock extends ContentBlockBase {
  type: 'text';
  markdown: LocalizedString;
  readingTimeSeconds?: number;
}

/** Code block for display (non-interactive) */
export interface CodeBlock extends ContentBlockBase {
  type: 'code';
  language: ProgrammingLanguage;
  code: string;
  filename?: string;
  highlightLines?: number[];
  caption?: LocalizedString;
  allowCopy: boolean;
}

/** Image block with accessibility support */
export interface ImageBlock extends ContentBlockBase {
  type: 'image';
  image: AssetReference;
  caption?: LocalizedString;
  size: 'small' | 'medium' | 'large' | 'full-width';
  zoomable: boolean;
}

/** Video block referencing video content */
export interface VideoBlock extends ContentBlockBase {
  type: 'video';
  videoId: string;
  videoPath: RelativePath;
  videoContent?: VideoContent;
  startAt?: number;
  endAt?: number;
}

/** Audio block for embedded audio */
export interface AudioBlock extends ContentBlockBase {
  type: 'audio';
  audio: AssetReference;
  title?: LocalizedString;
  transcript?: LocalizedString;
  autoPlay: boolean;
}

/** Callout block for tips, warnings, etc. */
export interface CalloutBlock extends ContentBlockBase {
  type: 'callout';
  calloutType: CalloutType;
  title?: LocalizedString;
  content: LocalizedString;
  collapsible: boolean;
  defaultCollapsed?: boolean;
}

/** Exercise block referencing a code exercise */
export interface ExerciseBlock extends ContentBlockBase {
  type: 'exercise';
  exerciseId: string;
  exercisePath: RelativePath;
  required: boolean;
}

/** Inline quiz block for knowledge checks */
export interface InlineQuizBlock extends ContentBlockBase {
  type: 'quiz-inline';
  question: QuizQuestion;
  showAnswer: boolean;
  required: boolean;
}

/** Divider block for visual separation */
export interface DividerBlock extends ContentBlockBase {
  type: 'divider';
  label?: LocalizedString;
}

/** Union type of all content blocks */
export type ContentBlock =
  | TextBlock
  | CodeBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | CalloutBlock
  | ExerciseBlock
  | InlineQuizBlock
  | DividerBlock;

// =============================================================================
// QUIZ / ASSESSMENT
// =============================================================================

/**
 * Quiz - assessment for evaluating learner knowledge.
 * Located at: modules/{module-id}/assessments/{quiz-id}.json
 */
export interface Quiz {
  schemaVersion: '1.0.0';

  id: string;
  moduleId: string;
  courseId: string;

  title: LocalizedString;
  description?: LocalizedString;
  instructions?: LocalizedString;

  config: {
    timeLimitMinutes: number;
    questionCount: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    displayMode: 'one-at-a-time' | 'all-at-once';
    allowNavigation: boolean;
    allowChangeAnswers: boolean;
    maxAttempts: number;
    attemptCooldownMinutes: number;
    passingScore: number;
    showCorrectAnswers: 'never' | 'after-submit' | 'after-pass' | 'after-all-attempts';
    showCategoryScores: boolean;
  };

  questions: QuizQuestion[];

  categories?: Array<{
    id: string;
    name: LocalizedString;
    questionIds: string[];
  }>;

  feedback: {
    passMessage: LocalizedString;
    failMessage: LocalizedString;
    scoreMessages?: Array<{
      minScore: number;
      maxScore: number;
      message: LocalizedString;
    }>;
  };

  completion: {
    showResults: boolean;
    allowReview: boolean;
    showExplanations: boolean;
    nextAction: 'retry' | 'next-lesson' | 'module-complete';
  };

  status: ContentStatus;
}

// =============================================================================
// QUESTION TYPES
// =============================================================================

/** Base question interface */
export interface QuizQuestionBase {
  id: string;
  type: QuestionType;
  question: LocalizedString;
  hint?: LocalizedString;
  explanation?: LocalizedString;
  points: number;
  categoryId?: string;
  difficulty: DifficultyLevel;
  image?: AssetReference;
}

/** Multiple choice question (single correct answer) */
export interface MultipleChoiceQuestion extends QuizQuestionBase {
  type: 'multiple-choice';
  options: Array<{
    id: string;
    text: LocalizedString;
    correct: boolean;
    feedback?: LocalizedString;
  }>;
  minOptions?: number;
}

/** Multiple select question (multiple correct answers) */
export interface MultipleSelectQuestion extends QuizQuestionBase {
  type: 'multiple-select';
  options: Array<{
    id: string;
    text: LocalizedString;
    correct: boolean;
    feedback?: LocalizedString;
  }>;
  scoring: 'all-or-nothing' | 'partial' | 'partial-with-penalty';
  wrongPenalty?: number;
}

/** True/false question */
export interface TrueFalseQuestion extends QuizQuestionBase {
  type: 'true-false';
  correctAnswer: boolean;
  trueLabel?: LocalizedString;
  falseLabel?: LocalizedString;
}

/** Fill in the blank with text input */
export interface FillBlankQuestion extends QuizQuestionBase {
  type: 'fill-blank';
  questionWithBlanks: LocalizedString;
  blanks: Array<{
    id: string;
    acceptedAnswers: string[];
    caseSensitive: boolean;
    allowPartial: boolean;
    placeholder?: string;
  }>;
}

/** Fill in the blank with dropdown options */
export interface FillBlankOptionsQuestion extends QuizQuestionBase {
  type: 'fill-blank-options';
  questionWithBlanks: LocalizedString;
  blanks: Array<{
    id: string;
    options: Array<{
      id: string;
      text: LocalizedString;
      correct: boolean;
    }>;
  }>;
}

/** Matching question (pair items) */
export interface MatchingQuestion extends QuizQuestionBase {
  type: 'matching';
  leftItems: Array<{
    id: string;
    text: LocalizedString;
  }>;
  rightItems: Array<{
    id: string;
    text: LocalizedString;
  }>;
  correctMatches: Record<string, string>;
  scoring: 'all-or-nothing' | 'partial';
}

/** Ordering question (arrange in sequence) */
export interface OrderingQuestion extends QuizQuestionBase {
  type: 'ordering';
  items: Array<{
    id: string;
    text: LocalizedString;
  }>;
  correctOrder: string[];
  scoring: 'all-or-nothing' | 'partial';
}

/** Code output question */
export interface CodeOutputQuestion extends QuizQuestionBase {
  type: 'code-output';
  language: ProgrammingLanguage;
  code: string;
  answerType: 'multiple-choice' | 'text-input';
  options?: Array<{
    id: string;
    text: string;
    correct: boolean;
    feedback?: LocalizedString;
  }>;
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
}

/** Code completion question */
export interface CodeCompletionQuestion extends QuizQuestionBase {
  type: 'code-completion';
  language: ProgrammingLanguage;
  codeTemplate: string;
  blanks: Array<{
    id: string;
    acceptedAnswers: string[];
    caseSensitive: boolean;
    pattern?: string;
    hint?: LocalizedString;
  }>;
}

/** Code challenge question (full exercise) */
export interface CodeChallengeQuestion extends QuizQuestionBase {
  type: 'code-challenge';
  exerciseId: string;
  exercisePath: RelativePath;
  scoring: {
    method: 'pass-fail' | 'test-percentage';
    pointsPerTest?: number;
  };
}

/** Union type of all question types */
export type QuizQuestion =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | FillBlankOptionsQuestion
  | MatchingQuestion
  | OrderingQuestion
  | CodeOutputQuestion
  | CodeCompletionQuestion
  | CodeChallengeQuestion;

// =============================================================================
// CODE EXERCISE
// =============================================================================

/**
 * Code exercise - interactive coding challenge.
 * Located at: modules/{module-id}/lessons/{lesson-id}/exercises/{exercise-id}.json
 */
export interface CodeExercise {
  schemaVersion: '1.0.0';

  id: string;
  lessonId: string;
  moduleId: string;
  courseId: string;

  title: LocalizedString;
  description: LocalizedString;

  language: ProgrammingLanguage;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;

  problem: {
    description: LocalizedString;
    inputFormat?: LocalizedString;
    outputFormat?: LocalizedString;
    constraints?: LocalizedString[];
    examples: Array<{
      input: string;
      output: string;
      explanation?: LocalizedString;
    }>;
  };

  editor: {
    starterCode: string;
    preCode?: string;
    postCode?: string;
    readOnlyRegions?: Array<{
      startLine: number;
      endLine: number;
    }>;
    solutionCode: string;
    files?: Array<{
      filename: string;
      content: string;
      editable: boolean;
      hidden: boolean;
    }>;
  };

  testCases: Array<{
    id: string;
    name: string;
    visible: boolean;
    input: string;
    expectedOutput: string;
    outputPattern?: string;
    points: number;
    failureFeedback?: LocalizedString;
    timeoutMs?: number;
  }>;

  limits: {
    timeoutMs: number;
    memoryBytes: number;
    maxOutputChars: number;
    maxSubmissions: number;
  };

  hints: Array<{
    id: string;
    unlockCondition: 'always' | 'after-attempts' | 'after-time';
    attemptsRequired?: number;
    timeRequired?: number;
    content: LocalizedString;
    pointPenalty: number;
  }>;

  scoring: {
    maxPoints: number;
    method: 'all-or-nothing' | 'per-test' | 'weighted';
    partialCredit: boolean;
    passingScore: number;
    efficiencyBonus?: {
      timeThresholdMs: number;
      bonusPoints: number;
    };
  };

  feedback: {
    showTestResults: boolean;
    showDiff: boolean;
    showStats: boolean;
    errorPatterns?: Array<{
      pattern: string;
      feedback: LocalizedString;
    }>;
  };

  concepts: string[];
  status: ContentStatus;
}

// =============================================================================
// VIDEO CONTENT
// =============================================================================

/**
 * Video content with offline support.
 * Can be standalone or referenced by VideoBlock.
 */
export interface VideoContent {
  schemaVersion: '1.0.0';

  id: string;
  title: LocalizedString;
  description?: LocalizedString;

  source: {
    primary: {
      path: RelativePath;
      mimeType: 'video/mp4' | 'video/webm';
      sizeBytes: FileSizeBytes;
      checksum: SHA256Hash;
    };
    alternatives?: Array<{
      quality: '360p' | '480p' | '720p' | '1080p';
      path: RelativePath;
      mimeType: string;
      sizeBytes: FileSizeBytes;
      checksum: SHA256Hash;
    }>;
    audioOnly?: {
      path: RelativePath;
      mimeType: 'audio/mp3' | 'audio/aac';
      sizeBytes: FileSizeBytes;
      checksum: SHA256Hash;
    };
  };

  metadata: {
    durationSeconds: DurationSeconds;
    resolution: {
      width: number;
      height: number;
    };
    frameRate: number;
    codec: string;
    bitrate: number;
  };

  poster: AssetReference;

  captions?: Array<{
    locale: LocaleCode;
    label: string;
    path: RelativePath;
    format: 'vtt' | 'srt';
    default: boolean;
  }>;

  chapters?: Array<{
    id: string;
    title: LocalizedString;
    startSeconds: number;
    endSeconds: number;
    thumbnail?: AssetReference;
  }>;

  interactivePoints?: Array<{
    id: string;
    timestampSeconds: number;
    type: 'quiz' | 'note' | 'link';
    question?: QuizQuestion;
    note?: LocalizedString;
    link?: {
      text: LocalizedString;
      lessonId?: string;
      url?: string;
    };
    pauseVideo: boolean;
    required: boolean;
  }>;

  transcript?: {
    text: LocalizedString;
    timed?: Array<{
      startSeconds: number;
      endSeconds: number;
      text: string;
    }>;
  };

  caching: {
    priority: number;
    required: boolean;
    streamOnly: boolean;
    chunkSizeBytes: FileSizeBytes;
  };

  playback: {
    allowSpeedControl: boolean;
    speedOptions?: number[];
    autoPlay: boolean;
    loop: boolean;
    muted: boolean;
    allowPiP: boolean;
    allowDownload: boolean;
  };

  progress: {
    completionThreshold: number;
    trackSegments: boolean;
    minSpeedForProgress: number;
  };

  status: ContentStatus;
}

// =============================================================================
// SIMPLIFIED TYPES FOR UI
// =============================================================================

/** Simplified lesson status for UI display */
export type LessonStatus = 'completed' | 'in-progress' | 'locked' | 'available';

/** Lesson item for list display */
export interface LessonListItem {
  id: string;
  title: string;
  duration: number; // in minutes
  status: LessonStatus;
  moduleId: string;
  courseId: string;
}

/** Course item for list display */
export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  icon?: string;
  difficulty: DifficultyLevel;
  lessonsCount: number;
  completedLessons: number;
  estimatedHours: number;
}

/** Answer value type for quizzes - can be string, array, or object for fill-blank */
export type QuizAnswerValue = string | string[] | Record<string, string>;

/** Quiz result */
export interface QuizResult {
  quizId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  timeSpentSeconds: number;
  answers: Record<string, QuizAnswerValue>;
  completedAt: Date;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the localized string value, falling back to default
 */
export function getLocalizedText(
  str: LocalizedString | undefined,
  locale?: LocaleCode
): string {
  if (!str) return '';
  if (locale && str.translations?.[locale]) {
    return str.translations[locale];
  }
  return str.default;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  return hours === 1
    ? `1 hour ${remainingMinutes} min`
    : `${hours} hours ${remainingMinutes} min`;
}
