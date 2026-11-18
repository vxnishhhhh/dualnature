"use client"

/**
 * Liquid sculpture — a GPU particle sculpture.
 *
 * The sculpture is rebuilt from up to ~100k GPU-simulated particles sampled from its own
 * pixels. Touching it turns the material into liquid plasma: fast material flashes like an
 * electric arc, a tap fires a surge with a branching arc, and current pulses travel along it
 * at rest. Without WebGL2 the static image is shown.
 */

import * as React from "react"

/* ────────────────────────────────────────────────────────────────────
   Engine (WebGL2 GPGPU particles)
   ──────────────────────────────────────────────────────────────────── */

type Rect = { x: number; y: number; w: number; h: number }

interface EngineOptions {
  interactive: boolean
  strength: number
  radius: number
  density: number
  dotSize: number
  spread: number
  turbulence: number
  returnSpeed: number
  streaks: boolean
  restStyle: "image" | "particles"
  ambient: boolean
  ambientIntensity: number
  speed: number
  intro: boolean
  reducedMotion: boolean
  bg: [number, number, number]
  imgBg: [number, number, number] | null
  liquid: number
  /** 0 – 2: brightness of the current pulses travelling along the material at rest */
  pulse: number
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

/* ── shaders ─────────────────────────────────────────────────────────── */

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv*vec2(3.2,1.7);
  vec2 a = vec2(vnoise(q+vec2(t*0.11,0.0))-0.5, vnoise(q+vec2(5.2,t*0.08)+3.1)-0.5);
  vec2 q2 = uv*vec2(7.5,4.0) + vec2(-t*0.19, t*0.13);
  vec2 b = vec2(vnoise(q2+1.7)-0.5, vnoise(q2+9.3)-0.5);
  return a + b*0.45;
}
`

/* energy of the material at a point: shared by image and particles so the cross-fade is complementary */
const ENERGY = `
float energyAt(vec2 rectPx, vec2 mouse, float radius, float presence, float wakeEnergy){
  vec2 d = rectPx - mouse;
  float f = exp(-dot(d,d)/(radius*radius))*presence;
  return smoothstep(0.06, 0.5, f*1.15 + wakeEnergy*1.7);
}
`

const QUAD_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`

/* Flow map (the wake left by the cursor). RGBA8: velocity encoded around 128, energy in B. */
const FLOW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;
vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.22;
  p = max(p, f*sp);
  v *= uDecay;
  p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`

/* GPGPU step: state = (offset.xy, velocity.xy) in rect CSS px. */
const SIM_FS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uFlow;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uStrength;
uniform float uSpread;
uniform float uTurb;
uniform float uReturn;
uniform float uTime;
uniform float uDt;
uniform float uIntro;
${NOISE}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hm = texelFetch(uHome, ij, 0);
  if(hm.w <= 0.0){ o = vec4(0.0); return; }
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;
  float sd = hm.z;
  float light = 0.45 + sd*1.1;

  vec2 p = hm.xy*uSize + off;
  vec4 fl = texture(uFlow, clamp(p/uSize, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  float pr = fl.b;

  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(pr*2.0 + f, 0.0, 1.0);

  vec2 acc = vec2(0.0);
  acc += n*f*1.25*uStrength*uSpread*light;
  acc += vec2(-n.y, n.x)*f*1.45*uStrength*uSpread*(0.4+sd);
  acc += (wake*42.0*uSpread*light - vel)*e*0.08;
  vec2 q = p*0.0095 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.2*uSpread + uIntro*1.5)*uTurb*light;
  float k = (0.006 + 0.02*uReturn)*(0.65+sd*0.7)*(1.0 - uIntro*0.75);
  acc -= off*k;

  vel += acc*uDt;
  vel *= pow(mix(0.93, 0.955, e), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004){ off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}
`

/* Particles: one instanced capsule per particle, stretched along its velocity. */
const PART_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uCol;
uniform sampler2D uFlow;
uniform int uTexW;
uniform vec4 uRect;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
uniform float uStreak;
uniform float uIntroVis;
uniform float uRest;
uniform vec3 uTint;
uniform vec3 uArc;
out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;
${NOISE}
${ENERGY}
void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hm = texelFetch(uHome, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  vec4 cl = texelFetch(uCol, ij, 0);

  float wakeE = texture(uFlow, hm.xy).b;
  float E = energyAt(hm.xy*uRect.zw, uMouse, uRadius, uPresence, wakeE);
  float lift = smoothstep(0.35, 2.5, length(st.xy));
  float a = max(max(E, lift), max(uRest, 1.0-uIntroVis));
  if(a < 0.01 || hm.w <= 0.0){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }

  vec2 base = uRect.xy + hm.xy*uRect.zw + st.xy;
  base -= ambientField(hm.xy, uTime)*10.0*uAmbient;

  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = uDot*hm.w*0.5;
  float len = min(sp*1.35, 22.0)*uStreak;
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 center = base - dir*len*0.5;
  vec2 world = center + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;

  vec2 clip = world/uRes*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc;
  vHalfLen = len*0.5;
  vR = r;
  vec3 col = cl.rgb*uTint;
  // fast material flashes like an electric arc: white-blue at speed, hot white at the peak
  float glint = smoothstep(2.0, 14.0, sp);
  float flash = smoothstep(12.0, 26.0, sp);
  col = mix(col, uArc, glint*0.8);
  col = mix(col, vec3(1.0), flash*0.55);
  vCol = col;
  vA = a;
}
`

const PART_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;
void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`

/* Image pass: the crisp sculpture, lensed by the cursor, fading out where the material has
   turned liquid, with current pulses running along it from left to right. */
