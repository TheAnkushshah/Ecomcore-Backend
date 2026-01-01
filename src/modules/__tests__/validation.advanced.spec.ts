import {
  LoginRequestSchema,
  RegisterRequestSchema,
  OTPRequestSchema,
  OTPVerifySchema,
  ProductCreateSchema,
  AddToCartSchema,
  CreateOrderSchema,
} from "../validation"

describe("Validation Schemas - Advanced", () => {
  describe("OTPRequestSchema", () => {
    it("should validate with email only", () => {
      const data = { email: "user@example.com" }
      const result = OTPRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should validate with email and phone", () => {
      const data = {
        email: "user@example.com",
        phone: "+1-234-567-8900",
      }
      const result = OTPRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const data = {
        email: "not-an-email",
        phone: "+1234567890",
      }
      const result = OTPRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject invalid phone format", () => {
      const data = {
        email: "user@example.com",
        phone: "invalid-phone",
      }
      const result = OTPRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("OTPVerifySchema", () => {
    it("should validate correct OTP", () => {
      const data = {
        email: "user@example.com",
        otp: "123456",
      }
      const result = OTPVerifySchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should reject OTP with non-numeric characters", () => {
      const data = {
        email: "user@example.com",
        otp: "12345a",
      }
      const result = OTPVerifySchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject OTP not 6 digits", () => {
      const data = {
        email: "user@example.com",
        otp: "12345",
      }
      const result = OTPVerifySchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("AddToCartSchema", () => {
    it("should validate correct add to cart request", () => {
      const data = {
        product_id: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 1,
      }
      const result = AddToCartSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should validate with variant_id", () => {
      const data = {
        product_id: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 2,
        variant_id: "550e8400-e29b-41d4-a716-446655440001",
      }
      const result = AddToCartSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should reject zero quantity", () => {
      const data = {
        product_id: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 0,
      }
      const result = AddToCartSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject negative quantity", () => {
      const data = {
        product_id: "550e8400-e29b-41d4-a716-446655440000",
        quantity: -1,
      }
      const result = AddToCartSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject invalid product_id", () => {
      const data = {
        product_id: "not-a-uuid",
        quantity: 1,
      }
      const result = AddToCartSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should reject non-integer quantity", () => {
      const data = {
        product_id: "550e8400-e29b-41d4-a716-446655440000",
        quantity: 1.5,
      }
      const result = AddToCartSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe("CreateOrderSchema", () => {
    it("should validate correct order data", () => {
      const validData = {
        email: "user@example.com",
        phone: "+1-234-567-8900",
        shipping_address: {
          first_name: "John",
          last_name: "Doe",
          address_1: "123 Main St",
          city: "New York",
          state: "NY",
          postal_code: "10001",
          country_code: "US",
        },
      }
      const result = CreateOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should validate with optional address_2", () => {
      const validData = {
        email: "user@example.com",
        phone: "+1234567890",
        shipping_address: {
          first_name: "John",
          last_name: "Doe",
          address_1: "123 Main St",
          address_2: "Apt 4B",
          city: "New York",
          state: "NY",
          postal_code: "10001",
          country_code: "US",
        },
      }
      const result = CreateOrderSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should reject invalid country code", () => {
      const invalidData = {
        email: "user@example.com",
        phone: "+1234567890",
        shipping_address: {
          first_name: "John",
          last_name: "Doe",
          address_1: "123 Main St",
          city: "New York",
          state: "NY",
          postal_code: "10001",
          country_code: "USA", // Should be 2 chars
        },
      }
      const result = CreateOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject missing required address fields", () => {
      const invalidData = {
        email: "user@example.com",
        phone: "+1234567890",
        shipping_address: {
          first_name: "John",
          // missing last_name
          address_1: "123 Main St",
          city: "New York",
          state: "NY",
          postal_code: "10001",
          country_code: "US",
        },
      }
      const result = CreateOrderSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe("ProductCreateSchema - Advanced", () => {
    it("should validate with all optional fields", () => {
      const data = {
        title: "Test Product",
        handle: "test-product",
        description: "A great product",
        sku: "SKU-12345",
        weight: 2.5,
        price: 99.99,
        currency_code: "USD",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
        images: [
          { url: "https://example.com/image1.jpg" },
          { url: "https://example.com/image2.jpg" },
        ],
      }
      const result = ProductCreateSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it("should validate handle format", () => {
      const validHandles = ["test-product", "product-123", "my-test-product-v2"]
      for (const handle of validHandles) {
        const data = {
          title: "Test",
          handle,
          price: 99.99,
          currency_code: "USD",
          category_id: "550e8400-e29b-41d4-a716-446655440000",
        }
        const result = ProductCreateSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })

    it("should reject invalid handle format", () => {
      const invalidHandles = ["Test Product", "test_product", "TEST-PRODUCT"]
      for (const handle of invalidHandles) {
        const data = {
          title: "Test",
          handle,
          price: 99.99,
          currency_code: "USD",
          category_id: "550e8400-e29b-41d4-a716-446655440000",
        }
        const result = ProductCreateSchema.safeParse(data)
        expect(result.success).toBe(false)
      }
    })

    it("should reject zero price", () => {
      const data = {
        title: "Test",
        handle: "test",
        price: 0,
        currency_code: "USD",
        category_id: "550e8400-e29b-41d4-a716-446655440000",
      }
      const result = ProductCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should validate currency code length", () => {
      const data = {
        title: "Test",
        handle: "test",
        price: 99.99,
        currency_code: "USDA", // 4 chars, should be 3
        category_id: "550e8400-e29b-41d4-a716-446655440000",
      }
      const result = ProductCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})
