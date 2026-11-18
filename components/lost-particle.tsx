"use client"

import { useEffect, useRef } from "react"

/** A quiet wave of particles; one amber particle has wandered off the line. */
export function LostParticle() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    let raf = 0, w = 0, h = 0, dpr = 1
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2)
      w = c.clientWidth; h = c.clientHeight
      c.width = w * dpr; c.height = h * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const N = 90
    const draw = (t: number) => {
      const s = reduced ? 0 : t * 0.001
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const light = document.documentElement.dataset.theme === "light"
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1)
        const x = w * (0.08 + u * 0.84)
        const y = h * 0.34 + Math.sin(u * Math.PI * 3 + s * 1.4) * h * 0.12 * Math.sin(u * Math.PI)
        const hue = u < 0.52 ? [51 + (125 - 51) * (u / 0.52), 160 + (108 - 160) * (u / 0.52), 255 + (240 - 255) * (u / 0.52)] : [125 + (255 - 125) * ((u - 0.52) / 0.48), 108 + (126 - 108) * ((u - 0.52) / 0.48), 240 + (34 - 240) * ((u - 0.52) / 0.48)]
        ctx.fillStyle = `rgba(${hue.map(Math.round).join(",")},${light ? 0.75 : 0.85})`
        ctx.beginPath()
        ctx.arc(x, y, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      // the lost one drifts on its own orbit, well away from the wave
      const lx = w * (0.72 + Math.sin(s * 0.45) * 0.06), ly = h * (0.13 + Math.cos(s * 0.6) * 0.05)
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 22)
      g.addColorStop(0, "rgba(255,126,34,.9)")
      g.addColorStop(0.3, "rgba(255,126,34,.35)")
      g.addColorStop(1, "rgba(255,126,34,0)")
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(lx, ly, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#FF7E22"
      ctx.beginPath()
      ctx.arc(lx, ly, 5, 0, Math.PI * 2)
      ctx.fill()
      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])
  return <canvas ref={ref} className="lost-canvas" aria-hidden="true" />
}