const IMAGE_FS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uFlow;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uRect;
uniform vec3 uBg;
uniform vec3 uImgBg;
uniform vec2 uMouse;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;
uniform float uAmbient;
uniform float uIntroVis;
uniform float uRest;
uniform float uAlphaMode;
uniform float uPulse;
uniform vec3 uArc;
${NOISE}
${ENERGY}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y)/uDpr;
  vec2 size = uRect.zw;
  vec2 uv = (px-uRect.xy)/size;
  if(uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.12 || uv.y > 1.12){ o = vec4(0.0); return; }
  vec4 fl = texture(uFlow, clamp(uv,0.0,1.0));
  vec2 vel = (fl.rg*255.0-128.0)/127.0;
  vec2 rp = uv*size;
  vec2 toM = rp - uMouse;
  float fall = exp(-dot(toM,toM)/(uRadius*uRadius))*uPresence;
  vec2 disp = -toM*0.22*uStrength*fall - vel*10.0*uStrength;
  disp += ambientField(uv, uTime)*10.0*uAmbient;
  vec2 suv = uv + disp/size;
  vec4 tx = texture(uImg, suv);
  vec3 col = tx.rgb;
  vec2 e = smoothstep(vec2(0.0), vec2(0.004,0.01), suv) * smoothstep(vec2(1.0), vec2(0.996,0.99), suv);
  float key = uAlphaMode > 0.5 ? tx.a : smoothstep(0.012, 0.05, length(col-uImgBg));
  float k = key*e.x*e.y;
  float E = energyAt(rp, uMouse, uRadius, uPresence, fl.b);
  float show = (1.0 - max(E, uRest))*uIntroVis;
  vec3 mat = uAlphaMode > 0.5 ? col : col*(uBg/max(uImgBg, vec3(0.001)));
  // current: two trains of soft pulses running left to right, slightly noisy like real current
  float j = (vnoise(vec2(uv.y*18.0, uTime*2.0))-0.5)*0.015;
  float b1 = fract(uv.x*1.15 - uTime*0.32 + j);
  float b2 = fract(uv.x*0.7 - uTime*0.21 + 0.5 + j);
  float p1 = smoothstep(0.0, 0.05, b1)*smoothstep(0.13, 0.05, b1);
  float p2 = smoothstep(0.0, 0.04, b2)*smoothstep(0.09, 0.04, b2);
  float pulse = (p1 + p2*0.6)*uPulse*smoothstep(0.25, 0.9, key);
  mat = min(mat + uArc*pulse*0.85, vec3(1.0));
  float A = k*show;
  o = vec4(mat*A, A);
}
`

/* ── helpers ─────────────────────────────────────────────────────────── */

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh)
      gl.deleteShader(sh)
      throw new Error("Shader: " + log)
    }
    return sh
  }
  const p = gl.createProgram()!
  const v = make(gl.VERTEX_SHADER, vs)
  const f = make(gl.FRAGMENT_SHADER, fs)
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.bindAttribLocation(p, 0, "aPos")
  gl.linkProgram(p)
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Link: " + gl.getProgramInfoLog(p))
  const u: Record<string, WebGLUniformLocation | null> = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)
    if (info) u[info.name] = gl.getUniformLocation(p, info.name)
  }
  return { p, u }
}

/* ── engine ──────────────────────────────────────────────────────────── */

const TEX_W = 1024
const SETTLE_FRAMES = 270

class LiquidEngine {
  lastImage: HTMLImageElement | null = null
  onFirstFrame: (() => void) | null = null
  arc: [number, number, number] = [0.72, 0.88, 1.0]

  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private opts: EngineOptions
  private onFail: () => void
  private lowPower = false
  private stateFormat: { internal: number; type: number } = { internal: 0, type: 0 }

  private pFlow!: Prog
  private pSim!: Prog
  private pPart!: Prog
  private pImg!: Prog
  private vao!: WebGLVertexArrayObject
  private quad!: WebGLBuffer

  private imgTex: WebGLTexture | null = null
  private flowTex: WebGLTexture[] = []
  private flowFb: WebGLFramebuffer[] = []
  private flowW = 256
  private flowH = 104
  private flowIdx = 0
  private flowDirty = false

  private homeTex: WebGLTexture | null = null
  private colTex: WebGLTexture | null = null
  private stateTex: WebGLTexture[] = []
  private stateFb: WebGLFramebuffer[] = []
  private stateIdx = 0
  private texH = 1
  private n = 0
  private gridW = 1
  private stateDirty = false
  private alphaMode = false
  private imgBg: [number, number, number] = [0.918, 0.914, 0.906]
  private flowing = 0

  private aspect = 2.5
  private rect: Rect = { x: 0, y: 0, w: 1, h: 1 }
  private cssW = 1
  private cssH = 1

  private target = { x: -9999, y: -9999 }
  private mouse = { x: -9999, y: -9999 }
  private prevMouse = { x: -9999, y: -9999 }
  private mvel = { x: 0, y: 0 }
  private presence = 0
  private presenceTarget = 0
  private burst = 0
  private settle = 1e9
  private touchRelease = 0

  private time = 0
  private introT = 1
  private raf = 0
  private running = false
  private last = 0
  private skip = 0
  private visible = true
  private ready = false
  private destroyed = false
  private lost = false
  private homeData: Float32Array | null = null

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions, onFail: () => void) {
    this.canvas = canvas
    this.opts = opts
    this.onFail = onFail
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null
    if (!gl) throw new Error("WebGL2 unavailable")
    this.gl = gl
    const nav = navigator as Navigator & { deviceMemory?: number }
    this.lowPower =
      (nav.hardwareConcurrency || 8) <= 4 ||
      (nav.deviceMemory || 8) <= 4 ||
      window.matchMedia("(pointer: coarse)").matches
    this.initGL()
    canvas.addEventListener("webglcontextlost", this.onLost, false)
  }

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
    this.stop()
    this.onFail()
  }

  private initGL() {
    const gl = this.gl
    const full = gl.getExtension("EXT_color_buffer_float")
    const half = full ? null : gl.getExtension("EXT_color_buffer_half_float")
    if (!full && !half) throw new Error("No float render targets")
    this.stateFormat = { internal: gl.RGBA16F, type: gl.HALF_FLOAT }

    this.pFlow = compile(gl, QUAD_VS, FLOW_FS)
    this.pSim = compile(gl, QUAD_VS, SIM_FS)
    this.pPart = compile(gl, PART_VS, PART_FS)
    this.pImg = compile(gl, QUAD_VS, IMAGE_FS)

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    this.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < 2; i++) {
      const t = this.makeTex(gl.RGBA8, this.flowW, this.flowH, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      this.flowTex.push(t)
      this.flowFb.push(fb)
    }
    this.clearFlow()
  }

  private makeTex(internal: number, w: number, h: number, format: number, type: number, data: ArrayBufferView | null, filter: number) {
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  private clearFlow() {
    const gl = this.gl
    for (const fb of this.flowFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, this.flowW, this.flowH)
      gl.clearColor(128 / 255, 128 / 255, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.flowDirty = false
  }

  private clearState() {
    const gl = this.gl
    for (const fb of this.stateFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, TEX_W, this.texH)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.stateDirty = false
  }

  setImage(img: HTMLImageElement, playIntro: boolean) {
    if (this.destroyed || this.lost) return
    const gl = this.gl
    this.lastImage = img
    this.aspect = img.naturalWidth / img.naturalHeight || 2.5
    this.flowH = Math.max(32, Math.round(this.flowW / this.aspect))
    for (const t of this.flowTex) {
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.flowW, this.flowH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    this.clearFlow()
    if (this.imgTex) gl.deleteTexture(this.imgTex)
    this.imgTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.buildParticles(img)
    this.ready = true
    if (playIntro && this.opts.intro && !this.opts.reducedMotion) this.startIntro()
    this.wake()
  }

  private buildParticles(img: HTMLImageElement) {
    const gl = this.gl
    const baseGrid = this.lowPower ? 560 : 920
    const gw = Math.round(baseGrid * Math.sqrt(clamp(this.opts.density, 0.15, 2)))
    const gh = Math.max(1, Math.round(gw / this.aspect))
    this.gridW = gw
    let data: Uint8ClampedArray
    try {
      const c = document.createElement("canvas")
      c.width = gw
      c.height = gh
      const ctx = c.getContext("2d", { willReadFrequently: true })!
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, gw, gh)
      data = ctx.getImageData(0, 0, gw, gh).data
    } catch {
      throw new Error("Image is not readable")
    }
    let transparent = 0
    for (let i = 3; i < data.length; i += 4 * 7) if (data[i] < 250) transparent++
    this.alphaMode = transparent > data.length / (4 * 7) / 20
    if (this.opts.imgBg) this.imgBg = this.opts.imgBg
    else if (!this.alphaMode) {
      let r = 0, g = 0, b = 0, n = 0
      const pw = Math.max(2, Math.round(gw * 0.012))
      for (const [cx, cy] of [[0, 0], [gw - pw, 0], [0, gh - pw], [gw - pw, gh - pw]]) {
        for (let y = cy; y < cy + pw; y++)
          for (let x = cx; x < cx + pw; x++) {
            const i = (y * gw + x) * 4
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
          }
      }
      this.imgBg = [r / n / 255, g / n / 255, b / n / 255]
    }
    const home: number[] = []
    const col: number[] = []
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4
        const r = data[i] / 255
        const g = data[i + 1] / 255
        const b = data[i + 2] / 255
        if (this.alphaMode) {
          const a = data[i + 3] / 255
          if (a < 0.12) continue
          if (a < 0.5 && Math.random() > a * 2) continue
        } else {
          const dev = Math.hypot(r - this.imgBg[0], g - this.imgBg[1], b - this.imgBg[2])
          if (dev < 0.03) continue
          if (dev < 0.07 && Math.random() > (dev - 0.03) / 0.04) continue
        }
        const jx = (Math.random() - 0.5) * 0.6
        const jy = (Math.random() - 0.5) * 0.6
        home.push((x + 0.5 + jx) / gw, (y + 0.5 + jy) / gh, Math.random(), 0.85 + Math.random() * 0.3)
        col.push(data[i], data[i + 1], data[i + 2], 255)
      }
    }
    const n = home.length / 4
    this.n = n
    this.texH = Math.max(1, Math.ceil(n / TEX_W))
    const total = TEX_W * this.texH
    const homeArr = new Float32Array(total * 4)
    homeArr.set(home)
    const colArr = new Uint8Array(total * 4)
    colArr.set(col)

    for (const t of [this.homeTex, this.colTex, ...this.stateTex]) if (t) gl.deleteTexture(t)
    for (const f of this.stateFb) gl.deleteFramebuffer(f)
    this.stateTex = []
    this.stateFb = []
    this.homeTex = this.makeTex(gl.RGBA32F, TEX_W, this.texH, gl.RGBA, gl.FLOAT, homeArr, gl.NEAREST)
    this.colTex = this.makeTex(gl.RGBA8, TEX_W, this.texH, gl.RGBA, gl.UNSIGNED_BYTE, colArr, gl.NEAREST)
    for (let i = 0; i < 2; i++) {
      const t = this.makeTex(this.stateFormat.internal, TEX_W, this.texH, gl.RGBA, this.stateFormat.type, null, gl.NEAREST)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Float FBO incomplete")
      this.stateTex.push(t)
      this.stateFb.push(fb)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.homeData = homeArr
    this.clearState()
  }

  /** Scatter the material as sparks, flung out along the current's direction; it then assembles. */
  private startIntro() {
    const gl = this.gl
    const home = this.homeData
    if (!home) return
    const w = this.rect.w > 10 ? this.rect.w : 1300
    const total = TEX_W * this.texH
    const st = new Float32Array(total * 4)
    for (let i = 0; i < this.n; i++) {
      const hx = home[i * 4] - 0.5
      const hy = home[i * 4 + 1] - 0.5
      const sd = home[i * 4 + 2]
      const ang = (Math.random() - 0.5) * 1.1 + (hx > 0 ? 0 : Math.PI)
      const dist = w * (0.05 + Math.random() * 0.16) * (0.5 + Math.abs(hx) * 1.4)
      st[i * 4] = Math.cos(ang) * dist + hx * w * 0.25 * sd
      st[i * 4 + 1] = Math.sin(ang) * dist * 0.6 + hy * 140 * (Math.random() - 0.5)
    }
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.texImage2D(gl.TEXTURE_2D, 0, this.stateFormat.internal, TEX_W, this.texH, 0, gl.RGBA, gl.FLOAT, st)
    this.introT = 0
    this.stateDirty = true
  }

  setOptions(o: Partial<EngineOptions>) {
    const rebuild = o.density !== undefined && o.density !== this.opts.density
    this.opts = { ...this.opts, ...o }
    if (rebuild && this.ready && this.lastImage) {
      try {
        this.buildParticles(this.lastImage)
      } catch {
        this.onFail()
      }
    }
    this.wake()
  }

  resize(cssW: number, cssH: number, rect: Rect) {
    this.cssW = Math.max(1, cssW)
    this.cssH = Math.max(1, cssH)
    this.rect = rect
    let dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2)
    const px = this.cssW * this.cssH * dpr * dpr
    if (px > 4.5e6) dpr = Math.max(1, Math.sqrt(4.5e6 / (this.cssW * this.cssH)))
    const w = Math.round(this.cssW * dpr)
    const h = Math.round(this.cssH * dpr)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    this.draw()
  }

  setVisible(v: boolean) {
    this.visible = v
    if (v) this.wake()
    else this.stop()
  }

  pointer(type: "move" | "down" | "up" | "leave", x: number, y: number, touch: boolean) {
    if (!this.opts.interactive || this.lost) return
    const now = performance.now()
    if (type === "leave" || type === "up") {
      if (touch) this.touchRelease = now + 260
      else this.presenceTarget = 0
      this.wake()
      return
    }
    if (this.mouse.x < -9000 || type === "down") {
      this.mouse.x = this.prevMouse.x = x
      this.mouse.y = this.prevMouse.y = y
    }
    this.target.x = x
    this.target.y = y
    this.presenceTarget = 1
    this.settle = 0
    if (type === "down") {
      this.burst = 1
      this.touchRelease = 0
    }
    this.wake()
  }

  private wake() {
    if (!this.ready || this.running || !this.visible || this.destroyed || this.lost) {
      if (this.ready && !this.running) this.draw()
      return
    }
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private radiusPx() {
    return this.opts.radius * clamp(this.rect.w / 1400, 0.6, 1.25)
  }

  private strength() {
    return this.opts.strength * (this.opts.reducedMotion ? 0.5 : 1)
  }

  private frame = (now: number) => {
    if (!this.running) return
    const rawMs = now - this.last
    const dt = clamp(rawMs / 16.6667, 0.25, 3)
    this.last = now
    const o = this.opts
    const ambientOn = o.ambient && !o.reducedMotion

    if (this.touchRelease && now > this.touchRelease) {
      this.presenceTarget = 0
      this.touchRelease = 0
    }
    const ease = 1 - Math.pow(1 - 0.22, dt)
    this.mouse.x += (this.target.x - this.mouse.x) * ease
    this.mouse.y += (this.target.y - this.mouse.y) * ease
    const vx = (this.mouse.x - this.prevMouse.x) / dt
    const vy = (this.mouse.y - this.prevMouse.y) / dt
    this.prevMouse.x = this.mouse.x
    this.prevMouse.y = this.mouse.y
    this.mvel.x += (clamp(vx, -60, 60) - this.mvel.x) * 0.5
    this.mvel.y += (clamp(vy, -60, 60) - this.mvel.y) * 0.5
    const pk = this.presenceTarget > this.presence ? 0.1 : 0.035
    this.presence += (this.presenceTarget - this.presence) * (1 - Math.pow(1 - pk, dt))
    if (this.presence < 0.001 && this.presenceTarget === 0) this.presence = 0
    const fk = this.presenceTarget > this.flowing ? 0.05 : 0.018
    this.flowing += (this.presenceTarget - this.flowing) * (1 - Math.pow(1 - fk, dt))
    if (this.flowing < 0.002 && this.presenceTarget === 0) this.flowing = 0
    if (this.introT < 1) this.introT = Math.min(1, this.introT + Math.min(rawMs, 100) / 3200)

    const interacting = this.presence > 0.001 || this.burst > 0
    this.settle = interacting ? 0 : this.settle + dt
    const active = interacting || this.settle < SETTLE_FRAMES || this.introT < 1

    if (!active) {
      if (this.flowDirty) this.clearFlow()
      if (this.stateDirty) this.clearState()
      if (!ambientOn) {
        this.draw()
        this.firstFrame()
        this.stop()
        return
      }
      // at rest only the image pass runs (current pulses), at half rate
      this.raf = requestAnimationFrame(this.frame)
      if (this.skip++ % 2) return
      this.time += (dt * 2 * o.speed) / 60
      this.draw()
      this.firstFrame()
      return
    }
    this.raf = requestAnimationFrame(this.frame)
    this.time += (dt * o.speed * (1 + this.flowing * 1.6)) / 60
    this.stepFlow(dt)
    this.stepSim(dt)
    this.burst = Math.max(0, this.burst - 0.1 * dt)
    this.draw()
    this.firstFrame()
  }

  private firstFrame() {
    if (this.onFirstFrame) {
      const cb = this.onFirstFrame
      this.onFirstFrame = null
      requestAnimationFrame(() => cb())
    }
  }

  private stepFlow(dt: number) {
    const gl = this.gl
    const P = this.pFlow
    const dst = 1 - this.flowIdx
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.flowFb[dst])
    gl.viewport(0, 0, this.flowW, this.flowH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uPrev, 0)
    gl.uniform2f(P.u.uTexel, 1 / this.flowW, 1 / this.flowH)
    const r = this.rect
    gl.uniform2f(P.u.uMouse, (this.mouse.x - r.x) / r.w, (this.mouse.y - r.y) / r.h)
    gl.uniform2f(P.u.uVel, clamp(this.mvel.x / 40, -1, 1), clamp(this.mvel.y / 40, -1, 1))
    gl.uniform2f(P.u.uSize, r.w, r.h)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(P.u.uDecay, Math.pow(0.968, dt))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.flowIdx = dst
    this.flowDirty = true
  }

  private stepSim(dt: number) {
    if (!this.n) return
    const gl = this.gl
    const P = this.pSim
    const o = this.opts
    const r = this.rect
    const dst = 1 - this.stateIdx
    const intro = o.reducedMotion || !o.intro ? 0 : Math.pow(1 - this.introT, 2)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.stateFb[dst])
    gl.viewport(0, 0, TEX_W, this.texH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(P.u.uState, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.homeTex)
    gl.uniform1i(P.u.uHome, 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uFlow, 2)
    gl.uniform2f(P.u.uSize, r.w, r.h)
    gl.uniform2f(P.u.uMouse, this.mouse.x - r.x, this.mouse.y - r.y)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(P.u.uStrength, this.strength() * (1 + this.burst * 1.5))
    gl.uniform1f(P.u.uSpread, clamp(o.spread, 0, 2))
    gl.uniform1f(P.u.uTurb, clamp(o.turbulence, 0, 2) * (o.reducedMotion ? 0.3 : 1))
    gl.uniform1f(P.u.uReturn, clamp(o.returnSpeed, 0, 2))
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uDt, dt)
    gl.uniform1f(P.u.uIntro, intro)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.stateIdx = dst
    this.stateDirty = true
  }

  private draw() {
    if (!this.ready || this.lost || this.destroyed) return
    const gl = this.gl
    const o = this.opts
    const r = this.rect
    const rm = o.reducedMotion
    const introVis = rm || !o.intro ? 1 : Math.pow(this.introT, 2.2)
    const base = o.ambient && !rm ? clamp(o.ambientIntensity, 0, 2) : 0
    const amb = base + this.flowing * 0.85 * clamp(o.liquid, 0, 2) * (rm ? 0.3 : 1)
    const rest = o.restStyle === "particles" ? 1 : 0
    const [br, bg, bb] = o.bg
    const [ir, ig, ib] = this.imgBg
    const [ar, ag, ab] = this.arc
    const dpr = this.canvas.width / this.cssW
    const pres = Math.max(this.presence, this.burst)
    const mx = this.mouse.x - r.x
    const my = this.mouse.y - r.y

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.bindVertexArray(this.vao)
    gl.disable(gl.BLEND)

    const I = this.pImg
    gl.useProgram(I.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex)
    gl.uniform1i(I.u.uImg, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(I.u.uFlow, 1)
    gl.uniform2f(I.u.uRes, this.cssW, this.cssH)
    gl.uniform1f(I.u.uDpr, dpr)
    gl.uniform4f(I.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform3f(I.u.uBg, br, bg, bb)
    gl.uniform3f(I.u.uImgBg, ir, ig, ib)
    gl.uniform2f(I.u.uMouse, mx, my)
    gl.uniform1f(I.u.uPresence, pres)
    gl.uniform1f(I.u.uRadius, this.radiusPx())
    gl.uniform1f(I.u.uStrength, this.strength())
    gl.uniform1f(I.u.uTime, this.time)
    gl.uniform1f(I.u.uAmbient, amb)
    gl.uniform1f(I.u.uIntroVis, introVis)
    gl.uniform1f(I.u.uRest, rest)
    gl.uniform1f(I.u.uAlphaMode, this.alphaMode ? 1 : 0)
    gl.uniform1f(I.u.uPulse, rm ? 0 : clamp(o.pulse, 0, 2) * introVis)
    gl.uniform3f(I.u.uArc, ar, ag, ab)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    if (!this.n || (!this.stateDirty && rest === 0 && introVis >= 1)) return

    const P = this.pPart
    gl.useProgram(P.p)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(P.u.uState, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.homeTex)
    gl.uniform1i(P.u.uHome, 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.colTex)
    gl.uniform1i(P.u.uCol, 2)
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uFlow, 3)
    gl.uniform1i(P.u.uTexW, TEX_W)
    gl.uniform4f(P.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform2f(P.u.uRes, this.cssW, this.cssH)
    gl.uniform2f(P.u.uMouse, mx, my)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, pres)
    const spacing = r.w / this.gridW
    gl.uniform1f(P.u.uDot, spacing * 1.45 * clamp(o.dotSize, 0.2, 3))
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uAmbient, amb)
    gl.uniform1f(P.u.uStreak, (o.streaks ? 1 : 0) * (0.45 + 0.55 * introVis))
    gl.uniform1f(P.u.uIntroVis, introVis)
    gl.uniform1f(P.u.uRest, rest)
    gl.uniform1f(P.u.uDpr, dpr)
    gl.uniform3f(P.u.uArc, ar, ag, ab)
    if (this.alphaMode) gl.uniform3f(P.u.uTint, 1, 1, 1)
    else gl.uniform3f(P.u.uTint, br / Math.max(ir, 0.001), bg / Math.max(ig, 0.001), bb / Math.max(ib, 0.001))
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n)
    gl.disable(gl.BLEND)
  }

  destroy() {
    this.destroyed = true
    this.stop()
    this.canvas.removeEventListener("webglcontextlost", this.onLost)
    const gl = this.gl
    if (!this.lost) {
      gl.deleteBuffer(this.quad)
      gl.deleteVertexArray(this.vao)
      for (const t of [...this.flowTex, ...this.stateTex, this.imgTex, this.homeTex, this.colTex]) if (t) gl.deleteTexture(t)
      for (const f of [...this.flowFb, ...this.stateFb]) gl.deleteFramebuffer(f)
      for (const p of [this.pFlow, this.pSim, this.pPart, this.pImg]) if (p) gl.deleteProgram(p.p)
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext()
  }
}

/* ────────────────────────────────────────────────────────────────────
   Branching arcs (2D overlay): a surge on tap jumps to the nearest node
   ──────────────────────────────────────────────────────────────────── */

type Bolt = { pts: [number, number][]; w: number }[]

function makeBolt(x0: number, y0: number, x1: number, y1: number, depth = 0): Bolt {
  const pts: [number, number][] = [[x0, y0], [x1, y1]]
  let disp = Math.hypot(x1 - x0, y1 - y0) * 0.22
  for (let it = 0; it < 6; it++) {
    for (let i = pts.length - 1; i > 0; i--) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i]
      const mx = (ax + bx) / 2, my = (ay + by) / 2
      const nx = -(by - ay), ny = bx - ax
      const len = Math.hypot(nx, ny) || 1
      const d = (Math.random() - 0.5) * disp
      pts.splice(i, 0, [mx + (nx / len) * d, my + (ny / len) * d])
    }
    disp *= 0.55
  }
  const out: Bolt = [{ pts, w: depth ? 1.2 : 2.2 }]
  if (depth < 1) {
    for (let b = 0; b < 2; b++) {
      const i = Math.floor(pts.length * (0.25 + Math.random() * 0.45))
      const [sx, sy] = pts[i]
      const ang = Math.atan2(y1 - y0, x1 - x0) + (Math.random() - 0.5) * 1.6
      const l = Math.hypot(x1 - x0, y1 - y0) * (0.2 + Math.random() * 0.3)
      out.push(...makeBolt(sx, sy, sx + Math.cos(ang) * l, sy + Math.sin(ang) * l, depth + 1))
    }
  }
  return out
}

/* ────────────────────────────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────────────────────────────── */

export interface SculptureHeroLink {
  label: string
  href: string
}

export interface SculptureHeroProps {
  /** Sculpture image for wide layouts (transparent PNG / data URL works best). */
  src?: string
  /** Portrait sculpture image for phones. */
  mobileSrc?: string
  imageAlt?: string
  /** Points the tap-surge arcs jump to, as fractions of the image. */
  arcTargets?: { x: number; y: number }[]
  mobileArcTargets?: { x: number; y: number }[]
  /** Colour of fast material and arcs. */
  arcColor?: [number, number, number]

  eyebrow?: string
  headline?: string
  /** Part of the headline set in the accent colour. */
  headlineAccent?: string
  body?: string
  primaryCta?: SculptureHeroLink
  secondaryCta?: SculptureHeroLink
  hint?: string
  hintTouch?: string
  /** Space reserved at the top for a fixed site header, in px. */
  topInset?: number

  sculptureScale?: number
  mobileSculptureScale?: number
  sculptureX?: number
  sculptureY?: number

  interactive?: boolean
  strength?: number
  radius?: number
  particleDensity?: number
  dotSize?: number
  particleSpread?: number
  turbulence?: number
  liquid?: number
  streaks?: boolean
  restStyle?: "image" | "particles"
  returnSpeed?: number
  ambient?: boolean
  ambientIntensity?: number
  speed?: number
  intro?: boolean
  pulse?: number

  height?: string
  backdropText?: string
  id?: string
  className?: string
  style?: React.CSSProperties
}

/* ────────────────────────────────────────────────────────────────────
   Layout
   ──────────────────────────────────────────────────────────────────── */

function computeRect(
  w: number,
  h: number,
  aspect: number,
  band: { top: number; bottom: number },
  p: { scale: number; mobileScale: number; x: number; y: number }
): Rect {
  const bandH = Math.max(80, band.bottom - band.top)
  let rw: number
  let maxH: number
  if (w >= 1024) {
    rw = w * 0.96 * p.scale
    maxH = bandH * 1.05 * p.scale
  } else if (w >= 640) {
    rw = w * 1.15 * p.scale
    maxH = bandH * 1.1 * p.scale
  } else if (aspect < 1.3) {
    rw = w * 1.04 * p.mobileScale
    maxH = bandH * 1.0 * p.mobileScale
  } else {
    rw = w * 1.6 * p.mobileScale
    maxH = bandH * 1.15 * p.mobileScale
  }
  if (rw / aspect > maxH) rw = maxH * aspect
  const rh = rw / aspect
  const cx = w * (0.5 + p.x / 100)
  const cy = (band.top + band.bottom) / 2 + h * (p.y / 100)
  return { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh }
}

/* ────────────────────────────────────────────────────────────────────
   Styles (site tokens: --bg, --fg, --muted, --amber, --display, --sans, --mono)
   ──────────────────────────────────────────────────────────────────── */

const CSS = `
.sh-root{position:relative;width:100%;height:var(--sh-h);min-height:620px;overflow:hidden;isolation:isolate;container-type:size;
  background:var(--bg);color:var(--fg);font-family:var(--sans);touch-action:pan-y;display:flex;flex-direction:column;box-sizing:border-box}
