declare module "@blossom-carousel/react" {
  import * as React from "react"

  interface BlossomCarouselProps extends React.HTMLAttributes<HTMLElement> {
    as?: keyof JSX.IntrinsicElements
    ref?: React.Ref<HTMLElement>
    onOverscroll?: (event: CustomEvent<{ left: number }>) => void
  }

  export const BlossomCarousel: React.FC<BlossomCarouselProps>
}
