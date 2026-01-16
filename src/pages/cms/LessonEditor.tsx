'use client';

/**
 * LessonEditor Page
 *
 * Full-featured lesson editor with two-column layout and auto-save.
 *
 * Features:
 * - Get :id param from URL, create new draft if no id
 * - Two-column layout: Left (metadata + objectives), Right (editor + preview)
 * - MetadataForm for title/description
 * - LearningObjectiveEditor for objectives
 * - MarkdownEditor for content
 * - PreviewPanel (collapsible) for live preview
 * - Auto-save using createAutoSaver from draft-service
 * - Save status indicator ("Saved", "Saving...", "Unsaved changes")
 * - Load existing draft on mount
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  FileText,
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
import { LearningObjectiveEditor } from '@/components/cms/editors/LearningObjectiveEditor';
import { MarkdownEditor } from '@/components/cms/editors/MarkdownEditor';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';

import {
  createDraft,
  getDraft,
  updateDraft,
  createAutoSaver,
} from '@/lib/cms/draft-service';
import { useAuthStore } from '@/stores';
import { useCMSKeyboardShortcuts } from '@/hooks/useCMSKeyboardShortcuts';
import type { ContentDraft } from '@/lib/db';
import type {
  LessonDraftContent,
  EditorLearningObjective,
  SaveStatus,
} from '@/components/cms/editors/types';
import { createEmptyLessonContent } from '@/components/cms/editors/types';

// =============================================================================
// Types
// =============================================================================

interface EditorState {
  title: string;
  description: string;
  objectives: EditorLearningObjective[];
  markdownContent: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse draft content JSON into editor state
 */
function parseDraftContent(content: string): EditorState {
  try {
    const parsed: LessonDraftContent = JSON.parse(content);
    return {
      title: parsed.metadata?.title ?? '',
      description: parsed.metadata?.description ?? '',
      objectives: parsed.learningObjectives ?? [],
      markdownContent: parsed.markdownContent ?? '',
    };
  } catch {
    return {
      title: '',
      description: '',
      objectives: [],
      markdownContent: '',
    };
  }
}

/**
 * Serialize editor state to draft content JSON
 */
