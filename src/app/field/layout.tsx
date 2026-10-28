import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { InspectorProfileForm } from "@/components/field/InspectorProfileForm";
import { requireInspector } from "@/lib/auth";
import { inspectorFor, STATUS_COPY } from "@/lib/field";
import { FieldShell } from "@/components/field/FieldShell";
import { InstallHint } from "@/components/app/InstallHint";
import { doSignOut } from "@/lib/actions";
import { notFound } from "next/navigation";
import { APPS_LIVE } from "@/lib/flags";

export const metadata: Metadata = {
  title: { default: "Today", template: "%s · StillYours field" },
  robots: { index: false, follow: false },
};

export default async function FieldLayout({ children }: LayoutProps<"/field">) {
  /* Hiding the links is not enough — anybody with the URL would still
     reach a sign-in form we are not ready for. */
  if (!APPS_LIVE) notFound();

  const user = await requireInspector();
  const ins = await inspectorFor(user.id);

  /* An account with the inspector role but no profile row yet: real,
     and not an error. Say so rather than crashing into an empty app. */
  if (!ins) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
        <div className="max-w-[44ch]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warn-soft text-warn"><ShieldAlert size={22} /></span>
          <h1 className="serif mt-5 text-[26px] tracking-[-0.03em]">Your profile is not set up yet.</h1>
          <p className="t-small mt-2">Your number is on our list, but nobody has finished your record. Give us a day — and call if it takes longer.</p>
          <form action={doSignOut}><button className="btn btn-white btn-sm mt-6">Sign out</button></form>
          <Link href="/" className="t-small mt-3 block underline underline-offset-4">Back to the site</Link>
        </div>
      </main>
    );
  }

  /* The day's pay goes to their UPI that evening — so it is asked for
     before anything else. */
  if (!ins.upiId || !ins.name) {
    return (
      <main className="grid min-h-dvh place-items-center bg-paper px-6 py-10">
        <div className="w-full max-w-[420px]">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-accent-tint text-accent"><ShieldCheck size={22} /></span>
          <h1 className="serif mt-5 text-[28px] leading-[1.08] tracking-[-0.03em]">Welcome to the roster.</h1>
          <p className="t-small mt-2 mb-6">Two things before your first job: your name, and the UPI ID your pay goes to — the same day, by the end of it.</p>
          <InspectorProfileForm name={ins.name} upiId={ins.upiId} cta="Open my jobs" />
        </div>
      </main>
    );
  }

  const copy = STATUS_COPY[ins.status];
  return (
    <FieldShell initials={ins.initials} rating={ins.rating} statusLabel={copy.label} statusTone={copy.tone}>
      {children}
      <InstallHint />
    </FieldShell>
  );
}
