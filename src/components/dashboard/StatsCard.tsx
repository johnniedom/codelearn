/**
 * StatsCard Component
 *
 * Displays a single statistic with icon, label, and value.
 *
 * Features:
 * - Icon support
 * - Value with optional unit
 * - Trend indicator
 * - Accessible
 */

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface StatsCardProps {
  /** Label for the stat */
  label: string;
  /** Current value */
  value: string | number;
  /** Optional unit (e.g., "min", "XP", "%") */
  unit?: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value (e.g., "+5%") */
  trendValue?: string;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// StatsCard Component
// =============================================================================

export function StatsCard({
  label,
  value,
  unit,
  icon,
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-text-muted';
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-4',
        className
      )}
    >
      {/* Header with icon */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        {icon && (
          <div className="text-text-muted" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text">{value}</span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>

      {/* Trend */}
      {trend && trendValue && (
        <div className={cn('mt-1 flex items-center gap-1 text-xs', getTrendColor())}>
          {getTrendIcon()}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// StatsGrid Component
// =============================================================================

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Grid container for StatsCards
 */
export function StatsGrid({ children, className }: StatsGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export default StatsCard;
