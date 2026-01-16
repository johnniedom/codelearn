/**
 * Permission System for CodeLearn
 *
 * Maps roles to permissions for fine-grained access control.
 */

import type { UserRole } from '@/types/roles';

/** Available permissions in the application */
export type Permission =
  | 'cms.access'
  | 'cms.create'
  | 'cms.edit'
  | 'cms.delete'
  | 'cms.publish'
  | 'analytics.view'
  | 'analytics.export'
  | 'students.view'
  | 'students.manage';

/** Permission mappings for each role */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [],
  teacher: [
    'cms.access',
    'cms.create',
    'cms.edit',
    'cms.delete',
    'cms.publish',
    'analytics.view',
    'students.view',
  ],
  author: [
    'cms.access',
    'cms.create',
    'cms.edit',
    'cms.delete',
    'cms.publish',
    'analytics.view',
    'analytics.export',
    'students.view',
    'students.manage',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: UserRole | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has any of the given permissions
 */
export function hasAnyPermission(
  role: UserRole | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some(p => ROLE_PERMISSIONS[role].includes(p));
}

/**
 * Check if a role has all of the given permissions
 */
export function hasAllPermissions(
  role: UserRole | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.every(p => ROLE_PERMISSIONS[role].includes(p));
}
