import Link from "next/link"
import Image from "next/image"
import PerspectiveTunnelHero, { type TunnelItem } from "@/components/ui/perspective-tunnel-hero"
import { LiveCurrent } from "@/components/live-current"
import { InstallAnatomy } from "@/components/install-anatomy"
import { LoadSheddingSim } from "@/components/loadshedding-sim"
import { SolarCalculator } from "@/components/solar-calculator"
import { QuoteForm } from "@/components/quote-form"
import { HeroScene } from "@/components/hero-scene"

const SERVICES = [
  {
    t: "Turnkey Solar Energy",
    d: "We manage the full solar lifecycle — load audits, custom system engineering, professional installation, and final safety testing with certified CoCs. From single-phase home hybrids to 3-phase commercial off-grid.",
    tags: ["Load audits", "Hybrid & off-grid", "3-phase", "CoC sign-off"],
    icon: <><rect x="6" y="14" width="36" height="22" rx="2" /><path d="M6 25h36M18 14v22M30 14v22M24 36v6M16 42h16" /><circle cx="38" cy="7" r="3" /></>,
  },
  {
    t: "Panel Washing & Maintenance",
    d: "Dust, salt air, and bird mess quietly cut yield. Scheduled professional panel washing and system maintenance keep arrays performing at peak and protect your return on investment.",
    tags: ["Scheduled service", "Yield recovery"],
    icon: <><path d="M8 30l14-14 18 18" /><path d="M30 8c0 4-4 6-4 9a4 4 0 0 0 8 0c0-3-4-5-4-9z" /><path d="M6 40h36" /></>,
  },
  {
    t: "Smart Home Automation",
    d: "Intelligent environments on robust Sonoff hardware and centralized Home Assistant ecosystems — smart switching, automated lighting, and advanced sensory networks tailored to your space.",
    tags: ["Sonoff", "Home Assistant"],
    icon: <><path d="M8 22L24 9l16 13v18H8z" /><circle cx="24" cy="29" r="5" /><path d="M24 20v2M24 36v2M15 29h2M31 29h2" /></>,
  },
  {
    t: "CCTV & Security",
    d: "Surveillance and security infrastructure — IP camera arrays, NVR/DVR systems, remote monitoring, and integration with smart-home and access control for full-property coverage.",
    tags: ["IP cameras", "NVR/DVR", "Access control"],
    icon: <><path d="M6 14l26-6 4 12-26 6z" /><circle cx="20" cy="17" r="3" /><path d="M14 25l2 9h-8M36 14l6-2" /></>,
  },
  {
    t: "Internet & Connectivity",
    d: "Structured network and wireless setups — fibre, mesh Wi-Fi, and backbone cabling — so the connectivity behind your smart and security systems is fast and flawless.",
    tags: ["Fibre", "Mesh Wi-Fi", "Cabling"],
    icon: <><path d="M6 19a26 26 0 0 1 36 0M11 25a18 18 0 0 1 26 0M16 31a10 10 0 0 1 16 0" /><circle cx="24" cy="37" r="2.5" /></>,
  },
  {
    t: "Equipment Supply",
    d: "Beyond installation, we supply and resell solar, networking, and CCTV hardware — inverters, batteries, panels, routers, and cameras — sourced and priced for installers, estates, and direct clients.",
    tags: ["Solar", "Networking", "Security"],
    icon: <><path d="M6 16l18-8 18 8-18 8z" /><path d="M6 16v16l18 8 18-8V16M24 24v16" /></>,
  },
]

const GALLERY = [
  ["hybrid-volta-storage.jpg", "Hybrid inverter with dual VOLTA lithium battery storage", "Hybrid · Dual Battery", "Inverter + VOLTA Stage 4 storage", 760, 896],
  ["deye-battery-stack.jpg", "Deye inverter above a four-battery stacked lithium tower", "Stacked Lithium", "Deye inverter + 4-battery stack", 760, 896],
  ["combiner-boxes.jpg", "DC and AC combiner boxes wired and protected", "AC + DC", "Combiner boxes", 640, 840],
  ["distribution-board.jpg", "Distribution board with surge protection and RCDs", "Surge + RCD", "Distribution board", 640, 840],
  ["three-tier-db.jpg", "Three-tier single-phase distribution board fully wired", "Single-Phase", "Three-tier DB", 620, 860],
] as const

