import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Space_Grotesk, Inter, DM_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SiteChrome } from "@/components/site-chrome"
import { SiteEffects } from "@/components/site-effects"
import { SmoothScroll } from "@/components/smooth-scroll"
import { SITE, siteGraph } from "@/lib/seo"
import "./globals.css"
import "./upgrade.css"

const display = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display", display: "swap" })
const sans = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans", display: "swap" })
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap", preload: false })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Dual Nature — Solar Installation, Smart Infrastructure & Manufacturing | Durban, KZN",
    template: "%s · Dual Nature",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "solar installation Durban",
    "solar installers KwaZulu-Natal",
    "CoC certified solar",
    "hybrid inverter installation",
    "3-phase solar",
    "Deye inverter",
    "battery backup load-shedding",
    "CCTV installation Durban",
    "Home Assistant smart home",
    "3D printing KZN",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: SITE.url,
    siteName: SITE.name,
    title: "Dual Nature — Solar · Infrastructure · Manufacturing",
    description: "Certified solar, smart-home automation, CCTV, connectivity and precision 3D-fabricated products across KwaZulu-Natal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dual Nature — Solar · Infrastructure · Manufacturing",
    description: "Certified solar, smart infrastructure and precision manufacturing in Durban & KwaZulu-Natal.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: true, email: true, address: false },
  category: "Solar energy",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070A11" },
    { media: "(prefers-color-scheme: light)", color: "#070A11" },
  ],
}

const themeBoot = `try{var t=localStorage.getItem('dn-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined
  return (
    <html lang="en-ZA" data-theme="dark" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph()) }} />
      </head>
      <body>
        <SiteChrome>{children}</SiteChrome>
        <SiteEffects />
        <SmoothScroll />
        {process.env.VERCEL ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  )
}
