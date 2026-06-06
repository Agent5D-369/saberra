import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/Shell";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Saberra | Institutional Memory for Teams That Can't Afford to Forget",
    template: "%s | Saberra"
  },
  description:
    "Saberra turns Google Meet meetings, emails, decisions, tasks, risks, and roles into searchable institutional memory. Ask Sera what your organization already knows.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Saberra | Institutional Memory Infrastructure",
    description:
      "Human-reviewed organizational memory from Google Meet, email, Notion, and sourced Sera answers.",
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