function serializeEditorState(state: EditorState): string {
  const content: LessonDraftContent = {
    metadata: {
      title: state.title,
      description: state.description,
      difficulty: 'beginner',
      estimatedMinutes: 10,
      tags: [],
    },
    learningObjectives: state.objectives,
    markdownContent: state.markdownContent,
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
// Main Component
// =============================================================================

export default function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);

  // Determine if this is a new lesson or editing existing
  const isNewLesson = !id || id === 'new';

  // State
  const [draft, setDraft] = useState<ContentDraft | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(() => ({
    title: '',
    description: '',
    objectives: [],
    markdownContent: '',
  }));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Hide preview by default on mobile (< 1024px), show on desktop
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // Refs
  const autoSaverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  // Get user ID
  const userId = profile?.userId ?? 'anonymous';

  // ==========================================================================
  // Keyboard Shortcuts
  // ==========================================================================

  useCMSKeyboardShortcuts({
    onSave: useCallback(() => {
      // Trigger manual save via ref to avoid stale closure
      if (draft) {
        handleManualSaveRef.current?.();
      }
    }, [draft]),
    onPreviewToggle: useCallback(() => {
      setShowPreview((prev) => !prev);
    }, []),
    onNewLesson: useCallback(() => {
      navigate('/cms/lessons/new');
    }, [navigate]),
    onNewQuiz: useCallback(() => {
      navigate('/cms/quizzes/new');
    }, [navigate]),
    onNewExercise: useCallback(() => {
      navigate('/cms/exercises/new');
    }, [navigate]),
  });

  // Ref for manual save to avoid stale closures in keyboard shortcuts
  const handleManualSaveRef = useRef<(() => Promise<void>) | null>(null);

  // ==========================================================================
  // Load Draft
  // ==========================================================================

  useEffect(() => {
    const loadOrCreateDraft = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (isNewLesson) {
          // Create new draft
          const newDraft = await createDraft(userId, 'lesson', 'Untitled Lesson');
          setDraft(newDraft);

          // Initialize with empty content
          const emptyContent = createEmptyLessonContent();
          setEditorState({
            title: 'Untitled Lesson',
            description: '',
            objectives: [],
            markdownContent: '',
          });

          // Save initial content
          await updateDraft(newDraft.id, {
            content: JSON.stringify(emptyContent),
          });

          // Navigate to the new draft URL
          navigate(`/cms/lessons/${newDraft.id}`, { replace: true });
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
        console.error('[LessonEditor] Failed to load draft:', err);
        setError('Failed to load lesson. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrCreateDraft();
  }, [id, isNewLesson, userId, navigate]);

  // ==========================================================================
  // Auto-Save Setup
  // ==========================================================================

  useEffect(() => {
    if (!draft) return;

    // Create auto-saver for this draft
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

    // Cleanup on unmount
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

        // Mark as unsaved and trigger auto-save
        setSaveStatus('unsaved');
        hasUnsavedChangesRef.current = true;

        if (autoSaverRef.current && draft) {
          const content = serializeEditorState(next);
          const title = next.title || 'Untitled Lesson';

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

  const handleObjectivesChange = useCallback(
    (objectives: EditorLearningObjective[]) => {
      handleChange({ objectives });
    },
    [handleChange]
  );

  const handleContentChange = useCallback(
    (markdownContent: string) => {
      handleChange({ markdownContent });
    },
    [handleChange]
  );

  // ==========================================================================
  // Manual Save
  // ==========================================================================

  const handleManualSave = useCallback(async () => {
    if (!draft) return;

    setSaveStatus('saving');

    try {
      const content = serializeEditorState(editorState);
      const title = editorState.title || 'Untitled Lesson';

      await updateDraft(draft.id, { content, title });
      setSaveStatus('saved');
      hasUnsavedChangesRef.current = false;
    } catch (err) {
      console.error('[LessonEditor] Manual save failed:', err);
      setSaveStatus('error');
    }
  }, [draft, editorState]);

  // Keep ref in sync for keyboard shortcuts to access
  useEffect(() => {
    handleManualSaveRef.current = handleManualSave;
  }, [handleManualSave]);

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
  // Memoized Preview Content
  // ==========================================================================

  const previewContent = useMemo(() => {
    if (!showPreview) return null;

    return (
      <div className="prose prose-sm max-w-none">
        {editorState.markdownContent ? (
          <MarkdownRenderer content={editorState.markdownContent} />
        ) : (
          <p className="text-text-muted italic">
            Start writing to see a preview of your lesson content.
          </p>
        )}
      </div>
    );
  }, [showPreview, editorState.markdownContent]);

  // ==========================================================================
  // Render
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-text-muted">Loading lesson editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="alert">
        <AlertCircle className="h-12 w-12 text-error" aria-hidden="true" />
        <h2 className="text-xl font-semibold">Error Loading Lesson</h2>
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
              <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <h1 className="text-lg sm:text-xl font-bold">
                {isNewLesson ? 'New Lesson' : 'Edit Lesson'}
              </h1>
              <Badge variant="secondary" className="shrink-0">Draft</Badge>
            </div>
            <p className="text-sm text-text-muted truncate">
              {editorState.title || 'Untitled Lesson'}
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
            <span className="hidden sm:inline">Save</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>

      {/* Two-Column Layout - Stacks vertically on mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Left Column: Metadata & Objectives */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Details</CardTitle>
            </CardHeader>
            <CardContent>
              <MetadataForm
                title={editorState.title}
                description={editorState.description}
                onChange={handleMetadataChange}
              />
            </CardContent>
          </Card>

          {/* Learning Objectives Card */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <LearningObjectiveEditor
                objectives={editorState.objectives}
                onChange={handleObjectivesChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editor & Preview */}
        <div className="space-y-4 sm:space-y-6">
          {/* Markdown Editor Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Lesson Content</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1.5 sm:gap-2 h-9 px-2 sm:px-3"
                aria-pressed={showPreview}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Hide Preview</span>
                    <span className="sm:hidden text-xs">Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Show Preview</span>
                    <span className="sm:hidden text-xs">Preview</span>
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <MarkdownEditor
                value={editorState.markdownContent}
                onChange={handleContentChange}
                placeholder="Write your lesson content in Markdown..."
                minHeight={300}
                aria-label="Lesson content editor"
              />
            </CardContent>
          </Card>

          {/* Preview Panel - Hidden by default on mobile, toggleable */}
          {showPreview && (
            <Card>
              <CardHeader className="p-3 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div
                  className={cn(
                    'min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 rounded-md border border-border bg-background',
                    'overflow-auto max-h-[400px] sm:max-h-[500px]'
                  )}
                >
                  {previewContent}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
