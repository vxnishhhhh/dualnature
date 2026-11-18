"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect } from "react"

// the first paint is never delayed: transitions only run on client-side navigation
let firstLoad = true

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const animate = !firstLoad && !reduce
  useEffect(() => {
    firstLoad = false
  }, [])
  return (
    <>
      {animate && (
        <motion.div
          aria-hidden
          className="page-wipe"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          style={{ originY: 0 }}
        />
      )}
      <motion.div
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: animate ? 0.15 : 0, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </>
  )
}
