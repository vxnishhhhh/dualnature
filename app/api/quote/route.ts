import { NextResponse } from "next/server"

/*
 * Quote requests.
 * - Validates and sanitises input on the server.
 * - Honeypot field ("company_site") silently drops bots.
 * - Basic per-IP rate limit (best effort: in-memory per server instance).
 * - If RESEND_API_KEY is set, emails the enquiry to QUOTE_TO_EMAIL and returns { ok: true, sent: true }.
 * - Otherwise returns 503 { ok: false, fallback: "mailto" } and the form opens the visitor's email app.
 */

export const runtime = "nodejs"

const SERVICES = new Set(["Solar", "Panel washing", "Smart home", "CCTV & security", "Connectivity", "Equipment supply", "Precision products"])
const TYPES = new Set(["Residential", "Commercial", "Estate / Body corporate"])
const hits = new Map<string, number[]>()

type Body = { name?: unknown; phone?: unknown; email?: unknown; type?: unknown; services?: unknown; message?: unknown; company_site?: unknown }

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "")
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 5
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 })
  }

  if (clean(body.company_site, 200)) return NextResponse.json({ ok: true, sent: true }) // honeypot

  const name = clean(body.name, 120)
  const phone = clean(body.phone, 40)
  const email = clean(body.email, 160)
  const type = TYPES.has(clean(body.type, 40)) ? clean(body.type, 40) : "Residential"
  const services = Array.isArray(body.services) ? body.services.map((s) => clean(s, 40)).filter((s) => SERVICES.has(s)) : []
  const message = typeof body.message === "string" ? body.message.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, 2000) : ""

  if (name.length < 2) return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 422 })
  if (!phone && !email) return NextResponse.json({ ok: false, error: "Add a phone number or email so we can reply." }, { status: 422 })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ ok: false, error: "That email address doesn't look right." }, { status: 422 })
  if (phone && !/^[+\d][\d\s()-]{6,}$/.test(phone)) return NextResponse.json({ ok: false, error: "That phone number doesn't look right." }, { status: 422 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  if (limited(ip)) return NextResponse.json({ ok: false, error: "Too many requests — please call 067 400 7509." }, { status: 429 })

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ ok: false, fallback: "mailto" }, { status: 503 })

  const to = process.env.QUOTE_TO_EMAIL || "admin@dualnature.co.za"
  const from = process.env.QUOTE_FROM_EMAIL || "Dual Nature Website <onboarding@resend.dev>"
  const subject = `Quote request — ${services.join(", ") || "General enquiry"} — ${name}`
  const rows: [string, string][] = [["Name", name], ["Phone", phone || "—"], ["Email", email || "—"], ["Property", type], ["Interested in", services.join(", ") || "General enquiry"]]
  const html = `<h2 style="font-family:sans-serif">New quote request</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#586176">${k}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`)
    .join("")}</table><p style="font-family:sans-serif;white-space:pre-wrap">${esc(message || "(no message)")}</p>`

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, ...(email ? { reply_to: email } : {}) }),
    })
    if (!r.ok) return NextResponse.json({ ok: false, fallback: "mailto" }, { status: 502 })
    return NextResponse.json({ ok: true, sent: true })
  } catch {
    return NextResponse.json({ ok: false, fallback: "mailto" }, { status: 502 })
  }
}
