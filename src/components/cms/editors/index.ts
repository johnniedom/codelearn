/**
 * CMS Editor Components
 *
 * This module exports editor components used in the Content Management System
 * for creating and editing educational content.
 */

// Markdown Editor - CodeMirror-based markdown editing with toolbar
export { MarkdownEditor } from './MarkdownEditor';
export type { MarkdownEditorProps } from './MarkdownEditor';

// Metadata Form - title and description fields with validation
export { MetadataForm } from './MetadataForm';
export type { MetadataFormProps } from './MetadataForm';

// Bloom Level Selector - dropdown for Bloom's taxonomy levels
export { BloomLevelSelector } from './BloomLevelSelector';
export type { BloomLevelSelectorProps } from './BloomLevelSelector';

// Learning Objective Editor - list management for learning objectives
export { LearningObjectiveEditor } from './LearningObjectiveEditor';
export type { LearningObjectiveEditorProps } from './LearningObjectiveEditor';

// Question Editor - for quiz questions (multiple-choice, true-false, fill-blank)
export { QuestionEditor } from './QuestionEditor';
export type { QuestionEditorProps } from './QuestionEditor';

// Test Case Editor - for code exercise test cases
export { TestCaseEditor } from './TestCaseEditor';
export type { TestCaseEditorProps } from './TestCaseEditor';

// Types - re-export commonly used types for convenience
export type {
  ContentMetadata,
  EditorLearningObjective,
  EditorQuizQuestion,
  EditorQuestionType,
  QuestionOption,
  EditorTestCase,
  LessonDraftContent,
  QuizDraftContent,
  ExerciseDraftContent,
  SaveStatus,
} from './types';

// Factory functions for creating new items
export {
  createEmptyQuestion,
  createEmptyTestCase,
  createEmptyLessonContent,
  createEmptyQuizContent,
  createEmptyExerciseContent,
} from './types';
