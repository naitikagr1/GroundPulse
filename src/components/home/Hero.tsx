"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { heroBlur } from "@/lib/heroBlur";
import { ArrowRight } from "lucide-react";
import { HealthRing } from "@/components/ui/HealthRing";
import { AddressBar } from "@/components/shared/AddressBar";
import { EASE } from "@/lib/motion";
import { LIMIT } from "@/lib/offer";

const up = (delay: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: EASE } });

export function Hero() {
  return (
    <section id="hero" className="bleed pb-4 sm:pb-6" aria-labelledby="hero-title">
      <div className="panel on-dark relative mx-auto flex min-h-[680px] max-w-[1900px] flex-col overflow-hidden bg-ink md:min-h-[760px] lg:min-h-[820px]">
        {/* full-bleed photo: dusk sky at the top keeps the headline clean */}
        <motion.div initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: EASE }} className="absolute inset-0">
          <Image
            src="/photos/villa2.jpg"
            alt="A modern villa under a clear sky"
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={heroBlur}
            className="object-cover object-[35%_45%] sm:object-[center_40%]"
          />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-[rgba(24,28,34,0.42)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(24,28,34,0.55)_0%,rgba(24,28,34,0.42)_42%,rgba(24,28,34,0.12)_64%,rgba(35,32,29,0.72)_100%)]" aria-hidden />

        <div className="relative z-10 mx-auto flex w-full max-w-[684px] flex-col items-center px-5 pt-14 text-center sm:pt-[72px] md:pt-[88px]">
          <motion.a {...up(0.02)} href="#founding" className="mb-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.16] px-4 text-[13.5px] font-medium text-white backdrop-blur-sm transition hover:bg-white/25 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.28)]">
            First {LIMIT} owners get a free inspection <ArrowRight size={14} />
          </motion.a>
          <motion.h1 {...up(0.1)} id="hero-title" className="serif t-display max-w-[16ch] text-balance text-white [text-shadow:0_2px_30px_rgba(0,0,0,0.35)]">
            Know your home is fine. From anywhere.
          </motion.h1>
          <motion.p {...up(0.22)} className="mt-4 max-w-[46ch] text-[17px] leading-[24px] text-white/92 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)] sm:text-[18px]">
            A verified inspector walks every room of your home — or every corner of your plot. Photo-and-video report within the hour. No repair without your approval.
          </motion.p>
          <motion.div {...up(0.34)} className="mt-7 w-full"><AddressBar /></motion.div>
          <motion.div {...up(0.42)} className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <Link href="/sample-report" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.16] px-4 text-[13.5px] font-medium text-white backdrop-blur-sm transition hover:bg-white/25 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.28)]">
              See a sample report <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div {...up(0.5)} className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[14px] font-medium text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.45)]">
            <span>Live in Bengaluru</span><span className="h-3.5 w-px bg-white/40 max-sm:hidden" /><span>Homes · Plots · Cars</span><span className="h-3.5 w-px bg-white/40 max-sm:hidden" /><span>We fix what we damage</span>
          </motion.div>
        </div>

        {/* floating report card (Opendoor-style product card over the photo) */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1.1, ease: EASE }} className="card shadow-float on-light absolute bottom-[112px] right-8 z-10 hidden w-[320px] bg-white p-4 lg:block xl:right-12">
          <div className="flex items-center gap-4">
            <HealthRing score={84} size={72} stroke={7} label="Health" delay={1.5} />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-medium">Ancestral Apartment</div>
              <div className="truncate text-[13px] text-text-2">Indiranagar, Bengaluru</div>
              <div className="mt-2 flex gap-1.5"><span className="chip chip-fail">1 issue</span><span className="chip chip-pass">39 pass</span></div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[13px]"><span className="text-text-2">Report delivered</span><span className="font-medium">38 min after visit</span></div>
        </motion.div>

        {/* stats row */}
        <motion.dl {...up(0.9)} className="relative z-10 mt-auto grid grid-cols-3 gap-4 px-5 pb-8 pt-16 text-center">
          <div><dt className="text-[24px] font-medium tracking-[-0.03em] text-white sm:text-[28px]">1 hr</dt><dd className="mt-0.5 text-[13px] text-white/80">report after every visit</dd></div>
          <div><dt className="text-[24px] font-medium tracking-[-0.03em] text-white sm:text-[28px]">42 items</dt><dd className="mt-0.5 text-[13px] text-white/80">checked every visit</dd></div>
          <div><dt className="text-[24px] font-medium tracking-[-0.03em] text-white sm:text-[28px]">100%</dt><dd className="mt-0.5 text-[13px] text-white/80">repairs owner-approved</dd></div>
        </motion.dl>
      </div>
    </section>
  );
}
