import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";
import { APPS_LIVE } from "@/lib/flags";

/* Priority reflects what we actually want ranked: the money pages first, the
   company pages last. changeFrequency is a hint, not a promise. */
const routes: [path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
  ["/", 1.0, "weekly"],
  ["/owners", 0.9, "monthly"],
  ["/cleaning", 0.9, "monthly"],
  ["/plots", 0.9, "monthly"],
  ["/pricing", 0.9, "monthly"],
  ["/how-it-works", 0.8, "monthly"],
  ["/sample-report", 0.7, "monthly"],
  ["/about", 0.6, "monthly"],
  /* the waitlist exists only until the apps are live */
  ...(APPS_LIVE ? [] : [["/access", 0.7, "monthly"] as [string, number, "monthly"]]),
  ["/network", 0.6, "monthly"],
  ["/platform", 0.5, "monthly"],
  ["/terms", 0.4, "yearly"],
  ["/privacy", 0.3, "yearly"],
  ["/refunds", 0.3, "yearly"],
  ["/contact", 0.4, "yearly"],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(([path, priority, changeFrequency]) => ({
    url: abs(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}
