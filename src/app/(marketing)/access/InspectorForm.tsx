"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, input } from "./AccessForm";
import { Vetting } from "./Vetting";

/**
 * Inspector waitlist.
 *
 * The long application — documents, references, availability grid, the
 * declarations — belongs at the in-person interview, not in front of someone
 * who has just heard of us. We take enough to call them back, and say plainly
 * what applying leads to so that anyone unwilling stops here.
 */

/** `narrow` stacks every field, for the card on the inspector sign-in. */
export function InspectorForm({ narrow = false, className = "mt-8" }: { narrow?: boolean; className?: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function submitApplication(e: React.FormEvent<HTMLFormElement>) {
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
          kind: "inspector",
          name: g("name"),
          phone: g("phone"),
          email: g("email"),
          city: g("city"),
          localities: g("localities"),
          occupation: g("occupation"),
          company: g("company"),
          source: typeof window === "undefined" ? "" : window.location.search,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "We could not save that just now.");
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "We could not save that just now.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className={cn("rounded-[16px] bg-accent-tint p-8 text-center", className)}>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-white"><Check size={22} strokeWidth={3} /></span>
        <h2 className="t-3 mt-4 text-[22px] font-medium">Thank you — we have your application.</h2>
        <p className="t-body mx-auto mt-2 max-w-[42ch] text-[15px]">
          We will call you on this number to set a time to meet in person. Once we have met and checked your documents, your
          number opens the inspector sign-in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitApplication} className={cn("grid gap-5", className)}>
      <div className={cn("grid gap-5", !narrow && "sm:grid-cols-2")}>
        <Field label="Your name">
          <input name="name" required autoComplete="name" className={input} placeholder="Full name" />
        </Field>
        <Field label="WhatsApp number">
          <input name="phone" type="tel" required autoComplete="tel" className={input} placeholder="+91 …" />
        </Field>
      </div>

      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" />
      </Field>

      <div className={cn("grid gap-5", !narrow && "sm:grid-cols-2")}>
        <Field label="City">
          <input name="city" required defaultValue="Bengaluru" className={input} />
        </Field>
        <Field label="Areas you can reach easily" hint="Two or three localities.">
          <input name="localities" className={input} placeholder="Whitefield, Marathahalli…" />
        </Field>
      </div>

      <Field label="What do you do now?" hint="Optional — a line is enough.">
        <input name="occupation" className={input} placeholder="Facility supervisor, electrician, student…" />
      </Field>

      {/* A real person never sees or fills this. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <Vetting />

      <button type="submit" disabled={sending} className="btn btn-accent w-full disabled:opacity-60">
        {sending ? "Sending…" : <>Send my application <ArrowRight size={16} /></>}
      </button>

      {sendError && (
        <p className={cn("rounded-[12px] px-4 py-3 text-[14px]", "bg-fail-soft text-fail")}>
          {sendError} Please write to us at{" "}
          <a className="underline" href="mailto:stillyours.care@gmail.com">stillyours.care@gmail.com</a> and we&apos;ll sort it out.
        </p>
      )}
    </form>
  );
}
