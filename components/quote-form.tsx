"use client"

import * as React from "react"

const SERVICES = [
  ["Solar", "Solar"],
  ["Panel washing", "Panel washing"],
  ["Smart home", "Smart home"],
  ["CCTV & security", "CCTV"],
  ["Connectivity", "Connectivity"],
  ["Equipment supply", "Equipment"],
  ["Precision products", "3D products"],
] as const

type Status = { kind: "idle" | "sending" | "sent" | "error" | "mailto"; msg?: string }

export function QuoteForm() {
  const [status, setStatus] = React.useState<Status>({ kind: "idle" })
  const nameRef = React.useRef<HTMLInputElement>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const payload = {
      name: String(f.get("name") || "").trim(),
      phone: String(f.get("phone") || "").trim(),
      email: String(f.get("email") || "").trim(),
      type: String(f.get("type") || ""),
      services: f.getAll("svc").map(String),
      message: String(f.get("msg") || ""),
      company_site: String(f.get("company_site") || ""),
    }
    if (payload.name.length < 2) {
      setStatus({ kind: "error", msg: "Please add your name so we know who to reply to." })
      nameRef.current?.focus()
      return
    }
    if (!payload.phone && !payload.email) {
      setStatus({ kind: "error", msg: "Add a phone number or email so we can reply." })
      return
    }
    setStatus({ kind: "sending" })
    try {
      const r = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.ok) {
        setStatus({ kind: "sent" })
        ;(e.target as HTMLFormElement).reset()
        return
      }
      if (j.fallback === "mailto") {
        const svcs = payload.services.join(", ") || "General enquiry"
        const body = `Name: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email}\nProperty: ${payload.type}\nInterested in: ${svcs}\n\n${payload.message}`
        window.location.href = `mailto:admin@dualnature.co.za?subject=${encodeURIComponent("Quote request — " + svcs)}&body=${encodeURIComponent(body)}`
        setStatus({ kind: "mailto" })
        return
      }
      setStatus({ kind: "error", msg: j.error || "Something went wrong. Please call 067 400 7509." })
    } catch {
      setStatus({ kind: "error", msg: "You seem to be offline. Please call 067 400 7509." })
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="quote reveal in quote-done" role="status">
        <span className="done-mark" aria-hidden>✓</span>
        <h3>Enquiry received.</h3>
        <p>Thank you — the Dual Nature team will be in touch shortly. For anything urgent, call <a href="tel:+27674007509">067 400 7509</a>.</p>
        <button className="btn btn-ghost" type="button" onClick={() => setStatus({ kind: "idle" })}>Send another</button>
      </div>
    )
  }

  return (
    <form className="quote reveal" onSubmit={submit} noValidate>
      <h3>Request a quote</h3>
      <p className="mono">We reply within one business day</p>
      <fieldset className="pills">
        <legend>I&apos;m interested in</legend>
        {SERVICES.map(([v, l]) => (
          <label key={v}><input type="checkbox" name="svc" value={v} defaultChecked={v === "Solar"} /><span>{l}</span></label>
        ))}
      </fieldset>
      <label className="inp"><span>Name</span><input ref={nameRef} name="name" autoComplete="name" required aria-invalid={status.kind === "error" && !nameRef.current?.value ? true : undefined} /></label>
      <div className="inp-row">
        <label className="inp"><span>Phone</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" /></label>
        <label className="inp"><span>Email</span><input name="email" type="email" inputMode="email" autoComplete="email" /></label>
      </div>
      <label className="inp"><span>Property type</span>
        <select name="type" defaultValue="Residential"><option>Residential</option><option>Commercial</option><option>Estate / Body corporate</option></select>
      </label>
      <label className="inp"><span>Tell us about the project</span><textarea name="msg" rows={3} /></label>
      <input className="hp" name="company_site" tabIndex={-1} autoComplete="off" aria-hidden />
      <button className="btn btn-solid wide" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "Sending…" : <>Send enquiry <span aria-hidden>→</span></>}
      </button>
      <p className="form-note" role="status">
        {status.kind === "error" && status.msg}
        {status.kind === "mailto" && "Opening your email app with the details filled in. If nothing happens, email admin@dualnature.co.za or call 067 400 7509."}
      </p>
    </form>
  )
}
