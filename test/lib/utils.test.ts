import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("should handle tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2")
  })

  it("should handle undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar")
  })

  it("should handle array inputs", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz")
  })

  it("should return empty string for no inputs", () => {
    expect(cn()).toBe("")
  })
})
