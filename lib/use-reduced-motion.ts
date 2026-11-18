"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"

/**
 * Reduced-motion preference that is identical on the server and the first client render
 * (always false), then follows the real preference. Prevents hydration mismatches when a
 * component renders a different tree for reduced motion.
 */
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && !!reduce
}
