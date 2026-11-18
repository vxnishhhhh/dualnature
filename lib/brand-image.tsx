import { readFile } from "node:fs/promises"
import { join } from "node:path"

/** The logo as a data URI, for next/og images. */
export async function logoDataUri() {
  const svg = await readFile(join(process.cwd(), "public", "favicon.svg"), "utf8")
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
}

export async function photoDataUri(file: string) {
  const buf = await readFile(join(process.cwd(), "public", "img", file))
  return `data:image/jpeg;base64,${buf.toString("base64")}`
}

/** Square app icon: the mark on the brand night background. */
export async function iconElement(size: number) {
  const logo = await logoDataUri()
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#070A11" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={size * 0.86} height={size * 0.86} alt="" />
    </div>
  )
}

/** 1200×630 share card in the site's style. */
export async function shareCard({ kicker, title, sub, photo }: { kicker: string; title: string; sub: string; photo?: string }) {
  const logo = await logoDataUri()
  const bg = photo ? await photoDataUri(photo) : null
  return (
    <div style={{ width: 1200, height: 630, display: "flex", position: "relative", background: "#070A11", color: "#ECF1FB", fontFamily: "sans-serif" }}>
      {bg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bg} width={1200} height={630} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.32 }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg,#070A11 35%,rgba(7,10,17,.55))" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={64} height={64} alt="" />
          <div style={{ fontSize: 26, letterSpacing: 7, fontWeight: 700 }}>DUAL NATURE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: "#FF7E22", textTransform: "uppercase", marginBottom: 18 }}>{kicker}</div>
          <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -3, fontWeight: 700, maxWidth: 900 }}>{title}</div>
          <div style={{ fontSize: 28, color: "#8C99B3", marginTop: 22, maxWidth: 860 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", height: 4, width: 260, background: "linear-gradient(90deg,#33A0FF,#7D6CF0,#FF7E22)" }} />
      </div>
    </div>
  )
}
