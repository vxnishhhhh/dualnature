import type { Metadata } from "next"
import Link from "next/link"
import { LostParticle } from "@/components/lost-particle"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <section className="lost" aria-labelledby="lost-title">
      <LostParticle />
      <div className="wrap lost-inner">
        <p className="kicker"><span className="sq amber-bg" />Error 404</p>
        <h1 className="lost-title" id="lost-title">Particle lost.</h1>
        <p className="lead">This page slipped out of the circuit. Everything else is still flowing.</p>
        <div className="hero-ctas">
          <Link className="btn btn-solid" href="/">Back to the current <span aria-hidden>→</span></Link>
          <Link className="btn btn-ghost" href="/about">About Dual Nature</Link>
        </div>
      </div>
    </section>
  )
}
