/*
 * Live Current artwork: the Dual Nature mark (a sine-wave filament flowing into three orbs),
 * drawn in code on a transparent canvas with fine circuit-trace detail. The particle engine
 * samples this image by alpha, so every glowing pixel becomes material.
 */

export type ArtTheme = "dark" | "light"

/** Logo geometry, in the mark's own 100-unit box. */
const WAVE_X0 = 15.4
const WAVE_X1 = 54.4
const WAVE_AMP = 11.5
const WAVE_LEN = 26
export const ORBS = [
  { x: 62.9, r: 4.3, a: 1 },
  { x: 73.9, r: 3.4, a: 0.86 },
  { x: 83.4, r: 2.6, a: 0.7 },
]

/** Where the orbs sit inside the generated image, as fractions of its width/height. */
export type ArtSpec = { w: number; h: number; orbs: { x: number; y: number; r: number }[]; aspect: number }

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function drawCurrentArt(portrait: boolean, theme: ArtTheme): { url: string; spec: ArtSpec } {
  const W = portrait ? 1000 : 2000
  const H = portrait ? 1200 : 760
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const g = c.getContext("2d")!
  const light = theme === "light"

  // map the mark's 100-unit box into the canvas
  const span = portrait ? [10, 90] : [11, 89]
  const U = (W * (portrait ? 0.94 : 0.92)) / (span[1] - span[0])
  const ox = (W - (span[1] - span[0]) * U) / 2 - span[0] * U
  const cy = portrait ? H * 0.47 : H * 0.5
  const X = (u: number) => ox + u * U
  const waveY = (u: number) => cy - WAVE_AMP * U * Math.sin(((u - WAVE_X0) / WAVE_LEN) * Math.PI * 2)

  const blue = "#33A0FF", violet = "#7D6CF0", amber = "#FF7E22"
  const rand = rng(portrait ? 17 : 7)

  /* circuit traces: right-angled runs with pads and vias, drawn first so the mark sits on top */
  g.lineCap = "round"
  g.lineJoin = "round"
  const trace = (pts: [number, number][], col: string, a: number, w = 2) => {
    g.globalAlpha = a
    g.strokeStyle = col
    g.lineWidth = w
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.stroke()
    const [ex, ey] = pts[pts.length - 1]
    g.lineWidth = w
    g.beginPath()
    g.arc(ex, ey, w * 3.2, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = col
    g.beginPath()
    g.arc(ex, ey, w * 1.2, 0, Math.PI * 2)
    g.fill()
    g.globalAlpha = 1
  }
  const traceCol = (i: number) => (i % 3 === 0 ? violet : i % 3 === 1 ? blue : amber)
  const traceA = light ? 0.75 : 0.55
  const n = portrait ? 14 : 18
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    // traces leave the filament / orbs and run toward the edges in steps
    const u = WAVE_X0 + t * (ORBS[2].x - WAVE_X0)
    const sx = X(u)
    const sy = u <= WAVE_X1 ? waveY(u) : cy
    const dir = i % 2 ? 1 : -1
    const step1 = (0.12 + rand() * 0.18) * H * dir
    const jog = (rand() - 0.5) * U * 9
    const endY = dir > 0 ? H * (0.9 + rand() * 0.07) : H * (0.03 + rand() * 0.07)
    trace([[sx, sy + dir * U * 3], [sx, sy + step1], [sx + jog, sy + step1 + Math.abs(jog) * dir], [sx + jog, endY]], traceCol(i), traceA, portrait ? 2.2 : 2.4)
  }
  // bus lines out of each end
  trace([[X(WAVE_X0) - U * 2, cy], [X(span[0]) + U, cy], [X(span[0]) + U, cy + U * 8]], blue, traceA, 3)
  trace([[X(ORBS[2].x + ORBS[2].r + 1.5), cy], [X(span[1]) - U, cy], [X(span[1]) - U, cy - U * 8]], amber, traceA, 3)

  /* the filament: a twisted cable of strands following the logo's sine wave */
  const grad = g.createLinearGradient(X(WAVE_X0), 0, X(WAVE_X1), 0)
  grad.addColorStop(0, blue)
  grad.addColorStop(0.55, violet)
  grad.addColorStop(1, light ? "#E8620B" : amber)
  const strands = 9
  const thick = 3.4 * U
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 0 && !light) {
      g.shadowColor = "rgba(51,160,255,.55)"
      g.shadowBlur = U * 2.4
    } else g.shadowBlur = 0
    for (let k = 0; k < strands; k++) {
      const off = (k / (strands - 1) - 0.5) * thick
      const ph = k * 0.7
      g.strokeStyle = grad
      g.globalAlpha = pass === 0 ? 0.5 : 0.95
      g.lineWidth = pass === 0 ? U * 0.55 : U * 0.32
      g.beginPath()
      for (let u = WAVE_X0; u <= WAVE_X1 + 0.001; u += 0.08) {
        // twist: each strand weaves across the cable
        const tw = Math.cos(u * 0.9 + ph) * 0.5 + 0.5
        const y = waveY(u) + off * (0.45 + tw * 0.55)
        u === WAVE_X0 ? g.moveTo(X(u), y) : g.lineTo(X(u), y)
      }
      g.stroke()
    }
  }
  g.globalAlpha = 1
  g.shadowBlur = 0
  // bright core
  g.strokeStyle = light ? "rgba(23,60,140,.9)" : "rgba(235,245,255,.95)"
  g.lineWidth = U * 0.42
  g.beginPath()
  for (let u = WAVE_X0; u <= WAVE_X1 + 0.001; u += 0.08) {
    u === WAVE_X0 ? g.moveTo(X(u), waveY(u)) : g.lineTo(X(u), waveY(u))
  }
  g.stroke()
  // winding ticks across the cable, like a coil
  g.strokeStyle = light ? "rgba(10,14,23,.35)" : "rgba(236,241,251,.35)"
  g.lineWidth = Math.max(1.5, U * 0.08)
  for (let u = WAVE_X0 + 0.6; u < WAVE_X1 - 0.4; u += 1.15) {
    const y = waveY(u)
    const s = (waveY(u + 0.05) - waveY(u - 0.05)) / (X(u + 0.05) - X(u - 0.05))
    const nx = -s / Math.hypot(1, s), ny = 1 / Math.hypot(1, s)
    g.beginPath()
    g.moveTo(X(u) - nx * thick * 0.55, y - ny * thick * 0.55)
    g.lineTo(X(u) + nx * thick * 0.55, y + ny * thick * 0.55)
    g.stroke()
  }

  /* the three particles: shaded spheres with an orbit ring each */
  const orbs: ArtSpec["orbs"] = []
  for (const o of ORBS) {
    const x = X(o.x), r = o.r * U
    g.globalAlpha = o.a * (light ? 0.7 : 0.5)
    g.strokeStyle = amber
    g.lineWidth = Math.max(1.5, U * 0.1)
    g.beginPath()
    g.ellipse(x, cy, r * 1.75, r * 0.55, -0.35, 0, Math.PI * 2)
    g.stroke()
    g.globalAlpha = o.a
    if (!light) {
      g.shadowColor = "rgba(255,126,34,.6)"
      g.shadowBlur = r * 0.8
    }
    const rg = g.createRadialGradient(x - r * 0.35, cy - r * 0.4, r * 0.08, x, cy, r)
    rg.addColorStop(0, light ? "#FFB27A" : "#FFE2C6")
    rg.addColorStop(0.35, amber)
    rg.addColorStop(1, light ? "#9A3A06" : "#A8430A")
    g.fillStyle = rg
    g.beginPath()
    g.arc(x, cy, r, 0, Math.PI * 2)
    g.fill()
    g.shadowBlur = 0
    g.globalAlpha = 1
    orbs.push({ x: x / W, y: cy / H, r: r / W })
  }

  /* portrait gets the outer ring of the logo */
  if (portrait) {
    const rr = H * 0.4
    const ring = g.createLinearGradient(W / 2 - rr, 0, W / 2 + rr, 0)
    ring.addColorStop(0, blue)
    ring.addColorStop(1, amber)
    g.strokeStyle = ring
    g.globalAlpha = light ? 0.6 : 0.45
    g.lineWidth = U * 0.45
    g.beginPath()
    g.arc(W / 2, cy, Math.min(rr, W * 0.48), 0, Math.PI * 2)
    g.stroke()
    g.globalAlpha = 1
  }

  return { url: c.toDataURL("image/png"), spec: { w: W, h: H, orbs, aspect: W / H } }
}
