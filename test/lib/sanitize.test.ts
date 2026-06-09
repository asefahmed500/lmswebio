import { describe, it, expect } from "vitest"
import { sanitizeText, stripHtml, sanitizeUrl } from "@/lib/sanitize"

describe("sanitize utilities", () => {
  describe("sanitizeText", () => {
    it("should allow safe formatting tags like p and strong", () => {
      const result = sanitizeText("<p>Hello</p>")
      expect(result).toBe("<p>Hello</p>")
    })

    it("should strip scripts", () => {
      const result = sanitizeText('<script>alert("xss")</script>Hello')
      expect(result).not.toContain("script")
      expect(result).toBe("Hello")
    })

    it("should handle plain text", () => {
      expect(sanitizeText("Hello, world!")).toBe("Hello, world!")
    })

    it("should handle empty string", () => {
      expect(sanitizeText("")).toBe("")
    })
  })

  describe("stripHtml", () => {
    it("should strip all HTML tags", () => {
      expect(stripHtml("<div><p>Hello <b>world</b></p></div>")).toBe(
        "Hello world"
      )
    })

    it("should return plain text unchanged", () => {
      expect(stripHtml("Just text")).toBe("Just text")
    })
  })

  describe("sanitizeUrl", () => {
    it("should allow https URLs", () => {
      const result = sanitizeUrl("https://example.com")
      expect(result).toMatch(/^https:\/\/example\.com/)
    })

    it("should block javascript URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("")
    })

    it("should reject relative URLs", () => {
      expect(sanitizeUrl("/path/to/page")).toBe("")
    })
  })
})
