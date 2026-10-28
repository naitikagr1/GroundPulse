"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useInstalled } from "@/components/app/usePlatform";
import { APPS_LIVE } from "@/lib/flags";

/* Opened from the home screen, StillYours is the app — not the marketing
   site. A marketing page reached from inside it (a logo, a sign-out) goes
   straight to the app instead. The legal pages stay reachable: the sign-in
   links to them, and people are entitled to read them anywhere. */
const STAYS = ["/terms", "/privacy", "/refunds", "/contact"];

export function StandaloneGuard() {
  const installed = useInstalled();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!APPS_LIVE || !installed || STAYS.some((p) => path.startsWith(p))) return;
    router.replace("/app");
  }, [installed, path, router]);
  return null;
}
