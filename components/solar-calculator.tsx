"use client"

import * as React from "react"
import { PeakChart } from "@/components/ui/peak-chart"

/* Indicative model. Grid at ~R3.10/kWh escalating ~12%/yr (Eskom, April 2026),
   0.5%/yr panel degradation, 1%/yr of system cost for upkeep (panel washing, checks). */
const GRID_RATE = 3.1
const ESCALATION = 0.12
const HORIZONS = ["10 years", "15 years", "25 years"] as const
type Horizon = (typeof HORIZONS)[number]
type Kind = "home" | "biz"

const rand = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ")
const randK = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? "−" : ""
  return a >= 1_000_000 ? `${s}R ${(a / 1_000_000).toFixed(2)}m` : `${s}R ${Math.round(a / 1000)}k`
}

function model(bill: number, offset: number, kind: Kind) {
  const kwhOffset = (bill / GRID_RATE) * offset
  const kwp = kwhOffset / (4.4 * 30) // ~4.4 peak sun hours in KZN
  const cost = Math.max(kind === "home" ? 65000 : 90000, kwp * (kind === "home" ? 21000 : 16500)) + (kind === "home" ? 25000 : 0)
  const year1 = bill * 12 * offset
  const net = [-cost]
  let cum = 0
  let payback: number | null = null
  for (let y = 1; y <= 25; y++) {
    const yr = year1 * Math.pow(1 + ESCALATION, y - 1) * Math.pow(0.995, y - 1) - cost * 0.01
    const before = cum
    cum += yr
    net.push(cum - cost)
    if (payback === null && cum >= cost) payback = y - 1 + (cost - before) / yr
  }
  return { cost, year1, net, payback, kwp }
}

function useWidth(ref: React.RefObject<HTMLDivElement | null>, max = 440) {
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let t: ReturnType<typeof setTimeout> | undefined
    const set = () => setW(Math.max(260, Math.min(max, Math.floor(el.clientWidth))))
    set()
    const ro = new ResizeObserver(() => {
      clearTimeout(t)
      t = setTimeout(set, 160) // the glow field is painted per size, so settle before repainting
    })
    ro.observe(el)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [ref, max])
  return w
}

export function SolarCalculator() {
  const [kind, setKind] = React.useState<Kind>("home")
  const [bill, setBill] = React.useState(3000)
  const [offset, setOffset] = React.useState(70)
  const [horizon, setHorizon] = React.useState<Horizon>("25 years")
  const wrap = React.useRef<HTMLDivElement>(null)
  const width = useWidth(wrap)

  const m = React.useMemo(() => model(bill, offset / 100, kind), [bill, offset, kind])
  const years = parseInt(horizon, 10)
  const data = m.net.slice(0, years + 1)
  const labels = data.map((_, i) => (i === 0 ? "Install day" : `Year ${i}`))
  const atHorizon = data[data.length - 1]

  const switchKind = (k: Kind) => {
    setKind(k)
    if (k === "biz" && bill < 8000) setBill(15000)
    if (k === "home" && bill > 12000) setBill(3000)
  }
  const pct = (v: number, a: number, b: number) => `${((v - a) / (b - a)) * 100}%`

  return (
    <div className="calc reveal" id="calc">
      <div className="calc-controls">
        <div className="seg" role="tablist" aria-label="Property type">
          {(["home", "biz"] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => switchKind(k)}>
              {k === "home" ? "Residential" : "Commercial"}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Monthly electricity bill</span>
          <output>{rand(bill)}</output>
          <input type="range" min={800} max={60000} step={100} value={bill} aria-label="Monthly electricity bill in rand"
            style={{ ["--p" as string]: pct(bill, 800, 60000) }} onChange={(e) => setBill(+e.target.value)} />
        </label>
        <label className="field">
          <span>Share of bill offset by solar</span>
          <output>{offset}%</output>
          <input type="range" min={30} max={95} step={5} value={offset} aria-label="Percentage of bill offset by solar"
            style={{ ["--p" as string]: pct(offset, 30, 95) }} onChange={(e) => setOffset(+e.target.value)} />
        </label>
        <dl className="calc-results">
          <div><dt className="mono">Indicative system</dt><dd>{m.kwp.toFixed(1)} kWp · {rand(m.cost)}</dd></div>
          <div><dt className="mono">Year-one savings</dt><dd>{rand(m.year1)}</dd></div>
          <div><dt className="mono">Est. payback</dt><dd className="amber">{m.payback ? `~${m.payback.toFixed(1)} yrs` : "25+ yrs"}</dd></div>
          <div><dt className="mono">Net after {years} yrs</dt><dd className="blue">{rand(atHorizon)}</dd></div>
        </dl>
      </div>

      <div className="calc-chart" ref={wrap}>
        {width > 0 && (
          <PeakChart
            width={width}
            data={data}
            labels={labels}
            value={Math.round(atHorizon / 1000)}
            valueSuffix="k"
            decimals={0}
            title={`Net position after ${years} years · ZAR`}
            caption={m.payback ? `Breaks even around year ${Math.ceil(m.payback)} · then near-free power` : "Payback beyond 25 years at this offset"}
            updatedText="Your solar estimate"
            trend={atHorizon >= 0 ? "up" : "down"}
            periods={[...HORIZONS]}
            period={horizon}
            onPeriodChange={(p) => setHorizon(p as Horizon)}
            formatValue={randK}
            font="var(--display), system-ui, sans-serif"
            accent="#4f8ef7"
          />
        )}
        <p className="chart-hint mono">Drag across the chart to read any year</p>
      </div>
    </div>
  )
}
