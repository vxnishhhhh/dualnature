/* Dual Nature — interactions. Native scroll, no frameworks. */
(() => {
  const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const root = document.documentElement, body = document.body;
  const mqMobile = matchMedia('(max-width:760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const rand = n => 'R ' + Math.round(n).toLocaleString('en-ZA').replace(/,/g, ' ');

  /* loader */
  const done = () => { $('#loader')?.classList.add('done'); body.classList.add('ready'); };
  if (document.readyState === 'complete') setTimeout(done, 250); else addEventListener('load', () => setTimeout(done, 250));
  setTimeout(done, 2500);

  /* theme */
  $('#themeBtn').addEventListener('click', () => {
    const t = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = t; try { localStorage.setItem('dn-theme', t); } catch (e) {}
    $('meta[name=theme-color]').content = t === 'light' ? '#ECEFF6' : '#0A0E17';
    window.DNScene?.setTheme(t); drawChart();
  });

  /* menu */
  const burger = $('#burger'), menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', !open); body.classList.toggle('locked', open);
    if (open) $('a', menu).focus({ preventScroll: true });
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

  /* cursor */
  if (fine) {
    const dot = $('.c-dot'), ring = $('.c-ring'); let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; }, { passive: true });
    (function loop() { rx += (x - rx) * .18; ry += (y - ry) * .18; ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', e => body.classList.toggle('hov', !!e.target.closest('a,button,input,select,textarea,label,.shot')));
  }

  /* split quote into words for scroll-lit reading */
  const quote = $('[data-split]');
  if (quote) {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) f.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; f.append(s); } }); c.replaceWith(f); }
      else walk(c);
    });
    walk(quote);
  }
  const words = $$('.philo-quote .w');

  /* reveal + counters */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
    $$('[data-count]', e.target).forEach(count);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  function count(el) {
    const end = +el.dataset.count; if (reduced) { el.textContent = end; return; }
    const t0 = performance.now(); (function f(t) { const p = clamp((t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
  }

  /* services track */
  const seq = $('.energy-seq'), track = $('#track'), wrap = $('.track-wrap'), cards = $$('.svc'), dots = $('#trackDots'), countEl = $('#trackCount');
  cards.forEach((c, i) => {
    const b = document.createElement('button'); b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Service ' + (i + 1) + ': ' + $('h3', c).textContent);
    b.setAttribute('aria-selected', i === 0); b.addEventListener('click', () => goCard(i)); dots.append(b);
  });
  let activeCard = 0;
  const setCard = i => { if (i === activeCard) return; activeCard = i; $$('button', dots).forEach((b, k) => b.setAttribute('aria-selected', k === i)); countEl.textContent = `0${i + 1} / 06`; };
  function goCard(i) {
    if (mqMobile.matches) { const c = cards[i]; wrap.scrollTo({ left: c.offsetLeft - (wrap.clientWidth - c.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' }); }
    else { const max = seq.offsetHeight - innerHeight; scrollTo({ top: seq.offsetTop + max * (i / (cards.length - 1)), behavior: reduced ? 'auto' : 'smooth' }); }
  }
  wrap.addEventListener('scroll', () => {
    if (!mqMobile.matches) return; const mid = wrap.scrollLeft + wrap.clientWidth / 2; let best = 0, bd = 1e9;
    cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } }); setCard(best);
  }, { passive: true });

  /* process steps */
  const steps = [
    ['Load audit', 'Every system starts with a load audit — measuring what your property actually draws, so the design is scaled to the load.'],
    ['Engineering', 'Custom system engineering: single-phase home hybrids through to 3-phase commercial off-grid, sized for reliability and room to scale.'],
    ['Installation', 'Professional installation of panels, inverters, storage, combiner boxes and distribution boards — neat, protected and built to last.'],
    ['Testing & CoC', 'Final safety testing and sign-off with a full Certificate of Compliance, registered where required. 100% of our installs are certified.'],
    ['Maintenance', 'Scheduled panel washing and system maintenance recover lost yield from dust, salt air and bird mess — protecting your return.']
  ];
  const stepBtns = $$('.steps button'); let activeStep = -1;
  function setStep(i, fromUser) {
    if (i === activeStep) return; activeStep = i; const s = steps[i];
    stepBtns.forEach((b, k) => b.setAttribute('aria-selected', k === i));
    $('#stepIdx').textContent = `0${i + 1} / 05`; $('#stepTitle').textContent = s[0]; $('#stepCopy').textContent = s[1]; $('#stepLine').style.width = (i + 1) * 20 + '%';
    if (!reduced) $('.step-card').animate([{ opacity: .35, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' });
    if (fromUser && mqMobile.matches) stepBtns[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  }
  setStep(0);
  const pseq = $('.process-seq');
  stepBtns.forEach((b, i) => b.addEventListener('click', () => {
    if (mqMobile.matches) setStep(i, true);
    else { const max = pseq.offsetHeight - innerHeight; scrollTo({ top: pseq.offsetTop + max * ((i + .5) / steps.length), behavior: reduced ? 'auto' : 'smooth' }); }
  }));
  // swipe on step card (mobile)
  let sx = null, sy = null; const card = $('.step-card');
  card.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  card.addEventListener('touchend', e => {
    if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) setStep(clamp(activeStep + (dx < 0 ? 1 : -1), 0, 4), true);
  }, { passive: true });

  /* tilt (fine pointers) */
  if (fine && !reduced) $$('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; el.style.transform = `perspective(900px) rotateX(${(.5 - py) * 7}deg) rotateY(${(px - .5) * 9}deg) translateY(-4px)`; el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%'); });
    el.addEventListener('pointerleave', () => el.style.transform = '');
  });

  /* ROI calculator */
  const bill = $('#bill'), off = $('#offset'), chart = $('#roiChart'); let type = 'home';
  const calcState = {};
  function compute() {
    const B = +bill.value, O = +off.value / 100, esc = .12;
    const kwhMonth = B / 3.10, saveY1 = B * 12 * O;
    // indicative installed cost per kWh offset/month, residential vs commercial economies of scale
    const kwhOffset = kwhMonth * O, kwp = kwhOffset / (4.4 * 30);
    const cost = Math.max(type === 'home' ? 65000 : 90000, kwp * (type === 'home' ? 21000 : 16500)) + (type === 'home' ? 25000 : 0);
    const cum = [0]; let pay = null, s = 0;
    for (let y = 1; y <= 25; y++) { const yr = saveY1 * Math.pow(1 + esc, y - 1) * Math.pow(.995, y - 1) - cost * .01; s += yr; cum.push(s); if (pay == null && s >= cost) pay = y - 1 + (cost - (s - yr)) / yr; }
    Object.assign(calcState, { cost, cum, pay });
    $('#billOut').textContent = rand(B); $('#offOut').textContent = Math.round(O * 100) + '%';
    $('#r1').textContent = rand(saveY1); $('#rPay').textContent = pay ? '~' + pay.toFixed(1) + ' yrs' : '25+ yrs'; $('#r25').textContent = rand(s - cost);
    $('#payTag').textContent = pay ? 'PAYBACK ~YR ' + Math.round(pay) : 'PAYBACK 25+ YRS';
    [bill, off].forEach(r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'));
    drawChart();
  }
  let chartAnim = 1;
  function drawChart() {
    if (!calcState.cum) return;
    const dpr = Math.min(devicePixelRatio, 2), w = chart.clientWidth, h = chart.clientHeight; if (!w) return;
    chart.width = w * dpr; chart.height = h * dpr; const c = chart.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    const cs = getComputedStyle(root), line = cs.getPropertyValue('--line').trim(), muted = cs.getPropertyValue('--muted').trim(), fineC = cs.getPropertyValue('--fine').trim();
    const { cum, cost, pay } = calcState, max = Math.max(cum[25], cost) * 1.08, pl = 8, pr = 8, pt = 14, pb = 26;
    const X = y => pl + (w - pl - pr) * y / 25, Y = v => pt + (h - pt - pb) * (1 - v / max);
    c.strokeStyle = line; c.lineWidth = 1; c.font = '500 10px "DM Mono",monospace'; c.fillStyle = muted;
    [0, 5, 10, 15, 20, 25].forEach(y => { c.beginPath(); c.moveTo(X(y), pt); c.lineTo(X(y), h - pb); c.stroke(); c.textAlign = y === 0 ? 'left' : y === 25 ? 'right' : 'center'; c.fillText('YR ' + y, X(y), h - 8); });
    // free generation zone
    if (pay) { c.fillStyle = 'rgba(255,126,34,.07)'; c.fillRect(X(pay), pt, X(25) - X(pay), h - pt - pb); }
    // cost line
    c.setLineDash([6, 6]); c.strokeStyle = fineC; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(0), Y(cost)); c.lineTo(X(25), Y(cost)); c.stroke(); c.setLineDash([]);
    c.fillStyle = muted; c.textAlign = 'left'; c.fillText('SYSTEM COST ' + rand(cost), X(0) + 4, Y(cost) - 8);
    // savings curve
    const n = Math.max(1, Math.round(25 * chartAnim)); const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#33A0FF'); g.addColorStop(.52, '#7D6CF0'); g.addColorStop(1, '#FF7E22');
    const area = c.createLinearGradient(0, pt, 0, h - pb); area.addColorStop(0, 'rgba(125,108,240,.28)'); area.addColorStop(1, 'rgba(125,108,240,0)');
    c.beginPath(); c.moveTo(X(0), Y(0)); for (let y = 1; y <= n; y++) c.lineTo(X(y), Y(cum[y])); c.lineTo(X(n), Y(0)); c.closePath(); c.fillStyle = area; c.fill();
    c.beginPath(); c.moveTo(X(0), Y(0)); for (let y = 1; y <= n; y++) c.lineTo(X(y), Y(cum[y])); c.strokeStyle = g; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
    if (pay && pay <= n) { c.beginPath(); c.arc(X(pay), Y(cost), 6, 0, 7); c.fillStyle = '#FF7E22'; c.fill(); c.beginPath(); c.arc(X(pay), Y(cost), 12, 0, 7); c.strokeStyle = 'rgba(255,126,34,.4)'; c.lineWidth = 2; c.stroke(); }
  }
  $$('.seg button').forEach(b => b.addEventListener('click', () => {
    type = b.dataset.type; $$('.seg button').forEach(x => x.setAttribute('aria-selected', x === b));
    if (type === 'biz' && +bill.value < 8000) bill.value = 15000; if (type === 'home' && +bill.value > 12000) bill.value = 3000; compute();
  }));
  [bill, off].forEach(r => r.addEventListener('input', compute));
  new ResizeObserver(drawChart).observe(chart);
  new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); if (reduced) return; chartAnim = 0; const t0 = performance.now(); (function f(t) { chartAnim = clamp((t - t0) / 1400); drawChart(); if (chartAnim < 1) requestAnimationFrame(f); })(t0); }, { threshold: .3 }).observe(chart);
  compute();

  /* lightbox with swipe */
  const shots = $$('[data-lb]'), lb = $('#lb'), lbImg = $('#lbImg'); let li = 0, lastFocus = null;
  const caption = el => { const cap = el.closest('figure')?.querySelector('h3')?.textContent || el.querySelector('.g-cap')?.lastChild?.textContent || ''; return cap; };
  function showLb(i) {
    li = (i + shots.length) % shots.length; const img = $('img', shots[li]);
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; $('#lbCap').textContent = caption(shots[li]); $('#lbCount').textContent = `${li + 1} / ${shots.length}`;
  }
  function openLb(i) { lastFocus = document.activeElement; showLb(i); lb.hidden = false; requestAnimationFrame(() => lb.classList.add('show')); body.classList.add('locked'); $('#lbClose').focus(); }
  function closeLb() { lb.classList.remove('show'); body.classList.remove('locked'); setTimeout(() => lb.hidden = true, 300); lastFocus?.focus({ preventScroll: true }); }
  shots.forEach((s, i) => s.addEventListener('click', () => openLb(i)));
  $('#lbClose').addEventListener('click', closeLb); $('#lbPrev').addEventListener('click', () => showLb(li - 1)); $('#lbNext').addEventListener('click', () => showLb(li + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showLb(li - 1); if (e.key === 'ArrowRight') showLb(li + 1); if (e.key === 'Tab') { e.preventDefault(); $('#lbClose').focus(); } });
  let lx = null, ly = null;
  lb.addEventListener('touchstart', e => { lx = e.touches[0].clientX; ly = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchmove', e => { if (lx == null) return; const dx = e.touches[0].clientX - lx; lbImg.style.transform = `translateX(${dx * .6}px)`; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (lx == null) return; const dx = e.changedTouches[0].clientX - lx, dy = e.changedTouches[0].clientY - ly; lx = null; lbImg.style.transform = '';
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showLb(li + (dx < 0 ? 1 : -1)); else if (dy > 90) closeLb();
  }, { passive: true });

  /* quote form → mailto */
  $('#quote').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, name = f.name.value.trim(), note = $('#formNote');
    if (!name) { f.name.classList.add('err'); f.name.focus(); note.textContent = 'Please add your name so we know who to reply to.'; return; }
    f.name.classList.remove('err');
    const svcs = $$('input[name=svc]:checked', f).map(i => i.value).join(', ') || 'General enquiry';
    const bodyTxt = `Name: ${name}\nPhone: ${f.phone.value}\nProperty: ${f.type.value}\nInterested in: ${svcs}\n\n${f.msg.value}`;
    location.href = `mailto:admin@dualnature.co.za?subject=${encodeURIComponent('Quote request — ' + svcs)}&body=${encodeURIComponent(bodyTxt)}`;
    note.textContent = 'Opening your email app… If nothing happens, email admin@dualnature.co.za or call 067 400 7509.';
  });

  /* scroll engine: one rAF per frame */
  const hdr = $('#hdr'), bar = $('#progress'), heroSeq = $('.hero-seq'), heroInner = $('.hero-inner'), heroState = $('#heroState'), dock = $('.dock');
  const sections = $$('main section[id]'), navLinks = $$('.links a');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false; const y = scrollY, vh = innerHeight, mobile = mqMobile.matches;
    bar.style.transform = `scaleX(${y / Math.max(1, document.documentElement.scrollHeight - vh)})`;
    hdr.classList.toggle('solid', y > 40);
    const down = y > lastY + 4, up = y < lastY - 4;
    if (!menu.classList.contains('open')) { if (down && y > vh * .8) hdr.classList.add('hide'); else if (up) hdr.classList.remove('hide'); }
    if (dock) { const nearContact = $('#contact').getBoundingClientRect().top < vh * .6; dock.classList.toggle('away', nearContact || (y < vh * .5)); }
    lastY = y;

    // hero
    const hp = mobile ? clamp(y / (vh * .9)) : clamp(-heroSeq.getBoundingClientRect().top / Math.max(1, heroSeq.offsetHeight - vh));
    window.DNScene?.setProgress(hp);
    if (!reduced) { heroInner.style.transform = `translate3d(0,${hp * -60}px,0) scale(${1 - hp * .06})`; heroInner.style.opacity = 1 - clamp((hp - .45) / .5); }
    const isP = hp > .45; heroState.textContent = isP ? 'STATE / PARTICLE' : 'STATE / WAVE'; heroState.classList.toggle('particle', isP);

    // quote words
    if (words.length) { const r = quote.getBoundingClientRect(), p = clamp((vh * .85 - r.top) / (r.height + vh * .35)); const n = Math.round(p * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n || reduced)); }

    // energy horizontal
    if (!mobile) {
      const r = seq.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, seq.offsetHeight - vh));
      const maxX = track.scrollWidth - innerWidth; track.style.transform = `translate3d(${-p * maxX}px,0,0)`;
      setCard(Math.round(p * (cards.length - 1)));
      const pr = pseq.getBoundingClientRect(), pp = clamp(-pr.top / Math.max(1, pseq.offsetHeight - vh));
      if (pr.top < vh && pr.bottom > 0) setStep(Math.min(4, Math.floor(pp * 5)));
    }

    // active nav
    let cur = ''; sections.forEach(s => { if (s.getBoundingClientRect().top < vh * .4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(onScroll));
  mqMobile.addEventListener('change', () => { track.style.transform = ''; onScroll(); });
  onScroll();
})();
