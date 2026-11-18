"use client"

import { useEffect } from "react"
import Lenis from "lenis"

declare global {
  interface Window { __lenis?: Lenis }
}

/** Weighted smooth scrolling for mouse and trackpad only. Touch and reduced motion keep native scrolling. */
export function SmoothScroll() {
  useEffect(() => {
    const fine = matchMedia("(hover:hover) and (pointer:fine)").matches
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduced) return
    const lenis = new Lenis({
      lerp: 0.11,
      wheelMultiplier: 0.95,
      autoRaf: true,
      anchors: { offset: -84 },
      prevent: (node) => !!node.closest?.(".lb, .menu, [data-lenis-prevent]"),
    })
    window.__lenis = lenis
    return () => {
      lenis.destroy()
      if (window.__lenis === lenis) delete window.__lenis
    }
  }, [])
  return null
}
