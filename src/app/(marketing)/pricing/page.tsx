import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { Pricing } from "@/components/home/Pricing";
import { CoverTerms } from "@/components/home/CoverTerms";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";

export const metadata: Metadata = {
  title: "Pricing: Home Inspection from ₹1,999",
  description:
    "One visit from ₹1,999, or a yearly plan from ₹7,999. Plots ₹1,999, cars ₹700. You see the exact price of every repair before you approve it.",
  alternates: { canonical: "/pricing" },
  openGraph: { title: "Pricing: Home Inspection from ₹1,999 | StillYours", description: "One visit from ₹1,999, or a yearly plan from ₹7,999. Plots ₹1,999, cars ₹700. You see the exact price of every repair before you approve it.", url: "/pricing" },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Pricing" title={<>Pricing: one visit,<br className="hidden md:block" /> or a yearly plan</>} lede="Homes from ₹1,999 and plots from ₹1,999 — one visit, or a year of quarterly eyes on it. Cars ₹700 on any visit." />
      <Pricing full />
      <CoverTerms />
      <div className="h-6 md:h-10" />
      <FAQ />
      <CTA title="Book your first visit" lede="Register a property and pick a plan in under five minutes. Move or cancel free until the day before — your money comes back." />
    </>
  );
}
