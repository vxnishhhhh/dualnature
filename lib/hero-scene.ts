/*
 * Hero scene: a field of light that moves as a wave. On scroll the field flows along its own
 * direction (left to right, like current) and gathers into the logo's three particles, placed
 * low and right of centre so they line up with the Live Current sculpture that follows.
 */
import * as THREE from "three"

export type SceneHandle = { setProgress: (p: number) => void; setTheme: (t: string) => void; dispose: () => void }

declare global {
  interface Window { DNScene?: SceneHandle }
}

/* Orb layout on screen (fractions of the viewport) — matches the Live Current artwork. */
const ORB_LAYOUT = {
  wide: { x: [0.637, 0.754, 0.855], y: 0.64, r: 0.046 },
  tall: { x: [0.62, 0.765, 0.885], y: 0.4, r: 0.052 },
}
const ORB_R = [4.3, 3.4, 2.6]
const ORB_SHARE = [0.47, 0.32, 0.21]

export function createHeroScene(canvas: HTMLCanvasElement): SceneHandle | null {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  const small = matchMedia("(max-width:760px)").matches
  const probe = document.createElement("canvas")
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return null
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2))
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 1.6, 11)

  const COLS = small ? 90 : 170, ROWS = small ? 44 : 70, N = COLS * ROWS
  const W = small ? 12 : 22, D = small ? 9 : 12
  const wave = new Float32Array(N * 3), pos = new Float32Array(N * 3), col = new Float32Array(N * 3)
  const seed = new Float32Array(N), colU = new Float32Array(N)
  const orbOf = new Uint8Array(N), ball = new Float32Array(N * 3)
  const target = new Float32Array(N * 3)
  const cB = new THREE.Color("#33A0FF"), cV = new THREE.Color("#7D6CF0"), cA = new THREE.Color("#FF7E22"), tmp = new THREE.Color()
  for (let i = 0, k = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++, k++) {
    const u = j / (COLS - 1), v = i / (ROWS - 1)
    wave[k * 3] = (u - 0.5) * W; wave[k * 3 + 1] = 0; wave[k * 3 + 2] = (v - 0.5) * D
    colU[k] = u
    seed[k] = Math.random()
    // rightmost columns feed the nearest (largest) orb first, like current entering a cell
    const r = Math.random() * 0.35 + u * 0.65
    orbOf[k] = r > 1 - ORB_SHARE[0] ? 0 : r > 1 - ORB_SHARE[0] - ORB_SHARE[1] ? 1 : 2
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), rad = Math.cbrt(0.35 + 0.65 * Math.random())
    ball[k * 3] = rad * Math.sin(ph) * Math.cos(th)
    ball[k * 3 + 1] = rad * Math.cos(ph)
    ball[k * 3 + 2] = rad * Math.sin(ph) * Math.sin(th)
    if (u < 0.52) tmp.copy(cB).lerp(cV, u / 0.52); else tmp.copy(cV).lerp(cA, (u - 0.52) / 0.48)
    col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b
  }
  const base = col.slice()
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3))
  const spriteCanvas = document.createElement("canvas")
  spriteCanvas.width = spriteCanvas.height = 64
  const sx = spriteCanvas.getContext("2d")!
  const g = sx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)")
  sx.fillStyle = g; sx.fillRect(0, 0, 64, 64)
  const sprite = new THREE.CanvasTexture(spriteCanvas)
  const mat = new THREE.PointsMaterial({ size: small ? 0.1 : 0.075, map: sprite, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })
  const points = new THREE.Points(geo, mat)
  scene.add(points)
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.615, 160), new THREE.MeshBasicMaterial({ color: 0x8c99b3, transparent: true, opacity: 0.08, side: THREE.DoubleSide }))
  ring.rotation.x = Math.PI / 2.3
  scene.add(ring)

  // the wave sits right of the copy on wide screens and above it on phones
  const waveOffset = new THREE.Vector3()
  let portrait = false

  let progress = 0, target_ = 0, mx = 0, my = 0, tx = 0, ty = 0, visible = true, running = false, disposed = false
  const applyTheme = (t: string) => { mat.blending = t === "light" ? THREE.NormalBlending : THREE.AdditiveBlending; mat.needsUpdate = true }
  applyTheme(document.documentElement.dataset.theme || "dark")

  const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse") { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5 } }
  addEventListener("pointermove", onMove, { passive: true })

  /** World-space orb centres at z = 0, from screen fractions. */
  const layoutTargets = () => {
    const L = portrait ? ORB_LAYOUT.tall : ORB_LAYOUT.wide
    const hh = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
    const hw = hh * camera.aspect
    const centres = L.x.map((fx) => [(fx - 0.5) * 2 * hw, camera.position.y - (L.y - 0.5) * 2 * hh])
    const r0 = L.r * 2 * hw * (portrait ? 1 : 1)
    for (let k = 0; k < N; k++) {
      const o = orbOf[k], rr = (r0 * ORB_R[o]) / ORB_R[0]
      target[k * 3] = centres[o][0] + ball[k * 3] * rr
      target[k * 3 + 1] = centres[o][1] + ball[k * 3 + 1] * rr
      target[k * 3 + 2] = ball[k * 3 + 2] * rr * 0.6
    }
  }

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    portrait = w < h
    camera.position.z = portrait ? 15 : 11
    camera.updateProjectionMatrix()
    waveOffset.set(portrait ? -0.4 : 2.2, portrait ? 2.4 : 0, 0)
    layoutTargets()
    kick()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick() })
  io.observe(canvas)
  const onVis = () => { if (!document.hidden) kick() }
  document.addEventListener("visibilitychange", onVis)

  const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
  const waveY = (x: number, z: number, t: number) =>
    Math.sin(x * 0.55 + t * 1.2) * 0.9 * Math.cos(z * 0.35 + t * 0.6) + Math.sin(x * 1.3 - t * 1.6 + z * 0.4) * 0.25

  let last = performance.now()
  function frame(now: number) {
    if (disposed || !visible || document.hidden) { running = false; return }
    const dt = Math.min(50, now - last); last = now
    const t = reduced ? 0 : now * 0.001
    progress += (target_ - progress) * Math.min(1, dt * 0.005)
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05
    // the collapse waits until the copy has cleared
    const m = Math.min(1, Math.max(0, (progress - 0.2) / 0.72))
    // group transform eases from the wave framing to identity, so targets are plain world space
    const gm = easeIO(m)
    points.position.set(waveOffset.x * (1 - gm), waveOffset.y * (1 - gm), 0)
    points.rotation.set((0.18 + my * 0.25) * (1 - gm), mx * 0.5 * (1 - gm), 0)
    for (let k = 0; k < N; k++) {
      const i = k * 3, x = wave[i], z = wave[i + 2], s = seed[k], u = colU[k]
      // rightmost material leaves first; the field streams rightwards behind it
      const d = (1 - u) * 0.45 + s * 0.12
      const mm = Math.min(1, Math.max(0, (m - d) / 0.43))
      const e = easeIO(mm)
      const cx = x + (target[i] - x) * e
      const cz = z + (target[i + 2] - z) * e
      // ride the wave while travelling, then settle into the orb
      const settle = smooth(0.5, 1, mm)
      const ride = waveY(cx, cz, t) * (1 - settle)
      const jitter = settle * 0.035 * Math.sin(t * 3 + s * 40)
      pos[i] = cx + jitter
      pos[i + 1] = ride + (target[i + 1] - ride) * settle + jitter
      pos[i + 2] = cz
      const a = smooth(0.15, 0.9, mm) * 0.9
      col[i] = base[i] + (cA.r - base[i]) * a; col[i + 1] = base[i + 1] + (cA.g - base[i + 1]) * a; col[i + 2] = base[i + 2] + (cA.b - base[i + 2]) * a
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    ring.position.set(points.position.x + 1, points.position.y, 0)
    ring.rotation.z = t * 0.1
    ;(ring.material as THREE.MeshBasicMaterial).opacity = 0.08 * (1 - gm)
    renderer.render(scene, camera)
    if (reduced && Math.abs(target_ - progress) < 0.001) { running = false; return }
    requestAnimationFrame(frame)
  }
  function kick() { if (!running && !disposed) { running = true; last = performance.now(); requestAnimationFrame(frame) } }
  resize()

  return {
    setProgress: (p) => { target_ = p; kick() },
    setTheme: (th) => { applyTheme(th); kick() },
    dispose: () => {
      disposed = true
      removeEventListener("pointermove", onMove)
      document.removeEventListener("visibilitychange", onVis)
      ro.disconnect(); io.disconnect()
      geo.dispose(); mat.dispose(); sprite.dispose(); renderer.dispose()
    },
  }
}
