<div align="center">

<img src="assets/img/logo.svg" width="96" alt="Dual Nature logo">

# DUAL NATURE

**Solar · Infrastructure · Precision Manufacturing**
KwaZulu-Natal, South Africa

*In quantum mechanics, light is both a wave and a particle. We were built on the same principle.*

[www.dualnature.co.za](https://www.dualnature.co.za) · 067 400 7509 · admin@dualnature.co.za

</div>

---

## The site

A single-page, cinematic rebuild of the Dual Nature website. Same content, same photography, same brand — rebuilt on the NVTRA design system.

![Flagship install](assets/img/flagship-logistics-rooftop.jpg)

| Section | What it does |
|---|---|
| **Hero** | A live WebGL field of light that moves as a **wave**, then collapses into the logo's three **particles** as you scroll. |
| **Philosophy** | The quote lights up word by word as you read. Animated counters: 20+ systems, 120 kW+, 100% CoC. |
| **Energy & Infrastructure** | Six services on a pinned horizontal track (desktop) / snap-swipe carousel (mobile). |
| **Solar ROI** | Interactive savings calculator — bill, offset and property type drive a live 25-year payback chart. |
| **Our Work** | Flagship 3-phase install, residential array and a swipeable gallery with a full-screen lightbox. |
| **Process** | Load audit → Engineering → Installation → Testing & CoC → Maintenance. |
| **Precision Products** | Tools, automotive aero and the 360° spin booth, plus the materials we print. |
| **Contact** | Quote builder that drafts an email — no backend, nothing stored. |

### Built for phones first
- Phone layouts are designed separately, not shrunk — no scroll-jacking on touch devices
- Native swipe carousels with snap points, swipe-to-change in the lightbox and process card
- Floating **Call · Get a quote · Email** dock within thumb reach, hidden near the form
- 44 px+ tap targets everywhere, 16 px form inputs (no iOS zoom), safe-area aware
- Lighter 3D scene on mobile, paused when off-screen; respects *reduce motion*
- Light / dark theme, keyboard accessible, no horizontal overflow

## Stack
Static HTML, CSS and vanilla JS. [three.js r128](https://threejs.org) from cdnjs for the hero. No build step.

```
index.html
assets/
  css/style.css
  js/main.js      # interactions, calculator, lightbox, scroll engine
  js/scene.js     # WebGL wave → particle hero
  img/            # original Dual Nature photography + logo
vercel.json
```

## Run locally
```bash
python3 -m http.server 4173
```
Open http://localhost:4173.

## Deploy
Import this repo into Vercel — framework preset **Other**, no build command, output directory `.` (root).

---

<sub>© 2026 Dual Nature (Pty) Ltd · KwaZulu-Natal, South Africa · 100% CoC-certified</sub>
