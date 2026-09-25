import { BadgeCheck, KeyRound, PhoneCall, ShieldCheck, ThumbsUp, Video } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { damageCover } from "@/lib/pricing";

export const relaxPoints = [
  { I: BadgeCheck, t: "You know who's coming.", b: "Your inspector's name and photo on WhatsApp before the visit." },
  { I: KeyRound, t: "Nobody goes in without your OK.", b: "The key is handed over only after you — or your caretaker — confirm on WhatsApp." },
  { I: Video, t: "Every room is on video.", b: "Every room you list is filmed, and we walk through the whole home on video before we leave." },
  { I: PhoneCall, t: "Watch the visit live, if you want.", b: "The inspector video-calls you at the start and the end — you, your parents or your caretaker see it live, from anywhere." },
  { I: ThumbsUp, t: "Nothing happens without your yes.", b: "Repairs, cleaning, money — your approval first, with the exact amount." },
  { I: ShieldCheck, t: `We fix what we damage — up to ${damageCover.words}.`, b: "If we break something during a visit, we repair or replace it at our cost. Cupboards, wardrobes and lockers are never opened.", hero: true },
];

export const relaxTagline = `One verified person. Your go-ahead before anyone enters. Every room on video — live if you want. Your approval for everything. And if we damage something, we fix it at our cost — up to ${damageCover.words} a visit.`;

/** The same five lines everywhere — repetition is what builds the trust. */
export function Relax({ variant = "strip", className }: { variant?: "strip" | "dark" | "list"; className?: string }) {
  if (variant === "dark") {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="text-[13px] font-medium text-white/60">Why you can relax</div>
        <ul className="space-y-2.5">
          {relaxPoints.map(({ I, t, b, hero }) => (
            <li key={t} className={cn("flex items-start gap-2.5 text-[13px]", hero && "rounded-[10px] bg-white/10 p-2.5")}>
              <I size={14} className="mt-[3px] shrink-0 text-[#7be3a5]" />
              <span><span className="font-medium text-white">{t}</span> <span className="text-white/65">{b}</span></span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-white/55">Cupboards and lockers are never opened. Keep cash and jewellery locked away — and anything we damage, we fix, up to {damageCover.words} a visit.</p>
      </div>
    );
  }
  if (variant === "list") {
    return (
      <ul className={cn("grid grid-cols-2 gap-2.5 sm:gap-3", className)}>
        {relaxPoints.map(({ I, t, b, hero }) => (
          <li key={t} className={cn("flex flex-col gap-2.5 rounded-[12px] p-3 text-[13px] leading-snug sm:flex-row sm:items-start sm:gap-3 sm:p-3.5 sm:text-[14.5px] sm:leading-normal", hero ? "bg-accent text-white" : "bg-white shadow-card")}>
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full sm:h-9 sm:w-9", hero ? "bg-white/15 text-white" : "bg-accent-soft text-accent")}><I size={15} /></span>
            <span><span className="font-medium">{t}</span> <span className={hero ? "text-white/85" : "text-text-2"}>{b}</span></span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <section className={cn("wrap mt-4 md:mt-6", className)} aria-label="Why you can relax">
      <Reveal>
        <div className="card overflow-hidden bg-white shadow-card">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="text-[16px] font-medium">Why you can relax</div>
            <div className="text-[13px] text-text-2 max-sm:hidden">{relaxTagline}</div>
          </div>
          <ul className="grid grid-cols-2 lg:grid-cols-3">
            {relaxPoints.map(({ I, t, b, hero }, i) => (
              <li key={t} className={cn("flex flex-col gap-2.5 p-4 sm:flex-row sm:items-start sm:gap-3 sm:p-5", i % 2 === 1 && "border-l border-line", i >= 2 && "border-t border-line lg:border-t-0", i > 0 && "lg:border-l lg:border-line", hero && "bg-accent-tint")}>
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full sm:h-10 sm:w-10", hero ? "bg-accent text-white" : "bg-accent-soft text-accent")}><I size={16} /></span>
                <div><div className="text-[14px] font-medium leading-tight sm:text-[14.5px]">{t}</div><div className="t-small mt-1 text-[12.5px] leading-snug sm:text-[13px]">{b}</div></div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