const WORK_TUNNEL: TunnelItem[] = [
  { src: "/img/hybrid-volta-storage.jpg", title: "Hybrid · VOLTA storage", alt: "Hybrid inverter with dual VOLTA lithium batteries" },
  { src: "/img/residential-rooftop.jpg", title: "Residential array", alt: "Residential rooftop solar installation" },
  { src: "/img/combiner-boxes.jpg", title: "AC + DC combiners", alt: "DC and AC combiner boxes" },
  { src: "/img/deye-battery-stack.jpg", title: "Deye · 4-battery stack", alt: "Deye inverter above a stacked lithium tower" },
  { src: "/img/distribution-board.jpg", title: "Surge + RCD", alt: "Distribution board with surge protection" },
  { src: "/img/three-tier-db.jpg", title: "Three-tier DB", alt: "Three-tier single-phase distribution board" },
  { src: "/img/hybrid-volta-storage.jpg", title: "Installed & certified", alt: "Certified hybrid install" },
  { src: "/img/residential-rooftop.jpg", title: "KwaZulu-Natal", alt: "Rooftop solar in KwaZulu-Natal" },
]

const STEPS = ["Load audit", "Engineering", "Installation", "Testing & CoC", "Maintenance"]

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-seq" id="top">
        <div className="hero">
          <HeroScene />
          <div className="hero-veil" aria-hidden />
          <div className="hero-inner">
            <p className="kicker"><span className="sq" />Solar · Infrastructure · Manufacturing</p>
            <h1 className="wordmark" aria-label="Dual Nature">
              <span className="ln"><span>DUAL</span></span>
              <span className="ln"><span><b className="blue">NA</b><b className="amber">TURE</b></span></span>
            </h1>
            <p className="hero-sub">Powering Durban homes and businesses with engineered solar, smart infrastructure, and precision manufactured products.</p>
            <div className="hero-ctas">
              <Link className="btn btn-solid" href="/#contact">Get a quote <span aria-hidden>→</span></Link>
              <Link className="btn btn-ghost" href="/#solar">Calculate savings</Link>
            </div>
            <div className="chips">
              <Link className="chip energy" href="/#energy">Energy &amp; Infrastructure</Link>
              <Link className="chip products" href="/#products">Precision Manufactured Products</Link>
            </div>
          </div>
          <div className="hero-foot">
            <span>KWAZULU-NATAL · ZA</span>
            <span className="hero-state" id="heroState">STATE / WAVE</span>
            <span className="scroll-cue"><i />SCROLL</span>
          </div>
        </div>
      </section>

      {/* LIVE CURRENT — the 3D centrepiece */}
      <LiveCurrent />

      {/* PHILOSOPHY */}
      <section className="sect philo" id="philosophy">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq" />The Dual Nature Philosophy</p>
          <p className="philo-quote" data-split>
            In quantum mechanics, light is both a <em className="blue">wave</em> and a <em className="amber">particle</em>. We were built on the same principle.
          </p>
          <div className="philo-grid">
            <div className="reveal">
              <p>Dual Nature (Pty) Ltd was founded on dynamic versatility. We are not just electricians, and we are not just fabricators — we are a hybrid technology company built to adapt, engineer, and deliver complex solutions without compromising on precision or reliability.</p>
              <p>Our primary discipline is energy and infrastructure: turnkey solar, smart-home automation, security, and connectivity for residential and commercial clients across KwaZulu-Natal.</p>
            </div>
            <div className="reveal">
              <p>Alongside it, we design and build precision manufactured products — grounded in advanced electronic engineering and high-tolerance 3D fabrication.</p>
              <p>From an estate-wide renewable rollout to a 3-phase commercial off-grid transition, every system is engineered for reliability, scaled to the load, and signed off with a full Certificate of Compliance.</p>
            </div>
          </div>
          <div className="duality reveal" aria-label="Our two pillars">
            <Link className="pole wave" href="/#energy">
              <span className="mono">Pillar I · Wave</span>
              <strong>Energy &amp; Infrastructure</strong>
              <small>Our core business</small>
            </Link>
            <Link className="pole particle" href="/#products">
              <span className="mono">Pillar II · Particle</span>
              <strong>Precision Products</strong>
              <small>A secondary engineering arm</small>
            </Link>
          </div>
          <dl className="stats">
            <div className="stat reveal"><dt><span data-count="20">0</span><em>+</em></dt><dd>Solar systems installed to date</dd></div>
            <div className="stat reveal"><dt><span data-count="120">0</span><em> kW+</em></dt><dd>Total solar installed · 200+ panels</dd></div>
            <div className="stat reveal"><dt><span data-count="100">0</span><em>%</em></dt><dd>CoC-certified installs</dd></div>
            <div className="stat reveal"><dt>B2B<em>·</em>B2C</dt><dd>Residential &amp; commercial</dd></div>
          </dl>
          <Link className="text-link reveal" href="/about">Read the full story <span aria-hidden>→</span></Link>
        </div>
      </section>

      {/* ENERGY */}
      <section className="energy-seq" id="energy">
        <div className="energy-pin">
          <div className="energy-head wrap">
            <p className="kicker"><span className="sq" />Pillar I · Energy &amp; Infrastructure · Durban &amp; KZN</p>
            <h2 className="h2">Our core business.</h2>
            <p className="lead">End-to-end electrical, solar, security, and connectivity — engineered for reliability, scalability, and modern integration.</p>
          </div>
          <div className="track-wrap">
            <ol className="track" id="track">
              {SERVICES.map((s, i) => (
                <li className="svc" data-tilt key={s.t}>
                  <span className="svc-n">{String(i + 1).padStart(2, "0")}</span>
                  <svg className="svc-ic" viewBox="0 0 48 48">{s.icon}</svg>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                  <ul className="tags">{s.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                </li>
              ))}
            </ol>
          </div>
          <div className="track-ui wrap">
            <div className="track-dots" id="trackDots" role="tablist" aria-label="Services" />
            <span className="mono track-count" id="trackCount">01 / 06</span>
          </div>
        </div>
      </section>

      {/* ANATOMY */}
      <InstallAnatomy />

      {/* SOLAR ROI */}
      <section className="sect solar" id="solar">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq" />Why Solar · Return on Investment</p>
          <h2 className="h2 reveal">Solar is an investment, not a <span className="strike">cost</span>.</h2>
          <p className="lead reveal">
            Eskom raised tariffs ~12.7% in April 2026 — the fifth consecutive double-digit hike, with grid electricity climbing over 600% since 2008. Solar locks your generation rate at roughly <b className="blue">R0.95/kWh</b> against a grid price now exceeding <b className="amber">R3.10/kWh</b> — and the gap widens every year.
          </p>
          <SolarCalculator />
          <p className="fine">Illustrative only: assumes ~R3.10/kWh grid rate escalating ~12% a year, 0.5%/yr panel degradation, and an indicative system cost sized to your bill. Figures are typical South African ranges as at mid-2026 and depend on system size, consumption, self-consumption ratio, and tariff. Eskom SSEG fixed charges and registration requirements affect net returns. Exact payback is quoted per site after a load audit. Not financial advice.</p>

          <LoadSheddingSim />

          <div className="payback">
            <div className="pb reveal"><strong>5–7 yrs</strong><span>Typical residential payback</span></div>
            <div className="pb reveal"><strong>4–8 yrs</strong><span>Commercial payback</span></div>
            <div className="pb reveal"><strong>18–25 yrs</strong><span>Near-free generation after</span></div>
          </div>
          <div className="benefits">
            <article className="bf reveal"><span className="mono">01</span><h3>Escape rising tariffs</h3><p>Every Eskom increase shortens your payback and grows your savings. You fix your energy cost while the grid keeps climbing 8–15% a year.</p></article>
            <article className="bf reveal"><span className="mono">02</span><h3>Continuity = money</h3><p>For commercial clients, load-shedding means lost production, spoiled stock, and POS downtime. Hybrid solar keeps critical operations running through outages.</p></article>
            <article className="bf reveal"><span className="mono">03</span><h3>Property value uplift</h3><p>South African homes with professionally installed, certified solar typically resell for 10–20% more, and solar now ranks among buyers&apos; top requested features.</p></article>
            <article className="bf reveal"><span className="mono">04</span><h3>We handle compliance</h3><p>Every install is properly sized, signed off with a Certificate of Compliance, and registered where required — the corner most installers cut, and the costliest to get wrong.</p></article>
          </div>
        </div>
      </section>

      {/* TUNNEL INTO THE WORK */}
      <PerspectiveTunnelHero
        id="installs"
        images={WORK_TUNNEL}
        titleAs="h2"
        eyebrow="Proof of work"
        title={<>INSIDE 20+<br />INSTALLS.</>}
        subtitle="Real systems, our own work — certified solar across KwaZulu-Natal."
        prompt="Scroll through the installs"
        length={3}
        finale={{
          src: "/img/flagship-logistics-rooftop.jpg",
          alt: "Flagship commercial rooftop solar array over a logistics yard in KwaZulu-Natal",
          dim: 0.25,
          caption: <>Flagship · Commercial 3-phase<br />Logistics rooftop array</>,
        }}
      />

      {/* WORK */}
      <section className="sect work" id="work">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq" />Proof of Work · Solar installations in KwaZulu-Natal</p>
          <h2 className="h2 reveal">20+ systems installed. Residential to commercial.</h2>
          <p className="lead reveal">A growing track record of certified solar across KwaZulu-Natal — from single-home hybrids to full 3-phase commercial off-grid transitions. Below: real installs, our own work.</p>

          <figure className="flagship reveal">
            <button className="shot" type="button" data-lb data-full="/img/flagship-logistics-rooftop.jpg" aria-label="Enlarge: Logistics rooftop array">
              <Image src="/img/flagship-logistics-rooftop.jpg" alt="Aerial view of a flagship commercial rooftop solar array over a logistics yard in KwaZulu-Natal" width={1280} height={708} sizes="(max-width:760px) 92vw, 60vw" />
            </button>
            <figcaption>
              <span className="mono amber">Flagship · Commercial 3-Phase</span>
              <h3>Logistics rooftop array</h3>
              <p>Engineered for a logistics operation phasing toward full energy independence.</p>
              <dl className="specs">
                <div><dt>12 kW</dt><dd>Deye 3-phase inverter</dd></div>
                <div><dt>10 kWh</dt><dd>2 × 5 kWh storage</dd></div>
                <div><dt>7560 W</dt><dd>Solar array · 12 × 630 W</dd></div>
                <div><dt className="amber">CoC</dt><dd>Certified &amp; commissioned</dd></div>
              </dl>
            </figcaption>
          </figure>

          <figure className="resi reveal">
            <button className="shot" type="button" data-lb data-full="/img/residential-rooftop.jpg" aria-label="Enlarge: Residential rooftop array">
              <Image src="/img/residential-rooftop.jpg" alt="Aerial view of a residential rooftop solar installation across a tiled roof" width={1280} height={708} sizes="(max-width:760px) 92vw, 60vw" />
            </button>
            <figcaption><span className="mono blue">Residential</span><h3>Rooftop array</h3><p>One of 20+ certified solar installs across KwaZulu-Natal.</p></figcaption>
          </figure>

          <p className="subhead reveal"><span className="dash" />Inside the install — installed &amp; certified</p>
          <div className="gallery" id="gallery">
            {GALLERY.map(([f, alt, k, cap, w, h]) => (
              <button key={f} className="g-item shot reveal" type="button" data-lb data-cap={cap} data-full={`/img/${f}`}>
                <Image src={`/img/${f}`} alt={alt} width={w} height={h} sizes="(max-width:760px) 74vw, (max-width:1280px) 33vw, 420px" />
                <span className="g-cap"><i className="mono">{k}</i>{cap}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="process-seq" id="process">
        <div className="process-pin">
          <div className="wrap process-grid">
            <div>
              <p className="kicker"><span className="sq" />How a solar install runs</p>
              <h2 className="h2">The full lifecycle, managed end to end.</h2>
              <div className="steps" role="tablist" aria-label="Install stages">
                {STEPS.map((s, i) => (
                  <button key={s} type="button" role="tab" aria-selected={i === 0} data-step={i}><i>{String(i + 1).padStart(2, "0")}</i>{s}</button>
                ))}
              </div>
            </div>
            <div className="step-card" aria-live="polite">
              <span className="step-big" id="stepBig" aria-hidden>01</span>
              <span className="mono" id="stepIdx">01 / 05</span>
              <h3 id="stepTitle">Load audit</h3>
              <p id="stepCopy">Every system starts with a load audit — measuring what your property actually draws, so the design is scaled to the load.</p>
              <div className="step-line"><span id="stepLine" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="sect products" id="products">
        <div className="wrap">
          <p className="kicker reveal"><span className="sq amber-bg" />Pillar II · Precision Manufactured Products</p>
          <h2 className="h2 reveal">A secondary engineering arm.</h2>
          <p className="lead reveal">We merge electronic-engineering concepts with high-tolerance 3D printing — full-cycle, from CAD modelling and structural engineering to the finished physical build.</p>
          <div className="prod-grid">
            <article className="prod reveal" data-tilt>
              <div className="prod-vis" aria-hidden>
                <svg viewBox="0 0 200 110"><g className="ln-a">{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={40 + i * 6} y={18 + i * 2} width="110" height="10" rx="2" transform={`rotate(${-18 + i * 9} 46 ${92})`} />)}</g><circle cx="46" cy="92" r="5" className="ln-b" /></svg>
              </div>
              <span className="mono amber">Tools</span>
              <h3>Industrial precision tools</h3>
              <p>Custom, high-accuracy 3D-printed feeler gauges used on the factory line — strict tolerances, durable materials, functional workplace instrumentation.</p>
              <small className="mono">Factory-line instrumentation</small>
            </article>
            <article className="prod reveal" data-tilt>
              <div className="prod-vis" aria-hidden>
                <svg viewBox="0 0 200 110"><path className="ln-a" d="M14 72 C44 50,94 40,154 44 L190 54 L190 66 L22 78Z" /><path className="ln-b" d="M4 34 C64 24,124 22,196 30M4 50 C64 38,124 34,196 42M4 94 C64 96,124 94,196 88" /></svg>
              </div>
              <span className="mono amber">Auto</span>
              <h3>Automotive aerodynamics</h3>
              <p>CAD design and multi-part fabrication of a custom BMW E46 front lip — high-strength, weatherproof material engineering matched to factory fitment.</p>
              <small className="mono">BMW E46 front lip</small>
            </article>
            <article className="prod reveal" data-tilt>
              <div className="prod-vis" aria-hidden>
                <svg viewBox="0 0 200 110"><ellipse className="ln-a" cx="100" cy="74" rx="70" ry="18" /><ellipse className="ln-a" cx="100" cy="74" rx="40" ry="10" /><path className="ln-b" d="M100 74V22M92 22h16v10H92z" /><circle className="ln-c" cx="170" cy="74" r="4" /></svg>
              </div>
              <span className="mono amber">Systems</span>
              <h3>Integrated mechanical systems</h3>
              <p>A functional 360° camera spin booth merging 3D-printed structure with custom wiring and motor automation — the clearest expression of our dual nature.</p>
              <small className="mono">360° camera spin booth</small>
            </article>
          </div>
          <div className="materials reveal">
            <span className="mono">Materials we print</span>
            <ul className="mat-list">
              {["ABS", "PETG", "PLA", "Carbon-fiber blend", "Flexible TPU"].map((m) => <li key={m}>{m}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="sect contact" id="contact">
        <div className="wrap contact-grid">
          <div>
            <p className="kicker reveal"><span className="sq" />Let&apos;s Build</p>
            <h2 className="h2 big reveal">Power your property.<br /><span className="dim">Engineer your edge.</span></h2>
            <p className="lead reveal">For estate managers, body corporates, commercial operators, and homeowners planning solar, security, or connectivity — Dual Nature delivers end-to-end, certified, and built to scale.</p>
            <dl className="contact-list reveal">
              <div><dt className="mono">Contact</dt><dd><a href="tel:+27674007509">067 400 7509</a></dd></div>
              <div><dt className="mono">Email</dt><dd><a href="mailto:admin@dualnature.co.za">admin@dualnature.co.za</a></dd></div>
              <div><dt className="mono">Website</dt><dd>www.dualnature.co.za</dd></div>
              <div><dt className="mono">Sectors</dt><dd>Estates · Commercial · Residential</dd></div>
            </dl>
          </div>
          <QuoteForm />
        </div>
      </section>
    </>
  )
}
