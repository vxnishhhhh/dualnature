"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion"
import { useReducedMotionSafe } from "@/lib/use-reduced-motion"

const STOPS = [
  { k: "01 · Generation", t: "Rooftop array", d: "Panels sized from a load audit — from single-home hybrids to the flagship's 12 × 630 W array.", img: "residential-rooftop.jpg", alt: "Residential rooftop solar array seen from above" },
  { k: "02 · Protection", t: "AC + DC combiner boxes", d: "Strings are combined, wired and protected before they ever reach the inverter.", img: "combiner-boxes.jpg", alt: "DC and AC combiner boxes wired and protected" },
  { k: "03 · Conversion", t: "Hybrid inverter", d: "Hybrid inverters, from single-phase homes to a 12 kW Deye 3-phase commercial system.", img: "hybrid-volta-storage.jpg", alt: "Hybrid inverter with dual VOLTA lithium battery storage" },
  { k: "04 · Storage", t: "Lithium storage", d: "VOLTA and stacked lithium batteries carry critical loads straight through outages.", img: "deye-battery-stack.jpg", alt: "Deye inverter above a four-battery stacked lithium tower" },
  { k: "05 · Distribution", t: "Distribution board", d: "Surge protection and RCDs at the board keep every circuit in the property safe.", img: "distribution-board.jpg", alt: "Distribution board with surge protection and RCDs" },
  { k: "06 · Sign-off", t: "Your home or business", d: "Final safety testing and a full Certificate of Compliance — on 100% of our installs.", img: "flagship-logistics-rooftop.jpg", alt: "Commercial rooftop array over a logistics yard" },
]

/** Scroll-driven energy path: panels → combiners → inverter → storage → board → property. */
export function InstallAnatomy() {
  const ref = React.useRef<HTMLElement>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const reduce = useReducedMotionSafe()
  const [active, setActive] = React.useState(0)
  const n = STOPS.length

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (window.matchMedia("(max-width:760px)").matches) return
    setActive(Math.min(n - 1, Math.max(0, Math.floor(v * n * 0.999))))
  })
  const fill = useTransform(scrollYProgress, [0, 0.96], [0, 1])
  const dotLeft = useTransform(fill, (v) => `${v * 100}%`)

  // phones: a vertical stepper whose line fills as you read
  const { scrollYProgress: listP } = useScroll({ target: listRef, offset: ["start 70%", "end 60%"] })
  const vFill = useTransform(listP, [0, 1], [0, 1])
  React.useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>("[data-stop]")
    if (!items) return
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("on")),
      { rootMargin: "0px 0px -35% 0px" }
    )
    items.forEach((i) => io.observe(i))
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className="anatomy" id="anatomy" aria-labelledby="anatomy-title">
      <div className="anatomy-pin">
        <div className="wrap anatomy-grid">
          <div className="anatomy-copy">
            <p className="kicker"><span className="sq" />Anatomy of an install</p>
            <h2 className="h2" id="anatomy-title">Follow the current, from roof to switchboard.</h2>
            <p className="lead">Every Dual Nature solar install is engineered as one system — generation, protection, conversion, storage and distribution — and signed off with a Certificate of Compliance.</p>
            <div className="anatomy-now" aria-live="polite">
              <span className="mono amber">{STOPS[active].k}</span>
              <h3>{STOPS[active].t}</h3>
              <p>{STOPS[active].d}</p>
            </div>
          </div>
          <div className="anatomy-photos" aria-hidden="true">
            {STOPS.map((s, i) => (
              <div key={s.img} className="anatomy-photo" data-on={i === active}>
                <Image src={`/img/${s.img}`} alt="" fill sizes="(max-width:1080px) 90vw, 46vw" className="object-cover" />
              </div>
            ))}
            <span className="anatomy-count mono">{String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
          </div>
        </div>
        <div className="wrap anatomy-track" aria-hidden="true">
          <div className="track-line">
            <motion.span className="track-fill" style={{ scaleX: fill }} />
            <span className="track-flow" />
            {!reduce && <motion.span className="track-dot" style={{ left: dotLeft }} />}
          </div>
          <ol className="track-nodes">
            {STOPS.map((s, i) => (
              <li key={s.t} data-on={i <= active} style={{ left: `${(i / (n - 1)) * 100}%` }}>
                <span className="node" />
                <span className="node-label">{s.t}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* phones */}
        <ol className="anatomy-steps" ref={listRef}>
          <motion.span className="steps-fill" style={{ scaleY: vFill }} aria-hidden="true" />
          {STOPS.map((s) => (
            <li key={s.t} data-stop>
              <span className="step-node" aria-hidden="true" />
              <div className="step-photo"><Image src={`/img/${s.img}`} alt={s.alt} fill sizes="80vw" className="object-cover" /></div>
              <span className="mono amber">{s.k}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
