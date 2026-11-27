/**
 * Quiz answer normalisation.
 *
 * Quiz questions store `options` and `correctAnswer` as Prisma JSON. Older
 * seed data used array options (`["A", "B"]`) and `{ correct: 0 }` answer
 * objects, while the quiz builder and player use a keyed option map
 * (`{ A: "A", B: "B" }`) with a string or string[] answer. Normalising on read
 * keeps both formats usable and makes grading deterministic.
 */

export type NormalisedOptions = Record<string, string> | null

export function normaliseOptions(raw: unknown): NormalisedOptions {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    return Object.fromEntries(
      raw.map((value, index) => [String(index), String(value)])
    )
  }

  if (typeof raw === "object") {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
        key,
        String(value),
      ])
    )
  }

  return null
}

export function normaliseCorrectAnswer(raw: unknown): string | string[] | null {
  if (raw == null) return null
  if (typeof raw === "string") return raw
  if (Array.isArray(raw)) return raw.map((value) => String(value))

  if (typeof raw === "object") {
    const candidate = (raw as Record<string, unknown>).correct
    if (Array.isArray(candidate)) return candidate.map((value) => String(value))
    if (candidate != null) return String(candidate)
  }

  return null
}

/** Grade one answer. Returns null when the question needs manual grading. */
export function gradeAnswer(
  type: string,
  correctAnswer: unknown,
  userAnswer: string | string[] | undefined
): number | null {
  const correct = normaliseCorrectAnswer(correctAnswer)
  if (correct == null || userAnswer == null || userAnswer === "") return 0

  switch (type) {
    case "MC_SINGLE":
    case "TRUE_FALSE":
      return userAnswer === correct ? 1 : 0

    case "MC_MULTI": {
      const expected = Array.isArray(correct) ? correct : [correct]
      const given = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      if (expected.length === 0) return 0
      const matched = given.filter((answer) => expected.includes(answer)).length
      const wrong = given.length - matched
      // Pro-rata credit, with a penalty for every incorrect selection so a
      // student cannot score by ticking every option.
      return Math.max(0, (matched - wrong) / expected.length)
    }

    case "TEXT":
      // Essay/text answers cannot be auto-graded.
      return null

    default:
      return 0
  }
}
