import type { MetadataRoute } from "next"
import { SITE } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "monthly", priority: 1, images: [`${SITE.url}/img/flagship-logistics-rooftop.jpg`] },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8, images: [`${SITE.url}/img/residential-rooftop.jpg`] },
  ]
}
