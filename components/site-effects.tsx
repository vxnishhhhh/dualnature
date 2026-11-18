"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { initSite } from "@/lib/site"

/** Runs the DOM interactions (header, menu, reveals, scroll scenes, lightbox) and re-binds them per route. */
export function SiteEffects() {
  const pathname = usePathname()
  useEffect(() => initSite(), [pathname])
  return null
}
