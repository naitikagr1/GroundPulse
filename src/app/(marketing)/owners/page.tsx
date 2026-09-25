import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceLd } from "@/lib/seo";
import { Bell, Building2, Plane, Waves } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { FeatureRow } from "@/components/shared/FeatureRow";
import { Reveal } from "@/components/ui/Reveal";
import { OwnerDashMock, ReportMock, ResolveMock } from "@/components/shared/Mocks";
import { Compare } from "@/components/home/Compare";
import { Neighbour } from "@/components/home/Neighbour";
import { ComingHome } from "@/components/home/ComingHome";
import { Pricing } from "@/components/home/Pricing";
import { CTA } from "@/components/home/CTA";
import { BetaNote } from "@/components/shared/BetaNote";

export const metadata: Metadata = {
  title: "Property Care for NRIs & Out-of-Town Owners",
  description:
    "Live abroad or in another city? We inspect your Bengaluru flat, house or plot, report within an hour with photos and video, and fix only what you approve.",
  alternates: { canonical: "/owners" },
  openGraph: { title: "Property Care for NRIs & Out-of-Town Owners | StillYours", description: "Live abroad or in another city? We inspect your Bengaluru flat, house or plot, report within an hour with photos and video, and fix only what you approve.", url: "/owners" },
};

const who = [
  { I: Plane, t: "Living abroad or in another city", b: "A flat or your parents' house in Bengaluru that sits empty while you live in Dubai, Pune or Delhi. You want to know it's safe — and to fix things without flying back." },
  { I: Building2, t: "Investors with a portfolio", b: "Several units across Bengaluru, each with a different local agent and a different story. You want one source of truth and one number per unit." },
  { I: Waves, t: "Vacation-home & plot owners", b: "A holiday home you visit twice a year, or a plot nobody has walked in months. Idle time is exactly when leaks, pests and encroachment get expensive." },
];

export default function Page() {
  return (
    <>
      <JsonLd data={serviceLd({ name: "Home inspection for property owners abroad", serviceType: "Property inspection", path: "/owners", description: "A verified inspector walks a 42-item room-by-room checklist on a fixed day, photographs and films every room, and sends a timestamped report within the hour. No repair without the owner's approval." })} />
      <PageHero eyebrow="For owners" title={<>For owners who live<br className="hidden md:block" /> away from their property</>} lede="One flat in Indiranagar, five units across the city, or an empty plot nobody has walked in months — you get the same thing: a true, timestamped picture, and control over every repair. Even the car parked in the basement." />
      <BetaNote className="mt-6" />

      <section className="wrap mt-6 grid gap-3 md:mt-8 md:grid-cols-3">
        {who.map(({ I, t, b }, i) => (
          <Reveal key={t} delay={i * 0.06}><div className="card h-full border border-line bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent"><I size={18} /></span><h3 className="t-3 mt-4">{t}</h3><p className="t-body mt-2 text-[15px]">{b}</p></div></Reveal>
        ))}
      </section>

      <section className="section">
        <div className="wrap grid gap-14 md:gap-20">
          <FeatureRow k="Your dashboard" title="Every property, one glance." body="Every flat, villa and plot shows its health score, last visit date and open-issue count. Tap in for the full history, the latest report — or the boundary photo map for a plot — and anything waiting for your decision." bullets={["Health score ring: red under 40, amber to 70, green above", "Open issues badge only when there's something to see", "Add a property in under five minutes"]}><div className="mx-auto max-w-[440px]"><OwnerDashMock /></div></FeatureRow>
          <FeatureRow k="Reports" title="See it. Don't take anyone's word for it." body="Every report includes every checklist item, its status, and the photos and video the inspector attached — viewable from your property page within an hour." flip bullets={["Email + in-app notification the moment it's ready", "Inspection history timeline per property", "Media on private, expiring links"]}><div className="mx-auto max-w-[460px]"><ReportMock /></div></FeatureRow>
          <FeatureRow k="Repairs" title="Track it to the last photo." body="Approve a repair and watch it move from Requested to Completed in real time. The provider's completion note and after-photos land in the same record as the original issue." bullets={["Only verified, locality-matched providers — quote + a 15% fee, you approve the exact amount", "Work happens during a visit, inspector on-site the whole time", "Live status — no refreshing; rate the provider when it's done"]}><div className="mx-auto max-w-[420px]"><ResolveMock /></div></FeatureRow>
        </div>
      </section>

      <section className="wrap">
        <Reveal>
          <div className="panel bg-beige p-6 sm:p-10 md:p-14">
            <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center">
              <div><p className="t-label">Notifications</p><h3 className="t-2 mt-3">You'll never learn about a leak three days late.</h3><p className="t-body mt-4 max-w-[44ch]">Report ready, issue flagged, repair status changed — each one reaches you by email and in-app within minutes. Choose the channel you prefer.</p></div>
              <div className="grid gap-2">
                {[["Issue flagged on Ancestral Apartment", "Water leakage · Bathroom · 2 photos", "13:41"], ["Report ready · Ancestral Apartment", "Health 84 · 39 pass · 2 attention · 1 fail", "14:02"], ["Repair completed", "Suresh M. · 1 after-photo · note attached", "12:48"]].map(([t, b, tm]) => (
                  <div key={t} className="card shadow-card flex items-start gap-3 bg-white p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Bell size={15} /></span><div className="min-w-0 flex-1"><div className="text-[14px] font-semibold">{t}</div><div className="t-small">{b}</div></div><span className="text-[12px] text-text-3">{tm}</span></div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <ComingHome />
      <Pricing />
      <Compare />
      <Neighbour />
      <CTA />
    </>
  );
}
