import { ImageResponse } from "next/og"
import { shareCard } from "@/lib/brand-image"

export const alt = "Dual Nature — certified solar, smart infrastructure and precision manufacturing in Durban, KwaZulu-Natal"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    await shareCard({
      kicker: "Solar · Infrastructure · Manufacturing",
      title: "Powering Durban homes and businesses.",
      sub: "20+ solar systems · 120 kW+ installed · 100% CoC-certified across KwaZulu-Natal.",
      photo: "flagship-logistics-rooftop.jpg",
    }),
    size
  )
}
