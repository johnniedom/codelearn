'use client';

/**
 * QuizEditor Page
 *
 * Full-featured quiz editor with question management and auto-save.
 *
 * Features:
 * - Draft management like LessonEditor
 * - MetadataForm for quiz title/description
 * - List of QuestionEditor components
 * - "Add Question" button with type selector
 * - Reorder questions (move up/down buttons)
 * - Auto-save quiz content
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Upload,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { MetadataForm } from '@/components/cms/editors/MetadataForm';
import { QuestionEditor, createEmptyQuestion } from '@/components/cms/editors';
import { PublishDialog } from '@/components/cms/PublishDialog';

import {
  createDraft,
  getDraft,
  updateDraft,
  createAutoSaver,
} from '@/lib/cms/draft-service';
import { useAuthStore } from '@/stores';
import type { ContentDraft } from '@/lib/db';
import type {
  QuizDraftContent,
  EditorQuizQuestion,
  EditorQuestionType,
  SaveStatus,
} from '@/components/cms/editors/types';
import { createEmptyQuizContent } from '@/components/cms/editors/types';

// =============================================================================
// Types
// =============================================================================

interface EditorState {
  title: string;
  description: string;
  questions: EditorQuizQuestion[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse draft content JSON into editor state
 */
function parseDraftContent(content: string): EditorState {
  try {
    const parsed: QuizDraftContent = JSON.parse(content);
    return {
      title: parsed.metadata?.title ?? '',
      description: parsed.metadata?.description ?? '',
      questions: parsed.questions ?? [],
    };
  } catch {
    return {
      title: '',
      description: '',
      questions: [],
    };
  }
}

/**
 * Serialize editor state to draft content JSON
 */
function serializeEditorState(state: EditorState): string {
  const content: QuizDraftContent = {
    metadata: {
      title: state.title,
      description: state.description,
      difficulty: 'beginner',
      estimatedMinutes: state.questions.length * 2,
      tags: [],
    },
    questions: state.questions,
  };
  return JSON.stringify(content);
}

// =============================================================================
// Save Status Component
// =============================================================================

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const statusConfig = {
    saved: {
      icon: Check,
      text: 'Saved',
      className: 'text-success',
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      className: 'text-text-muted',
    },
    unsaved: {
      icon: AlertCircle,
      text: 'Unsaved changes',
      className: 'text-warning',
    },
    error: {
      icon: AlertCircle,
      text: 'Save failed',
      className: 'text-error',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn('flex items-center gap-1.5 text-sm', config.className)}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={cn('h-4 w-4', status === 'saving' && 'animate-spin')}
        aria-hidden="true"
      />
      <span>{config.text}</span>
    </div>
  );
}

// =============================================================================
// Question Type Selector
// =============================================================================

interface QuestionTypeSelectorProps {
  onSelect: (type: EditorQuestionType) => void;
}

