import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ArrowRight, BadgeCheck, Fingerprint, IndianRupee, KeyRound, LogOut, MapPinned, ShieldCheck, Timer, UserPlus } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { currentUser, homeFor, prettyPhone } from "@/lib/auth";
import { switchAccount } from "@/lib/actions";
import { googleReady } from "@/lib/google";
import { SignInForm } from "./SignInForm";
import { OwnerDoor } from "./OwnerDoor";
import { InstallHint } from "@/components/app/InstallHint";
import { InspectorForm } from "@/app/(marketing)/access/InspectorForm";
import { APPLY } from "@/lib/start";
import { cn } from "@/lib/cn";
import { notFound } from "next/navigation";
import { APPS_LIVE } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Open your StillYours account — reports, visits and decisions for every property you own in India.",
  robots: { index: false, follow: true },
};

/* Two doors on one page. The owner door is open to any number; the
   inspector door only to the roster — and it should look like it. */
const PANELS = {
  owner: {
    title: <>Far away.<br />Still yours.</>,
    points: [
      { I: BadgeCheck, t: "Every visit, on the record", b: "Photo and video of every room, time-stamped, with the inspector's name on it." },
      { I: KeyRound, t: "Nothing happens without you", b: "No repair is ever started until you have approved it, from wherever you are." },
      { I: Timer, t: "The report, within the hour", b: "Not a WhatsApp forward. A proper report you can open at 2 AM and act on." },
    ],
    foot: "Bengaluru · verified inspectors · your media stays private",
  },
  inspector: {
    title: <>Verified<br />inspectors only.</>,
    points: [
      { I: Fingerprint, t: "Met in person, then added", b: "ID, police verification and an interview come first. Only then does a number open this door." },
      { I: MapPinned, t: "Your city, and 20 km past it", b: "Every open job nearby — plots outside the city included — nearest first." },
      { I: IndianRupee, t: "Paid the same day", b: "What a job pays is on it before you claim it, and it reaches your UPI by the end of that day." },
    ],
    foot: "Roster-only access · paid the same day to your UPI",
  },
} as const;

