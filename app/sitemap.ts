import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/how-it-works",
    "/teal",
    "/nonprofit",
    "/consultancy",
    "/for-self-managing-teams",
    "/for-nonprofits",
    "/for-consultancies",
    "/sera",
    "/pricing",
    "/audit",
    "/summit",
    "/notion-template",
    "/demo",
    "/founding-access",
    "/partners",
    "/institutional-memory-system",
    "/institutional-memory-infrastructure",
    "/resources",
    "/resources/institutional-memory-system",
    "/resources/meeting-notes-are-not-memory",
    "/resources/notion-institutional-memory-template",
    "/resources/saberra-vs-meeting-notetakers",
    "/resources/notion-ai-vs-saberra",
    "/resources/google-meet-institutional-memory",
    "/resources/key-person-knowledge-loss",
    "/weekly-pulse",
    "/product",
    "/cases/governance-coordinator-transition",
    "/cases/nonprofit-leadership-handoff",
    "/cases/consultancy-delivery-lead",
    "/careers",
    "/security",
    "/privacy",
    "/terms"
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date("2026-06-09"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
