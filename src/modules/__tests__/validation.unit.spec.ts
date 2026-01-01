import { LoginRequestSchema, RegisterRequestSchema, ProductCreateSchema } from "../validation"

describe("Validation Schemas", () => {
  describe("LoginRequestSchema", () => {
    it("should validate correct login credentials", () => {
      const validData = {
        email: "user@example.com",
        password: "SecurePass123!",
      }
      const result = LoginRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        password: "SecurePass123!",
      }
      const result = LoginRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject weak password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "weak",
      }
      const result = LoginRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe("RegisterRequestSchema", () => {
    it("should validate correct registration data", () => {
      const validData = {
        email: "newuser@example.com",
        password: "SecurePass123!",
        first_name: "John",
        last_name: "Doe",
      }
      const result = RegisterRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject mismatched passwords", () => {
      const invalidData = {
        email: "newuser@example.com",
        password: "SecurePass123!",
        passwordConfirm: "DifferentPass123!",
        firstName: "John",
        lastName: "Doe",
      }
      const result = RegisterRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject missing required fields", () => {
      const invalidData = {
        email: "newuser@example.com",
        // missing password and name fields
      }
      const result = RegisterRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe("ProductCreateSchema", () => {
    it("should validate correct product data", () => {
      const validData = {
        title: "Test Product",
        handle: "test-product",
        price: 99.99,
        currency_code: "USD",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
      }
      const result = ProductCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject negative price", () => {
      const invalidData = {
        title: "Test Product",
        handle: "test-product",
        price: -100,
        currency_code: "USD",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
      }
      const result = ProductCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject missing title", () => {
      const invalidData = {
        handle: "test-product",
        price: 99.99,
        currency_code: "USD",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
      }
      const result = ProductCreateSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
