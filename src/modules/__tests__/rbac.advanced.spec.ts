import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  createUserContext,
  getAnonymousUserContext,
  canAccessResource,
} from "../rbac"

describe("RBAC Advanced Tests", () => {
  describe("hasAnyPermission", () => {
    it("should return true if user has at least one permission", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAnyPermission(user, ["create_orders", "manage_users"])).toBe(true)
    })

    it("should return false if user has none of the permissions", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAnyPermission(user, ["manage_users", "manage_products"])).toBe(false)
    })

    it("should return false for unauthenticated users", () => {
      const anonymous = getAnonymousUserContext()
      expect(hasAnyPermission(anonymous, ["create_orders"])).toBe(false)
    })
  })

  describe("hasAllPermissions", () => {
    it("should return true if user has all permissions", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAllPermissions(user, ["create_orders", "view_own_orders"])).toBe(true)
    })

    it("should return false if user lacks any permission", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAllPermissions(user, ["create_orders", "manage_users"])).toBe(false)
    })

    it("should return true for empty permission array", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAllPermissions(user, [])).toBe(true)
    })

    it("should return false for unauthenticated users", () => {
      const anonymous = getAnonymousUserContext()
      expect(hasAllPermissions(anonymous, ["view_products"])).toBe(false)
    })
  })

  describe("getAnonymousUserContext", () => {
    it("should return anonymous viewer context", () => {
      const anonymous = getAnonymousUserContext()
      expect(anonymous.id).toBe("anonymous")
      expect(anonymous.email).toBe("")
      expect(anonymous.role).toBe("viewer")
      expect(anonymous.isAuthenticated).toBe(false)
    })

    it("should have only viewer permissions", () => {
      const anonymous = getAnonymousUserContext()
      expect(anonymous.permissions).toContain("view_products")
      expect(anonymous.permissions).not.toContain("create_orders")
    })
  })

  describe("canAccessResource", () => {
    it("admin should access any resource", () => {
      const admin = createUserContext("admin-1", "admin@example.com", "admin")
      expect(canAccessResource(admin, "other-user-id")).toBe(true)
    })

    it("user should access own resource", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(canAccessResource(user, "user-1")).toBe(true)
    })

    it("user should not access others resource", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(canAccessResource(user, "other-user-id")).toBe(false)
    })

    it("should respect allowAdmin flag", () => {
      const editor = createUserContext("editor-1", "editor@example.com", "editor")
      expect(canAccessResource(editor, "other-id", false)).toBe(false)
    })
  })

  describe("Role-based permissions", () => {
    it("admin should have all permissions", () => {
      const admin = createUserContext("admin-1", "admin@example.com", "admin")
      expect(admin.permissions.length).toBeGreaterThan(10)
      expect(hasPermission(admin, "manage_users")).toBe(true)
      expect(hasPermission(admin, "manage_products")).toBe(true)
    })

    it("editor should have limited permissions", () => {
      const editor = createUserContext("editor-1", "editor@example.com", "editor")
      expect(editor.permissions.length).toBeLessThan(10)
      expect(hasPermission(editor, "edit_products")).toBe(true)
      expect(hasPermission(editor, "manage_users")).toBe(false)
    })

    it("customer should have order-related permissions", () => {
      const customer = createUserContext("user-1", "user@example.com", "customer")
      expect(hasPermission(customer, "create_orders")).toBe(true)
      expect(hasPermission(customer, "view_own_orders")).toBe(true)
      expect(hasPermission(customer, "manage_products")).toBe(false)
    })

    it("viewer should only view products", () => {
      const viewer = createUserContext("viewer-1", "viewer@example.com", "viewer")
      expect(hasPermission(viewer, "view_products")).toBe(true)
      expect(hasPermission(viewer, "create_orders")).toBe(false)
    })
  })
})
