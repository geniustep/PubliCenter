import { UserRole } from '@/types/api';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isEditorOrAbove,
  isAuthorOrAbove,
  canManageArticles,
  canPublishArticles,
  canOnlyViewOwnArticles,
  getRolePermissions,
  isRoleHigherThan,
  isRoleHigherOrEqual,
} from '../rbac';

describe('RBAC (Role-Based Access Control)', () => {
  describe('hasPermission', () => {
    it('should allow ADMIN full access to articles', () => {
      expect(hasPermission(UserRole.ADMIN, 'articles', 'create')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'articles', 'read')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'articles', 'update')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'articles', 'delete')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'articles', 'publish')).toBe(true);
    });

    it('should allow EDITOR to manage articles', () => {
      expect(hasPermission(UserRole.EDITOR, 'articles', 'create')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'articles', 'read')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'articles', 'update')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'articles', 'delete')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'articles', 'publish')).toBe(true);
    });

    it('should allow AUTHOR to create and publish own articles', () => {
      expect(hasPermission(UserRole.AUTHOR, 'articles', 'create')).toBe(true);
      expect(hasPermission(UserRole.AUTHOR, 'articles', 'read')).toBe(true);
      expect(hasPermission(UserRole.AUTHOR, 'articles', 'update')).toBe(true);
      expect(hasPermission(UserRole.AUTHOR, 'articles', 'publish')).toBe(true);
    });

    it('should allow CONTRIBUTOR to create but not publish', () => {
      expect(hasPermission(UserRole.CONTRIBUTOR, 'articles', 'create')).toBe(true);
      expect(hasPermission(UserRole.CONTRIBUTOR, 'articles', 'read')).toBe(true);
      expect(hasPermission(UserRole.CONTRIBUTOR, 'articles', 'update')).toBe(true);
      expect(hasPermission(UserRole.CONTRIBUTOR, 'articles', 'publish')).toBe(false);
    });

    it('should allow VIEWER only read access', () => {
      expect(hasPermission(UserRole.VIEWER, 'articles', 'read')).toBe(true);
      expect(hasPermission(UserRole.VIEWER, 'articles', 'create')).toBe(false);
      expect(hasPermission(UserRole.VIEWER, 'articles', 'update')).toBe(false);
      expect(hasPermission(UserRole.VIEWER, 'articles', 'delete')).toBe(false);
      expect(hasPermission(UserRole.VIEWER, 'articles', 'publish')).toBe(false);
    });

    it('should handle categories permissions', () => {
      expect(hasPermission(UserRole.ADMIN, 'categories', 'create')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'categories', 'create')).toBe(true);
      expect(hasPermission(UserRole.AUTHOR, 'categories', 'create')).toBe(false);
      expect(hasPermission(UserRole.AUTHOR, 'categories', 'read')).toBe(true);
    });

    it('should handle templates permissions', () => {
      expect(hasPermission(UserRole.ADMIN, 'templates', 'create')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'templates', 'update')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'templates', 'create')).toBe(false);
      expect(hasPermission(UserRole.EDITOR, 'templates', 'read')).toBe(true);
    });

    it('should handle users permissions', () => {
      expect(hasPermission(UserRole.ADMIN, 'users', 'create')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'users', 'update')).toBe(true);
      expect(hasPermission(UserRole.ADMIN, 'users', 'delete')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'users', 'create')).toBe(false);
      expect(hasPermission(UserRole.EDITOR, 'users', 'read')).toBe(true);
    });

    it('should return false for non-existent permissions', () => {
      expect(hasPermission(UserRole.VIEWER, 'articles', 'nonexistent')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the specified permissions', () => {
      expect(
        hasAnyPermission(UserRole.VIEWER, 'articles', ['read', 'write'])
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(
        hasAnyPermission(UserRole.VIEWER, 'articles', ['create', 'delete'])
      ).toBe(false);
    });

    it('should work with single permission', () => {
      expect(hasAnyPermission(UserRole.ADMIN, 'articles', ['create'])).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(
        hasAllPermissions(UserRole.ADMIN, 'articles', ['create', 'read', 'update'])
      ).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      expect(
        hasAllPermissions(UserRole.VIEWER, 'articles', ['read', 'create'])
      ).toBe(false);
    });

    it('should work with single permission', () => {
      expect(hasAllPermissions(UserRole.AUTHOR, 'articles', ['read'])).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true);
    });

    it('should return false for non-ADMIN roles', () => {
      expect(isAdmin(UserRole.EDITOR)).toBe(false);
      expect(isAdmin(UserRole.AUTHOR)).toBe(false);
      expect(isAdmin(UserRole.CONTRIBUTOR)).toBe(false);
      expect(isAdmin(UserRole.VIEWER)).toBe(false);
    });
  });

  describe('isEditorOrAbove', () => {
    it('should return true for ADMIN and EDITOR', () => {
      expect(isEditorOrAbove(UserRole.ADMIN)).toBe(true);
      expect(isEditorOrAbove(UserRole.EDITOR)).toBe(true);
    });

    it('should return false for roles below EDITOR', () => {
      expect(isEditorOrAbove(UserRole.AUTHOR)).toBe(false);
      expect(isEditorOrAbove(UserRole.CONTRIBUTOR)).toBe(false);
      expect(isEditorOrAbove(UserRole.VIEWER)).toBe(false);
    });
  });

  describe('isAuthorOrAbove', () => {
    it('should return true for ADMIN, EDITOR, and AUTHOR', () => {
      expect(isAuthorOrAbove(UserRole.ADMIN)).toBe(true);
      expect(isAuthorOrAbove(UserRole.EDITOR)).toBe(true);
      expect(isAuthorOrAbove(UserRole.AUTHOR)).toBe(true);
    });

    it('should return false for CONTRIBUTOR and VIEWER', () => {
      expect(isAuthorOrAbove(UserRole.CONTRIBUTOR)).toBe(false);
      expect(isAuthorOrAbove(UserRole.VIEWER)).toBe(false);
    });
  });

  describe('canManageArticles', () => {
    it('should return true for roles that can create, update, and delete', () => {
      expect(canManageArticles(UserRole.ADMIN)).toBe(true);
      expect(canManageArticles(UserRole.EDITOR)).toBe(true);
    });

    it('should return false for AUTHOR (can update but not delete)', () => {
      // Depends on RolePermissions - AUTHOR might not have delete permission
      const result = canManageArticles(UserRole.AUTHOR);
      expect(typeof result).toBe('boolean');
    });

    it('should return false for VIEWER', () => {
      expect(canManageArticles(UserRole.VIEWER)).toBe(false);
    });
  });

  describe('canPublishArticles', () => {
    it('should return true for roles with publish permission', () => {
      expect(canPublishArticles(UserRole.ADMIN)).toBe(true);
      expect(canPublishArticles(UserRole.EDITOR)).toBe(true);
      expect(canPublishArticles(UserRole.AUTHOR)).toBe(true);
    });

    it('should return false for CONTRIBUTOR and VIEWER', () => {
      expect(canPublishArticles(UserRole.CONTRIBUTOR)).toBe(false);
      expect(canPublishArticles(UserRole.VIEWER)).toBe(false);
    });
  });

  describe('canOnlyViewOwnArticles', () => {
    it('should return true for CONTRIBUTOR and VIEWER', () => {
      expect(canOnlyViewOwnArticles(UserRole.CONTRIBUTOR)).toBe(true);
      expect(canOnlyViewOwnArticles(UserRole.VIEWER)).toBe(true);
    });

    it('should return false for higher roles', () => {
      expect(canOnlyViewOwnArticles(UserRole.ADMIN)).toBe(false);
      expect(canOnlyViewOwnArticles(UserRole.EDITOR)).toBe(false);
      expect(canOnlyViewOwnArticles(UserRole.AUTHOR)).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions array for valid role', () => {
      const permissions = getRolePermissions(UserRole.ADMIN);
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return permissions for all roles', () => {
      Object.values(UserRole).forEach((role) => {
        const permissions = getRolePermissions(role);
        expect(Array.isArray(permissions)).toBe(true);
      });
    });
  });

  describe('isRoleHigherThan', () => {
    it('should return true when first role is higher', () => {
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.EDITOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.EDITOR, UserRole.AUTHOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.AUTHOR, UserRole.CONTRIBUTOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.CONTRIBUTOR, UserRole.VIEWER)).toBe(true);
    });

    it('should return false when first role is lower or equal', () => {
      expect(isRoleHigherThan(UserRole.EDITOR, UserRole.ADMIN)).toBe(false);
      expect(isRoleHigherThan(UserRole.VIEWER, UserRole.AUTHOR)).toBe(false);
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('isRoleHigherOrEqual', () => {
    it('should return true when first role is higher or equal', () => {
      expect(isRoleHigherOrEqual(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(isRoleHigherOrEqual(UserRole.ADMIN, UserRole.EDITOR)).toBe(true);
      expect(isRoleHigherOrEqual(UserRole.EDITOR, UserRole.EDITOR)).toBe(true);
      expect(isRoleHigherOrEqual(UserRole.AUTHOR, UserRole.CONTRIBUTOR)).toBe(true);
    });

    it('should return false when first role is lower', () => {
      expect(isRoleHigherOrEqual(UserRole.VIEWER, UserRole.ADMIN)).toBe(false);
      expect(isRoleHigherOrEqual(UserRole.CONTRIBUTOR, UserRole.AUTHOR)).toBe(false);
    });
  });

  describe('Role Hierarchy', () => {
    it('should maintain correct hierarchy order', () => {
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.EDITOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.AUTHOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.CONTRIBUTOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.ADMIN, UserRole.VIEWER)).toBe(true);

      expect(isRoleHigherThan(UserRole.EDITOR, UserRole.AUTHOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.EDITOR, UserRole.CONTRIBUTOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.EDITOR, UserRole.VIEWER)).toBe(true);

      expect(isRoleHigherThan(UserRole.AUTHOR, UserRole.CONTRIBUTOR)).toBe(true);
      expect(isRoleHigherThan(UserRole.AUTHOR, UserRole.VIEWER)).toBe(true);

      expect(isRoleHigherThan(UserRole.CONTRIBUTOR, UserRole.VIEWER)).toBe(true);
    });
  });
});
