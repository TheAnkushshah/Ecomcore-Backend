/**
 * Role-Based Access Control (RBAC)
 * Enterprise-grade authorization system
 */

export type UserRole = "admin" | "editor" | "customer" | "viewer"

export type Permission =
  // Admin permissions
  | "manage_users"
  | "manage_roles"
  | "manage_products"
  | "manage_orders"
  | "manage_customers"
  | "view_analytics"
  | "manage_settings"
  // Editor permissions
  | "edit_products"
  | "view_products"
  | "manage_categories"
  | "view_orders"
  // Customer permissions
  | "create_orders"
  | "view_own_orders"
  | "edit_own_profile"
  | "manage_addresses"
  // Viewer permissions
  | "view_products"
  | "view_categories"

/**
 * Role definitions with permissions
 */
export const RoleDefinitions: Record<UserRole, Permission[]> = {
  admin: [
    "manage_users",
    "manage_roles",
    "manage_products",
    "manage_orders",
    "manage_customers",
    "view_analytics",
    "manage_settings",
    "edit_products",
    "view_products",
    "manage_categories",
    "view_orders",
    "create_orders",
    "view_own_orders",
    "edit_own_profile",
    "manage_addresses",
  ],
  editor: [
    "edit_products",
    "view_products",
    "manage_categories",
    "view_orders",
  ],
  customer: [
    "create_orders",
    "view_own_orders",
    "edit_own_profile",
    "manage_addresses",
    "view_products",
    "view_categories",
  ],
  viewer: ["view_products", "view_categories"],
}

/**
 * User context with role and permissions
 */
export interface UserContext {
  id: string
  email: string
  role: UserRole
  permissions: Permission[]
  isAuthenticated: boolean
}

/**
 * Check if user has permission
 */
export function hasPermission(
  userContext: UserContext,
  requiredPermission: Permission
): boolean {
  if (!userContext.isAuthenticated) {
    return false
  }
  return userContext.permissions.includes(requiredPermission)
}

/**
 * Check if user has any of the permissions
 */
export function hasAnyPermission(
  userContext: UserContext,
  requiredPermissions: Permission[]
): boolean {
  if (!userContext.isAuthenticated) {
    return false
  }
  return requiredPermissions.some((perm) =>
    userContext.permissions.includes(perm)
  )
}

/**
 * Check if user has all permissions
 */
export function hasAllPermissions(
  userContext: UserContext,
  requiredPermissions: Permission[]
): boolean {
  if (!userContext.isAuthenticated) {
    return false
  }
  return requiredPermissions.every((perm) =>
    userContext.permissions.includes(perm)
  )
}

/**
 * Create user context from user data
 */
export function createUserContext(
  userId: string,
  email: string,
  role: UserRole
): UserContext {
  const permissions = RoleDefinitions[role] || []

  return {
    id: userId,
    email,
    role,
    permissions,
    isAuthenticated: true,
  }
}

/**
 * Get anonymous user context
 */
export function getAnonymousUserContext(): UserContext {
  return {
    id: "anonymous",
    email: "",
    role: "viewer",
    permissions: RoleDefinitions.viewer,
    isAuthenticated: false,
  }
}

/**
 * Authorization decorator factory
 * For use in API endpoints
 */
export function requirePermission(permission: Permission) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (userContext: UserContext, ...args: any[]) {
      if (!hasPermission(userContext, permission)) {
        throw new Error(`User lacks required permission: ${permission}`)
      }
      return originalMethod.apply(this, [userContext, ...args])
    }

    return descriptor
  }
}

/**
 * Check resource ownership
 * Useful for verifying user owns the resource they're accessing
 */
export function canAccessResource(
  userContext: UserContext,
  resourceOwnerId: string,
  allowAdmin: boolean = true
): boolean {
  if (allowAdmin && userContext.role === "admin") {
    return true
  }
  return userContext.id === resourceOwnerId
}
