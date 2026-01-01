/**
 * Error Handling & Response Utilities
 * Standardized API response formatting and error handling
 */

import { captureException, addBreadcrumb } from "./sentry-config"
import { log } from "./logger"
import { ZodError } from "zod"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  requestId?: string
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number = 400,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = "ApiError"
  }
}

/**
 * Format successful response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId,
  }
}

/**
 * Format error response
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    requestId,
  }
}

/**
 * Handle Zod validation errors
 */
export function handleValidationError(error: ZodError): ApiResponse {
  const details = error.errors.map((err) => ({
    path: err.path.join("."),
    message: err.message,
    code: err.code,
  }))

  return errorResponse(
    "VALIDATION_ERROR",
    "Request validation failed",
    400,
    details
  )
}

/**
 * Handle API errors
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): { response: ApiResponse; statusCode: number } {
  // Zod validation error
  if (error instanceof ZodError) {
    return {
      response: handleValidationError(error),
      statusCode: 400,
    }
  }

  // Custom API error
  if (error instanceof ApiError) {
    log.error(error.message, error)
    addBreadcrumb(error.message, "api_error", "error", {
      code: error.code,
      statusCode: error.statusCode,
    })

    return {
      response: errorResponse(
        error.code,
        error.message,
        error.statusCode,
        error.details,
        requestId
      ),
      statusCode: error.statusCode,
    }
  }

  // Generic error
  if (error instanceof Error) {
    const eventId = captureException(error, { requestId })
    log.error("Unhandled error", error)

    return {
      response: errorResponse(
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred",
        500,
        { eventId },
        requestId
      ),
      statusCode: 500,
    }
  }

  // Unknown error
  return {
    response: errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred",
      500,
      {},
      requestId
    ),
    statusCode: 500,
  }
}

/**
 * Predefined error codes
 */
export const ErrorCodes = {
  // Authentication
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",

  // Authorization
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS",

  // Business logic
  INVALID_STATE: "INVALID_STATE",
  OPERATION_FAILED: "OPERATION_FAILED",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Server errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
}

/**
 * Predefined HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

/**
 * Common API errors
 */
export const CommonErrors = {
  unauthorized: () =>
    new ApiError(
      ErrorCodes.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      "Authentication required"
    ),
  forbidden: () =>
    new ApiError(
      ErrorCodes.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      "You do not have permission to access this resource"
    ),
  notFound: (resource: string) =>
    new ApiError(
      ErrorCodes.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      `${resource} not found`
    ),
  invalidInput: (message: string) =>
    new ApiError(
      ErrorCodes.INVALID_INPUT,
      HttpStatus.BAD_REQUEST,
      message
    ),
  rateLimited: () =>
    new ApiError(
      ErrorCodes.RATE_LIMITED,
      HttpStatus.RATE_LIMITED,
      "Too many requests, please try again later"
    ),
  internalError: () =>
    new ApiError(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      "An internal server error occurred"
    ),
}
