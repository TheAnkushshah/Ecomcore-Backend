/**
 * Error Tracking & Monitoring
 * Sentry integration for production error tracking
 */

import * as Sentry from "@sentry/node"
import { ProfilingIntegration } from "@sentry/profiling-node"

export function initializeSentry(): void {
  if (!process.env.SENTRY_DSN) {
    console.warn("Sentry DSN not configured - error tracking disabled")
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    beforeSend(event, hint) {
      // Filter out certain errors in development
      if (process.env.NODE_ENV === "development") {
        if (event.exception) {
          const error = hint.originalException
          if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
            return null
          }
        }
      }
      return event
    },
    ignoreErrors: [
      // Ignore certain common errors
      "NetworkError",
      "timeout of",
      "Network request failed",
      "ECONNREFUSED",
    ],
  })
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context: Record<string, any> = {}
): string {
  Sentry.captureException(error, {
    extra: context,
  })

  return Sentry.lastEventId() || "unknown"
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
): void {
  Sentry.captureMessage(message, level)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  data: Record<string, any> = {}
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  })
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, username?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null)
}

/**
 * Sentry middleware for Express
 */
export function getSentryMiddleware() {
  return {
    requestHandler: Sentry.Handlers.requestHandler(),
    errorHandler: Sentry.Handlers.errorHandler(),
  }
}
