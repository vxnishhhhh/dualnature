/* Dual Nature — DOM interactions. Native scroll; every listener is removed on cleanup. */

const STEPS: [string, string][] = [
  ["Load audit", "Every system starts with a load audit — measuring what your property actually draws, so the design is scaled to the load."],
  ["Engineering", "Custom system engineering: single-phase home hybrids through to 3-phase commercial off-grid, sized for reliability and room to scale."],
  ["Installation", "Professional installation of panels, inverters, storage, combiner boxes and distribution boards — neat, protected and built to last."],
  ["Testing & CoC", "Final safety testing and sign-off with a full Certificate of Compliance, registered where required. 100% of our installs are certified."],
  ["Maintenance", "Scheduled panel washing and system maintenance recover lost yield from dust, salt air and bird mess — protecting your return."],
]

export function initSite(): () => void {
  const $ = <T extends Element = HTMLElement>(q: string, r: ParentNode = document) => r.querySelector<T>(q)
  const $$ = <T extends Element = HTMLElement>(q: string, r: ParentNode = document) => [...r.querySelectorAll<T>(q)]
  const root = document.documentElement, body = document.body
  const ac = new AbortController()
  const sig = { signal: ac.signal }
  const psig = { signal: ac.signal, passive: true } as AddEventListenerOptions
  const cleanups: (() => void)[] = []
  const mqMobile = matchMedia("(max-width:760px)")
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches
  const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n))
  const on = <K extends keyof WindowEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opts: AddEventListenerOptions = sig) =>
    t.addEventListener(type, fn as EventListener, opts)

  requestAnimationFrame(() => body.classList.add("ready"))

  /* theme */
  const themeBtn = $("#themeBtn")
  if (themeBtn) on(themeBtn, "click", () => {
    const t = root.dataset.theme === "light" ? "dark" : "light"
    root.dataset.theme = t
    try { localStorage.setItem("dn-theme", t) } catch {}
    const meta = $<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = t === "light" ? "#ECEFF6" : "#070A11"
    window.DNScene?.setTheme(t)
  })

  /* menu */
  const burger = $("#burger")!, menu = $("#menu")!
  const setMenu = (open: boolean) => {
    burger.setAttribute("aria-expanded", String(open))
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu")
    menu.classList.toggle("open", open)
    menu.setAttribute("aria-hidden", String(!open))
    body.classList.toggle("locked", open)
    if (open) $("a", menu)?.focus({ preventScroll: true })
  }
  setMenu(false)
  on(burger, "click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"))
  $$("a", menu).forEach((a) => on(a, "click", () => setMenu(false)))
  on(window, "keydown", (e: KeyboardEvent) => { if (e.key === "Escape" && menu.classList.contains("open")) setMenu(false) })

  /* cursor */
  if (fine && !reduced) {
    const dot = $(".c-dot")!, ring = $(".c-ring")!
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0
    on(window, "pointermove", (e: PointerEvent) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)` }, psig)
    const loop = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`; raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    cleanups.push(() => cancelAnimationFrame(raf))
    on(document, "pointerover", (e: PointerEvent) => body.classList.toggle("hov", !!(e.target as Element).closest?.("a,button,input,select,textarea,label,.shot,[data-peak-chart]")))
  }

  /* split quote into words */
  const quote = $("[data-split]")
  if (quote && !quote.dataset.done) {
    quote.dataset.done = "1"
    const walk = (n: Node) => [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment()
        ;(c.textContent || "").split(/(\s+)/).forEach((w) => {
          if (!w.trim()) f.append(w)
          else { const s = document.createElement("span"); s.className = "w"; s.textContent = w; f.append(s) }
        })
        c.replaceWith(f)
      } else walk(c)
    })
    walk(quote)
  }
  const words = $$(".w", quote || document.createElement("div"))

  /* reveals + counters */
  const count = (el: HTMLElement) => {
    const end = +(el.dataset.count || 0)
    if (reduced) { el.textContent = String(end); return }
    const t0 = performance.now()
    const f = (t: number) => { const p = clamp((t - t0) / 1400); el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f) }
    requestAnimationFrame(f)
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return
    e.target.classList.add("in")
    io.unobserve(e.target)
    $$("[data-count]", e.target).forEach(count)
  }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 })
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el) })
  cleanups.push(() => io.disconnect())

  /* services track */
  const seq = $(".energy-seq"), track = $("#track"), wrap = $(".track-wrap"), dots = $("#trackDots"), countEl = $("#trackCount")
  const cards = $$(".svc")
  let activeCard = 0
  const setCard = (i: number) => {
    if (i === activeCard || !dots) return
    activeCard = i
    $$("button", dots).forEach((b, k) => b.setAttribute("aria-selected", String(k === i)))
    if (countEl) countEl.textContent = `0${i + 1} / 0${cards.length}`
  }
  if (seq && track && wrap && dots) {
    dots.innerHTML = ""
    cards.forEach((c, i) => {
      const b = document.createElement("button")
      b.type = "button"; b.setAttribute("role", "tab")
      b.setAttribute("aria-label", `Service ${i + 1}: ${$("h3", c)?.textContent}`)
      b.setAttribute("aria-selected", String(i === 0))
      b.addEventListener("click", () => goCard(i), sig)
      dots.append(b)
    })
    const goCard = (i: number) => {
      if (mqMobile.matches) {
        const c = cards[i]
        wrap.scrollTo({ left: c.offsetLeft - (wrap.clientWidth - c.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" })
      } else {
        const max = seq.offsetHeight - innerHeight
        scrollTo({ top: seq.offsetTop + max * (i / (cards.length - 1)), behavior: reduced ? "auto" : "smooth" })
      }
    }
    on(wrap, "scroll", () => {
      if (!mqMobile.matches) return
      const mid = wrap.scrollLeft + wrap.clientWidth / 2
      let best = 0, bd = 1e9
      cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i } })
      setCard(best)
    }, psig)
  }

  /* process */
  const stepBtns = $$(".steps button"), pseq = $(".process-seq"), card = $(".step-card")
  let activeStep = -1
  const setStep = (i: number, fromUser = false) => {
    if (i === activeStep || !card) return
    activeStep = i
    stepBtns.forEach((b, k) => b.setAttribute("aria-selected", String(k === i)))
    $("#stepIdx")!.textContent = `0${i + 1} / 05`
    $("#stepBig")!.textContent = `0${i + 1}`
    $("#stepTitle")!.textContent = STEPS[i][0]
    $("#stepCopy")!.textContent = STEPS[i][1]
    $("#stepLine")!.style.width = (i + 1) * 20 + "%"
    if (!reduced) card.animate([{ opacity: 0.4, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" })
    if (fromUser && mqMobile.matches) stepBtns[i].scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "center" })
  }
  if (card && pseq) {
    setStep(0)
    stepBtns.forEach((b, i) => on(b, "click", () => {
      if (mqMobile.matches) setStep(i, true)
      else { const max = pseq.offsetHeight - innerHeight; scrollTo({ top: pseq.offsetTop + max * ((i + 0.5) / STEPS.length), behavior: reduced ? "auto" : "smooth" }) }
    }))
    let sx: number | null = null, sy = 0
    on(card, "touchstart", (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY }, psig)
    on(card, "touchend", (e: TouchEvent) => {
      if (sx == null) return
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy
      sx = null
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) setStep(clamp(activeStep + (dx < 0 ? 1 : -1), 0, 4), true)
    }, psig)
  }

  /* tilt */
  if (fine && !reduced) $$("[data-tilt]").forEach((el) => {
    on(el, "pointermove", (e: PointerEvent) => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 4}deg) rotateY(${(px - 0.5) * 5}deg) translateY(-3px)`
      el.style.setProperty("--mx", px * 100 + "%"); el.style.setProperty("--my", py * 100 + "%")
    })
    on(el, "pointerleave", () => { el.style.transform = "" })
  })

  /* lightbox */
  const shots = $$("[data-lb]"), lb = $("#lb"), lbImg = $<HTMLImageElement>("#lbImg")
  if (lb && lbImg && shots.length) {
    let li = 0, lastFocus: HTMLElement | null = null
    const caption = (el: HTMLElement) => el.dataset.cap || el.closest("figure")?.querySelector("h3")?.textContent || ""
    const show = (i: number) => {
      li = (i + shots.length) % shots.length
      const img = $<HTMLImageElement>("img", shots[li])!
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt
      $("#lbCap")!.textContent = caption(shots[li]); $("#lbCount")!.textContent = `${li + 1} / ${shots.length}`
    }
    const open = (i: number) => { lastFocus = document.activeElement as HTMLElement; show(i); lb.hidden = false; requestAnimationFrame(() => lb.classList.add("show")); body.classList.add("locked"); $("#lbClose")!.focus() }
    const close = () => { lb.classList.remove("show"); body.classList.remove("locked"); setTimeout(() => (lb.hidden = true), 300); lastFocus?.focus({ preventScroll: true }) }
    shots.forEach((s, i) => on(s, "click", () => open(i)))
    on($("#lbClose")!, "click", close)
    on($("#lbPrev")!, "click", () => show(li - 1))
    on($("#lbNext")!, "click", () => show(li + 1))
    on(lb, "click", (e: MouseEvent) => { if (e.target === lb) close() })
    on(window, "keydown", (e: KeyboardEvent) => {
      if (lb.hidden) return
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") show(li - 1)
      if (e.key === "ArrowRight") show(li + 1)
      if (e.key === "Tab") { e.preventDefault(); $("#lbClose")!.focus() }
    })
    let lx: number | null = null, ly = 0
    on(lb, "touchstart", (e: TouchEvent) => { lx = e.touches[0].clientX; ly = e.touches[0].clientY }, psig)
    on(lb, "touchmove", (e: TouchEvent) => { if (lx != null) lbImg.style.transform = `translateX(${(e.touches[0].clientX - lx) * 0.6}px)` }, psig)
    on(lb, "touchend", (e: TouchEvent) => {
      if (lx == null) return
      const dx = e.changedTouches[0].clientX - lx, dy = e.changedTouches[0].clientY - ly
      lx = null; lbImg.style.transform = ""
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(li + (dx < 0 ? 1 : -1))
      else if (dy > 90) close()
    }, psig)
  }

  /* scroll engine */
  const hdr = $("#hdr")!, bar = $("#progress")!, dock = $(".dock")
  const heroSeq = $(".hero-seq"), heroInner = $(".hero-inner"), heroState = $("#heroState"), contact = $("#contact")
  const sections = $$("main section[id]")
  const navLinks = $$<HTMLAnchorElement>(".links a")
  const path = location.pathname
  let lastY = scrollY, ticking = false
  const onScroll = () => {
    ticking = false
    const y = scrollY, vh = innerHeight, mobile = mqMobile.matches
    bar.style.transform = `scaleX(${y / Math.max(1, root.scrollHeight - vh)})`
    hdr.classList.toggle("solid", y > 40)
    const down = y > lastY + 4, up = y < lastY - 4
    if (!menu.classList.contains("open")) { if (down && y > vh * 0.8) hdr.classList.add("hide"); else if (up) hdr.classList.remove("hide") }
    if (dock) {
      const nearContact = contact ? contact.getBoundingClientRect().top < vh * 0.6 : false
      dock.classList.toggle("away", nearContact || y < vh * 0.5)
    }
    lastY = y

    if (heroSeq && heroInner) {
      const hp = mobile ? clamp(y / (vh * 0.9)) : clamp(-heroSeq.getBoundingClientRect().top / Math.max(1, heroSeq.offsetHeight - vh))
      window.DNScene?.setProgress(hp)
      if (!reduced) { heroInner.style.transform = `translate3d(0,${hp * -50}px,0)`; heroInner.style.opacity = String(1 - clamp((hp - 0.45) / 0.5)) }
      if (heroState) { const p = hp > 0.45; heroState.textContent = p ? "STATE / PARTICLE" : "STATE / WAVE"; heroState.classList.toggle("particle", p) }
    }

    if (words.length && quote) {
      const r = quote.getBoundingClientRect(), p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35))
      const n = Math.round(p * words.length)
      words.forEach((w, i) => w.classList.toggle("on", i < n || reduced))
    }

    if (!mobile && seq && track) {
      const r = seq.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, seq.offsetHeight - vh))
      track.style.transform = `translate3d(${-p * (track.scrollWidth - innerWidth)}px,0,0)`
      setCard(Math.round(p * (cards.length - 1)))
    }
    if (!mobile && pseq && card) {
      const pr = pseq.getBoundingClientRect(), pp = clamp(-pr.top / Math.max(1, pseq.offsetHeight - vh))
      if (pr.top < vh && pr.bottom > 0) setStep(Math.min(4, Math.floor(pp * 5)))
    }

    let cur = ""
    sections.forEach((s) => { if (s.getBoundingClientRect().top < vh * 0.4) cur = s.id })
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || ""
      a.classList.toggle("active", path === "/" ? href === "/#" + cur : href === path)
    })
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll) } }
  on(window, "scroll", req, psig)
  on(window, "resize", req, psig)
  on(mqMobile, "change", () => { if (track) track.style.transform = ""; onScroll() })
  onScroll()

  return () => {
    ac.abort()
    cleanups.forEach((f) => f())
    body.classList.remove("locked")
  }
}