.sh-root *,.sh-root *::before,.sh-root *::after{box-sizing:border-box}
.sh-stage{position:absolute;inset:0;z-index:0;pointer-events:none}
.sh-canvas,.sh-arcs{position:absolute;inset:0;width:100%;height:100%;display:block}
.sh-canvas{opacity:0;transition:opacity .6s ease}
.sh-arcs{z-index:1}
.sh-fallback{position:absolute;display:block;max-width:none;user-select:none;-webkit-user-drag:none;transition:opacity .6s ease}
.sh-root[data-gl="on"] .sh-canvas{opacity:1}
.sh-root[data-gl="on"] .sh-fallback{opacity:0}
.sh-root[data-gl="wait"] .sh-fallback{opacity:0}
.sh-root[data-swap="1"] .sh-canvas{opacity:0;transition-duration:.25s}
.sh-backdrop{position:absolute;left:50%;z-index:0;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;user-select:none;
  font-family:var(--display);font-weight:600;letter-spacing:-.06em;line-height:.8;color:color-mix(in srgb,var(--fg) 4%,transparent)}
.sh-hint{position:absolute;z-index:2;transform:translate(-50%,0);display:flex;align-items:center;gap:10px;white-space:nowrap;
  font:500 10.5px/1 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted);pointer-events:none;transition:opacity .8s ease}
