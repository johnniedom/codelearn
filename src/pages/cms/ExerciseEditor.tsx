'use client';

/**
 * ExerciseEditor Page
 *
 * Full-featured code exercise editor with test case management.
 *
 * Features:
 * - Draft management
 * - MetadataForm for title/description
 * - Language selector dropdown (Python, JavaScript)
 * - Starter code textarea/editor
 * - Solution code textarea/editor
 * - List of TestCaseEditor components
 * - "Add Test Case" button
 * - Auto-save
 */

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Loader2,
  Check,
  AlertCircle,
  Code,
  Play,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { MetadataForm } from '@/components/cms/editors/MetadataForm';
import { TestCaseEditor, createEmptyTestCase } from '@/components/cms/editors';

import {
  createDraft,
  getDraft,
  updateDraft,
  createAutoSaver,
} from '@/lib/cms/draft-service';
import { useAuthStore } from '@/stores';
import type { ContentDraft } from '@/lib/db';
import type {
  ExerciseDraftContent,
  EditorTestCase,
  SaveStatus,
} from '@/components/cms/editors/types';
import { createEmptyExerciseContent } from '@/components/cms/editors/types';
import type { ProgrammingLanguage } from '@/types/content';

// =============================================================================
// Types
// =============================================================================

interface EditorState {
  title: string;
  description: string;
  language: ProgrammingLanguage;
  starterCode: string;
  solutionCode: string;
  testCases: EditorTestCase[];
}

// =============================================================================
// Constants
// =============================================================================

const SUPPORTED_LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse draft content JSON into editor state
 */
function parseDraftContent(content: string): EditorState {
  try {
    const parsed: ExerciseDraftContent = JSON.parse(content);
    return {
      title: parsed.metadata?.title ?? '',
      description: parsed.metadata?.description ?? '',
      language: parsed.language ?? 'python',
      starterCode: parsed.starterCode ?? '',
      solutionCode: parsed.solutionCode ?? '',
      testCases: parsed.testCases ?? [],
    };
  } catch {
    return {
      title: '',
      description: '',
      language: 'python',
      starterCode: '',
      solutionCode: '',
      testCases: [],
    };
  }
}

/**
 * Serialize editor state to draft content JSON
 */
