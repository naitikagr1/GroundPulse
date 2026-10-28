import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { damageCover } from "@/lib/pricing";

export const promises = [
  ["Every claim here is checkable", "Name, photo, OTP, GPS, video, audit log. Not adjectives — things you can open in your own report and verify."],
  ["Watch it live", "Video call at the start and end of every visit, if you want it."],
  ["Nobody earns from flagging", "Inspectors are paid a flat fee. Repairs go to a different professional at Urban Company's price for the same job + 15% — none under Care+ — which you approve."],
  ["Change your mind", "Move or cancel a visit free until the day before — what you paid comes back on its own. A yearly plan cancels in full before its first visit."],
  ["We fix what we damage", `If we break something during a visit, we repair or replace it at our cost — up to ${damageCover.words} a visit.`],
  ["No brokerage, nothing hidden", "We never find tenants. On repairs we charge 15% you see before you approve. Inspection, proof and approved repairs are the whole product."],
  ["Your data stays yours", "Videos and photos on private, expiring links, never sold. Recordings are deleted after 90 days, and closing your account removes your name and number from it."],
];

export function Promise() {
  return (
    <section className="section" aria-labelledby="promise-title">
      <div className="wrap">
        <Reveal>
          <div className="panel on-dark bg-accent px-5 py-12 sm:px-8 md:px-12 md:py-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
              <div>
                <p className="text-[16px] font-medium text-white/70">The Still Yours Promise</p>
                <h2 id="promise-title" className="t-1 mt-2 max-w-[12ch] text-white">Seven things we put in writing.</h2>
                <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-white/80">Trust isn't a word on a website. These are the commitments in your agreement — every plan, every visit, homes and plots alike.</p>
              </div>
              <ol className="grid gap-2 sm:grid-cols-2">
                {promises.map(([t, b], i) => (
                  <li key={t} className="flex gap-3 rounded-[14px] bg-white/10 p-4">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-accent-2"><Check size={13} strokeWidth={3} /></span>
                    <div><div className="text-[15px] font-medium text-white"><span className="mr-1.5 text-white/50">0{i + 1}</span>{t}</div><div className="mt-1 text-[13.5px] leading-snug text-white/75">{b}</div></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
