import type { Prerequisite } from '@/types/content';

export interface PrerequisiteStatus {
  prerequisite: Prerequisite;
  met: boolean;
  blocking: boolean; // true if required and not met
}

/**
 * Check the status of all prerequisites against completed IDs.
 * Returns whether all blocking prerequisites are met and individual statuses.
 */
export function checkPrerequisites(
  prerequisites: Prerequisite[],
  completedIds: Set<string>
): { allMet: boolean; statuses: PrerequisiteStatus[] } {
  const statuses = prerequisites.map(prereq => ({
    prerequisite: prereq,
    met: completedIds.has(prereq.refId),
    blocking: prereq.required && !completedIds.has(prereq.refId)
  }));

  const allMet = statuses.every(s => !s.blocking);

  return { allMet, statuses };
}

/**
 * Get counts of completed prerequisites for progress display.
 * Returns both total and required-only counts.
 */
export function getCompletedPrerequisiteCount(
  prerequisites: Prerequisite[],
  completedIds: Set<string>
): { completed: number; total: number; requiredCompleted: number; requiredTotal: number } {
  const total = prerequisites.length;
  const completed = prerequisites.filter(p => completedIds.has(p.refId)).length;
  const requiredTotal = prerequisites.filter(p => p.required).length;
  const requiredCompleted = prerequisites.filter(p => p.required && completedIds.has(p.refId)).length;

  return { completed, total, requiredCompleted, requiredTotal };
}
