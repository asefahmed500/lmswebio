import sanitizeHtmlLib from "sanitize-html"

const SAFE_HTML_CONFIG: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "ul",
    "ol",
    "li",
    "a",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "blockquote",
    "pre",
    "code",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["class"],
  },
  allowVulnerableTags: false,
}

const STRICT_TEXT_CONFIG: sanitizeHtmlLib.IOptions = {
  allowedTags: ["p", "br", "strong", "em"],
  allowedAttributes: {},
  allowVulnerableTags: false,
}

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe formatting tags but strips scripts, event handlers, and dangerous elements.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ""
  return sanitizeHtmlLib(dirty, SAFE_HTML_CONFIG)
}

/**
 * Sanitize content for strict text-only output (minimal formatting allowed).
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return ""
  return sanitizeHtmlLib(dirty, STRICT_TEXT_CONFIG)
}

/**
 * Strip all HTML tags, returning plain text only.
 */
export function stripHtml(html: string): string {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").trim()
}

/**
 * Sanitize a URL to prevent javascript: and other dangerous protocols.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ""
  try {
    const parsed = new URL(url)
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return ""
    }
    return parsed.href
  } catch {
    return ""
  }
}

/**
 * Sanitize user-generated content with options.
 */
export function sanitizeUserContent(
  content: string,
  options: { allowHtml?: boolean; strict?: boolean } = {}
): string {
  if (!content) return ""

  const { allowHtml = true, strict = false } = options

  if (strict) {
    return sanitizeText(content)
  }

  if (allowHtml) {
    return sanitizeHtml(content)
  }

  return stripHtml(content)
}