.sh-hint::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--amber);animation:sh-pulse 2.4s ease-in-out infinite}
.sh-root[data-touched="1"] .sh-hint{opacity:0}
@keyframes sh-pulse{0%,100%{transform:scale(.6);opacity:.45}50%{transform:scale(1);opacity:1}}
.sh-spacer{flex:1 1 auto;min-height:0}
.sh-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:end;
  gap:clamp(24px,4cqw,72px);width:100%;max-width:1280px;margin:0 auto;padding:0 var(--gut,clamp(20px,3.2cqw,48px)) clamp(32px,4cqw,64px);pointer-events:none}
.sh-content a{pointer-events:auto}
.sh-eyebrow{font:500 11px/1.6 var(--mono);letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:0 0 clamp(14px,1.6cqw,22px);
  display:flex;align-items:center;gap:12px}
.sh-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--blue)}
.sh-h2{font-family:var(--display);font-weight:500;font-size:clamp(40px,min(6.4cqw,11cqh),112px);line-height:.94;letter-spacing:-.05em;margin:0;text-wrap:balance}
.sh-h2 .sh-line{display:block}
.sh-accent{color:var(--amber)}
.sh-aside{max-width:420px;justify-self:end;padding-bottom:.6em}
.sh-body{font-size:clamp(15px,1.1cqw,17px);line-height:1.6;margin:0 0 26px;color:var(--muted);text-wrap:pretty}
.sh-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:22px}
.sh-txt{display:inline-flex;align-items:center;gap:8px;min-height:44px;color:inherit;text-decoration:none;font:500 14.5px var(--display);
  border-bottom:1px solid var(--line2)}
