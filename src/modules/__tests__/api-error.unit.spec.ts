import { ApiError, ApiResponse, errorResponse, successResponse } from "../api-error"

describe("API Error Handling", () => {
  describe("ApiError", () => {
    it("should create error with code and message", () => {
      const error = new ApiError("UNAUTHORIZED", 401, "Invalid credentials")
      expect(error.code).toBe("UNAUTHORIZED")
      expect(error.message).toBe("Invalid credentials")
      expect(error.statusCode).toBe(401)
    })

    it("should have UNAUTHORIZED status code 401", () => {
      const error = new ApiError("UNAUTHORIZED", 401, "Not authorized")
      expect(error.statusCode).toBe(401)
    })

    it("should have VALIDATION_ERROR status code 400", () => {
      const error = new ApiError("VALIDATION_ERROR", 400, "Invalid input")
      expect(error.statusCode).toBe(400)
    })

    it("should have INTERNAL_SERVER_ERROR status code 500", () => {
      const error = new ApiError("INTERNAL_SERVER_ERROR", 500, "Server error")
      expect(error.statusCode).toBe(500)
    })
  })

  describe("successResponse", () => {
    it("should return success response with data", () => {
      const data = { id: "1", name: "Test" }
      const response = successResponse(data)
      
      expect(response.success).toBe(true)
      expect(response.data).toEqual(data)
      expect(response.timestamp).toBeDefined()
    })

    it("should include timestamp and no error", () => {
      const response = successResponse({ test: true })
      expect(response.success).toBe(true)
      expect(response.error).toBeUndefined()
      expect(response.timestamp).toBeDefined()
    })
  })

  describe("errorResponse", () => {
    it("should return error response with error details", () => {
      const response = errorResponse("VALIDATION_ERROR", "Invalid email", 400)
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.timestamp).toBeDefined()
    })

    it("should include error code and message", () => {
      const response = errorResponse("NOT_FOUND", "Resource not found", 404)
      
      expect(response.error?.code).toBe("NOT_FOUND")
      expect(response.error?.message).toBe("Resource not found")
    })
  })
})
