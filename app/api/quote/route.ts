import { NextResponse } from "next/server"
import { z } from "zod"
import { env } from "@/lib/env"

/*
 * Quote requests.
 *  - JSON only, body capped at 10 KB, same-origin only.
 *  - zod schema validation; honeypot + minimum fill time drop bots silently.
 *  - Rate limit: Upstash Redis when configured, otherwise in-memory per instance.
 *  - With RESEND_API_KEY the enquiry is emailed; otherwise { ok: false, fallback: "mailto" } and the
 *    form opens the visitor's email app. Errors are generic; nothing personal is logged.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 10 * 1024
const MIN_FILL_MS = 2500
const WINDOW_S = 600
const LIMIT = 5

const SERVICES = ["Solar", "Panel washing", "Smart home", "CCTV & security", "Connectivity", "Equipment supply", "Precision products"] as const
const TYPES = ["Residential", "Commercial", "Estate / Body corporate"] as const

const oneLine = (max: number) => z.string().trim().max(max).transform((v) => v.replace(/[\u0000-\u001f\u007f]/g, " "))
const Quote = z
  .object({
    name: oneLine(120).pipe(z.string().min(2, "Please add your name.")),
    phone: oneLine(40).refine((v) => !v || /^[+\d][\d\s()-]{6,}$/.test(v), "That phone number doesn't look right.").default(""),
    email: oneLine(160).refine((v) => !v || z.email().safeParse(v).success, "That email address doesn't look right.").default(""),
    type: z.enum(TYPES).catch("Residential"),
    services: z.array(z.string()).max(10).default([]).transform((a) => a.filter((s): s is (typeof SERVICES)[number] => (SERVICES as readonly string[]).includes(s))),
    message: z.string().max(2000).default("").transform((v) => v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim()),
    company_site: z.string().max(200).default(""),
    elapsed: z.number().int().nonnegative().max(86_400_000).default(0),
  })
  .refine((q) => q.phone || q.email, { message: "Add a phone number or email so we can reply.", path: ["phone"] })

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })

/* ── rate limiting ──────────────────────────────────────────────────── */
const memory = new Map<string, number[]>()
async function limited(ip: string): Promise<boolean> {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const key = `dn:quote:${ip}`
      const r = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(WINDOW_S), "NX"]]),
        cache: "no-store",
      })
      if (r.ok) {
        const out = (await r.json()) as { result: number }[]
        return (out[0]?.result ?? 0) > LIMIT
      }
    } catch {
      /* fall through to memory */
    }
  }
  const now = Date.now()
  const recent = (memory.get(ip) ?? []).filter((t) => now - t < WINDOW_S * 1000)
  recent.push(now)
  memory.set(ip, recent)
  if (memory.size > 5000) memory.clear()
  return recent.length > LIMIT
}

function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site")
  if (site && site !== "same-origin") return false
  const origin = req.headers.get("origin")
  if (!origin) return site === "same-origin"
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false, error: "Request not allowed." }, 403)
  if (!(req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return json({ ok: false, error: "Unsupported request." }, 415)
  const declared = Number(req.headers.get("content-length") ?? 0)
  if (declared > MAX_BYTES) return json({ ok: false, error: "Request too large." }, 413)

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400)
  }
  if (raw.length > MAX_BYTES) return json({ ok: false, error: "Request too large." }, 413)

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400)
  }

  const parsed = Quote.safeParse(data)
  if (!parsed.success) {
    const first = parsed.error.issues.find((i) => typeof i.message === "string" && !i.message.startsWith("Invalid") && !i.message.startsWith("Expected"))
    return json({ ok: false, error: first?.message ?? "Please check the form and try again." }, 422)
  }
  const q = parsed.data

  // bots: filled the hidden field, or submitted faster than a person can type
  if (q.company_site || q.elapsed < MIN_FILL_MS) return json({ ok: true, sent: true })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local"
  if (await limited(ip)) return json({ ok: false, error: "Too many requests — please call 067 400 7509." }, 429)

  // no mail provider configured: a normal response telling the form to use the email app
  if (!env.RESEND_API_KEY) return json({ ok: false, fallback: "mailto" })

  const services = q.services.join(", ") || "General enquiry"
  const rows: [string, string][] = [["Name", q.name], ["Phone", q.phone || "—"], ["Email", q.email || "—"], ["Property", q.type], ["Interested in", services]]
  const html = `<h2 style="font-family:sans-serif">New quote request</h2><table style="font-family:sans-serif;border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#586176">${esc(k)}</td><td style="padding:6px 0"><b>${esc(v)}</b></td></tr>`)
    .join("")}</table><p style="font-family:sans-serif;white-space:pre-wrap">${esc(q.message || "(no message)")}</p>`
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${q.message || "(no message)"}`

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.QUOTE_FROM_EMAIL,
        to: [env.QUOTE_TO_EMAIL],
        subject: `Quote request — ${services} — ${q.name}`.slice(0, 180),
        html,
        text,
        ...(q.email ? { reply_to: q.email } : {}),
      }),
      cache: "no-store",
    })
    if (!r.ok) return json({ ok: false, fallback: "mailto" })
    return json({ ok: true, sent: true })
  } catch {
    return json({ ok: false, fallback: "mailto" })
  }
}

export function GET() {
  return json({ ok: false, error: "Method not allowed." }, 405)
}
