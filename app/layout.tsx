import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/Shell";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Saberra",
  title: {
    default: "Saberra — Stop losing what your organization knows",
    template: "%s | Saberra"
  },
  description:
    "Your organization is losing decisions, context, and commitments every day. Saberra captures them from meetings and emails and gives you Sera to query them.",
  keywords: [
    "institutional memory system",
    "institutional memory software",
    "organizational memory",
    "AI institutional memory",
    "knowledge management software",
    "meeting notes are not memory",
    "Google Meet institutional memory",
    "meeting transcript institutional memory",
    "Notion institutional memory template",
    "Notion knowledge management automation",
    "knowledge management for self-managing organizations",
    "institutional memory for nonprofits",
    "institutional memory for consultancies",
    "key person knowledge loss",
    "organizational knowledge retention",
    "AI organizational intelligence",
    "Saberra",
    "Sera AI"
  ],
  category: "Business software",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    title: "Saberra — Stop losing what your organization knows",
    description:
      "Decisions disappear. Context walks out the door. Saberra captures it from meetings and emails — Sera retrieves it on demand.",
    url: siteUrl,
    siteName: "Saberra",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Saberra — your organization's memory, intact. Ask Sera what you already know."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Saberra — Stop losing what your organization knows",
    description:
      "Decisions disappear. Context walks out the door. Saberra captures it and gives you Sera to query it on demand.",
    images: ["/og.png"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/saberra-icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/saberra-icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Saberra",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/saberra-logo-dark.png`,
        width: 200,
        height: 48
      },
      description:
        "Saberra is institutional memory infrastructure. It captures decisions, context, tasks, risks, and commitments from meetings and emails, and gives organizations Sera — an AI memory assistant that answers from human-reviewed organizational records.",
      foundingDate: "2024",
      areaServed: "Worldwide",
      knowsAbout: [
        "Institutional memory",
        "Organizational knowledge management",
        "Meeting intelligence",
        "Decision capture",
        "AI organizational infrastructure"
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Saberra",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en-US"
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#product`,
      name: "Saberra",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description:
        "Saberra captures organizational intelligence from Google Meet meetings and emails, structures it into human-reviewed records in Notion, and provides Sera — an AI assistant that queries your organization's memory.",
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        seller: { "@id": `${siteUrl}/#organization` }
      },
      featureList: [
        "Google Meet integration",
        "Email capture via forwarding",
        "Human review layer",
        "Notion memory backend",
        "Sera AI assistant",
        "Decision and task extraction",
        "Key-person risk reduction",
        "Organizational memory audit"
      ]
    }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
