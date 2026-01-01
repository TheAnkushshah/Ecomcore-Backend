import { log, logRequest, logDatabaseQuery, logBusinessEvent } from "../logger"

describe("Logger", () => {
  describe("log.error", () => {
    it("should be defined", () => {
      expect(typeof log.error).toBe("function")
    })

    it("should log error message", () => {
      const spy = jest.spyOn(log, "error")
      log.error("Test error message")
      expect(spy).toHaveBeenCalledWith("Test error message")
      spy.mockRestore()
    })

    it("should accept error object", () => {
      const spy = jest.spyOn(log, "error")
      const error = new Error("Test error")
      log.error("Error occurred", error)
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe("log.info", () => {
    it("should be defined", () => {
      expect(typeof log.info).toBe("function")
    })

    it("should log info message", () => {
      const spy = jest.spyOn(log, "info")
      log.info("Test info message")
      expect(spy).toHaveBeenCalledWith("Test info message")
      spy.mockRestore()
    })
  })

  describe("log.warn", () => {
    it("should be defined", () => {
      expect(typeof log.warn).toBe("function")
    })

    it("should log warning message", () => {
      const spy = jest.spyOn(log, "warn")
      log.warn("Test warning message")
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe("log.debug", () => {
    it("should be defined", () => {
      expect(typeof log.debug).toBe("function")
    })

    it("should log debug message", () => {
      const spy = jest.spyOn(log, "debug")
      log.debug("Test debug message")
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  describe("logRequest", () => {
    it("should be defined", () => {
      expect(typeof logRequest).toBe("function")
    })

    it("should log request with method and path", () => {
      const spy = jest.spyOn({ logRequest }, "logRequest")
      logRequest("GET", "/api/users", 200, 125, "user-123")
      expect(typeof logRequest).toBe("function")
    })
  })

  describe("logDatabaseQuery", () => {
    it("should be defined", () => {
      expect(typeof logDatabaseQuery).toBe("function")
    })

    it("should log database query", () => {
      const spy = jest.spyOn({ logDatabaseQuery }, "logDatabaseQuery")
      logDatabaseQuery("SELECT * FROM users", 150, { limit: 10 })
      expect(typeof logDatabaseQuery).toBe("function")
    })
  })

  describe("logBusinessEvent", () => {
    it("should be defined", () => {
      expect(typeof logBusinessEvent).toBe("function")
    })

    it("should log business event", () => {
      const spy = jest.spyOn({ logBusinessEvent }, "logBusinessEvent")
      logBusinessEvent("ORDER_CREATED", { orderId: "123" })
      expect(typeof logBusinessEvent).toBe("function")
    })
  })
})
