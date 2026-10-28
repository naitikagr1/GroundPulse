"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Smartphone } from "lucide-react";
import { cn } from "@/lib/cn";
import { LIMIT } from "@/lib/offer";
import { InspectorForm } from "./InspectorForm";

/**
 * The waitlist.
 *
 * This page used to carry a full quote builder — plan, size, rooms, add-ons,
 * a running total. All of that already lives on /pricing, and asking someone
 * to price a service we have not yet performed for them was the wrong first
 * step. So this asks only for what we need to contact a person and know
 * whether we can help them: everything else happens on WhatsApp.
 *
 * When the owner app is ready this page becomes sign-in; the fields below are
 * deliberately the same ones an account would need.
 */

type Role = "owner" | "inspector";

export const input =
  "h-12 w-full rounded-[12px] border border-line-2 bg-white px-4 text-[15px] text-ink outline-none transition placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10";

export const Field = ({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) => (
  <label className={cn("block", className)}>
    <span className="mb-1.5 block text-[13px] font-medium text-text-2">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-[12.5px] text-text-3">{hint}</span>}
  </label>
);

const propertyTypes = ["Apartment", "Villa", "Independent house", "Plot / land"];

const ownerSteps = [
  "We message you on WhatsApp within a day.",
  "You pick a date that suits you, and tell us who has the keys.",
  "One of us visits, films every room, and sends your report within the hour.",
];

const inspectorSteps = [
  "We keep your details until we start taking people on.",
  "When we do, we call you and meet you in person in Bengaluru.",
  "Verification first — originals, police verification, two references called.",
];

export function AccessForm({ initialRole = "owner" }: { initialRole?: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Switching tabs must clear a previous submission, or an owner who just
  // joined sees "You're on the list." on the (empty) inspector tab.
  const switchRole = (r: Role) => { setRole(r); setDone(false); setSendError(null); };

  async function submitOwner(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSendError(null);
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => (fd.get(k) as string) ?? "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "owner",
          name: g("name"),
          email: g("email"),
          phone: g("phone"),
          livesIn: g("livesIn"),
          address: g("address"),
          propertyType: g("propertyType"),
          company: g("company"),
          source: typeof window === "undefined" ? "" : window.location.search,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "We could not save that just now.");
      setDone(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "We could not save that just now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="pt-[88px] md:pt-[100px]">
      <div className="wrap">
        <div className="panel overflow-hidden bg-beige px-5 py-12 text-center sm:px-8 md:py-16">
          <p className="t-label">Join the waitlist</p>
          <h1 className="serif t-display mx-auto mt-4 max-w-[18ch] text-balance">
            Tell us where your property is
          </h1>
          <p className="t-lede mx-auto mt-5 max-w-[52ch]">
            Two minutes, six questions. We come back to you on WhatsApp — there is nothing to pay and nothing to set up.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
          {/* form */}
          <div className="card bg-white p-6 shadow-card sm:p-8">
            <div className="inline-flex w-full rounded-[14px] bg-beige p-1 sm:w-auto" role="tablist" aria-label="Who are you">
              {([["owner", "I own a property"], ["inspector", "I want to inspect"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={role === id}
                  onClick={() => switchRole(id)}
                  className={cn(
                    "flex-1 rounded-[11px] px-4 py-2.5 text-[14.5px] font-medium transition sm:flex-none",
                    role === id ? "bg-white text-ink shadow-card" : "text-text-2 hover:text-ink"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {role === "inspector" ? (
              <InspectorForm />
            ) : done ? (
              <div className="mt-8 rounded-[16px] bg-accent-tint p-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-white"><Check size={22} strokeWidth={3} /></span>
                <h2 className="t-3 mt-4 text-[22px] font-medium">You&apos;re on the list.</h2>
                <p className="t-body mx-auto mt-2 max-w-[42ch] text-[15px]">
                  We&apos;ll message you on WhatsApp within a day to fix a date. If it&apos;s urgent, write to us at{" "}
                  <a className="underline hover:text-ink" href="mailto:stillyours.care@gmail.com">stillyours.care@gmail.com</a>.
                </p>
              </div>
            ) : (
              <form onSubmit={submitOwner} className="mt-8 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your name">
                    <input name="name" required autoComplete="name" className={input} placeholder="Full name" />
                  </Field>
                  <Field label="WhatsApp number" hint="This is how we'll reach you.">
                    <input name="phone" type="tel" required autoComplete="tel" className={input} placeholder="+91 …" />
                  </Field>
                </div>

                <Field label="Email" hint="For your report and, later, your account.">
                  <input name="email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" />
                </Field>

                <Field label="Where is your property in Bengaluru?" hint="The area is enough for now — Whitefield, HSR Layout, Jayanagar.">
                  <input name="address" required className={input} placeholder="Area, and the society or street if you like" />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="What kind of property?">
                    <select name="propertyType" defaultValue="Apartment" className={cn(input, "appearance-none bg-white")}>
                      {propertyTypes.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Where do you live now?" hint="City or country is fine.">
                    <input name="livesIn" className={input} placeholder="Dubai, Pune, Bengaluru…" />
                  </Field>
                </div>

                {/* A real person never sees or fills this. */}
                <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

                <button type="submit" disabled={sending} className="btn btn-accent mt-1 w-full disabled:opacity-60">
                  {sending ? "Sending…" : <>Join the waitlist <ArrowRight size={16} /></>}
                </button>

                {sendError && (
                  <p className="rounded-[12px] bg-fail-soft px-4 py-3 text-[14px] text-fail">
                    {sendError} Please write to us at{" "}
                    <a className="underline" href="mailto:stillyours.care@gmail.com">stillyours.care@gmail.com</a> and we&apos;ll sort it out.
                  </p>
                )}

                <p className="t-small text-[12.5px]">
                  We use your details only to arrange your visit. See our{" "}
                  <Link href="/terms" className="underline hover:text-ink">terms</Link> and{" "}
                  <Link href="/privacy" className="underline hover:text-ink">privacy</Link>.
                </p>
              </form>
            )}
          </div>

          {/* what happens next */}
          <div className="grid content-start gap-4">
            {role === "owner" && (
            <div className="card bg-ink p-6 text-white sm:p-7">
              <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/55">Launch offer · Bengaluru</p>
              <h2 className="t-3 mt-2 text-[24px] font-medium tracking-[-0.02em]">The first {LIMIT} inspections are free.</h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/70">
                One free inspection each for the first {LIMIT} owners, whatever the size of the home. One of the two of us who started StillYours does
                your visit in person, the whole visit is recorded on a body camera, and you get the full video. No card, no deposit.
              </p>
              <Link href="/#founding" className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-white underline underline-offset-4">
                Read the full terms <ArrowRight size={15} />
              </Link>
            </div>
            )}

            <div className="card bg-white p-6 shadow-card sm:p-7">
              <div className="flex items-center gap-2 text-[15px] font-medium"><MessageCircle size={17} className="text-accent" /> What happens next</div>
              <ol className="mt-4 grid gap-3">
                {(role === "inspector" ? inspectorSteps : ownerSteps).map((s, i) => (
                  <li key={s} className="flex gap-3 text-[14.5px] leading-relaxed text-text-2">
                    <span className="mt-[1px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-medium text-accent">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="card bg-white p-6 shadow-card sm:p-7">
              <div className="flex items-center gap-2 text-[15px] font-medium"><Smartphone size={17} className="text-accent" /> Our app is in beta</div>
              <p className="mt-2 text-[14.5px] leading-relaxed text-text-2">
                {role === "inspector"
                  ? "The inspector app is still being built. Until it is ready the checklist, the photos and the video are handled on WhatsApp. We ask for your email now so we can move you across the day it is ready."
                  : "It is still being built. Until it is ready your report comes on WhatsApp and as a PDF, you approve any repair by message, and we video-call you at the start and the end of the visit. We ask for your email now so we can move you across the day your account is ready."}
              </p>
            </div>

            {role === "owner" && (
              <p className="t-small px-1 text-[13px]">
                Want the prices first? They are all on the{" "}
                <Link href="/pricing" className="underline hover:text-ink">pricing page</Link>.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="h-10 md:h-16" />
    </section>
  );
}
