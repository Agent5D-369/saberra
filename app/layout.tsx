import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/Shell";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Saberra",
  title: {
    default: "Saberra | AI Organizational Intelligence Infrastructure",
    template: "%s | Saberra"
  },
  description:
    "Saberra gives your organization Sera, the AI Secretary that turns meetings and emails into human-reviewed operating intelligence.",
  keywords: [
    "AI organizational intelligence infrastructure",
    "AI organizational operator",
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
    title: "Saberra | AI Organizational Intelligence Infrastructure",
    description:
      "Copy Sera on meetings and important emails. She turns organizational chaos into structured, human-reviewed operating intelligence.",
    url: siteUrl,
    siteName: "Saberra",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Ask Sera what your organization already knows."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Saberra | AI Organizational Intelligence Infrastructure",
    description:
      "Ask Sera what your organization already knows.",
    images: ["/og.png"]
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
