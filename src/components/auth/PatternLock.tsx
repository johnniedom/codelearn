/**
 * PatternLock Component
 *
 * A 3x3 grid pattern lock for MFA authentication.
 * Users draw a pattern by connecting at least 4 dots.
 *
 * Features:
 * - 3x3 grid (9 nodes)
 * - Minimum 4 connected points
 * - Visual feedback as user draws
 * - Hash pattern for storage (never store raw pattern)
 * - Haptic feedback on node selection (if available)
 *
 * Accessibility:
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Clear visual feedback
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PatternLockProps {
  /** Called when pattern changes */
  onChange: (pattern: number[]) => void;
  /** Called when pattern drawing is complete */
  onComplete?: (pattern: number[]) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Show error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Size of the grid (default: 200) */
  size?: number;
  /** Show the pattern being drawn */
  showPattern?: boolean;
  /** Additional class names */
  className?: string;
  /** Mode: 'input' for drawing, 'display' for showing a pattern */
  mode?: 'input' | 'display';
  /** Pattern to display (for display mode) */
  displayPattern?: number[];
}

// Grid positions (0-8, top-left to bottom-right)
const GRID_SIZE = 3;
const NODE_COUNT = GRID_SIZE * GRID_SIZE;

// Get node position in grid
function getNodePosition(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}

// Get node coordinates relative to grid
function getNodeCoordinates(
  index: number,
  gridSize: number
): { x: number; y: number } {
  const { row, col } = getNodePosition(index);
  const spacing = gridSize / (GRID_SIZE + 1);
  return {
    x: spacing * (col + 1),
    y: spacing * (row + 1),
  };
}

