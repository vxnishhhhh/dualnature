import { ImageResponse } from "next/og"
import { shareCard } from "@/lib/brand-image"

export const alt = "About Dual Nature — a hybrid technology company in KwaZulu-Natal"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    await shareCard({
      kicker: "About Dual Nature",
      title: "Most companies pick a lane. We were built on two.",
      sub: "Energy & infrastructure, and precision manufactured products — one standard of engineering.",
      photo: "residential-rooftop.jpg",
    }),
    size
  )
}
