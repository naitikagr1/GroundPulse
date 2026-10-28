/* ════════════════════════════════════════════════════════════════
   Where "get started" goes.

   With the apps live there is no waitlist: an owner opens an account
   and books inside it, and somebody who wants to inspect applies from
   the inspector side of the sign-in. Until then — production today —
   every button keeps pointing at the waitlist, so nothing on the live
   site leads to a sign-in that 404s.
   ════════════════════════════════════════════════════════════════ */

import type { Route } from "next";
import { APPS_LIVE } from "@/lib/flags";

export const START = (APPS_LIVE ? "/signin?mode=signup" : "/access") as Route;
export const START_LABEL = APPS_LIVE ? "Get started" : "Join the waitlist";

/** The navbar's green button: what a new visitor gets, not the mechanics
    of an account. When the free places are all gone, change these to
    "Book an inspection" / "Book a visit" (see lib/offer). */
export const NAV_CTA = APPS_LIVE
  ? { long: "Book free inspection", short: "Free inspection" }
  : { long: "Get started", short: "Get started" };

/** The inspector application. */
export const APPLY = (APPS_LIVE ? "/signin?as=inspector&apply=1" : "/access?role=inspector") as Route;
