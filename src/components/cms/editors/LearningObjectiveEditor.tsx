'use client';

/**
 * LearningObjectiveEditor Component
 *
 * Editor for managing a list of learning objectives with Bloom's taxonomy levels.
 *
 * Features:
 * - Add/remove objectives
 * - Reorder objectives (move up/down)
 * - Edit description text
 * - Select Bloom level for each objective
 * - Accessible drag-and-drop alternative using buttons
 */

import { useCallback, useId } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BloomLevelSelector } from './BloomLevelSelector';
import type { EditorLearningObjective } from './types';
import type { BloomLevel } from '@/types/content';

// =============================================================================
// Types
// =============================================================================

interface LearningObjectiveEditorProps {
  /** List of learning objectives */
  objectives: EditorLearningObjective[];
  /** Callback when objectives change */
  onChange: (objectives: EditorLearningObjective[]) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function LearningObjectiveEditor({
  objectives,
  onChange,
  className,
}: LearningObjectiveEditorProps) {
  const sectionId = useId();

  /**
   * Add a new empty objective
   */
  const handleAdd = useCallback(() => {
    const newObjective: EditorLearningObjective = {
      id: generateId(),
      description: '',
      level: 'understand', // Sensible default
    };
    onChange([...objectives, newObjective]);
  }, [objectives, onChange]);

  /**
   * Remove an objective by ID
   */
  const handleRemove = useCallback(
    (id: string) => {
      onChange(objectives.filter((obj) => obj.id !== id));
    },
    [objectives, onChange]
  );

  /**
   * Update an objective's description
   */
  const handleDescriptionChange = useCallback(
    (id: string, description: string) => {
      onChange(
        objectives.map((obj) =>
          obj.id === id ? { ...obj, description } : obj
        )
      );
    },
    [objectives, onChange]
  );

  /**
   * Update an objective's Bloom level
   */
  const handleLevelChange = useCallback(
    (id: string, level: BloomLevel) => {
      onChange(
        objectives.map((obj) =>
          obj.id === id ? { ...obj, level } : obj
        )
      );
    },
    [objectives, onChange]
  );

  /**
   * Move an objective up in the list
   */
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newObjectives = [...objectives];
      [newObjectives[index - 1], newObjectives[index]] = [
        newObjectives[index],
        newObjectives[index - 1],
      ];
      onChange(newObjectives);
    },
    [objectives, onChange]
  );

  /**
   * Move an objective down in the list
   */
  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === objectives.length - 1) return;
      const newObjectives = [...objectives];
      [newObjectives[index], newObjectives[index + 1]] = [
        newObjectives[index + 1],
        newObjectives[index],
      ];
      onChange(newObjectives);
    },
    [objectives, onChange]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <Label id={sectionId} className="text-base font-semibold">
          Learning Objectives
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Objective
        </Button>
      </div>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center py-8',
            'rounded-md border border-dashed border-border bg-surface/50'
          )}
          role="region"
          aria-labelledby={sectionId}
        >
          <p className="text-sm text-text-muted">No learning objectives yet.</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            className="mt-2 gap-1.5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add your first objective
          </Button>
        </div>
      ) : (
        <ul
          className="space-y-3"
          role="list"
          aria-labelledby={sectionId}
        >
          {objectives.map((objective, index) => (
            <ObjectiveItem
              key={objective.id}
              objective={objective}
              index={index}
              isFirst={index === 0}
              isLast={index === objectives.length - 1}
              onDescriptionChange={(desc) =>
                handleDescriptionChange(objective.id, desc)
              }
              onLevelChange={(level) =>
                handleLevelChange(objective.id, level)
              }
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onRemove={() => handleRemove(objective.id)}
            />
          ))}
        </ul>
      )}

      {/* Helper text */}
      {objectives.length > 0 && (
        <p className="text-xs text-text-muted">
          {objectives.length} objective{objectives.length !== 1 ? 's' : ''} defined.
          Use the arrow buttons to reorder.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// ObjectiveItem Sub-component
// =============================================================================

interface ObjectiveItemProps {
  objective: EditorLearningObjective;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onDescriptionChange: (description: string) => void;
  onLevelChange: (level: BloomLevel) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function ObjectiveItem({
  objective,
  index,
  isFirst,
  isLast,
  onDescriptionChange,
  onLevelChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ObjectiveItemProps) {
  const descriptionId = useId();

  return (
    <li
      className={cn(
        'flex gap-3 rounded-md border border-border bg-background p-3',
        'transition-colors hover:border-border-focus'
      )}
    >
      {/* Drag handle indicator (visual only) */}
      <div
        className="flex flex-col items-center justify-center text-text-muted"
        aria-hidden="true"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Reorder buttons */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Move objective ${index + 1} up`}
          className="h-6 w-6"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Move objective ${index + 1} down`}
          className="h-6 w-6"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
        {/* Description input */}
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={descriptionId} className="sr-only">
            Objective {index + 1} description
          </Label>
          <Input
            id={descriptionId}
            type="text"
            value={objective.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Students will be able to..."
            aria-label={`Learning objective ${index + 1}`}
          />
        </div>

        {/* Bloom level selector */}
        <div className="w-full sm:w-48">
          <BloomLevelSelector
            value={objective.level}
            onChange={onLevelChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Delete button */}
      <div className="flex items-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={`Remove objective ${index + 1}`}
          className="h-8 w-8 text-text-muted hover:text-error"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

export type { LearningObjectiveEditorProps };
export default LearningObjectiveEditor;
