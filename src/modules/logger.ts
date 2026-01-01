/**
 * Structured Logging
 * Winston logger for production-grade logging
 */

import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"

const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
}

const colors = {
  fatal: "red",
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
  trace: "gray",
}

winston.addColors(colors)

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
)

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(
    ({ timestamp, level, message, ...metadata }) =>
      `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ""}`
  )
)

const transports: winston.transport[] = []

// Console transport
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production" ? logFormat : devFormat,
  })
)

// File transports for production
if (process.env.NODE_ENV === "production") {
  // Error log file
  transports.push(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxDays: "14d",
      level: "error",
      format: logFormat,
    })
  )

  // Combined log file
  transports.push(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxDays: "7d",
      format: logFormat,
    })
  )

  // Application log file
  transports.push(
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxDays: "7d",
      level: "info",
      format: logFormat,
    })
  )
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  format: logFormat,
  defaultMeta: { service: "ecomcore-backend" },
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
})

/**
 * Structured logging methods
 */
export const log = {
  fatal: (message: string, meta?: Record<string, any>) =>
    logger.log("fatal", message, meta),
  error: (message: string, error?: Error | string, meta?: Record<string, any>) => {
    const errorMeta = error instanceof Error ? { error: error.stack } : { error }
    logger.error(message, { ...errorMeta, ...meta })
  },
  warn: (message: string, meta?: Record<string, any>) =>
    logger.warn(message, meta),
  info: (message: string, meta?: Record<string, any>) =>
    logger.info(message, meta),
  debug: (message: string, meta?: Record<string, any>) =>
    logger.debug(message, meta),
  trace: (message: string, meta?: Record<string, any>) =>
    logger.log("trace", message, meta),
}

/**
 * API request/response logging
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
): void {
  logger.info("HTTP Request", {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId: userId || "anonymous",
  })
}

/**
 * Database query logging
 */
export function logDatabaseQuery(
  query: string,
  duration: number,
  params?: Record<string, any>
): void {
  logger.debug("Database Query", {
    query,
    duration: `${duration}ms`,
    params,
  })
}

/**
 * Business event logging
 */
export function logBusinessEvent(
  event: string,
  data: Record<string, any>
): void {
  logger.info(`Business Event: ${event}`, data)
}
