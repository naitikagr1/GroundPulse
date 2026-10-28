import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, Car, Home, KeyRound, LandPlot, Lock, ShieldCheck, UserCheck, Wallet } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { SectionHead } from "@/components/shared/SectionHead";
import { Reveal } from "@/components/ui/Reveal";
import { Founders } from "@/components/home/Founders";
import { site } from "@/lib/site";
import { START, START_LABEL } from "@/lib/start";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Still Yours checks on the homes, plots and cars people own but cannot get to, and sends back proof. Two founders, one problem our own families were already paying for.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About us | StillYours", description: "Two founders, one problem our own families were already paying for.", url: "/about" },
};

/* What we cover — each one came from a real worry at home. */
const covers = [
  { I: Home, t: "Homes", b: "Apartments, villas, the parents' house — every room walked, photographed and filmed." },
  { I: LandPlot, t: "Plots & land", b: "A boundary walk with GPS photos, and a straight answer on whether anyone is sitting on it." },
  { I: Car, t: "Cars", b: "The car parked for months — started, checked, photographed, before the wiring goes." },
];

/* What we hold ourselves to. Every line here is also in the Terms. */
const beliefs = [
  { I: Camera, t: "Proof, not reassurance", b: "A thumbs-up is not evidence. Every room on video, every photo with its time and place — something you can open at 11 PM from another country." },
  { I: KeyRound, t: "Nothing happens without your yes", b: "A flagged issue is a question, not an invoice. No repair, no purchase, no booking until you approve the exact amount." },
  { I: UserCheck, t: "The person matters more than the app", b: "Anyone who walks into your home is met in person and verified first. For now, that person is one of us." },
  { I: ShieldCheck, t: "We fix what we damage", b: "If we break something while we are inside, we repair or replace it at our cost — no argument about whose fault it was." },
  { I: Lock, t: "Your property is yours", b: "Photos and recordings are seen only by you and whoever you share them with. Never sold, never used for advertising." },
  { I: Wallet, t: "Every rupee shown first", b: "No brokerage, no commission on rent, nothing hidden in a bill. You see the whole price before you pay any of it." },
];

/* How it happened — told from the founders' own stories. */
const story = [
  { t: "A house nobody walked through", b: "Raj's family home is outside the city. With work and the house to run, a free weekend to go and check on it never came. Months passed, and a house nobody walks through goes bad slowly — in exactly the way that costs a lot to undo." },
  { t: "The obvious fixes didn't work", b: "Every trip found something waiting, and paid for it twice: once to get there, once to repair it. Renting it out was meant to keep it alive — but the tenants didn't look after it either, and the rent came late, or not at all." },
  { t: "The call", b: "Raj researched it until he was sure, then took it to Naitik. Three sentences in, Naitik already knew how the story ended — his family had lived it too: a shut house, a kind “sab theek hai”, and a bill months later for something that was small in March." },
  { t: "Deciding what to build", b: "Not just an app. Software can be copied in a weekend; a verified person who actually turns up at your door, on the day they said, cannot. The app is there to carry the proof that person brings back." },
  { t: "Doing it ourselves first", b: "Before handing the job to anyone, we do the visits ourselves — to learn it properly, and to know exactly what we are asking of every inspector who joins after us." },
  { t: "Where we are today", b: "Live in Bengaluru, for homes, plots and cars. The land and the car are here because Raj's father worried about both: a plot in the village he couldn't get to, and a car whose wiring the mice got to. Every service we offer is something our families have already paid for." },
];

export default function Page() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title={<>Two founders. One problem<br className="hidden md:block" /> we were already paying for.</>}
        lede="Still Yours checks on the homes, plots and cars people own but cannot get to — and sends back proof, not reassurance. We started it because our own families needed it."
      >
        <Reveal delay={0.1} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={START} className="btn btn-accent">{START_LABEL} <ArrowRight size={16} /></Link>
          <Link href="/sample-report" className="btn btn-white">See a sample report</Link>
        </Reveal>
      </PageHero>

      {/* what we do */}
      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="What we do"
            title="Eyes on the property you can't get to"
            lede="A verified person walks your property on a fixed day, photographs and films it, and your report arrives within the hour. If something needs fixing, you decide — from wherever you are."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {covers.map(({ I, t, b }, i) => (
              <Reveal key={t} delay={i * 0.06}>
                <div className="card h-full bg-white p-6 shadow-card">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-tint text-accent"><I size={19} /></span>
                  <h3 className="mt-4 text-[19px] font-medium tracking-[-0.02em]">{t}</h3>
                  <p className="t-small mt-2 text-[14.5px] leading-relaxed">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-4">
            <div className="card grid grid-cols-2 gap-px overflow-hidden bg-line md:grid-cols-4">
              {[
                ["Bengaluru", "live today"],
                ["Within the hour", "your report, after every visit"],
                ["Every room", "on video, with time and place"],
                ["Your yes", "before any repair or rupee"],
              ].map(([k, v]) => (
                <div key={k} className="bg-white px-5 py-5">
                  <div className="serif text-[22px] leading-tight tracking-[-0.02em]">{k}</div>
                  <div className="t-small mt-1">{v}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* each founder, in their own words */}
      <Founders />

      {/* what we hold ourselves to */}
      <section className="section">
        <div className="wrap">
          <SectionHead
            eyebrow="What we believe"
            title="The promises we built the company around"
            lede="Not values on a wall. Each of these is written into our Terms, and each one is something we would want if it were our own house — because it was."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beliefs.map(({ I, t, b }, i) => (
              <Reveal key={t} delay={(i % 3) * 0.05}>
                <div className="card h-full bg-beige p-6">
                  <I size={20} className="text-accent" />
                  <h3 className="mt-3 text-[17px] font-medium tracking-[-0.02em]">{t}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-text-2">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* our story, start to now */}
      <section className="section" aria-labelledby="story-title">
        <div className="wrap">
          <div className="panel on-dark overflow-hidden bg-ink px-6 py-12 sm:px-10 md:px-14 md:py-16">
            <p className="t-label text-white/55">Our story</p>
            <h2 id="story-title" className="serif mt-3 max-w-[20ch] text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.035em] text-white">
              From a worry at home to a company
            </h2>
            <ol className="mt-10 grid gap-0">
              {story.map((s, i) => (
                <Reveal key={s.t} delay={i * 0.05}>
                  <li className="relative grid grid-cols-[40px_1fr] gap-4 pb-9 last:pb-0 sm:grid-cols-[56px_1fr] sm:gap-6">
                    {/* the thread that joins one step to the next */}
                    {i < story.length - 1 && <span aria-hidden className="absolute left-[19px] top-10 bottom-0 w-px bg-white/15 sm:left-[27px]" />}
                    <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-[14px] font-semibold text-ink sm:h-14 sm:w-14 sm:text-[16px]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="pt-1.5 sm:pt-3">
                      <h3 className="text-[18px] font-medium tracking-[-0.02em] text-white sm:text-[20px]">{s.t}</h3>
                      <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-white/70">{s.b}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
            <div className="mt-12 flex flex-col gap-4 border-t border-white/12 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="hand -rotate-2 text-[30px] leading-none text-white">Raj &amp; Naitik</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={START} className="btn btn-white">{START_LABEL} <ArrowRight size={16} /></Link>
                <Link href="/contact" className="btn btn-line text-white">Talk to us</Link>
              </div>
            </div>
          </div>
          <p className="t-small mt-4 text-center">{site.company} · {site.address} · {site.contactEmail}</p>
        </div>
      </section>
    </>
  );
}
