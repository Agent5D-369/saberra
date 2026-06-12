import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

const NOW = new Date("2026-06-12");

// Priority tiers
const HIGH = 0.9;
const MED = 0.7;
const LOW = 0.5;

interface RouteConfig {
  path: string;
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}

const routeConfigs: RouteConfig[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/audit", priority: HIGH, changeFrequency: "monthly" },
  { path: "/founding-access", priority: HIGH, changeFrequency: "monthly" },
  { path: "/pricing", priority: HIGH, changeFrequency: "monthly" },
  { path: "/calculator", priority: HIGH, changeFrequency: "monthly" },
  { path: "/how-it-works", priority: HIGH, changeFrequency: "monthly" },
  { path: "/sera", priority: HIGH, changeFrequency: "monthly" },
  { path: "/product", priority: MED, changeFrequency: "monthly" },
  { path: "/notion-template", priority: MED, changeFrequency: "monthly" },
  { path: "/use-cases/new-hire-onboarding", priority: MED, changeFrequency: "monthly" },
  { path: "/demo", priority: MED, changeFrequency: "monthly" },
  { path: "/teal", priority: MED, changeFrequency: "monthly" },
  { path: "/nonprofit", priority: MED, changeFrequency: "monthly" },
  { path: "/consultancy", priority: MED, changeFrequency: "monthly" },
  { path: "/for-self-managing-teams", priority: MED, changeFrequency: "monthly" },
  { path: "/for-nonprofits", priority: MED, changeFrequency: "monthly" },
  { path: "/for-consultancies", priority: MED, changeFrequency: "monthly" },
  { path: "/partners", priority: MED, changeFrequency: "monthly" },
  { path: "/weekly-pulse", priority: MED, changeFrequency: "monthly" },
  { path: "/resources", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/institutional-memory-system", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/meeting-notes-are-not-memory", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/notion-institutional-memory-template", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/saberra-vs-meeting-notetakers", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/notion-ai-vs-saberra", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/google-meet-institutional-memory", priority: MED, changeFrequency: "monthly" },
  { path: "/resources/key-person-knowledge-loss", priority: MED, changeFrequency: "monthly" },
  { path: "/institutional-memory-system", priority: MED, changeFrequency: "monthly" },
  { path: "/institutional-memory-infrastructure", priority: MED, changeFrequency: "monthly" },
  { path: "/cases", priority: MED, changeFrequency: "monthly" },
  { path: "/cases/governance-coordinator-transition", priority: MED, changeFrequency: "monthly" },
  { path: "/cases/nonprofit-leadership-handoff", priority: MED, changeFrequency: "monthly" },
  { path: "/cases/consultancy-delivery-lead", priority: MED, changeFrequency: "monthly" },
  { path: "/cases/amora", priority: MED, changeFrequency: "monthly" },
  { path: "/careers", priority: LOW, changeFrequency: "monthly" },
  { path: "/summit", priority: LOW, changeFrequency: "monthly" },
  { path: "/security", priority: LOW, changeFrequency: "yearly" },
  { path: "/privacy", priority: LOW, changeFrequency: "yearly" },
  { path: "/terms", priority: LOW, changeFrequency: "yearly" }
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routeConfigs.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified: NOW,
    changeFrequency,
    priority
  }));
}
