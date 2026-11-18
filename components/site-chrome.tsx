import Link from "next/link"

const NAV = [
  ["/#philosophy", "Philosophy"],
  ["/#energy", "Energy"],
  ["/#solar", "Solar ROI"],
  ["/#work", "Work"],
  ["/#products", "Products"],
  ["/about", "About"],
] as const

const MENU = [
  ["/#philosophy", "Philosophy"],
  ["/#energy", "Energy & Infrastructure"],
  ["/#solar", "Solar ROI"],
  ["/#work", "Our Work"],
  ["/#process", "Process"],
  ["/#products", "Precision Products"],
  ["/about", "About us"],
  ["/#contact", "Get a quote"],
] as const

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 116 116" aria-hidden className={className}>
      <use href="#dn-mark" />
    </svg>
  )
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id="gmk" x1="6" y1="50" x2="94" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#33A0FF" />
            <stop offset="1" stopColor="#FF7E22" />
          </linearGradient>
          <symbol id="dn-mark" viewBox="0 0 116 116">
            <g transform="translate(8,8)">
              <circle cx="50" cy="50" r="44" fill="none" stroke="url(#gmk)" strokeWidth="2.4" opacity=".5" />
              <path d="M15.4 50 C19 36,24.5 36,27.6 47.8 S34.9 64.5,41.2 50.4 S48 35,54.4 50" fill="none" stroke="url(#gmk)" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="62.9" cy="50" r="4.3" fill="#FF7E22" />
              <circle cx="73.9" cy="50" r="3.4" fill="#FF7E22" opacity=".82" />
              <circle cx="83.4" cy="50" r="2.6" fill="#FF7E22" opacity=".6" />
            </g>
          </symbol>
        </defs>
      </svg>

      <div className="cursor" aria-hidden><span className="c-dot" /><span className="c-ring" /></div>
      <div className="progress" aria-hidden><span id="progress" /></div>

      <header className="hdr" id="hdr">
        <Link className="brand" href="/" aria-label="Dual Nature home">
          <Mark />
          <span className="wm">DUAL&nbsp;NATURE</span>
        </Link>
        <nav className="links" aria-label="Primary">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} data-nav={href}>{label}</Link>
          ))}
        </nav>
        <div className="hdr-actions">
          <button className="icon-btn" id="themeBtn" type="button" aria-label="Toggle light or dark theme">
            <svg className="i-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
            <svg className="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.6v2.4M12 19v2.4M2.6 12H5M19 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M5.1 18.9l1.7-1.7M17.2 6.8l1.7-1.7" /></svg>
          </button>
          <Link className="btn btn-solid hdr-cta" href="/#contact">Get a quote</Link>
          <button className="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><span /><span /></button>
        </div>
      </header>

      <div className="menu" id="menu" aria-hidden="true">
        <nav aria-label="Mobile">
          {MENU.map(([href, label], i) => (
            <Link key={href} href={href}><i>{String(i + 1).padStart(2, "0")}</i>{label}</Link>
          ))}
        </nav>
        <div className="menu-foot">
          <a href="tel:+27674007509">067 400 7509</a>
          <a href="mailto:admin@dualnature.co.za">admin@dualnature.co.za</a>
        </div>
      </div>

      <main id="main">{children}</main>

      <footer className="foot">
        <div className="wrap foot-in">
          <Link className="brand" href="/" aria-label="Dual Nature home"><Mark /><span className="wm">DUAL&nbsp;NATURE</span></Link>
          <nav className="foot-links" aria-label="Footer">
            <Link href="/about">About</Link>
            <Link href="/#solar">Solar ROI</Link>
            <Link href="/#work">Our work</Link>
            <Link href="/#contact">Contact</Link>
          </nav>
          <p>© 2026 Dual Nature (Pty) Ltd · KwaZulu-Natal, South Africa</p>
          <p className="mono">Solar · Infrastructure · Precision Manufacturing · 100% CoC-certified</p>
        </div>
      </footer>

      <nav className="dock" aria-label="Quick actions">
        <a href="tel:+27674007509">
          <svg viewBox="0 0 24 24"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2" /></svg>Call
        </a>
        <Link href="/#contact" className="dock-main">Get a quote</Link>
        <a href="mailto:admin@dualnature.co.za">
          <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>Email
        </a>
      </nav>

      <div className="lb" id="lb" role="dialog" aria-modal="true" aria-label="Image viewer" hidden>
        <button className="lb-x" id="lbClose" type="button" aria-label="Close">×</button>
        <button className="lb-nav prev" id="lbPrev" type="button" aria-label="Previous image">‹</button>
        <figure><img id="lbImg" alt="" /><figcaption id="lbCap" /></figure>
        <button className="lb-nav next" id="lbNext" type="button" aria-label="Next image">›</button>
        <span className="lb-count mono" id="lbCount" />
      </div>
    </>
  )
}
