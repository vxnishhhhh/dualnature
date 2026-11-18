"use client"

import { useEffect, useRef } from "react"
import type { SceneHandle } from "@/lib/hero-scene"

/** Without WebGL: the same wave, drawn once as a field of dots in brand colours. */
function drawStaticWave(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")
  if (!ctx) return
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const w = c.clientWidth, h = c.clientHeight
  c.width = w * dpr
  c.height = h * dpr
  ctx.scale(dpr, dpr)
  const portrait = w < h
  for (let r = 0; r < 26; r++) {
    for (let i = 0; i <= 120; i++) {
      const u = i / 120, v = r / 25
      const x = (portrait ? -0.1 : 0.15) * w + u * w * (portrait ? 1.2 : 0.95)
      const base = (portrait ? 0.3 : 0.58) * h + v * h * 0.22
      const y = base + Math.sin(u * 6.2 + v * 1.4) * h * 0.06 * (1 - v * 0.4)
      const col = u < 0.52 ? `rgba(51,160,255,${0.25 + v * 0.35})` : `rgba(255,126,34,${0.2 + v * 0.35})`
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1.6, 1.6)
    }
  }
}

/** The hero's WebGL wave. three.js is loaded after first paint so the headline is the LCP. */
export function HeroScene() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let handle: SceneHandle | null = null
    let cancelled = false
    const start = () =>
      import("@/lib/hero-scene").then(({ createHeroScene }) => {
        if (cancelled || !ref.current) return
        handle = createHeroScene(ref.current)
        if (!handle) {
          ref.current.dataset.fallback = "1"
          drawStaticWave(ref.current)
          return
        }
        window.DNScene = handle
        window.dispatchEvent(new Event("scroll"))
      })
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    const idle = () => (w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300))
    if (document.readyState === "complete") idle()
    else window.addEventListener("load", idle, { once: true })
    return () => {
      cancelled = true
      handle?.dispose()
      if (handle && window.DNScene === handle) delete window.DNScene
    }
  }, [])
  return <canvas id="scene" ref={ref} aria-hidden />
}
