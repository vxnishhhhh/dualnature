"use client"

import * as React from "react"
import SculptureHero from "@/components/ui/liquid-sculpture-hero"
import { drawCurrentArt, type ArtTheme } from "@/lib/current-art"

type Pt = { x: number; y: number }
type Art = { wide?: string; tall?: string; wideT?: Pt[]; tallT?: Pt[] }

function useTheme(): ArtTheme {
  const [t, setT] = React.useState<ArtTheme>("dark")
  React.useEffect(() => {
    const el = document.documentElement
    const read = () => setT(el.dataset.theme === "light" ? "light" : "dark")
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] })
    return () => mo.disconnect()
  }, [])
  return t
}

/** "Live Current": the Dual Nature mark as a liquid, electrical particle sculpture. */
export function LiveCurrent() {
  const theme = useTheme()
  const [art, setArt] = React.useState<Art | null>(null)
  const [near, setNear] = React.useState(false)
  const [portrait, setPortrait] = React.useState(false)
  const hostRef = React.useRef<HTMLDivElement>(null)
  const cache = React.useRef<Record<string, { url: string; t: Pt[] }>>({})

  // only draw the artwork when the section is approaching, and only the orientation in use
  React.useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const mq = window.matchMedia("(max-width: 639px)")
    const sync = () => setPortrait(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "120% 0px" })
    io.observe(el)
    return () => {
      io.disconnect()
      mq.removeEventListener("change", sync)
    }
  }, [])

  React.useEffect(() => {
    if (!near) return
    const key = `${theme}-${portrait ? "tall" : "wide"}`
    const run = () => {
      if (!cache.current[key]) {
        const d = drawCurrentArt(portrait, theme)
        cache.current[key] = { url: d.url, t: d.spec.orbs.map(({ x, y }) => ({ x, y })) }
      }
      const c = cache.current[key]
      setArt(portrait ? { tall: c.url, tallT: c.t } : { wide: c.url, wideT: c.t })
    }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void }
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 600 })
      return () => w.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(run, 30)
    return () => window.clearTimeout(id)
  }, [near, theme, portrait])

  return (
    <div ref={hostRef}>
    <SculptureHero
      id="current"
      className="live-current"
      src={art?.wide ?? art?.tall}
      mobileSrc={art?.tall ?? art?.wide}
      arcTargets={art?.wideT}
      mobileArcTargets={art?.tallT}
      arcColor={theme === "light" ? [0.2, 0.45, 0.95] : [0.72, 0.88, 1.0]}
      imageAlt="The Dual Nature mark — a wave of current flowing into three particles — rendered as an interactive particle sculpture"
      eyebrow="Introducing Dual Nature"
      headline={"Wave. Particle.\nCurrent."}
      headlineAccent="Current."
      body="A hybrid technology company powering Durban homes and businesses: certified solar, smart infrastructure and precision manufactured products — every system engineered for reliability and signed off with a full Certificate of Compliance."
      primaryCta={{ label: "Get a quote", href: "/#contact" }}
      secondaryCta={{ label: "See the installs", href: "/#work" }}
      hint="Move across the current"
      hintTouch="Touch the current"
      backdropText="CURRENT"
      topInset={84}
      radius={200}
      strength={1.05}
      turbulence={1.15}
      liquid={1.1}
      ambientIntensity={0.16}
      pulse={theme === "light" ? 0.7 : 1}
      sculptureScale={0.94}
      mobileSculptureScale={1}
    />
    </div>
  )
}
