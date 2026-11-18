"use client"

import { useEffect, useRef } from "react"
import { createHeroScene } from "@/lib/hero-scene"

export function HeroScene() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const handle = createHeroScene(ref.current)
    if (!handle) return
    window.DNScene = handle
    return () => {
      handle.dispose()
      if (window.DNScene === handle) delete window.DNScene
    }
  }, [])
  return <canvas id="scene" ref={ref} aria-hidden />
}
