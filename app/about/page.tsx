import type { Metadata } from "next"
import Link from "next/link"
import PerspectiveTunnelHero, { type TunnelImage } from "@/components/ui/perspective-tunnel-hero"

export const metadata: Metadata = {
  title: "About",
  description:
    "Dual Nature is a KwaZulu-Natal hybrid technology company: certified solar and smart infrastructure on one side, precision 3D-fabricated engineering on the other. 20+ systems, 120 kW+, 100% CoC.",
}

const TUNNEL: TunnelImage[] = [
  { src: "/img/flagship-logistics-rooftop.jpg", title: "Logistics · 3-phase", alt: "Commercial rooftop solar array over a logistics yard" },
  { src: "/img/hybrid-volta-storage.jpg", title: "Hybrid · VOLTA storage", alt: "Hybrid inverter with dual VOLTA lithium batteries" },
  { src: "/img/residential-rooftop.jpg", title: "Residential array", alt: "Residential rooftop solar installation" },
  { src: "/img/deye-battery-stack.jpg", title: "Deye · 4-battery stack", alt: "Deye inverter above a stacked lithium tower" },
  { src: "/img/combiner-boxes.jpg", title: "AC + DC combiners", alt: "DC and AC combiner boxes" },
  { src: "/img/distribution-board.jpg", title: "Surge + RCD", alt: "Distribution board with surge protection" },
  { src: "/img/three-tier-db.jpg", title: "Three-tier DB", alt: "Three-tier single-phase distribution board" },
  { src: "/img/flagship-logistics-rooftop.jpg", title: "12 × 630 W", alt: "Commercial rooftop solar array" },
  { src: "/img/hybrid-volta-storage.jpg", title: "CoC certified", alt: "Certified hybrid install" },
]

const LEDGER = [
  ["20+", "Solar systems installed"],
  ["120 kW+", "Total solar capacity installed"],
  ["200+", "Panels on roofs across KZN"],
  ["100%", "Installs signed off with a CoC"],
  ["6", "Infrastructure disciplines under one roof"],
  ["5", "Engineering-grade print materials"],
]

const THESES = [
  {
    k: "The tailwind",
    h: "The grid is getting more expensive every single year.",
    p: "Eskom raised tariffs ~12.7% in April 2026 — the fifth double-digit hike in a row — and grid electricity is up more than 600% since 2008. Solar generates at roughly R0.95/kWh against a grid price now above R3.10/kWh. Every increase makes the case for what Dual Nature builds stronger.",
  },
  {
    k: "The moat",
    h: "Compliance is the corner others cut. We don't.",
    p: "Every Dual Nature install is properly sized, signed off with a Certificate of Compliance, and registered where required. 100% of them. In a market full of fly-by-night installers, a clean compliance record is the most valuable thing a client can buy.",
  },
  {
    k: "The stack",
    h: "One contractor for the whole property.",
    p: "Solar, panel washing, smart-home automation on Sonoff and Home Assistant, CCTV and access control, fibre and mesh Wi-Fi, and equipment supply. Estates and businesses don't need five vendors who blame each other — they need one engineered system.",
  },
  {
    k: "The edge",
    h: "An energy company that can also design and build things.",
    p: "Behind the installs sits a full-cycle engineering arm: CAD modelling, structural engineering and high-tolerance 3D fabrication in ABS, PETG, PLA, carbon-fibre blend and TPU. Factory-line feeler gauges, a BMW E46 front lip, a motorised 360° camera spin booth. Very few installers can say that.",
  },
]

export default function About() {
  return (
    <>
      <PerspectiveTunnelHero
        images={TUNNEL}
        eyebrow="About Dual Nature"
        title={<>BOTH,<br />AT ONCE.</>}
        subtitle="Energy and engineering. Wave and particle. One company built to do both — properly."
      />

      <section className="sect about-open">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq" />Who we are</p>
          <p className="manifesto reveal">
            Most companies pick a lane. <span className="dim">Dual Nature was built on two.</span>
          </p>
          <div className="about-cols">
            <p className="reveal">
              In quantum mechanics, light is both a wave and a particle. Dual Nature (Pty) Ltd was founded on the same principle: dynamic versatility.
              We are not just electricians, and we are not just fabricators — we are a hybrid technology company built to adapt, engineer, and deliver
              complex solutions without compromising on precision or reliability.
            </p>
            <p className="reveal">
              Based in KwaZulu-Natal and powering Durban homes and businesses, our core business is energy and infrastructure. Alongside it runs a
              precision manufacturing arm grounded in electronic engineering and 3D fabrication. Two disciplines, one standard: engineered for
              reliability, scaled to the load, and signed off properly.
            </p>
          </div>
        </div>
      </section>

      <section className="sect ledger-sect">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq amber-bg" />The ledger</p>
          <h2 className="h2 reveal">Numbers, not adjectives.</h2>
          <dl className="ledger">
            {LEDGER.map(([n, l]) => (
              <div className="reveal" key={l}><dt>{n}</dt><dd>{l}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="sect theses">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq" />Why Dual Nature wins</p>
          <h2 className="h2 reveal">Four reasons this is the company to watch in KZN energy.</h2>
          <ol className="thesis-list">
            {THESES.map((t, i) => (
              <li className="thesis reveal" key={t.k}>
                <span className="thesis-n mono">0{i + 1} · {t.k}</span>
                <h3>{t.h}</h3>
                <p>{t.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sect proof">
        <div className="wrap proof-grid">
          <figure className="proof-img reveal">
            <img src="/img/flagship-logistics-rooftop.jpg" alt="Flagship commercial rooftop array over a logistics yard" width={1280} height={708} loading="lazy" decoding="async" />
          </figure>
          <div>
            <p className="kicker reveal"><span className="sq amber-bg" />The flagship</p>
            <h2 className="h2 reveal">A logistics operation, phasing toward full energy independence.</h2>
            <p className="lead reveal">
              A 3-phase commercial rooftop engineered end to end: a 12 kW Deye 3-phase inverter, 10 kWh of storage across two 5 kWh batteries, and a
              7,560 W array of twelve 630 W panels — certified and commissioned. It is the template for what comes next: bigger roofs, estate-wide
              rollouts, and full commercial off-grid transitions.
            </p>
            <Link className="text-link reveal" href="/#work">See the installs <span aria-hidden>→</span></Link>
          </div>
        </div>
      </section>

      <section className="sect built-for">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq" />Built for what&apos;s next</p>
          <h2 className="h2 reveal">From a single home hybrid to a whole estate.</h2>
          <div className="scale-row">
            {[
              ["Homeowners", "Single-phase hybrids, backup through outages, smart switching and security."],
              ["Commercial operators", "3-phase systems that keep production, stock and POS running through load-shedding."],
              ["Estates & body corporates", "Estate-wide renewable rollouts, CCTV, access control and backbone connectivity."],
              ["Installers & resellers", "Inverters, batteries, panels, routers and cameras — sourced and priced for the trade."],
            ].map(([h, p]) => (
              <article className="scale reveal" key={h}><h3>{h}</h3><p>{p}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="sect about-cta">
        <div className="wrap">
          <h2 className="h2 big reveal">Power your property.<br /><span className="dim">Engineer your edge.</span></h2>
          <div className="hero-ctas reveal">
            <Link className="btn btn-solid" href="/#contact">Get a quote <span aria-hidden>→</span></Link>
            <a className="btn btn-ghost" href="tel:+27674007509">Call 067 400 7509</a>
          </div>
        </div>
      </section>
    </>
  )
}
