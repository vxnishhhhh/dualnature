/* Hero scene: a field of light that is a wave, then collapses into particles (the logo's three dots). */
(() => {
  const canvas = document.getElementById('scene');
  if (!canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width:760px)').matches;

  function fallback() {
    // 2D canvas fallback if WebGL/three is unavailable
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const draw = (t) => {
      const w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#33A0FF'); g.addColorStop(.52, '#7D6CF0'); g.addColorStop(1, '#FF7E22');
      ctx.strokeStyle = g; ctx.lineWidth = 3 * devicePixelRatio; ctx.beginPath();
      for (let x = 0; x <= w; x += 6) { const y = h * .45 + Math.sin(x / w * 12 + t / 600) * h * .08 * Math.sin(x / w * Math.PI); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); if (!reduced) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  function start() {
    if (!window.THREE) return fallback();
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
    catch (e) { return fallback(); }
    document.documentElement.classList.add('has-webgl');
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1.6, 11);

    const COLS = small ? 90 : 170, ROWS = small ? 44 : 70, N = COLS * ROWS;
    const W = small ? 12 : 22, D = small ? 9 : 12;
    const wave = new Float32Array(N * 3), part = new Float32Array(N * 3), pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N);
    const cB = new THREE.Color('#33A0FF'), cV = new THREE.Color('#7D6CF0'), cA = new THREE.Color('#FF7E22'), tmp = new THREE.Color();
    // particle targets: three spheres in a line like the logo dots (sizes 4.3 / 3.4 / 2.6)
    const orbs = [[-2.6, 0, 0, 1.9], [1.3, 0, 0, 1.5], [4.3, 0, 0, 1.15]];
    const weights = [.47, .32, .21];
    for (let i = 0, k = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++, k++) {
      const u = j / (COLS - 1), v = i / (ROWS - 1);
      wave[k * 3] = (u - .5) * W; wave[k * 3 + 1] = 0; wave[k * 3 + 2] = (v - .5) * D;
      const r = Math.random(); const o = r < weights[0] ? orbs[0] : r < weights[0] + weights[1] ? orbs[1] : orbs[2];
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), rad = o[3] * Math.cbrt(.55 + .45 * Math.random());
      part[k * 3] = o[0] + rad * Math.sin(ph) * Math.cos(th); part[k * 3 + 1] = o[1] + rad * Math.cos(ph); part[k * 3 + 2] = o[2] + rad * Math.sin(ph) * Math.sin(th);
      seed[k] = Math.random();
      if (u < .52) tmp.copy(cB).lerp(cV, u / .52); else tmp.copy(cV).lerp(cA, (u - .52) / .48);
      col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const base = col.slice();
    const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const mat = new THREE.PointsMaterial({ size: small ? .11 : .085, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const points = new THREE.Points(geo, mat); scene.add(points);

    // orbit ring for depth
    const ringG = new THREE.RingGeometry(5.6, 5.62, 128); const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0x33A0FF, transparent: true, opacity: .14, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2.3; scene.add(ring);

    let progress = 0, target = 0, mx = 0, my = 0, tx = 0, ty = 0, visible = true, running = false, light = false;
    window.DNScene = { setProgress: p => { target = p; }, setTheme: t => { light = t === 'light'; mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; mat.needsUpdate = true; kick(); } };
    light = document.documentElement.dataset.theme === 'light'; if (light) { mat.blending = THREE.NormalBlending; }

    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; } }, { passive: true });
    if (small && window.DeviceOrientationEvent) addEventListener('deviceorientation', e => { if (e.gamma != null) { tx = Math.max(-.5, Math.min(.5, e.gamma / 60)); ty = Math.max(-.5, Math.min(.5, (e.beta - 45) / 90)); } }, { passive: true });

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.z = w < h ? 15 : 11; camera.updateProjectionMatrix();
      points.position.x = w < h ? -0.4 : 2.2; ring.position.x = points.position.x + 1;
      points.position.y = w < h ? 1.8 : 0; ring.position.y = points.position.y;
    }
    new ResizeObserver(resize).observe(canvas); resize();

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });

    const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    let last = performance.now();
    function frame(now) {
      if (!visible || document.hidden) { running = false; return; }
      const dt = Math.min(50, now - last); last = now;
      const t = reduced ? 0 : now * .001;
      progress += (target - progress) * Math.min(1, dt * .006);
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      const m = ease(Math.min(1, Math.max(0, (progress - .08) / .7)));
      for (let k = 0; k < N; k++) {
        const i = k * 3, x = wave[i], z = wave[i + 2], s = seed[k];
        const y = Math.sin(x * .55 + t * 1.2) * .9 * Math.cos(z * .35 + t * .6) + Math.sin(x * 1.3 - t * 1.6 + z * .4) * .25;
        const mm = Math.min(1, Math.max(0, m * 1.25 - s * .25));
        const jitter = mm * .05 * Math.sin(t * 3 + s * 40);
        pos[i] = x + (part[i] - x) * mm + jitter;
        pos[i + 1] = y + (part[i + 1] - y) * mm + jitter;
        pos[i + 2] = z + (part[i + 2] - z) * mm;
        // particle state shifts colour toward amber
        const a = mm * .85;
        col[i] = base[i] + (cA.r - base[i]) * a; col[i + 1] = base[i + 1] + (cA.g - base[i + 1]) * a; col[i + 2] = base[i + 2] + (cA.b - base[i + 2]) * a;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      points.rotation.y = mx * .5 + m * (t * .25); points.rotation.x = .18 + my * .25 - m * .1;
      ring.rotation.z = t * .1; ring.material.opacity = .06 + m * .16;
      renderer.render(scene, camera);
      if (reduced && Math.abs(target - progress) < .001) { running = false; return; }
      requestAnimationFrame(frame);
    }
    function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
    kick();
  }
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
