import { UserRole, RolePermissions } from '@/types/api';

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  role: UserRole,
  resource: string,
  action: string
): boolean {
  const permissions = RolePermissions[role];
  if (!permissions) return false;

  const resourcePermission = permissions.find((p) => p.resource === resource);
  if (!resourcePermission) return false;

  return resourcePermission.actions.includes(action);
}

/**
 * Check if a user can perform ANY of the specified actions
 */
export function hasAnyPermission(
  role: UserRole,
  resource: string,
  actions: string[]
): boolean {
  return actions.some((action) => hasPermission(role, resource, action));
}

/**
 * Check if a user can perform ALL of the specified actions
 */
export function hasAllPermissions(
  role: UserRole,
  resource: string,
  actions: string[]
): boolean {
  return actions.every((action) => hasPermission(role, resource, action));
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Check if user is editor or above
 */
export function isEditorOrAbove(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.EDITOR;
}

/**
 * Check if user is author or above
 */
export function isAuthorOrAbove(role: UserRole): boolean {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.EDITOR ||
    role === UserRole.AUTHOR
  );
}

/**
 * Check if user can manage (create, update, delete) articles
 */
export function canManageArticles(role: UserRole): boolean {
  return hasAllPermissions(role, 'articles', ['create', 'update', 'delete']);
}

/**
 * Check if user can publish articles
 */
export function canPublishArticles(role: UserRole): boolean {
  return hasPermission(role, 'articles', 'publish');
}

/**
 * Check if user can only view their own articles
 */
export function canOnlyViewOwnArticles(role: UserRole): boolean {
  return role === UserRole.CONTRIBUTOR || role === UserRole.VIEWER;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole) {
  return RolePermissions[role] || [];
}

/**
 * Role hierarchy - higher roles include all permissions of lower roles
 */
export const RoleHierarchy = {
  [UserRole.ADMIN]: 5,
  [UserRole.EDITOR]: 4,
  [UserRole.AUTHOR]: 3,
  [UserRole.CONTRIBUTOR]: 2,
  [UserRole.VIEWER]: 1,
};

/**
 * Check if a role is higher than another role
 */
export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  return RoleHierarchy[role1] > RoleHierarchy[role2];
}

/**
 * Check if a role is higher or equal to another role
 */
export function isRoleHigherOrEqual(role1: UserRole, role2: UserRole): boolean {
  return RoleHierarchy[role1] >= RoleHierarchy[role2];
}
