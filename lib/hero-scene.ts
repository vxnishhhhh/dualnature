/* Hero scene: a field of light that moves as a wave, then collapses into particles (the logo's three dots). */
import * as THREE from "three"

export type SceneHandle = { setProgress: (p: number) => void; setTheme: (t: string) => void; dispose: () => void }

declare global {
  interface Window { DNScene?: SceneHandle }
}

export function createHeroScene(canvas: HTMLCanvasElement): SceneHandle | null {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
  const small = matchMedia("(max-width:760px)").matches
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
  const wave = new Float32Array(N * 3), part = new Float32Array(N * 3), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N)
  const cB = new THREE.Color("#33A0FF"), cV = new THREE.Color("#7D6CF0"), cA = new THREE.Color("#FF7E22"), tmp = new THREE.Color()
  const orbs = [[-2.6, 0, 0, 1.9], [1.3, 0, 0, 1.5], [4.3, 0, 0, 1.15]]
  const weights = [0.47, 0.32, 0.21]
  for (let i = 0, k = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++, k++) {
    const u = j / (COLS - 1), v = i / (ROWS - 1)
    wave[k * 3] = (u - 0.5) * W; wave[k * 3 + 1] = 0; wave[k * 3 + 2] = (v - 0.5) * D
    const r = Math.random()
    const o = r < weights[0] ? orbs[0] : r < weights[0] + weights[1] ? orbs[1] : orbs[2]
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), rad = o[3] * Math.cbrt(0.55 + 0.45 * Math.random())
    part[k * 3] = o[0] + rad * Math.sin(ph) * Math.cos(th)
    part[k * 3 + 1] = o[1] + rad * Math.cos(ph)
    part[k * 3 + 2] = o[2] + rad * Math.sin(ph) * Math.sin(th)
    seed[k] = Math.random()
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

  let progress = 0, target = 0, mx = 0, my = 0, tx = 0, ty = 0, visible = true, running = false, disposed = false
  const applyTheme = (t: string) => { mat.blending = t === "light" ? THREE.NormalBlending : THREE.AdditiveBlending; mat.needsUpdate = true }
  applyTheme(document.documentElement.dataset.theme || "dark")

  const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse") { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5 } }
  addEventListener("pointermove", onMove, { passive: true })

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.position.z = w < h ? 15 : 11
    camera.updateProjectionMatrix()
    points.position.x = w < h ? -0.4 : 2.2
    points.position.y = w < h ? 2.4 : 0
    ring.position.set(points.position.x + 1, points.position.y, 0)
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  resize()
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick() })
  io.observe(canvas)
  const onVis = () => { if (!document.hidden) kick() }
  document.addEventListener("visibilitychange", onVis)

  const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  let last = performance.now()
  function frame(now: number) {
    if (disposed || !visible || document.hidden) { running = false; return }
    const dt = Math.min(50, now - last); last = now
    const t = reduced ? 0 : now * 0.001
    progress += (target - progress) * Math.min(1, dt * 0.006)
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05
    const m = ease(Math.min(1, Math.max(0, (progress - 0.08) / 0.7)))
    for (let k = 0; k < N; k++) {
      const i = k * 3, x = wave[i], z = wave[i + 2], s = seed[k]
      const y = Math.sin(x * 0.55 + t * 1.2) * 0.9 * Math.cos(z * 0.35 + t * 0.6) + Math.sin(x * 1.3 - t * 1.6 + z * 0.4) * 0.25
      const mm = Math.min(1, Math.max(0, m * 1.25 - s * 0.25))
      const jitter = mm * 0.05 * Math.sin(t * 3 + s * 40)
      pos[i] = x + (part[i] - x) * mm + jitter
      pos[i + 1] = y + (part[i + 1] - y) * mm + jitter
      pos[i + 2] = z + (part[i + 2] - z) * mm
      const a = mm * 0.85
      col[i] = base[i] + (cA.r - base[i]) * a; col[i + 1] = base[i + 1] + (cA.g - base[i + 1]) * a; col[i + 2] = base[i + 2] + (cA.b - base[i + 2]) * a
    }
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    points.rotation.y = mx * 0.5 + m * (t * 0.25)
    points.rotation.x = 0.18 + my * 0.25 - m * 0.1
    ring.rotation.z = t * 0.1
    renderer.render(scene, camera)
    if (reduced && Math.abs(target - progress) < 0.001) { running = false; return }
    requestAnimationFrame(frame)
  }
  function kick() { if (!running && !disposed) { running = true; last = performance.now(); requestAnimationFrame(frame) } }
  kick()

  return {
    setProgress: (p) => { target = p; if (reduced) kick() },
    setTheme: (t) => { applyTheme(t); kick() },
    dispose: () => {
      disposed = true
      removeEventListener("pointermove", onMove)
      document.removeEventListener("visibilitychange", onVis)
      ro.disconnect(); io.disconnect()
      geo.dispose(); mat.dispose(); sprite.dispose(); renderer.dispose()
    },
  }
}
