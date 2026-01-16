'use client';

import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

interface BloomLevelBadgeProps {
  level: BloomLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const BLOOM_CONFIG: Record<BloomLevel, {
  label: string;
  description: string;
  icon: typeof Brain;
  colors: string;
}> = {
  remember: {
    label: 'Remember',
    description: 'Recall facts, terms, and basic concepts',
    icon: Brain,
    colors: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  understand: {
    label: 'Understand',
    description: 'Explain ideas and concepts',
    icon: Lightbulb,
    colors: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  apply: {
    label: 'Apply',
    description: 'Use information in new situations',
    icon: Wrench,
    colors: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  analyze: {
    label: 'Analyze',
    description: 'Draw connections among ideas',
    icon: Search,
    colors: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  evaluate: {
    label: 'Evaluate',
    description: 'Justify a decision or action',
    icon: Scale,
    colors: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  create: {
    label: 'Create',
    description: 'Produce new or original work',
    icon: Sparkles,
    colors: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
};

const SIZE_CONFIG = {
  sm: { badge: 'px-1.5 py-0.5 text-xs gap-1', icon: 'h-3 w-3' },
  md: { badge: 'px-2 py-1 text-sm gap-1.5', icon: 'h-4 w-4' },
  lg: { badge: 'px-3 py-1.5 text-base gap-2', icon: 'h-5 w-5' },
};

export function BloomLevelBadge({
  level,
  size = 'sm',
  showLabel = true,
  showTooltip = true,
  className,
}: BloomLevelBadgeProps) {
  const config = BLOOM_CONFIG[level];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.colors,
        sizeConfig.badge,
        className
      )}
      title={showTooltip ? config.description : undefined}
      aria-label={`${config.label}: ${config.description}`}
    >
      <Icon className={sizeConfig.icon} aria-hidden="true" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );

  return badge;
}

export type { BloomLevel, BloomLevelBadgeProps };
