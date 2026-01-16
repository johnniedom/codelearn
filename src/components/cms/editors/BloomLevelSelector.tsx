'use client';

/**
 * BloomLevelSelector Component
 *
 * Dropdown/button group for selecting Bloom's taxonomy levels.
 *
 * Features:
 * - Color-coded badges for each level
 * - Dropdown selection with icons and descriptions
 * - Keyboard accessible
 * - Supports disabled state
 */

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BloomLevel } from '@/types/content';

// =============================================================================
// Types
// =============================================================================

interface BloomLevelSelectorProps {
  /** Currently selected level */
  value: BloomLevel | null;
  /** Callback when level changes */
  onChange: (level: BloomLevel) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Bloom Level Configuration
// =============================================================================

interface BloomLevelConfig {
  label: string;
  description: string;
  icon: typeof Brain;
  bgColor: string;
  textColor: string;
  badgeClasses: string;
}

const BLOOM_LEVELS: Record<BloomLevel, BloomLevelConfig> = {
  remember: {
    label: 'Remember',
    description: 'Recall facts, terms, and basic concepts',
    icon: Brain,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    badgeClasses: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  understand: {
    label: 'Understand',
    description: 'Explain ideas and concepts',
    icon: Lightbulb,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    badgeClasses: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  apply: {
    label: 'Apply',
    description: 'Use information in new situations',
    icon: Wrench,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    badgeClasses: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  analyze: {
    label: 'Analyze',
    description: 'Draw connections among ideas',
    icon: Search,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    badgeClasses: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  evaluate: {
    label: 'Evaluate',
    description: 'Justify a decision or action',
    icon: Scale,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    badgeClasses: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  create: {
    label: 'Create',
    description: 'Produce new or original work',
    icon: Sparkles,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    badgeClasses: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
};

const BLOOM_LEVEL_ORDER: BloomLevel[] = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
];

// =============================================================================
// Component
// =============================================================================

export function BloomLevelSelector({
  value,
  onChange,
  disabled = false,
  className,
}: BloomLevelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const buttonId = useId();
  const listboxId = useId();

  const selectedConfig = value ? BLOOM_LEVELS[value] : null;

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            onChange(BLOOM_LEVEL_ORDER[focusedIndex]);
            setIsOpen(false);
            setFocusedIndex(-1);
          } else {
            setIsOpen(true);
            setFocusedIndex(value ? BLOOM_LEVEL_ORDER.indexOf(value) : 0);
          }
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(value ? BLOOM_LEVEL_ORDER.indexOf(value) : 0);
          } else {
            setFocusedIndex((prev) =>
              prev < BLOOM_LEVEL_ORDER.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(value ? BLOOM_LEVEL_ORDER.indexOf(value) : BLOOM_LEVEL_ORDER.length - 1);
          } else {
            setFocusedIndex((prev) =>
              prev > 0 ? prev - 1 : BLOOM_LEVEL_ORDER.length - 1
            );
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;

        case 'Tab':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;

        default:
          break;
      }
    },
    [disabled, isOpen, focusedIndex, value, onChange]
  );

  /**
   * Handle option selection
   */
  const handleSelect = useCallback(
    (level: BloomLevel) => {
      onChange(level);
      setIsOpen(false);
      setFocusedIndex(-1);
    },
    [onChange]
  );

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <Button
        id={buttonId}
        type="button"
        variant="outline"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setFocusedIndex(value ? BLOOM_LEVEL_ORDER.indexOf(value) : 0);
            }
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={buttonId}
        aria-controls={isOpen ? listboxId : undefined}
        className={cn(
          'w-full justify-between gap-2',
          !value && 'text-text-muted'
        )}
      >
        {selectedConfig ? (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                selectedConfig.badgeClasses
              )}
            >
              <selectedConfig.icon className="h-3 w-3" aria-hidden="true" />
              {selectedConfig.label}
            </span>
          </span>
        ) : (
          <span>Select level</span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </Button>

      {/* Dropdown List */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={buttonId}
          className={cn(
            'absolute z-50 mt-1 w-full min-w-[280px]',
            'rounded-md border border-border bg-background shadow-lg',
            'py-1 focus:outline-none'
          )}
        >
          {BLOOM_LEVEL_ORDER.map((level, index) => {
            const config = BLOOM_LEVELS[level];
            const Icon = config.icon;
            const isSelected = value === level;
            const isFocused = focusedIndex === index;

            return (
              <li
                key={level}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(level)}
                onMouseEnter={() => setFocusedIndex(index)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-3 py-2',
                  'transition-colors',
                  isFocused && 'bg-surface',
                  isSelected && 'bg-primary/5'
                )}
              >
                {/* Color-coded icon */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.textColor)} aria-hidden="true" />
                </span>

                {/* Label and description */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">{config.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{config.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export type { BloomLevelSelectorProps };
export default BloomLevelSelector;
