"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, ChevronDown, FileCheck2, Handshake, Scale, ShieldCheck } from "lucide-react";
import { DEPOSIT, HOLD, PENALTY } from "@/lib/payout";
import { inr } from "@/lib/pricing";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

/* What applying to inspect actually involves — shown to the applicant,
   and read by owners as proof of who comes to their door. Every line
   is something we do or the apps enforce; the money figures come from
   the same constants the inspector app charges by. */

const DOCS = ["Aadhaar", "PAN", "Address proof", "Police verification", "Two references"];

const SUMMARY = [
  "We meet you in person in Bengaluru and check your original Aadhaar, PAN and address proof.",
  "Police verification is filed, and two references are actually called.",
  "You wear a body camera on every visit, and your first two visits are done beside one of the founders.",
];

const GROUPS = [
  {
    I: BadgeCheck, t: "Before your number is added",
    items: [
      "An in-person meeting in Bengaluru — originals of your Aadhaar, PAN and address proof, checked against you",
      "Police verification filed, and the result kept on your file",
      "Two references, called by us — not a form they fill in",
      "Your first two visits done beside one of the founders",
      "Your first reports read by us before the owner sees them",
    ],
  },
  {
    I: ShieldCheck, t: "On every visit",
    items: [
      "Only a number on the roster can sign in, with a one-time code",
      "The checklist opens only with the owner's entry code, read out at the door",
      "A body camera records the whole visit, start to finish",
      "GPS and the time on every photo",
      "The visit closes only with the owner's completion code — once the keys are back",
    ],
  },
  {
    I: Scale, t: "What keeps it honest",
    items: [
      `A security deposit built from your pay — ${DEPOSIT.rate * 100}% of each job until ${inr(DEPOSIT.target)} is in. Never asked for in cash`,
      `${inr(PENALTY.noShow)} from it for a no-show, ${inr(PENALTY.lateRelease)} for dropping a job inside ${PENALTY.freeReleaseHours} hours`,
      `${HOLD.untilUnlock} jobs at a time to start, ${HOLD.max} once ${inr(DEPOSIT.unlock)} of the deposit is in`,
    ],
  },
  {
    I: Handshake, t: "What you get from us",
    items: [
      "Help with the paperwork — which documents to bring, and how to apply for police verification",
      "What each job pays, shown before you claim it — and paid the same day to your UPI",
      "Someone at StillYours on call during every visit, for a door code that fails or anything that looks wrong",
    ],
  },
] as const;

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0);

export function Vetting() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[14px] border border-line-2 bg-white/70 p-4 sm:p-5">
      <div className="text-[14.5px] font-semibold">What applying leads to</div>

      <p className="t-small mt-1.5">What we check before your number is added:</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {DOCS.map((d) => (
          <li key={d} className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1 text-[12.5px] font-medium text-accent">
            <FileCheck2 size={12} /> {d}
          </li>
        ))}
      </ul>

      <ul className="mt-3.5 grid gap-2">
        {SUMMARY.map((t) => (
          <li key={t} className="flex gap-2.5 text-[14px] leading-relaxed text-text-2">
            <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-accent" />
            {t}
          </li>
        ))}
      </ul>

      <button
        type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-[12px] border border-line-2 bg-paper px-4 py-3 text-left text-[14px] font-semibold transition hover:border-accent/40"
      >
        {open ? "Hide the full process" : `See the full process — all ${TOTAL} steps and safeguards`}
        <ChevronDown size={16} className={cn("shrink-0 text-accent transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="all" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden"
          >
            <div className="grid gap-5 pt-5">
              {GROUPS.map(({ I, t, items }) => (
                <section key={t}>
                  <h4 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-tint text-accent"><I size={13} /></span> {t}
                  </h4>
                  <ul className="mt-2.5 grid gap-2">
                    {items.map((x) => (
                      <li key={x} className="flex gap-2.5 text-[13.5px] leading-snug text-text-2">
                        <Check size={14} strokeWidth={2.5} className="mt-[2px] shrink-0 text-accent" /> {x}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <p className="rounded-[12px] bg-ink px-4 py-3 text-[13px] leading-snug text-white/80">
                Most people we talk to do not make it through. That is the point — owners hand over their keys from thousands of kilometres away.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/network" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-accent underline underline-offset-4">
        How we verify every inspector <ArrowRight size={14} />
      </Link>
    </div>
  );
}
