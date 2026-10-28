import Link from "next/link";
import { ArrowRight, Check, MessageCircle, Smartphone, Users } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { PhoneMore } from "@/components/ui/PhoneMore";
import { damageCover } from "@/lib/pricing";
import { LIMIT } from "@/lib/offer";
import { START, START_LABEL } from "@/lib/start";

/**
 * Launch offer for the first LIMIT owners (lib/offer).
 *
 * Remove this component — and the hero pill that links to #founding — once they
 * have all booked. The public page shows no count; the owner app does, and it
 * is worked out from the free inspections actually booked.
 */
const terms = [
  `For the first ${LIMIT} owners — one free inspection per owner, not per visit`,
  "Any home in Bengaluru, whatever its size",
  "One of the two of us who started StillYours does your visit in person — we are not sending anyone else",
  "The full 42-item check, photos and video of every room, and your report within the hour",
  "Your whole visit recorded on a body camera, start to finish — and you get the full video",
  "We never open cupboards, wardrobes or lockers, and your keys go back the same day",
  "Cleaning and repairs aren't included. Any repair you approve is at the professional's actual cost, with no StillYours fee",
  `If we damage something while we're inside, we repair or replace it at our cost — up to ${damageCover.words} a visit`,
  "No card needed. It never turns into a paid plan unless you choose one",
];

export function FoundingOffer() {
  return (
    <div id="founding" className="scroll-mt-24">
      <Reveal>
        <div className="card grid gap-8 bg-ink p-6 text-white sm:p-10 md:grid-cols-[1fr_1.15fr] md:gap-10 md:p-12">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-white/55">Launch offer · Bengaluru</p>
            <h3 className="t-2 mt-3 max-w-[14ch]">Your first inspection is free.</h3>
            <p className="mt-4 max-w-[42ch] text-[15.5px] leading-relaxed text-white/75">
              We&apos;re taking our first {LIMIT} owners at no cost — and the two of us do these visits ourselves, so we learn the job
              properly before anyone else ever walks into your home.
            </p>
            <Link href={START} className="btn btn-white mt-7">{START_LABEL} <ArrowRight size={16} /></Link>
            <p className="mt-3 text-[13px] text-white/50">The offer closes when {LIMIT} owners have booked.</p>
          </div>

          {/* one quiet list on a phone, a column of cards from sm up */}
          <PhoneMore dark show={5} label="terms" className="grid content-start divide-y divide-white/10 rounded-[14px] bg-white/[0.05] px-4 sm:gap-2.5 sm:divide-y-0 sm:bg-transparent sm:px-0">
            {terms.map((t) => (
              <li key={t} className="flex items-start gap-3 py-2.5 text-[14px] leading-snug sm:rounded-[12px] sm:bg-white/[0.07] sm:px-4 sm:py-3 sm:text-[14.5px]">
                <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/15"><Check size={11} strokeWidth={3} /></span>
                {t}
              </li>
            ))}
          </PhoneMore>

          <div className="swipe grid gap-3 [--swipe-bleed:1.5rem] md:col-span-2 md:grid-cols-3">
            <div className="rounded-[14px] bg-white/[0.07] p-5">
              <div className="flex items-center gap-2 text-[15px] font-medium"><MessageCircle size={16} /> What we ask in return</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Honest feedback after the visit — what worked and what didn&apos;t. Your permission to share your report as an
                example, with your name, address and anything personal blurred out. And permission to use what we learn on these ten
                visits — the checklist, the photos, the recording — to train the inspectors we take on later. Rather not?
                Just say so — the inspection stays free either way.
              </p>
            </div>
            <div className="rounded-[14px] bg-white/[0.07] p-5">
              <div className="flex items-center gap-2 text-[15px] font-medium"><Smartphone size={16} /> Our app is in beta</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Until it&apos;s ready, your report comes on WhatsApp and as a PDF, you approve repairs by message, and we
                video-call you at the start and end of the visit.
              </p>
            </div>
            <div className="rounded-[14px] bg-white/[0.07] p-5">
              <div className="flex items-center gap-2 text-[15px] font-medium"><Users size={16} /> When we take on inspectors</div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Everyone is referred, met in person, and checked — Aadhaar, address proof, police verification and two references we
                actually call. Their first two visits are done with one of us standing next to them.
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
