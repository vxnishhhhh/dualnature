import { ImageResponse } from "next/og"
import { iconElement } from "@/lib/brand-image"

export const dynamic = "force-static"

export async function GET() {
  return new ImageResponse(await iconElement(512), { width: 512, height: 512 })
}
