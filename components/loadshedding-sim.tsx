"use client"

import * as React from "react"

/* Illustrative model. Typical loads in watts; a 90% usable share of battery capacity;
   ~40 W of inverter overhead. Outage pattern per stage is a common municipal schedule. */
const LOADS = [
  { id: "lights", label: "LED lights", w: 100 },
  { id: "fridge", label: "Fridge", w: 150 },
  { id: "wifi", label: "Wi-Fi & router", w: 20 },
  { id: "tv", label: "TV", w: 120 },
  { id: "cctv", label: "CCTV / NVR", w: 60 },
  { id: "pos", label: "POS / PC", w: 200 },
  { id: "pool", label: "Pool pump", w: 750 },
] as const
const STAGES = {
  2: { slot: 2, perDay: 2 },
  4: { slot: 2, perDay: 4 },
  6: { slot: 4, perDay: 3 },
} as const
type Stage = keyof typeof STAGES
const USABLE = 0.9
const OVERHEAD = 40

export function LoadSheddingSim() {
  const [stage, setStage] = React.useState<Stage>(4)
  const [kwh, setKwh] = React.useState<5 | 10>(5)
  const [on, setOn] = React.useState<Set<string>>(() => new Set(["lights", "fridge", "wifi", "tv"]))

  const watts = [...on].reduce((s, id) => s + (LOADS.find((l) => l.id === id)?.w ?? 0), 0) + OVERHEAD
  const hours = (kwh * USABLE * 1000) / watts
  const { slot, perDay } = STAGES[stage]
  const daily = slot * perDay
  const verdict =
    hours >= daily
      ? { tone: "good", t: "Rides through the whole day's outages", d: `Enough for all ${daily} hours at Stage ${stage}, even before solar recharges the battery.` }
      : hours >= slot
        ? { tone: "ok", t: "Rides through every outage", d: `Covers each ${slot}-hour slot; solar or the grid tops the battery up between slots.` }
        : { tone: "short", t: "Runs short of a full slot", d: "Switch off heavy loads or step up to more storage to cover a full outage." }

  const toggle = (id: string) =>
    setOn((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const max = Math.max(daily, hours, 1) * 1.05
  const fmt = (h: number) => (h >= 10 ? Math.round(h).toString() : h.toFixed(1))

  return (
    <div className="sim reveal" id="loadshedding">
      <div className="sim-head">
        <p className="kicker"><span className="sq amber-bg" />Load-shedding simulator</p>
        <h3 className="sim-title">Will your system get through tonight?</h3>
      </div>
      <div className="sim-grid">
        <div className="sim-controls">
          <div className="sim-group">
            <span className="sim-label" id="sim-stage">Load-shedding stage</span>
            <div className="seg seg-3" role="radiogroup" aria-labelledby="sim-stage">
              {([2, 4, 6] as Stage[]).map((s) => (
                <button key={s} type="button" role="radio" aria-checked={stage === s} onClick={() => setStage(s)}>Stage {s}</button>
              ))}
            </div>
          </div>
          <div className="sim-group">
            <span className="sim-label" id="sim-batt">Battery storage</span>
            <div className="seg" role="radiogroup" aria-labelledby="sim-batt">
              {([5, 10] as const).map((b) => (
                <button key={b} type="button" role="radio" aria-checked={kwh === b} onClick={() => setKwh(b)}>{b} kWh</button>
              ))}
            </div>
          </div>
          <fieldset className="sim-group pills">
            <legend className="sim-label">What stays on</legend>
            {LOADS.map((l) => (
              <label key={l.id}>
                <input type="checkbox" checked={on.has(l.id)} onChange={() => toggle(l.id)} />
                <span>{l.label} <em>{l.w} W</em></span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="sim-result" aria-live="polite">
          <div className="sim-big">
            <span className="mono">Backup at {watts.toLocaleString("en-ZA")} W</span>
            <strong>{fmt(hours)}<em> h</em></strong>
          </div>
          <div className="sim-bars" aria-hidden="true">
            <div className="sim-bar"><span className="lbl">Battery runtime</span><i className="b-run" style={{ width: `${(hours / max) * 100}%` }} /></div>
            <div className="sim-bar"><span className="lbl">One outage slot · {slot} h</span><i className="b-slot" style={{ width: `${(slot / max) * 100}%` }} /></div>
            <div className="sim-bar"><span className="lbl">Daily total at Stage {stage} · {daily} h</span><i className="b-day" style={{ width: `${(daily / max) * 100}%` }} /></div>
          </div>
          <div className="sim-verdict" data-tone={verdict.tone}>
            <h4>{verdict.t}</h4>
            <p>{verdict.d}</p>
          </div>
        </div>
      </div>
      <p className="fine">Illustrative only. Assumes typical appliance draw, 90% usable battery capacity, ~40 W inverter overhead and a common outage pattern ({"Stage 2: 2 × 2 h, Stage 4: 4 × 2 h, Stage 6: 3 × 4 h"} per day). Real schedules vary by municipality; systems are sized per site after a load audit.</p>
    </div>
  )
}
