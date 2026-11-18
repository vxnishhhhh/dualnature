import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Inter, DM_Mono } from "next/font/google"
import { SiteChrome } from "@/components/site-chrome"
import { SiteEffects } from "@/components/site-effects"
import "./globals.css"

const display = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" })
const sans = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-sans" })
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dualnature.co.za"),
  title: {
    default: "Dual Nature (Pty) Ltd — Solar · Infrastructure · Manufacturing | KwaZulu-Natal",
    template: "%s · Dual Nature",
  },
  description:
    "Powering Durban homes and businesses with engineered solar, smart infrastructure, and precision manufactured products. 20+ systems, 120 kW+ installed, 100% CoC-certified.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Dual Nature — Solar · Infrastructure · Manufacturing",
    description: "Turnkey solar, smart-home automation, CCTV, connectivity and precision 3D-fabricated products across KwaZulu-Natal.",
    images: ["/img/flagship-logistics-rooftop.jpg"],
    type: "website",
    locale: "en_ZA",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070A11",
}

const themeBoot = `try{var t=localStorage.getItem('dn-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`
const ld = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Dual Nature (Pty) Ltd",
  url: "https://www.dualnature.co.za",
  telephone: "+27674007509",
  email: "admin@dualnature.co.za",
  areaServed: "KwaZulu-Natal",
  address: { "@type": "PostalAddress", addressRegion: "KwaZulu-Natal", addressCountry: "ZA" },
  description: "Solar, infrastructure and precision manufacturing.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" data-theme="dark" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      </head>
      <body>
        <SiteChrome>{children}</SiteChrome>
        <SiteEffects />
      </body>
    </html>
  )
}
