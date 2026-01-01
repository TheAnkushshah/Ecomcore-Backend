import {
  ApiError,
  handleValidationError,
  handleApiError,
} from "../api-error"
import { ZodError, z } from "zod"

describe("API Error Advanced Tests", () => {
  describe("handleValidationError", () => {
    it("should format validation error response", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      })

      const result = schema.safeParse({ email: "invalid", age: 10 })

      if (!result.success) {
        const response = handleValidationError(result.error)
        expect(response.success).toBe(false)
        expect(response.error?.code).toBe("VALIDATION_ERROR")
        expect(response.error?.details).toBeDefined()
        expect(Array.isArray(response.error?.details)).toBe(true)
      }
    })

    it("should include error details", () => {
      const schema = z.object({
        name: z.string().min(3),
      })

      const result = schema.safeParse({ name: "ab" })

      if (!result.success) {
        const response = handleValidationError(result.error)
        expect(response.error?.details).toBeTruthy()
        expect(response.error?.details?.length).toBeGreaterThan(0)
        expect(response.error?.details?.[0]).toHaveProperty("path")
        expect(response.error?.details?.[0]).toHaveProperty("message")
      }
    })
  })

  describe("handleApiError", () => {
    it("should handle ZodError", () => {
      const schema = z.object({ test: z.string() })
      const result = schema.safeParse({})

      if (!result.success) {
        const { response, statusCode } = handleApiError(result.error)
        expect(response.success).toBe(false)
        expect(statusCode).toBe(400)
        expect(response.error?.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should handle ApiError", () => {
      const error = new ApiError("NOT_FOUND", 404, "Resource not found")
      const { response, statusCode } = handleApiError(error)

      expect(response.success).toBe(false)
      expect(statusCode).toBe(404)
      expect(response.error?.code).toBe("NOT_FOUND")
      expect(response.error?.message).toBe("Resource not found")
    })

    it("should handle generic Error", () => {
      const error = new Error("Something went wrong")
      const { response, statusCode } = handleApiError(error)

      expect(response.success).toBe(false)
      expect(statusCode).toBe(500)
      expect(response.error?.code).toBe("INTERNAL_SERVER_ERROR")
    })

    it("should handle unknown error types", () => {
      const { response, statusCode } = handleApiError("Unknown error string")

      expect(response.success).toBe(false)
      expect(statusCode).toBe(500)
      expect(response.error?.code).toBe("INTERNAL_SERVER_ERROR")
    })

    it("should include requestId when provided", () => {
      const error = new ApiError("UNAUTHORIZED", 401, "Invalid token")
      const { response } = handleApiError(error, "req-123")

      expect(response.requestId).toBe("req-123")
    })

    it("should return different status codes for different errors", () => {
      const unauthorizedError = new ApiError("UNAUTHORIZED", 401, "Not authorized")
      const forbiddenError = new ApiError("FORBIDDEN", 403, "Forbidden")
      const notFoundError = new ApiError("NOT_FOUND", 404, "Not found")

      const { statusCode: code1 } = handleApiError(unauthorizedError)
      const { statusCode: code2 } = handleApiError(forbiddenError)
      const { statusCode: code3 } = handleApiError(notFoundError)

      expect(code1).toBe(401)
      expect(code2).toBe(403)
      expect(code3).toBe(404)
    })
  })

  describe("ApiError with details", () => {
    it("should store additional error details", () => {
      const details = { field: "email", suggestion: "Check spelling" }
      const error = new ApiError(
        "VALIDATION_ERROR",
        400,
        "Invalid email",
        details
      )

      expect(error.details).toEqual(details)
    })

    it("should be an Error instance", () => {
      const error = new ApiError("TEST_ERROR", 400, "Test message")
      expect(error instanceof Error).toBe(true)
      expect(error.name).toBe("ApiError")
    })
  })
})