.sh-txt svg{transition:transform .3s cubic-bezier(.2,.7,.2,1)}
.sh-txt:hover svg{transform:translateX(3px)}
@container (max-width:1023px){
  .sh-content{grid-template-columns:1fr;gap:24px}
  .sh-aside{justify-self:start;max-width:520px;padding-bottom:0}
  .sh-h2{font-size:clamp(40px,min(9.5cqw,9cqh),88px)}
}
@container (max-width:639px){
  .sh-h2{font-size:clamp(38px,min(12.5cqw,7.4cqh),60px)}
  .sh-body{font-size:15px;margin-bottom:18px}
  .sh-ctas{gap:16px}
  .sh-content{padding-bottom:36px}
}
@media (prefers-reduced-motion:reduce){
  .sh-hint::before{animation:none}
  .sh-canvas,.sh-fallback,.sh-txt svg{transition:none}
}
`

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function renderHeadline(text: string, accent: string) {
  return text.split("\n").map((line, li) => {
    let content: React.ReactNode = line
    const a = accent && accent.trim()
    if (a) {
      const idx = line.indexOf(a)
      if (idx >= 0) {
        content = (
          <>
            {line.slice(0, idx)}
            <span className="sh-accent">{a}</span>
            {line.slice(idx + a.length)}
          </>
        )
      }
    }
    return (
      <span className="sh-line" key={li}>
        {content}
      </span>
    )
  })
}

/* ────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────── */

export default function SculptureHero(props: SculptureHeroProps) {
  const {
    src,
    mobileSrc,
    imageAlt = "",
    arcTargets = [],
    mobileArcTargets,
    arcColor = [0.72, 0.88, 1.0],
    eyebrow,
    headline = "",
    headlineAccent = "",
    body,
    primaryCta,
    secondaryCta,
    hint = "Move across the current",
    hintTouch = "Touch the current",
    topInset = 88,
    sculptureScale = 1,
    mobileSculptureScale = 1,
    sculptureX = 0,
    sculptureY = 0,
    interactive = true,
    strength = 1,
    radius = 220,
    particleDensity = 1,
    particleSpread = 1,
    dotSize = 1,
    turbulence = 1,
    liquid = 1,
    streaks = true,
    restStyle = "image",
    returnSpeed = 1,
    ambient = true,
    ambientIntensity = 0.18,
    speed = 1,
    intro = true,
    pulse = 1,
    height = "100svh",
    backdropText = "",
    id,
    className,
    style,
  } = props

  const rootRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const arcsRef = React.useRef<HTMLCanvasElement>(null)
  const hintRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const engineRef = React.useRef<LiquidEngine | null>(null)
  const rectRef = React.useRef<Rect>({ x: 0, y: 0, w: 1, h: 1 })
  const aspectRef = React.useRef(2000 / 760)
  const [isTouch, setIsTouch] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const mobileRef = React.useRef(false)
  /** armed: close to the viewport, so the engine may exist. seen: visible enough to play the intro. */
  const [armed, setArmed] = React.useState(false)
  const [seen, setSeen] = React.useState(false)
  const introPlayed = React.useRef(false)

  const layout = React.useRef({ scale: sculptureScale, mobileScale: mobileSculptureScale, x: sculptureX, y: sculptureY })
  layout.current = {
    scale: clamp(sculptureScale, 0.3, 3),
    mobileScale: clamp(mobileSculptureScale, 0.3, 3),
    x: sculptureX,
    y: sculptureY,
  }

  const activeSrc = (isMobile && mobileSrc) || src || ""
  const targets = (isMobile && mobileArcTargets) || arcTargets
  const targetsRef = React.useRef(targets)
  targetsRef.current = targets

  const engineOpts = (rm: boolean): EngineOptions => ({
    interactive,
    strength: clamp(strength, 0, 2),
    radius: clamp(radius, 40, 600),
    density: clamp(particleDensity, 0.15, 2),
    dotSize: clamp(dotSize, 0.2, 3),
    spread: clamp(particleSpread, 0, 2),
    turbulence: clamp(turbulence, 0, 2),
    liquid: clamp(liquid, 0, 2),
    streaks,
    restStyle,
    returnSpeed: clamp(returnSpeed, 0, 2),
    ambient,
    ambientIntensity: clamp(ambientIntensity, 0, 2),
    speed: clamp(speed, 0.25, 3),
    intro,
    reducedMotion: rm,
    bg: [0, 0, 0],
    imgBg: null,
    pulse: clamp(pulse, 0, 2),
  })
  const optsRef = React.useRef(engineOpts)
  optsRef.current = engineOpts

  // arm when close, play the intro once it is properly in view
  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setArmed(true), { rootMargin: "60% 0px" })
    const view = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.3 })
    near.observe(root)
    view.observe(root)
    return () => {
      near.disconnect()
      view.disconnect()
    }
  }, [])

  const relayout = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const w = root.clientWidth
    const h = root.clientHeight
    const mob = w < 640
    if (mob !== mobileRef.current) {
      mobileRef.current = mob
      setIsMobile(mob)
    }
    const content = contentRef.current
    const band = { top: Math.min(topInset, h * 0.12), bottom: content ? content.offsetTop - 8 : h }
    if (mob && aspectRef.current < 1.3 && content) band.bottom += content.offsetHeight * 0.18
    const rect = computeRect(w, h, aspectRef.current, band, layout.current)
    rectRef.current = rect
    const bd = backdropRef.current
    if (bd) {
      const chars = Math.max(1, (bd.textContent || "").length)
      bd.style.fontSize = Math.min((band.bottom - band.top) * 0.9, (w * 0.94) / (chars * 0.6)) + "px"
      bd.style.top = (band.top + band.bottom) / 2 + "px"
    }
    const img = imgRef.current
    if (img) {
      img.style.left = rect.x + "px"
      img.style.top = rect.y + "px"
      img.style.width = rect.w + "px"
      img.style.height = rect.h + "px"
    }
    const arcs = arcsRef.current
    if (arcs) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      arcs.width = Math.round(w * dpr)
      arcs.height = Math.round(h * dpr)
    }
    const hintEl = hintRef.current
    if (hintEl) {
      hintEl.style.display = mob && aspectRef.current < 1.3 ? "none" : ""
      hintEl.style.left = clamp(rect.x + rect.w / 2, 80, w - 80) + "px"
      hintEl.style.top = Math.min(rect.y + rect.h * 0.92, band.bottom - 22) + "px"
    }
    engineRef.current?.resize(w, h, rect)
  }, [topInset])

  // engine lifecycle: created once armed
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!armed || !root || !stage) return
    const canvas = document.createElement("canvas")
    canvas.className = "sh-canvas"
    canvas.setAttribute("aria-hidden", "true")
    stage.insertBefore(canvas, arcsRef.current)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)")
    setIsTouch(coarse.matches)
    let engine: LiquidEngine | null = null
    const fail = () => {
      root.dataset.gl = "off"
    }
    try {
      engine = new LiquidEngine(canvas, optsRef.current(mq.matches), fail)
      engine.arc = arcColor
      engineRef.current = engine
      root.dataset.gl = "wait"
    } catch {
      fail()
    }

    const ro = new ResizeObserver(() => relayout())
    ro.observe(root)
    if (contentRef.current) ro.observe(contentRef.current)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) engine?.setVisible(e.isIntersecting && !document.hidden)
    })
    io.observe(root)
    const onVis = () => engine?.setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    const onMq = () => engine?.setOptions({ reducedMotion: mq.matches })
    mq.addEventListener?.("change", onMq)

    /* arc overlay */
    const actx = arcsRef.current?.getContext("2d") ?? null
    let arcRaf = 0
    const fire = (x: number, y: number) => {
      const targets = targetsRef.current
      if (!actx || mq.matches || !targets.length) return
      const r = rectRef.current
      let best = targets[0], bd = Infinity
      for (const t of targets) {
        const d = Math.hypot(r.x + t.x * r.w - x, r.y + t.y * r.h - y)
        if (d < bd) { bd = d; best = t }
      }
      const tx = r.x + best.x * r.w, ty = r.y + best.y * r.h
      if (Math.hypot(tx - x, ty - y) < 14) return
      const bolt = makeBolt(x, y, tx, ty)
      const t0 = performance.now()
      const [cr, cg, cb] = arcColor.map((v) => Math.round(v * 255))
      const light = document.documentElement.dataset.theme === "light"
      cancelAnimationFrame(arcRaf)
      const tick = (now: number) => {
        const k = (now - t0) / 380
        const c = actx.canvas
        const dpr = c.width / Math.max(1, root.clientWidth)
        actx.setTransform(1, 0, 0, 1, 0, 0)
        actx.clearRect(0, 0, c.width, c.height)
        if (k >= 1) return
        const flick = k < 0.5 ? 1 : (1 - k) * 2 * (0.6 + Math.random() * 0.4)
        actx.setTransform(dpr, 0, 0, dpr, 0, 0)
        actx.globalCompositeOperation = light ? "source-over" : "lighter"
        actx.lineCap = "round"
        actx.lineJoin = "round"
        for (const seg of bolt) {
          for (const [lw, a, col] of [[seg.w * 5, 0.18, `${cr},${cg},${cb}`], [seg.w, 0.95, light ? "40,90,200" : "255,255,255"]] as const) {
            actx.strokeStyle = `rgba(${col},${a * flick})`
            actx.lineWidth = lw
            actx.beginPath()
            seg.pts.forEach(([px, py], i) => (i ? actx.lineTo(px, py) : actx.moveTo(px, py)))
            actx.stroke()
          }
        }
        arcRaf = requestAnimationFrame(tick)
      }
      arcRaf = requestAnimationFrame(tick)
    }

    const pos = (e: PointerEvent) => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top] as const
    }
    let touched = false
    const markTouched = () => {
      if (!touched) {
        touched = true
        root.dataset.touched = "1"
      }
    }
    const inContent = (e: PointerEvent) => !!(e.target as Element).closest?.(".sh-content a")
    const onMove = (e: PointerEvent) => {
      const [x, y] = pos(e)
      const touch = e.pointerType === "touch"
      if (touch && e.buttons === 0 && e.pressure === 0) return
      engine?.pointer("move", x, y, touch)
      markTouched()
    }
    const onDown = (e: PointerEvent) => {
      if (inContent(e)) return
      const [x, y] = pos(e)
      engine?.pointer("down", x, y, e.pointerType === "touch")
      fire(x, y)
      markTouched()
    }
    const onUp = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("up", x, y, e.pointerType === "touch")
    }
    const onLeave = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("leave", x, y, e.pointerType === "touch")
    }
    root.addEventListener("pointermove", onMove, { passive: true })
    root.addEventListener("pointerdown", onDown, { passive: true })
    root.addEventListener("pointerup", onUp, { passive: true })
    root.addEventListener("pointercancel", onUp, { passive: true })
    root.addEventListener("pointerleave", onLeave, { passive: true })
    relayout()

    return () => {
      ro.disconnect()
      io.disconnect()
      cancelAnimationFrame(arcRaf)
      document.removeEventListener("visibilitychange", onVis)
      mq.removeEventListener?.("change", onMq)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      root.removeEventListener("pointerleave", onLeave)
      engine?.destroy()
      engineRef.current = null
      canvas.remove()
      delete root.dataset.gl
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, relayout])

  // relayout without an engine too (static fallback and backdrop)
  React.useEffect(() => {
    relayout()
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => relayout())
    ro.observe(root)
    return () => ro.disconnect()
  }, [relayout])

  // load the sculpture (first time with the intro, once it is in view)
  React.useEffect(() => {
    const root = rootRef.current
    const engine = engineRef.current
    if (!root || !activeSrc || !seen) return
    let cancelled = false
    const image = new Image()
    image.decoding = "async"
    const swapping = root.dataset.gl === "on"
    if (swapping) root.dataset.swap = "1"
    image.onload = () => {
      if (cancelled) return
      aspectRef.current = image.naturalWidth / image.naturalHeight || aspectRef.current
      relayout()
      if (engine && root.dataset.gl !== "off") {
        try {
          engine.onFirstFrame = () => {
            if (cancelled) return
            root.dataset.gl = "on"
            delete root.dataset.swap
          }
          engine.setImage(image, !introPlayed.current)
          introPlayed.current = true
          relayout()
        } catch {
          root.dataset.gl = "off"
        }
      } else delete root.dataset.swap
    }
    image.onerror = () => {
      delete root.dataset.swap
    }
    const t = window.setTimeout(() => (image.src = activeSrc), swapping ? 260 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
      image.onload = null
      image.onerror = null
    }
  }, [activeSrc, seen, armed, relayout])

  // read the source's aspect immediately so the static image is laid out correctly
  React.useEffect(() => {
    if (!activeSrc) return
    const im = new Image()
    im.onload = () => {
      aspectRef.current = im.naturalWidth / im.naturalHeight || aspectRef.current
      relayout()
    }
    im.src = activeSrc
    return () => {
      im.onload = null
    }
  }, [activeSrc, relayout])

  // live option updates
  React.useEffect(() => {
    const e = engineRef.current
    if (!e) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    e.setOptions(optsRef.current(rm))
  }, [interactive, strength, radius, particleDensity, dotSize, particleSpread, turbulence, liquid, streaks, restStyle, returnSpeed, ambient, ambientIntensity, speed, intro, pulse])

  React.useEffect(() => {
    relayout()
  }, [sculptureScale, mobileSculptureScale, sculptureX, sculptureY, relayout])

  const vars = { "--sh-h": height } as React.CSSProperties
  const hintText = isTouch ? hintTouch : hint

  return (
    <section ref={rootRef} id={id} className={"sh-root" + (className ? " " + className : "")} style={{ ...vars, ...style }} aria-labelledby={id ? `${id}-title` : undefined}>
      <style>{CSS}</style>
      {backdropText ? (
        <div ref={backdropRef} className="sh-backdrop" aria-hidden="true">
          {backdropText}
        </div>
      ) : null}
      <div ref={stageRef} className="sh-stage" role="img" aria-label={imageAlt}>
        {activeSrc ? <img ref={imgRef} className="sh-fallback" src={activeSrc} alt="" draggable={false} /> : null}
        <canvas ref={arcsRef} className="sh-arcs" aria-hidden="true" />
      </div>

      {interactive && hintText ? (
        <div ref={hintRef} className="sh-hint" aria-hidden="true">
          {hintText}
        </div>
      ) : null}

      <div className="sh-spacer" />

      <div ref={contentRef} className="sh-content">
        <div>
          {eyebrow ? <p className="sh-eyebrow">{eyebrow}</p> : null}
          <h2 className="sh-h2" id={id ? `${id}-title` : undefined}>{renderHeadline(headline, headlineAccent)}</h2>
        </div>
        <div className="sh-aside">
          {body ? <p className="sh-body">{body}</p> : null}
          <div className="sh-ctas">
            {primaryCta && primaryCta.label ? (
              <a className="btn btn-solid" href={primaryCta.href}>
                {primaryCta.label}
                <span aria-hidden>→</span>
              </a>
            ) : null}
            {secondaryCta && secondaryCta.label ? (
              <a className="sh-txt" href={secondaryCta.href}>
                {secondaryCta.label}
                <Arrow />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
