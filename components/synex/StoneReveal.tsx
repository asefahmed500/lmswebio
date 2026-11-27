"use client"

interface StoneRevealProps {
  side: "left" | "right"
  baseSrc: string
  grassSrc: string
  height: number
  zBase?: number
  // Kept for API compatibility; stacking now uses plain CSS layers.
  zGrass?: number
}

/**
 * A quiet, static two-layer reveal. The overlay is shown on hover with no
 * spring, mask motion or mount animation.
 */
export const StoneReveal = ({
  side,
  baseSrc,
  grassSrc,
  height,
}: StoneRevealProps) => {
  const position = side === "left" ? "left bottom" : "right bottom"

  return (
    <div
      className="group absolute bottom-0 w-fit"
      style={{
        left: side === "left" ? 0 : undefined,
        right: side === "right" ? 0 : undefined,
        height: `${height}px`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={baseSrc}
        alt=""
        className="size-full object-contain"
        style={{ objectPosition: position }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={grassSrc}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-contain opacity-0 group-hover:opacity-100"
        style={{ objectPosition: position }}
      />
    </div>
  )
}
