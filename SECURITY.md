# Security

## Reporting a vulnerability

Please email **admin@dualnature.co.za** with "Security" in the subject line. Include the affected URL, the steps to reproduce, and the impact you observed. Please don't open a public issue for security problems.

We aim to acknowledge reports within five working days.

## What the site does to stay safe

- **Strict Content-Security-Policy** with a fresh nonce per request (`proxy.ts`): scripts only run if they come from this site and carry the nonce.
- **Security headers** on every response: HSTS (preload), `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `nosniff`, a strict Referrer-Policy, a locked-down Permissions-Policy and `Cross-Origin-Opener-Policy`.
- **Quote endpoint** (`/api/quote`): same-origin only, JSON only, 10 KB body cap, schema validation, honeypot and minimum-fill-time bot checks, per-IP rate limiting (Upstash Redis when configured), HTML-escaped email output and generic error messages. No personal data is logged or stored.
- **Secrets** live only in environment variables, validated at startup (`lib/env.ts`). Nothing secret is sent to the browser.
- **Dependencies** are pinned to exact versions, audited in CI and kept current by Dependabot.