function QuestionTypeSelector({ onSelect }: QuestionTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const questionTypes: { value: EditorQuestionType; label: string; description: string }[] = [
    {
      value: 'multiple-choice',
      label: 'Multiple Choice',
      description: 'Single correct answer from 4 options',
    },
    {
      value: 'true-false',
      label: 'True/False',
      description: 'Binary choice question',
    },
    {
      value: 'fill-blank',
      label: 'Fill in the Blank',
      description: 'Text input answer',
    },
  ];

  const handleSelect = (type: EditorQuestionType) => {
    onSelect(type);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add Question
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className={cn(
              'absolute right-0 mt-2 w-64 z-50',
              'rounded-md border border-border bg-background shadow-lg'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {questionTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleSelect(type.value)}
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors',
                  'hover:bg-surface focus:bg-surface focus:outline-none',
                  'first:rounded-t-md last:rounded-b-md'
                )}
                role="menuitem"
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-text-muted">{type.description}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);

  // Determine if this is a new quiz or editing existing
  const isNewQuiz = !id || id === 'new';

  // State
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    title: '',
    description: '',
    questions: [],
  }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  // Refs
  const autoSaverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  // Get user ID
  const userId = profile?.userId ?? 'anonymous';

  // ==========================================================================
  // Load Draft
  // ==========================================================================

  useEffect(() => {
    const loadOrCreateDraft = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isNewQuiz) {
          // Create new draft
          const newDraft = await createDraft(userId, 'quiz', 'Untitled Quiz');
          setDraft(newDraft);

          // Initialize with empty content
          const emptyContent = createEmptyQuizContent();
          setEditorState({
            title: 'Untitled Quiz',
            description: '',
            questions: [],
          });

          // Save initial content
          await updateDraft(newDraft.id, {
            content: JSON.stringify(emptyContent),
          });

          // Navigate to the new draft URL
          navigate(`/cms/quizzes/${newDraft.id}`, { replace: true });
        } else {
          // Load existing draft
          const existingDraft = await getDraft(id);
          if (!existingDraft) {
            setError('Draft not found. It may have been deleted.');
            setIsLoading(false);
            return;
          }

          setDraft(existingDraft);

          // Parse content
          const parsedState = parseDraftContent(existingDraft.content);
          setEditorState({
            ...parsedState,
            title: existingDraft.title, // Use draft title as source of truth
          });
        }
      } catch (err) {
        console.error('[QuizEditor] Failed to load draft:', err);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrCreateDraft();
  }, [id, isNewQuiz, userId, navigate]);

  // ==========================================================================
  // Auto-Save Setup
  // ==========================================================================

  useEffect(() => {
    if (!draft) return;

    autoSaverRef.current = createAutoSaver(
      draft.id,
      () => {
        setSaveStatus('saved');
        hasUnsavedChangesRef.current = false;
      },
      () => {
        setSaveStatus('error');
      }
    );

    return () => {
      if (autoSaverRef.current) {
        autoSaverRef.current.flush();
      }
    };
  }, [draft?.id]);

  // ==========================================================================
  // Change Handlers
  // ==========================================================================

  const handleChange = useCallback(
    (updates: Partial<EditorState>) => {
      setEditorState((prev) => {
        const next = { ...prev, ...updates };

        setSaveStatus('unsaved');
        hasUnsavedChangesRef.current = true;

        if (autoSaverRef.current && draft) {
          const content = serializeEditorState(next);
          const title = next.title || 'Untitled Quiz';

          setSaveStatus('saving');
          autoSaverRef.current.save(content, title);
        }

        return next;
      });
    },
    [draft]
  );

  const handleMetadataChange = useCallback(
    (field: 'title' | 'description', value: string) => {
      handleChange({ [field]: value });
    },
    [handleChange]
  );

  // ==========================================================================
  // Question Management
  // ==========================================================================

  const handleAddQuestion = useCallback(
    (type: EditorQuestionType) => {
      const newQuestion = createEmptyQuestion(type);
      handleChange({
        questions: [...editorState.questions, newQuestion],
      });
    },
    [editorState.questions, handleChange]
  );

  const handleUpdateQuestion = useCallback(
    (index: number, updatedQuestion: EditorQuizQuestion) => {
      const newQuestions = [...editorState.questions];
      newQuestions[index] = updatedQuestion;
      handleChange({ questions: newQuestions });
    },
    [editorState.questions, handleChange]
  );

  const handleDeleteQuestion = useCallback(
    (index: number) => {
      const newQuestions = editorState.questions.filter((_, i) => i !== index);
      handleChange({ questions: newQuestions });
    },
    [editorState.questions, handleChange]
  );

  const handleMoveQuestion = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= editorState.questions.length) return;

      const newQuestions = [...editorState.questions];
      [newQuestions[index], newQuestions[newIndex]] = [
        newQuestions[newIndex],
        newQuestions[index],
      ];
      handleChange({ questions: newQuestions });
    },
    [editorState.questions, handleChange]
  );

  // ==========================================================================
  // Manual Save
  // ==========================================================================

  const handleManualSave = useCallback(async () => {
    if (!draft) return;

    setSaveStatus('saving');

    try {
      const content = serializeEditorState(editorState);
      const title = editorState.title || 'Untitled Quiz';

      await updateDraft(draft.id, { content, title });
      setSaveStatus('saved');
      hasUnsavedChangesRef.current = false;
    } catch (err) {
      console.error('[QuizEditor] Manual save failed:', err);
      setSaveStatus('error');
    }
  }, [draft, editorState]);

  // ==========================================================================
  // Navigation Warning
  // ==========================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ==========================================================================
  // Render
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-text-muted">Loading quiz editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="alert">
        <AlertCircle className="h-12 w-12 text-error" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Error Loading Quiz</h2>
        <p className="text-text-muted text-center max-w-md">{error}</p>
        <Button onClick={() => navigate('/cms/drafts')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Drafts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/cms/drafts')}
            aria-label="Back to drafts"
            className="h-10 w-10 sm:h-9 sm:w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <HelpCircle className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <h1 className="text-lg sm:text-xl font-bold">
                {isNewQuiz ? 'New Quiz' : 'Edit Quiz'}
              </h1>
              <Badge variant="secondary" className="shrink-0">Draft</Badge>
            </div>
            <p className="text-sm text-text-muted truncate">
              {editorState.title || 'Untitled Quiz'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 pl-13 sm:pl-0">
          <SaveStatusIndicator status={saveStatus} />

          <Button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="min-h-[44px] sm:min-h-0"
          >
            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPublishDialogOpen(true)}
            disabled={saveStatus !== 'saved' || !draft}
            className="min-h-[44px] sm:min-h-0"
          >
            <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
            Publish
          </Button>
        </div>
      </div>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent>
          <MetadataForm
            title={editorState.title}
            description={editorState.description}
            onChange={handleMetadataChange}
          />
        </CardContent>
      </Card>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Questions</h2>
            <p className="text-sm text-text-muted">
              {editorState.questions.length} question
              {editorState.questions.length !== 1 ? 's' : ''} added
            </p>
          </div>
          <QuestionTypeSelector onSelect={handleAddQuestion} />
        </div>

        {/* Questions List */}
        {editorState.questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="h-12 w-12 text-text-muted mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-text-muted text-center max-w-md mb-4">
                Add your first question to get started building your quiz.
              </p>
              <QuestionTypeSelector onSelect={handleAddQuestion} />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {editorState.questions.map((question, index) => (
              <div key={question.id} className="relative">
                {/* Reorder buttons */}
                <div className="absolute -left-12 top-4 flex flex-col gap-1 hidden lg:flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveQuestion(index, 'up')}
                    disabled={index === 0}
                    aria-label={`Move question ${index + 1} up`}
                    className="h-8 w-8"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveQuestion(index, 'down')}
                    disabled={index === editorState.questions.length - 1}
                    aria-label={`Move question ${index + 1} down`}
                    className="h-8 w-8"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <QuestionEditor
                  question={question}
                  questionNumber={index + 1}
                  onChange={(updated) => handleUpdateQuestion(index, updated)}
                  onDelete={() => handleDeleteQuestion(index)}
                />

                {/* Mobile reorder buttons */}
                <div className="flex justify-end gap-2 mt-2 lg:hidden">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveQuestion(index, 'up')}
                    disabled={index === 0}
                    className="gap-1 min-h-[44px] px-3"
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Move Up</span>
                    <span className="sm:hidden">Up</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoveQuestion(index, 'down')}
                    disabled={index === editorState.questions.length - 1}
                    className="gap-1 min-h-[44px] px-3"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Move Down</span>
                    <span className="sm:hidden">Down</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Summary */}
      {editorState.questions.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Quiz Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="text-center p-3 sm:p-4 bg-surface rounded-md">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {editorState.questions.length}
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Questions</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-surface rounded-md">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  {editorState.questions.reduce((sum, q) => sum + q.points, 0)}
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Points</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-surface rounded-md">
                <div className="text-xl sm:text-2xl font-bold text-primary">
                  ~{editorState.questions.length * 2}m
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        draftId={draft?.id ?? ''}
        contentType="quiz"
        title={editorState.title}
      />
    </div>
  );
}
