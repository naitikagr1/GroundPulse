import { Reveal } from "@/components/ui/Reveal";
import { AddressBar } from "@/components/shared/AddressBar";

export function CTA({ title = "Get your first inspection", lede = "Register a home or a plot and book the first visit in under five minutes. The report reaches you within the hour." }: { title?: string; lede?: string }) {
  return (
    <section id="cta" className="section">
      <div className="wrap">
        <Reveal className="mx-auto max-w-[684px] text-center">
          <h2 className="serif t-display text-balance">{title}</h2>
          <p className="t-lede mx-auto mt-4 max-w-[50ch] text-text-2">{lede}</p>
          <div className="mx-auto mt-8"><AddressBar cta="Sign up" /></div>
          <p className="mt-4 text-[14px] text-text-2">Takes 5 minutes · Your media stays private · No repair without your approval</p>
        </Reveal>
      </div>
    </section>
  );
}
