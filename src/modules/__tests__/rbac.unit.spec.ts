import { hasPermission, hasAnyPermission, hasAllPermissions, createUserContext } from "../rbac"

describe("RBAC (Role-Based Access Control)", () => {
  describe("hasPermission", () => {
    it("admin should have manage_users permission", () => {
      const admin = createUserContext("admin-1", "admin@example.com", "admin")
      expect(hasPermission(admin, "manage_users")).toBe(true)
    })

    it("customer should not have manage_users permission", () => {
      const customer = createUserContext("user-1", "user@example.com", "customer")
      expect(hasPermission(customer, "manage_users")).toBe(false)
    })

    it("admin should have all permissions", () => {
      const admin = createUserContext("admin-1", "admin@example.com", "admin")
      expect(hasPermission(admin, "manage_products")).toBe(true)
      expect(hasPermission(admin, "manage_orders")).toBe(true)
      expect(hasPermission(admin, "manage_users")).toBe(true)
    })

    it("customer should only have customer-level permissions", () => {
      const customer = createUserContext("user-1", "user@example.com", "customer")
      expect(hasPermission(customer, "create_orders")).toBe(true)
      expect(hasPermission(customer, "view_own_orders")).toBe(true)
      expect(hasPermission(customer, "edit_own_profile")).toBe(true)
      expect(hasPermission(customer, "manage_users")).toBe(false)
    })

    it("editor should have content management permissions", () => {
      const editor = createUserContext("editor-1", "editor@example.com", "editor")
      expect(hasPermission(editor, "edit_products")).toBe(true)
      expect(hasPermission(editor, "manage_users")).toBe(false)
    })
  })

  describe("hasAnyPermission", () => {
    it("should return true if user has any of the required permissions", () => {
      const customer = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAnyPermission(customer, ["manage_users", "create_orders"])).toBe(true)
    })

    it("should return false if user has none of the required permissions", () => {
      const customer = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAnyPermission(customer, ["manage_users", "manage_products"])).toBe(false)
    })
  })

  describe("hasAllPermissions", () => {
    it("admin should have all permissions", () => {
      const admin = createUserContext("admin-1", "admin@example.com", "admin")
      expect(hasAllPermissions(admin, ["manage_users", "manage_products", "manage_orders"])).toBe(
        true
      )
    })

    it("customer should not have all admin permissions", () => {
      const customer = createUserContext("user-1", "user@example.com", "customer")
      expect(hasAllPermissions(customer, ["manage_users", "create_orders"])).toBe(false)
    })
  })

  describe("createUserContext", () => {
    it("should create user context with correct properties", () => {
      const user = createUserContext("user-1", "user@example.com", "customer")
      expect(user.id).toBe("user-1")
      expect(user.email).toBe("user@example.com")
      expect(user.role).toBe("customer")
      expect(user.permissions).toBeDefined()
      expect(Array.isArray(user.permissions)).toBe(true)
    })

    it("should assign correct permissions based on role", () => {
      const admin = createUserContext("admin-1", "admin@example.com", "admin")
      const customer = createUserContext("user-1", "user@example.com", "customer")

      expect(admin.permissions.length).toBeGreaterThan(customer.permissions.length)
    })
  })
})
