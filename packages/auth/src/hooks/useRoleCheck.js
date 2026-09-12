import { useAuth } from '../useAuth';
import { UserRole } from '../types';

/**
 * useRoleCheck Hook
 * Provides role-based access control utilities
 */
export const useRoleCheck = () => {
  const { role, isAuthenticated } = useAuth();

  const hasRole = (requiredRole) => {
    if (!isAuthenticated || !role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    
    return role === requiredRole;
  };

  const isCustomer = () => hasRole(UserRole.CUSTOMER);
  const isPartner = () => hasRole(UserRole.PARTNER);
  const isDriver = () => hasRole(UserRole.DRIVER);
  const isStaff = () => hasRole(UserRole.STAFF);
  const isAdmin = () => hasRole(UserRole.ADMIN);

  const hasAnyRole = (...roles) => {
    return roles.some(r => hasRole(r));
  };

  const hasAllRoles = (...roles) => {
    return roles.every(r => hasRole(r));
  };

  const canAccessPTPFeatures = () => {
    return hasAnyRole(
      UserRole.CUSTOMER,
      UserRole.PARTNER,
      UserRole.DRIVER,
      UserRole.STAFF,
      UserRole.ADMIN
    );
  };

  const canAccessShopFeatures = () => {
    return hasAnyRole(
      UserRole.CUSTOMER,
      UserRole.PARTNER,
      UserRole.ADMIN
    );
  };

  const canScanParcels = () => {
    return hasAnyRole(
      UserRole.PARTNER,
      UserRole.DRIVER,
      UserRole.STAFF,
      UserRole.ADMIN
    );
  };

  const canManageShop = () => {
    return hasAnyRole(
      UserRole.PARTNER,
      UserRole.ADMIN
    );
  };

  const canViewAnalytics = () => {
    return hasAnyRole(
      UserRole.STAFF,
      UserRole.ADMIN
    );
  };

  const canManageUsers = () => {
    return hasRole(UserRole.ADMIN);
  };

  return {
    role,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isCustomer,
    isPartner,
    isDriver,
    isStaff,
    isAdmin,
    canAccessPTPFeatures,
    canAccessShopFeatures,
    canScanParcels,
    canManageShop,
    canViewAnalytics,
    canManageUsers,
  };
};

export default useRoleCheck;
