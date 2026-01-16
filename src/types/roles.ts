/**
 * Role System Types for CodeLearn
 *
 * Defines user roles and their capabilities within the application.
 * - Student: Learners accessing courses and completing exercises
 * - Teacher: Educators who can view student progress
 * - Author: Content creators with CMS access
 */

/** User roles in CodeLearn */
export type UserRole = 'student' | 'teacher' | 'author';

/** Role metadata for display and configuration */
export interface RoleInfo {
  id: UserRole;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/** Role definitions with display information */
export const ROLES: Record<UserRole, RoleInfo> = {
  student: {
    id: 'student',
    label: 'Student',
    description: 'Learn coding through interactive lessons and exercises',
    icon: '📚',
    color: 'bg-blue-500',
  },
  teacher: {
    id: 'teacher',
    label: 'Teacher',
    description: 'Guide students and track their learning progress',
    icon: '👩‍🏫',
    color: 'bg-green-500',
  },
  author: {
    id: 'author',
    label: 'Author',
    description: 'Create and manage educational content',
    icon: '✍️',
    color: 'bg-purple-500',
  },
};

/** Roles that have access to the CMS */
export const CMS_ROLES: UserRole[] = ['author'];

/** Roles that can view student analytics */
export const ANALYTICS_ROLES: UserRole[] = ['teacher', 'author'];

/** Check if a role has CMS access */
export function canAccessCMS(role: UserRole | undefined): boolean {
  return role !== undefined && CMS_ROLES.includes(role);
}

/** Check if a role can view analytics */
export function canViewAnalytics(role: UserRole | undefined): boolean {
  return role !== undefined && ANALYTICS_ROLES.includes(role);
}

/** Get role info by role ID */
export function getRoleInfo(role: UserRole): RoleInfo {
  return ROLES[role];
}

/** All available roles as an array */
export const ALL_ROLES: UserRole[] = ['student', 'teacher', 'author'];
