/**
 * Input Validation Schemas
 * Zod schemas for request validation
 */

import { z } from "zod"

// ============ Authentication Schemas ============

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const RegisterRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(2, "First name required"),
  last_name: z.string().min(2, "Last name required"),
})

export const OTPRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
    message: "Invalid phone format",
  }),
})

export const OTPVerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
})

// ============ Product Schemas ============

export const ProductCreateSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional(),
  handle: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Invalid handle format"),
  sku: z.string().min(1).max(100).optional(),
  weight: z.number().positive().optional(),
  price: z.number().positive("Price must be positive"),
  currency_code: z.string().length(3, "Currency code must be 3 characters"),
  category_id: z.string().uuid("Invalid category ID"),
  images: z.array(z.object({ url: z.string().url() })).optional(),
})

export const ProductUpdateSchema = ProductCreateSchema.partial()

// ============ Cart Schemas ============

export const AddToCartSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be positive"),
  variant_id: z.string().uuid().optional(),
})

export const UpdateCartSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
})

// ============ Order Schemas ============

export const CreateOrderSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone format"),
  shipping_address: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    address_1: z.string().min(1),
    address_2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country_code: z.string().length(2, "Country code must be 2 characters"),
  }),
  billing_address: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    address_1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country_code: z.string().length(2),
  }).optional(),
})

// ============ Review Schemas ============

export const CreateReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
})

// ============ Customer Schemas ============

export const UpdateCustomerSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone").optional(),
})

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

// ============ Admin Schemas ============

export const CreateUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]),
})

export const UpdateUserSchema = CreateUserSchema.partial()

export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  permissions: z.array(z.string()),
})

// ============ File Upload Schemas ============

export const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^[a-z]+\/[a-z0-9\-+.]+$/i, "Invalid MIME type"),
  size: z.number().positive().max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
})

// ============ Pagination Schemas ============

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
})

// ============ Type Exports ============

export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type OTPRequest = z.infer<typeof OTPRequestSchema>
export type OTPVerify = z.infer<typeof OTPVerifySchema>
export type ProductCreate = z.infer<typeof ProductCreateSchema>
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>
export type AddToCart = z.infer<typeof AddToCartSchema>
export type CreateOrder = z.infer<typeof CreateOrderSchema>
export type CreateReview = z.infer<typeof CreateReviewSchema>
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>
export type ChangePassword = z.infer<typeof ChangePasswordSchema>
export type Pagination = z.infer<typeof PaginationSchema>

/**
 * Validation middleware helper
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Safe validation with error details
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}
