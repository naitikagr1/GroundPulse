import { BadgeIndianRupee, RotateCcw, ShieldCheck, ThumbsUp } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/site";
import { damageCover } from "@/lib/pricing";

const guarantees = [
  { I: ThumbsUp, t: "You approve every rupee", b: "No repair, no cleaning, no part is bought without your yes on the exact amount. A flagged issue is a question, not an invoice." },
  { I: RotateCcw, t: "Cancel free until the day before", b: "Move or cancel any visit up to the day before and what you paid comes back automatically. No questions and no retention call." },
  { I: ShieldCheck, t: "We fix what we damage", b: `If we break something during a visit, we repair or replace it at our cost — up to ${damageCover.words} a visit. We never open cupboards, wardrobes or lockers — keep cash and jewellery locked away.` },
  { I: BadgeIndianRupee, t: "Never a rupee of commission", b: "We don't broker tenants and we don't mark up bills. The provider's quote + 15%, shown to you before you approve." },
];

/** The trust anchor: a joint note from both founders + the four guarantees they sign up to. */
export function Guarantee() {
  return (
    <section className="section" aria-labelledby="guarantee-title">
      <div className="wrap">
        <Reveal>
          <div className="panel overflow-hidden bg-white shadow-card">
            <div className="grid lg:grid-cols-[1.05fr_1fr]">
              {/* the note */}
              <div className="relative p-7 sm:p-10 md:p-12">
                <p className="t-label">What the two of us are building</p>
                <h2 id="guarantee-title" className="t-2 mt-3 max-w-[18ch]">We're asking you to let a stranger into your home.</h2>
                <div className="t-body mt-5 max-w-[52ch] space-y-3.5 text-[15.5px] leading-relaxed text-text-2">
                  <p>Between the two of us there's a house outside the city, a plot in a village, and a car parked in another state. Every one of them has cost our families money that a single honest look would have saved — and for years the only update either family got was somebody saying sab theek hai. Meant kindly, every time. Proof, not once.</p>
                  <p>So we know exactly what we're asking of you in return, and we don't take it lightly. A website with good words on it is not a reason to hand a stranger your keys. We wouldn't do it either.</p>
                  <p className="text-text">Which is why what we're building is narrow on purpose. One verified person, standing inside your property on a day you picked, producing evidence you can check yourself — the actual room, on video, with a time on it. Not an estimate, not a summary, not somebody's opinion. Get that one thing right in every city we open, and any owner anywhere should be able to know the truth about a place they can't reach, within the hour, without booking a flight and without taking anyone's word for it.</p>
                  <p className="text-text">Until we've earned that, here's our side of it in plain terms. Whoever walks in is verified, and gets in only after you confirm. Every room is on video, and you can watch it live. And if we damage something while we're in there, we fix it at our cost, up to {damageCover.words} a visit — not an argument about whose fault it was.</p>
                  <p className="text-text">If any of it doesn't happen exactly as written, the four promises on the right are what you hold us both to.</p>
                </div>
                <div className="mt-8 border-t border-line pt-6">
                  <div className="flex flex-wrap gap-x-12 gap-y-5">
                    {site.founders.map((p) => (
                      <div key={p.id} className="flex items-center gap-3.5">
                        <span className="hand -rotate-3 text-[30px] leading-none text-accent-2">{p.sign}</span>
                        <span className="h-8 w-px bg-line" />
                        <div>
                          <div className="text-[14.5px] font-medium">{p.name}</div>
                          <div className="text-[13px] text-text-2">{p.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* the guarantees */}
              <div className="relative bg-accent p-7 text-white sm:p-10 md:p-12">
                {/* stamp */}
                <span aria-hidden className="absolute right-6 top-6 hidden h-[86px] w-[86px] -rotate-12 place-items-center rounded-full text-center text-white/85 shadow-[inset_0_0_0_2px_currentColor] sm:grid md:right-9 md:top-9">
                  <span className="text-[19px] font-medium leading-none">100%</span>
                  <span className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.14em]">Your call</span>
                </span>
                <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/60">In writing</p>
                <h3 className="t-3 mt-3 max-w-[20ch] text-[22px] text-white sm:text-[25px]">You stay in control, right down to the way out.</h3>
                <ul className="mt-7 space-y-5">
                  {guarantees.map(({ I, t, b }) => (
                    <li key={t} className="flex gap-3.5">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"><I size={16} /></span>
                      <div>
                        <div className="text-[15.5px] font-medium">{t}</div>
                        <p className="mt-1 text-[13.5px] leading-snug text-white/75">{b}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 border-t border-white/15 pt-5 text-[13px] text-white/65">{site.company} · {site.address} · {site.email}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
