/**
 * CMS Editor Types
 *
 * Type definitions for the content editor components.
 * These types are used internally by the editor components
 * and represent the editable form of content before publishing.
 */

import type { DifficultyLevel, BloomLevel, ProgrammingLanguage } from '@/types/content';

// =============================================================================
// Metadata Types
// =============================================================================

/**
 * Common metadata fields for all content types
 */
export interface ContentMetadata {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  tags: string[];
}

/**
 * Learning objective for lessons
 */
export interface EditorLearningObjective {
  id: string;
  description: string;
  level: BloomLevel;
}

// =============================================================================
// Quiz Question Types
// =============================================================================

/**
 * Question type enumeration for editor
 */
export type EditorQuestionType = 'multiple-choice' | 'true-false' | 'fill-blank';

/**
 * Option for multiple choice questions
 */
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Quiz question for the editor
 */
export interface EditorQuizQuestion {
  id: string;
  text: string;
  type: EditorQuestionType;
  /** Options for multiple-choice questions */
  options: QuestionOption[];
  /** Correct answer for true-false (true/false) or fill-blank (string) */
  correctAnswer: string;
  /** Hint text shown to learners */
  hint?: string;
  /** Explanation shown after answering */
  explanation?: string;
  /** Points for this question */
  points: number;
}

/**
 * Create a new empty question
 */
export function createEmptyQuestion(type: EditorQuestionType): EditorQuizQuestion {
  const id = crypto.randomUUID();

  const baseQuestion: EditorQuizQuestion = {
    id,
    text: '',
    type,
    options: [],
    correctAnswer: '',
    points: 1,
  };

  if (type === 'multiple-choice') {
    baseQuestion.options = [
      { id: crypto.randomUUID(), text: '', isCorrect: true },
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: false },
    ];
  } else if (type === 'true-false') {
    baseQuestion.correctAnswer = 'true';
  }

  return baseQuestion;
}

// =============================================================================
// Test Case Types
// =============================================================================

/**
 * Test case for code exercises
 */
export interface EditorTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

/**
 * Create a new empty test case
 */
export function createEmptyTestCase(): EditorTestCase {
  return {
    id: crypto.randomUUID(),
    name: '',
    input: '',
    expectedOutput: '',
    isHidden: false,
  };
}

// =============================================================================
// Draft Content Types
// =============================================================================

/**
 * Lesson draft content structure (stored as JSON in draft.content)
 */
export interface LessonDraftContent {
  metadata: ContentMetadata;
  learningObjectives: EditorLearningObjective[];
  markdownContent: string;
}

/**
 * Quiz draft content structure
 */
export interface QuizDraftContent {
  metadata: ContentMetadata;
  questions: EditorQuizQuestion[];
}

/**
 * Exercise draft content structure
 */
export interface ExerciseDraftContent {
  metadata: ContentMetadata;
  language: ProgrammingLanguage;
  starterCode: string;
  solutionCode: string;
  testCases: EditorTestCase[];
}

/**
 * Create empty lesson draft content
 */
export function createEmptyLessonContent(): LessonDraftContent {
  return {
    metadata: {
      title: '',
      description: '',
      difficulty: 'beginner',
      estimatedMinutes: 10,
      tags: [],
    },
    learningObjectives: [],
    markdownContent: '',
  };
}

/**
 * Create empty quiz draft content
 */
export function createEmptyQuizContent(): QuizDraftContent {
  return {
    metadata: {
      title: '',
      description: '',
      difficulty: 'beginner',
      estimatedMinutes: 10,
      tags: [],
    },
    questions: [],
  };
}

/**
 * Create empty exercise draft content
 */
export function createEmptyExerciseContent(): ExerciseDraftContent {
  return {
    metadata: {
      title: '',
      description: '',
      difficulty: 'beginner',
      estimatedMinutes: 15,
      tags: [],
    },
    language: 'python',
    starterCode: '# Write your code here\n',
    solutionCode: '# Solution code\n',
    testCases: [],
  };
}

// =============================================================================
// Save Status Types
// =============================================================================

/**
 * Save status for the editor
 */
export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