export default async function Page({ searchParams }: PageProps<"/signin">) {
  /* Hiding the links is not enough — anybody with the URL would still
     reach a sign-in form we are not ready for. */
  if (!APPS_LIVE) notFound();

  const user = await currentUser();
  const sp = await searchParams;
  const wants = sp.as === "inspector" ? "inspector" : "owner";
  const inspector = wants === "inspector";
  /* the application lives on the inspector side, one tap from the door it leads to */
  const applying = inspector && sp.apply === "1";
  const panel = PANELS[wants];
  /* Somebody already signed in is not necessarily in the wrong place —
     they may have come here to switch. Bouncing them silently is what
     made an inspector link look like it opened the owner app. */
  const home = user ? homeFor(user.role) : "/app";
  const mismatch = !!user && user.role !== "admin" && ((wants === "inspector") !== (user.role === "inspector"));
  const error = typeof sp.error === "string" ? sp.error : undefined;

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* the promise, kept in view while they sign in */}
      <section className={cn("on-dark relative hidden flex-col justify-between overflow-hidden p-12 lg:flex", inspector ? "bg-[#0d1512]" : "bg-accent")}>
        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-32 -left-20 h-[380px] w-[380px] rounded-full bg-white/[0.03]" />
        <Link href="/" className="relative"><Logo inverted size={40} /></Link>
        <div className="relative max-w-[42ch]">
          {inspector && (
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/80">
              <ShieldCheck size={13} /> StillYours inspector roster
            </span>
          )}
          <h2 className="serif text-[clamp(2.2rem,3vw,3rem)] leading-[1.06] tracking-[-0.035em]">{applying ? <>Join the<br />roster.</> : panel.title}</h2>
          <ul className="mt-10 grid gap-6">
            {panel.points.map(({ I, t, b }) => (
              <li key={t} className="flex gap-4">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10"><I size={17} /></span>
                <div><div className="text-[15.5px] font-semibold">{t}</div><p className="mt-1 text-[14px] leading-relaxed text-white/70">{b}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[13px] text-white/45">{panel.foot}</p>
      </section>

      {/* the form */}
      <section className={cn("flex min-h-dvh flex-col px-6 py-8 sm:px-10", inspector ? "bg-[#0d1512]" : "bg-paper")}>
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden"><Logo size={34} inverted={inspector} /></Link>
          {/* opened from the home screen this is the app — there is no site to go back to */}
          <Link href="/" className={cn("inline-flex items-center gap-1.5 text-[13.5px] font-medium transition standalone:hidden", inspector ? "text-white/60 hover:text-white" : "text-text-2 hover:text-ink")}>
            <ArrowLeft size={14} /> Back to site
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-8">
          {/* the two doors */}
          <nav aria-label="Who is signing in" className={cn("mb-6 grid w-full max-w-[440px] grid-cols-2 gap-1 rounded-full p-1", inspector ? "bg-white/[0.07]" : "bg-beige")}>
            <Link href="/signin" aria-current={!inspector ? "page" : undefined}
              className={cn("rounded-full px-4 py-2.5 text-center text-[13.5px] font-semibold transition",
                !inspector ? "bg-white text-ink shadow-card" : "text-white/60 hover:text-white")}>
              Property owner
            </Link>
            <Link href={"/signin?as=inspector" as Route} aria-current={inspector ? "page" : undefined}
              className={cn("inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-center text-[13.5px] font-semibold transition",
                inspector ? "bg-white text-ink shadow-card" : "text-text-2 hover:text-ink")}>
              <ShieldCheck size={14} /> Verified inspector
            </Link>
          </nav>

          <div className={cn("w-full max-w-[440px]", inspector && "rounded-[22px] border border-white/10 bg-paper p-6 shadow-float sm:p-8")}>
            {applying ? (
              <div className="w-full">
                <h1 className="serif flex items-center gap-2.5 text-[clamp(1.8rem,4vw,2.3rem)] leading-[1.05] tracking-[-0.035em]">
                  <UserPlus size={26} className="shrink-0 text-accent" /> Apply to inspect
                </h1>
                <p className="t-small mt-2.5">Enough for us to call you back — the rest happens when we meet. Once you are verified, your number opens the inspector sign-in.</p>
                <InspectorForm narrow className="mt-6" />
              </div>
            ) : user ? (
              <div className="w-full">
                <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">
                  {mismatch ? "That is a different account." : "You are already signed in."}
                </h1>
                <p className="t-small mt-2.5">
                  This browser is signed in as <b className="text-ink">{user.name || "your account"}</b> ·{" "}
                  {user.role === "inspector" ? "inspector" : user.role === "admin" ? "ops" : "owner"} · {user.email && user.role !== "inspector" ? user.email : prettyPhone(user.phone)}.
                  {mismatch && wants === "inspector" && " The inspector app needs a number on the inspector roster."}
                  {mismatch && wants === "owner" && " Owners sign in with Google or their email."}
                </p>

                {/* On a mismatch the obvious button has to be the one that
                    gets them out of the wrong account. Leading with "go to
                    my properties" is how somebody following an inspector
                    link ends up in the owner app. */}
                <div className={cn("mt-7 grid gap-3", mismatch && "[&>form]:order-first")}>
                  <Link href={home as Route} className={cn("w-full", mismatch ? "btn btn-white" : "btn btn-accent")}>
                    {user.role === "inspector" ? "Go to my jobs" : user.role === "admin" ? "Go to the ops console" : "Go to my properties"}
                    {!mismatch && <ArrowRight size={16} />}
                  </Link>

                  <form action={switchAccount}>
                    <input type="hidden" name="as" value={wants} />
                    <button className={cn("w-full", mismatch ? "btn btn-accent" : "btn btn-white")}>
                      <LogOut size={15} />
                      {mismatch
                        ? wants === "inspector" ? "Sign in with an inspector number" : "Sign in as an owner"
                        : "Sign in as somebody else"}
                    </button>
                  </form>
                </div>

                <p className="t-small mt-4 text-center leading-snug">
                  Signing in as somebody else ends this session on this device — nothing on either account changes.
                </p>
              </div>
            ) : inspector ? (
              <SignInForm key={wants} side="inspector" />
            ) : (
              <OwnerDoor googleOn={googleReady()} dev={process.env.NODE_ENV !== "production"} error={error} mode={sp.mode === "signup" ? "signup" : "signin"} />
            )}
          </div>

          {/* right under the door it leads to: nobody has to hunt for how to get on the roster */}
          {inspector && !applying && user?.role !== "inspector" && (
            <div className="mt-4 w-full max-w-[440px] rounded-[20px] border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white"><UserPlus size={17} /></span>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-white">Not on the roster yet?</div>
                  <p className="mt-1 text-[13.5px] leading-snug text-white/60">Apply to inspect homes around Bengaluru. We meet you in person first — then your number opens this door.</p>
                </div>
              </div>
              <Link href={APPLY} className="btn btn-white mt-4 w-full">Apply to join <ArrowRight size={16} /></Link>
            </div>
          )}
          {applying && (
            <p className="mt-5 text-[13.5px] text-white/60">
              Already on the roster? <Link href={"/signin?as=inspector" as Route} className="font-medium text-white underline underline-offset-4">Sign in</Link>
            </p>
          )}
        </div>

        <p className={cn("t-small text-center", inspector && "text-white/50")}>
          {inspector ? (
            <>Own a property? <Link href="/signin" className="font-medium text-white underline underline-offset-4">Owner sign in</Link></>
          ) : (
            <>By continuing you agree to our <Link href="/terms" className="underline underline-offset-4">Terms</Link> and <Link href={"/privacy" as Route} className="underline underline-offset-4">Privacy Policy</Link> — your property media stays private and is never sold.</>
          )}
        </p>
      </section>
      {/* an applicant has no app to install yet */}
      {!applying && <InstallHint />}
    </main>
  );
}
