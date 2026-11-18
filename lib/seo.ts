/* Facts used for metadata and structured data — all taken from dualnature.co.za. */

export const SITE = {
  url: "https://www.dualnature.co.za",
  name: "Dual Nature",
  legalName: "Dual Nature (Pty) Ltd",
  phone: "+27674007509",
  phoneDisplay: "067 400 7509",
  email: "admin@dualnature.co.za",
  description:
    "Dual Nature powers Durban homes and businesses with engineered solar, smart infrastructure and precision manufactured products. 20+ solar systems, 120 kW+ installed, 100% CoC-certified across KwaZulu-Natal.",
}

const SERVICES = [
  ["Turnkey solar installation", "Load audits, custom system engineering, installation and final safety testing with a Certificate of Compliance — single-phase home hybrids to 3-phase commercial off-grid."],
  ["Solar panel washing and maintenance", "Scheduled panel washing and system maintenance to recover yield lost to dust, salt air and bird mess."],
  ["Smart home automation", "Sonoff hardware and Home Assistant ecosystems: smart switching, automated lighting and sensor networks."],
  ["CCTV and security", "IP camera arrays, NVR/DVR systems, remote monitoring and access-control integration."],
  ["Internet and connectivity", "Fibre, mesh Wi-Fi and backbone cabling for smart and security systems."],
  ["Solar, networking and CCTV equipment supply", "Inverters, batteries, panels, routers and cameras for installers, estates and direct clients."],
  ["Precision manufactured products", "CAD modelling, structural engineering and high-tolerance 3D fabrication in ABS, PETG, PLA, carbon-fibre blend and TPU."],
] as const

const AREA = [
  { "@type": "City", name: "Durban" },
  { "@type": "AdministrativeArea", name: "KwaZulu-Natal" },
]

export function siteGraph() {
  const org = `${SITE.url}/#organization`
  const biz = `${SITE.url}/#business`
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        logo: { "@type": "ImageObject", url: `${SITE.url}/icon-512.png`, width: 512, height: 512 },
        email: SITE.email,
        telephone: SITE.phone,
        contactPoint: { "@type": "ContactPoint", telephone: SITE.phone, email: SITE.email, contactType: "sales", areaServed: "ZA", availableLanguage: ["en"] },
      },
      {
        "@type": "Electrician",
        "@id": biz,
        name: SITE.legalName,
        description: SITE.description,
        url: SITE.url,
        image: `${SITE.url}/img/flagship-logistics-rooftop.jpg`,
        logo: `${SITE.url}/icon-512.png`,
        telephone: SITE.phone,
        email: SITE.email,
        address: { "@type": "PostalAddress", addressRegion: "KwaZulu-Natal", addressCountry: "ZA" },
        areaServed: AREA,
        parentOrganization: { "@id": org },
        knowsAbout: ["Solar PV", "Hybrid inverters", "3-phase systems", "Lithium battery storage", "Certificate of Compliance", "Home Assistant", "CCTV", "3D printing"],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services",
          itemListElement: SERVICES.map(([name]) => ({ "@type": "Offer", itemOffered: { "@id": `${SITE.url}/#service-${slug(name)}` } })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: "en-ZA",
        publisher: { "@id": org },
      },
      ...SERVICES.map(([name, description]) => ({
        "@type": "Service",
        "@id": `${SITE.url}/#service-${slug(name)}`,
        name,
        serviceType: name,
        description,
        provider: { "@id": biz },
        areaServed: AREA,
      })),
    ],
  }
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
