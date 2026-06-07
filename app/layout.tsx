import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/Shell";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Saberra",
  title: {
    default: "Saberra | Institutional Memory for Teams That Can't Afford to Forget",
    template: "%s | Saberra"
  },
  description:
    "Saberra turns Google Meet meetings, emailed transcripts, emails, decisions, tasks, risks, and roles into searchable institutional memory. Ask Sera what your organization already knows.",
  keywords: [
    "institutional memory system",
    "institutional memory software",
    "organizational memory",
    "AI institutional memory",
    "meeting notes are not memory",
    "Google Meet institutional memory",
    "meeting transcript institutional memory",
    "Notion institutional memory template",
    "Notion knowledge management automation",
    "knowledge management for self-managing organizations",
    "institutional memory for nonprofits",
    "institutional memory for consultancies",
    "AI Chief of Staff for organizational memory",
    "Saberra",
    "Sera"
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
    title: "Saberra | Institutional Memory Infrastructure",
    description:
      "Human-reviewed organizational memory from Google Meet, emailed transcripts, email, Notion, and sourced Sera answers.",
    url: siteUrl,
    siteName: "Saberra",
    type: "website",
    images: ["/og.svg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "Saberra | Institutional Memory Infrastructure",
    description:
      "Ask your organization what it already knows."
  },
  icons: {
    icon: [
      { url: "/saberra-icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/saberra-icon-512.png",
    apple: "/saberra-icon-512.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