// Check if a point is near a node
function isNearNode(
  x: number,
  y: number,
  nodeX: number,
  nodeY: number,
  threshold: number
): boolean {
  const dx = x - nodeX;
  const dy = y - nodeY;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

// Trigger haptic feedback if available
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export const PatternLock = React.forwardRef<HTMLDivElement, PatternLockProps>(
  (
    {
      onChange,
      onComplete,
      disabled = false,
      error = false,
      errorMessage,
      size = 200,
      showPattern = true,
      className,
      mode = 'input',
      displayPattern = [],
    },
    ref
  ) => {
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [pattern, setPattern] = React.useState<number[]>([]);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [currentPos, setCurrentPos] = React.useState<{ x: number; y: number } | null>(null);

    // Track if we're currently handling a touch sequence to prevent duplicate mouse events
    const isTouchActiveRef = React.useRef(false);

    // Node styling
    const nodeRadius = size * 0.08;
    const activeNodeRadius = size * 0.1;
    const hitRadius = size * 0.12; // Larger hit area for touch

    // Get SVG coordinates from mouse/touch event
    const getSVGCoordinates = React.useCallback(
      (clientX: number, clientY: number): { x: number; y: number } | null => {
        if (!svgRef.current) return null;

        const rect = svgRef.current.getBoundingClientRect();
        return {
          x: ((clientX - rect.left) / rect.width) * size,
          y: ((clientY - rect.top) / rect.height) * size,
        };
      },
      [size]
    );

    // Check if a node is hit and not already in pattern
    const checkNodeHit = React.useCallback(
      (x: number, y: number, currentPattern: number[]): number | null => {
        for (let i = 0; i < NODE_COUNT; i++) {
          if (currentPattern.includes(i)) continue;

          const coords = getNodeCoordinates(i, size);
          if (isNearNode(x, y, coords.x, coords.y, hitRadius)) {
            return i;
          }
        }
        return null;
      },
      [size, hitRadius]
    );

    // Handle drawing start
    const handleStart = React.useCallback(
      (clientX: number, clientY: number) => {
        if (disabled || mode !== 'input') return;

        const coords = getSVGCoordinates(clientX, clientY);
        if (!coords) return;

        const hitNode = checkNodeHit(coords.x, coords.y, []);
        if (hitNode !== null) {
          setIsDrawing(true);
          setPattern([hitNode]);
          setCurrentPos(coords);
          triggerHaptic();
        }
      },
      [disabled, mode, getSVGCoordinates, checkNodeHit]
    );

    // Handle drawing move
    const handleMove = React.useCallback(
      (clientX: number, clientY: number) => {
        if (!isDrawing || disabled || mode !== 'input') return;

        const coords = getSVGCoordinates(clientX, clientY);
        if (!coords) return;

        setCurrentPos(coords);

        // Check for node hit and update pattern atomically to prevent race conditions
        // that could cause duplicate nodes when moving quickly or when both touch
        // and mouse events fire for the same gesture
        setPattern((prev) => {
          const hitNode = checkNodeHit(coords.x, coords.y, prev);
          if (hitNode !== null && !prev.includes(hitNode)) {
            // Double-check for duplicates to guard against race conditions where
            // touch and mouse events could both fire before state updates
            triggerHaptic();
            return [...prev, hitNode];
          }
          return prev;
        });
      },
      [isDrawing, disabled, mode, getSVGCoordinates, checkNodeHit]
    );

    // Sync pattern changes to parent via onChange - avoids race condition
    // when calling onChange inside setState callback
    React.useEffect(() => {
      if (pattern.length > 0) {
        onChange(pattern);
      }
    }, [pattern, onChange]);

    // Handle drawing end
    const handleEnd = React.useCallback(() => {
      if (!isDrawing) return;

      setIsDrawing(false);
      setCurrentPos(null);

      if (pattern.length >= 4) {
        onComplete?.(pattern);
      }
    }, [isDrawing, pattern, onComplete]);

    // Mouse event handlers - skip if touch is active to prevent duplicate events
    const handleMouseDown = (e: React.MouseEvent) => {
      if (isTouchActiveRef.current) return;
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isTouchActiveRef.current) return;
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (isTouchActiveRef.current) return;
      handleEnd();
    };

    const handleMouseLeave = () => {
      if (isTouchActiveRef.current) return;
      handleEnd();
    };

    // Touch event handlers - set flag to block synthetic mouse events
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      isTouchActiveRef.current = true;
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      handleEnd();
      // Reset touch flag after a short delay to allow any queued mouse events to be ignored
      setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 100);
    };

    // Clear pattern
    const clearPattern = () => {
      setPattern([]);
      setCurrentPos(null);
      setIsDrawing(false);
      onChange([]);
    };

    // Keyboard support for accessibility
    const [focusedNode, setFocusedNode] = React.useState<number | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled || mode !== 'input') return;

      const currentNode = focusedNode ?? 4; // Start at center

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          const newNode = currentNode - GRID_SIZE;
          if (newNode >= 0) setFocusedNode(newNode);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const newNode = currentNode + GRID_SIZE;
          if (newNode < NODE_COUNT) setFocusedNode(newNode);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (currentNode % GRID_SIZE > 0) setFocusedNode(currentNode - 1);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (currentNode % GRID_SIZE < GRID_SIZE - 1) setFocusedNode(currentNode + 1);
          break;
        }
        case ' ':
        case 'Enter': {
          e.preventDefault();
          if (focusedNode !== null && !pattern.includes(focusedNode)) {
            const newPattern = [...pattern, focusedNode];
            setPattern(newPattern);
            onChange(newPattern);
            triggerHaptic();

            if (newPattern.length >= 4) {
              onComplete?.(newPattern);
            }
          }
          break;
        }
        case 'Escape':
        case 'Backspace': {
          e.preventDefault();
          clearPattern();
          break;
        }
      }
    };

    // Pattern to render (either current drawing or display pattern)
    const renderPattern = mode === 'display' ? displayPattern : pattern;

    // Generate path for pattern lines
    const generatePath = (): string => {
      if (renderPattern.length === 0) return '';

      const points = renderPattern.map((nodeIndex) =>
        getNodeCoordinates(nodeIndex, size)
      );

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }

      // Add line to current position if drawing
      if (isDrawing && currentPos && mode === 'input') {
        d += ` L ${currentPos.x} ${currentPos.y}`;
      }

      return d;
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Instructions */}
        {mode === 'input' && (
          <p className="mb-2 text-center text-sm text-text-muted" id="pattern-instructions">
            Connect at least 4 dots to create your pattern
          </p>
        )}

        {/* Pattern grid */}
        <div className="flex justify-center">
          <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            tabIndex={mode === 'input' && !disabled ? 0 : -1}
            role="application"
            aria-label={`Pattern lock grid. ${renderPattern.length} dots connected.`}
            aria-describedby="pattern-instructions"
            className={cn(
              'touch-none rounded-lg',
              !disabled && mode === 'input' && 'cursor-pointer',
              disabled && 'opacity-50',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background'
            )}
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            {/* Pattern lines */}
            {showPattern && renderPattern.length > 0 && (
              <path
                d={generatePath()}
                fill="none"
                stroke={error ? 'var(--color-error)' : 'var(--color-primary)'}
                strokeWidth={size * 0.02}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            )}

            {/* Nodes */}
            {Array.from({ length: NODE_COUNT }).map((_, index) => {
              const coords = getNodeCoordinates(index, size);
              const isInPattern = renderPattern.includes(index);
              const isFocused = focusedNode === index;
              const orderInPattern = renderPattern.indexOf(index);

              return (
                <g key={index}>
                  {/* Hit area (invisible, larger for touch) */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={hitRadius}
                    fill="transparent"
                  />

                  {/* Outer ring when active */}
                  {isInPattern && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={activeNodeRadius}
                      fill={error ? 'var(--color-error)' : 'var(--color-primary)'}
                      opacity={0.2}
                    />
                  )}

                  {/* Node circle */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isInPattern ? nodeRadius * 0.8 : nodeRadius}
                    fill={
                      isInPattern
                        ? error
                          ? 'var(--color-error)'
                          : 'var(--color-primary)'
                        : 'var(--color-border)'
                    }
                    className="transition-all duration-100"
                  />

                  {/* Order number for display mode */}
                  {mode === 'display' && isInPattern && (
                    <text
                      x={coords.x}
                      y={coords.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="white"
                      fontSize={nodeRadius * 0.8}
                      fontWeight="bold"
                    >
                      {orderInPattern + 1}
                    </text>
                  )}

                  {/* Keyboard focus indicator */}
                  {isFocused && mode === 'input' && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={activeNodeRadius * 1.2}
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Pattern status */}
        {mode === 'input' && (
          <div className="mt-3 flex items-center justify-between">
            <p
              className={cn(
                'text-sm',
                pattern.length >= 4 ? 'text-success' : 'text-text-muted'
              )}
              aria-live="polite"
            >
              {pattern.length}/4 dots connected
              {pattern.length >= 4 && ' (ready!)'}
            </p>

            {pattern.length > 0 && (
              <button
                type="button"
                onClick={clearPattern}
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Error message */}
        {error && errorMessage && (
          <p className="mt-2 text-center text-sm text-error" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

PatternLock.displayName = 'PatternLock';

export default PatternLock;
