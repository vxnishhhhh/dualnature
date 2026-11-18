import "server-only"
import { z } from "zod"

/*
 * Server environment, validated once when first imported. Everything is optional: without
 * RESEND_API_KEY the quote form falls back to the visitor's email app; without Upstash the
 * rate limit is in-memory per instance. Malformed values fail loudly instead of silently.
 */
const schema = z
  .object({
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    QUOTE_TO_EMAIL: z.email().default("admin@dualnature.co.za"),
    QUOTE_FROM_EMAIL: z.string().min(3).default("Dual Nature Website <onboarding@resend.dev>"),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(10).optional(),
  })
  .refine((e) => !!e.UPSTASH_REDIS_REST_URL === !!e.UPSTASH_REDIS_REST_TOKEN, {
    message: "Set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither",
  })

const blankToUndefined = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined)

const parsed = schema.safeParse({
  RESEND_API_KEY: blankToUndefined(process.env.RESEND_API_KEY),
  QUOTE_TO_EMAIL: blankToUndefined(process.env.QUOTE_TO_EMAIL),
  QUOTE_FROM_EMAIL: blankToUndefined(process.env.QUOTE_FROM_EMAIL),
  UPSTASH_REDIS_REST_URL: blankToUndefined(process.env.UPSTASH_REDIS_REST_URL),
  UPSTASH_REDIS_REST_TOKEN: blankToUndefined(process.env.UPSTASH_REDIS_REST_TOKEN),
})

if (!parsed.success) {
  // names only — never values
  throw new Error("Invalid environment: " + parsed.error.issues.map((i) => i.path.join(".") || i.message).join(", "))
}

export const env = parsed.data