function serializeEditorState(state: EditorState): string {
  const content: ExerciseDraftContent = {
    metadata: {
      title: state.title,
      description: state.description,
      difficulty: 'beginner',
      estimatedMinutes: 15,
      tags: [],
    },
    language: state.language,
    starterCode: state.starterCode,
    solutionCode: state.solutionCode,
    testCases: state.testCases,
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
// Code Textarea Component
// =============================================================================

interface CodeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  description?: string;
  minHeight?: number;
}

function CodeTextarea({
  value,
  onChange,
  placeholder,
  label,
  description,
  minHeight = 200,
}: CodeTextareaProps) {
  const textareaId = useId();

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={textareaId}>{label}</Label>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex w-full rounded-md border border-border bg-background px-3 py-2',
          'font-mono text-sm',
          'placeholder:text-text-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'resize-y'
        )}
        style={{ minHeight: `${minHeight}px` }}
        spellCheck={false}
      />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function ExerciseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const languageSelectId = useId();

  // Determine if this is a new exercise or editing existing
  const isNewExercise = !id || id === 'new';

  // State
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    title: '',
    description: '',
    language: 'python',
    starterCode: '',
    solutionCode: '',
    testCases: [],
  }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (isNewExercise) {
          // Create new draft
          const newDraft = await createDraft(userId, 'exercise', 'Untitled Exercise');
          setDraft(newDraft);

          // Initialize with empty content
          const emptyContent = createEmptyExerciseContent();
          setEditorState({
            title: 'Untitled Exercise',
            description: '',
            language: 'python',
            starterCode: emptyContent.starterCode,
            solutionCode: emptyContent.solutionCode,
            testCases: [],
          });

          // Save initial content
          await updateDraft(newDraft.id, {
            content: JSON.stringify(emptyContent),
          });

          // Navigate to the new draft URL
          navigate(`/cms/exercises/${newDraft.id}`, { replace: true });
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
        console.error('[ExerciseEditor] Failed to load draft:', err);
        setError('Failed to load exercise. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrCreateDraft();
  }, [id, isNewExercise, userId, navigate]);

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
          const title = next.title || 'Untitled Exercise';

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

  const handleLanguageChange = useCallback(
    (language: ProgrammingLanguage) => {
      handleChange({ language });
    },
    [handleChange]
  );

  const handleStarterCodeChange = useCallback(
    (starterCode: string) => {
      handleChange({ starterCode });
    },
    [handleChange]
  );

  const handleSolutionCodeChange = useCallback(
    (solutionCode: string) => {
      handleChange({ solutionCode });
    },
    [handleChange]
  );

  // ==========================================================================
  // Test Case Management
  // ==========================================================================

  const handleAddTestCase = useCallback(() => {
    const newTestCase = createEmptyTestCase();
    handleChange({
      testCases: [...editorState.testCases, newTestCase],
    });
  }, [editorState.testCases, handleChange]);

  const handleUpdateTestCase = useCallback(
    (index: number, updatedTestCase: EditorTestCase) => {
      const newTestCases = [...editorState.testCases];
      newTestCases[index] = updatedTestCase;
      handleChange({ testCases: newTestCases });
    },
    [editorState.testCases, handleChange]
  );

  const handleDeleteTestCase = useCallback(
    (index: number) => {
      const newTestCases = editorState.testCases.filter((_, i) => i !== index);
      handleChange({ testCases: newTestCases });
    },
    [editorState.testCases, handleChange]
  );

  // ==========================================================================
  // Manual Save
  // ==========================================================================

  const handleManualSave = useCallback(async () => {
    if (!draft) return;

    setSaveStatus('saving');

    try {
      const content = serializeEditorState(editorState);
      const title = editorState.title || 'Untitled Exercise';

      await updateDraft(draft.id, { content, title });
      setSaveStatus('saved');
      hasUnsavedChangesRef.current = false;
    } catch (err) {
      console.error('[ExerciseEditor] Manual save failed:', err);
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
          <p className="text-text-muted">Loading exercise editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="alert">
        <AlertCircle className="h-12 w-12 text-error" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Error Loading Exercise</h2>
        <p className="text-text-muted text-center max-w-md">{error}</p>
        <Button onClick={() => navigate('/cms/drafts')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Drafts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
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
              <Code className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <h1 className="text-lg sm:text-xl font-bold">
                {isNewExercise ? 'New Exercise' : 'Edit Exercise'}
              </h1>
              <Badge variant="secondary" className="shrink-0">Draft</Badge>
            </div>
            <p className="text-sm text-text-muted truncate">
              {editorState.title || 'Untitled Exercise'}
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
        </div>
      </div>

      {/* Two-Column Layout - Stacks on mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Left Column: Metadata & Language */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Exercise Details</CardTitle>
            </CardHeader>
            <CardContent>
              <MetadataForm
                title={editorState.title}
                description={editorState.description}
                onChange={handleMetadataChange}
              />
            </CardContent>
          </Card>

          {/* Language Selector Card */}
          <Card>
            <CardHeader>
              <CardTitle>Programming Language</CardTitle>
              <CardDescription>
                Select the language for this coding exercise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={languageSelectId}>Language</Label>
                <select
                  id={languageSelectId}
                  value={editorState.language}
                  onChange={(e) =>
                    handleLanguageChange(e.target.value as ProgrammingLanguage)
                  }
                  className={cn(
                    'flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-base',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'md:text-sm'
                  )}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Starter Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>Starter Code</CardTitle>
              <CardDescription>
                The initial code shown to learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeTextarea
                value={editorState.starterCode}
                onChange={handleStarterCodeChange}
                label="Starter Code"
                placeholder="# Write your starter code here..."
                minHeight={200}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Solution & Test Cases */}
        <div className="space-y-6">
          {/* Solution Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>Solution Code</CardTitle>
              <CardDescription>
                The reference solution (hidden from learners)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeTextarea
                value={editorState.solutionCode}
                onChange={handleSolutionCodeChange}
                label="Solution Code"
                placeholder="# Write the solution code here..."
                minHeight={200}
              />
            </CardContent>
          </Card>

          {/* Test Cases Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Test Cases</h2>
                <p className="text-sm text-text-muted">
                  {editorState.testCases.length} test case
                  {editorState.testCases.length !== 1 ? 's' : ''} defined
                </p>
              </div>
              <Button onClick={handleAddTestCase} className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Test Case
              </Button>
            </div>

            {/* Test Cases List */}
            {editorState.testCases.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Play className="h-12 w-12 text-text-muted mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2">No test cases yet</h3>
                  <p className="text-text-muted text-center max-w-md mb-4">
                    Add test cases to verify learners' solutions are correct.
                  </p>
                  <Button onClick={handleAddTestCase} className="gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add First Test Case
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {editorState.testCases.map((testCase, index) => (
                  <TestCaseEditor
                    key={testCase.id}
                    testCase={testCase}
                    index={index}
                    onChange={(updated) => handleUpdateTestCase(index, updated)}
                    onDelete={() => handleDeleteTestCase(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise Summary */}
      {(editorState.testCases.length > 0 || editorState.starterCode || editorState.solutionCode) && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Exercise Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-4">
              <div className="text-center p-2 sm:p-4 bg-surface rounded-md">
                <div className="text-lg sm:text-2xl font-bold text-primary capitalize">
                  {editorState.language}
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Language</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-surface rounded-md">
                <div className="text-lg sm:text-2xl font-bold text-primary">
                  {editorState.testCases.length}
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Tests</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-surface rounded-md">
                <div className="text-lg sm:text-2xl font-bold text-primary">
                  {editorState.testCases.filter((t) => !t.isHidden).length}
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Visible</div>
              </div>
              <div className="text-center p-2 sm:p-4 bg-surface rounded-md">
                <div className="text-lg sm:text-2xl font-bold text-primary">
                  {editorState.testCases.filter((t) => t.isHidden).length}
                </div>
                <div className="text-xs sm:text-sm text-text-muted">Hidden</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
