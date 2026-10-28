import Link from "next/link";
import { CreditCard, Download, IndianRupee, ShieldCheck } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { awaitingAdvance, invoices, properties } from "@/lib/queries";
import { PayButton } from "@/components/app/PayButton";
import { Empty, PageHead, Panel, PanelHead, Stat, money } from "@/components/app/ui";
import { Reveal } from "@/components/ui/Reveal";
import { fmtDate, fmtDayDate, relative } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata = { title: "Billing" };

export default async function Page() {
  const user = await requireOwner();
  const [all, props, toConfirm] = await Promise.all([invoices(user.id), properties(user.id), awaitingAdvance(user.id)]);
  const label = (id: string) => props.find((p) => p.id === id)?.label ?? "";
  const due = all.filter((i) => i.status === "due");
  const paid = all.filter((i) => i.status !== "due");
  const spent = all.filter((i) => i.status === "paid").reduce((n, i) => n + i.amountInr, 0);
  const owed = due.reduce((n, i) => n + i.amountInr, 0) + toConfirm.reduce((n, v) => n + v.advanceInr, 0);

  return (
    <>
      <PageHead
        eyebrow="Money, plainly"
        title="Billing"
        lede="A visit is paid in full when you book. A repair is paid when you approve it — never before."
      />

      {all.length === 0 && toConfirm.length === 0 ? (
        <Panel><Empty icon={CreditCard} title="Nothing billed yet." body="Book a visit and its payment shows here. Your first inspection under the launch offer is free." /></Panel>
      ) : (
        <div className="grid gap-4">
          <Reveal>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat n={money(owed)} l="Payable now" tone={owed ? "warn" : undefined} className="border border-line bg-white shadow-card" />
              <Stat n={money(spent)} l="Paid so far" className="border border-line bg-white shadow-card" />
              <Stat n={all.length} l="Bills in total" className="col-span-2 border border-line bg-white shadow-card sm:col-span-1" />
            </div>
          </Reveal>

          {toConfirm.length > 0 && (
            <Reveal delay={0.03}>
              <Panel>
                <PanelHead title="To confirm a booking" meta="Nobody is sent until it is paid" />
                <ul className="divide-y divide-line">
                  {toConfirm.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"><IndianRupee size={16} /></span>
                      <Link href={`/app/visits/${v.id}`} className="grow basis-[15rem]">
                        <div className="truncate text-[14.5px] font-medium">{v.lines[0]?.k ?? "Visit"}</div>
                        <div className="t-small mt-0.5 truncate font-mono">{v.ref} · {label(v.propertyId)} · {fmtDayDate(v.scheduledFor)}</div>
                      </Link>
                      <span className="shrink-0 text-[17px] font-medium tabular-nums">{money(v.advanceInr)}</span>
                      <PayButton purpose="advance" refId={v.id} amount={v.advanceInr} small className="shrink-0" />
                    </li>
                  ))}
                </ul>
              </Panel>
            </Reveal>
          )}

          {due.length > 0 && (
            <Reveal delay={0.04}>
              <Panel>
                <PanelHead title="Payable now" meta="Card, UPI or net banking" />
                <ul className="divide-y divide-line">
                  {due.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warn-soft text-warn"><IndianRupee size={16} /></span>
                      <div className="grow basis-[15rem]">
                        <div className="truncate text-[14.5px] font-medium">{i.title}</div>
                        <div className="t-small mt-0.5 truncate font-mono">{i.ref} · {label(i.propertyId)} · raised {relative(i.createdAt)}</div>
                        {i.method && <div className="t-small mt-0.5 flex items-center gap-1 text-accent-2"><ShieldCheck size={11} /> {i.method}</div>}
                      </div>
                      <span className="shrink-0 text-[17px] font-medium tabular-nums">{money(i.amountInr)}</span>
                      <PayButton purpose="invoice" refId={i.id} amount={i.amountInr} small className="shrink-0" />
                    </li>
                  ))}
                </ul>
                <div className="t-small grid gap-1.5 border-t border-line px-5 py-3.5 leading-relaxed">
                  <p>Payments go through Razorpay — card, UPI or net banking — and show here as paid the moment they go through.</p>
                  <p>Paying from abroad and it will not go through? <Link href="/app/help" className="font-medium text-accent underline underline-offset-2">Write to us</Link> and we send bank details.</p>
                </div>
              </Panel>
            </Reveal>
          )}

          <Reveal delay={0.06}>
            <Panel>
              <PanelHead title="History" meta={`${paid.length} settled`} />
              {paid.length === 0 ? <p className="t-small px-5 py-8 text-center">Nothing paid yet.</p> : (
                <ul className="divide-y divide-line">
                  {paid.map((i) => (
                    <li key={i.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pass-soft text-pass"><CreditCard size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-medium">{i.title}</div>
                        <div className="t-small mt-0.5 truncate font-mono">{i.ref} · {fmtDate(i.createdAt, { year: true })} · {i.method}</div>
                      </div>
                      <span className="shrink-0 text-[15px] font-medium tabular-nums">{money(i.amountInr)}</span>
                      <span className={cn("chip shrink-0", i.status === "paid" ? "chip-pass" : "chip-warn")}>{i.status === "paid" ? "Paid" : i.status === "refund_due" ? "Being refunded" : "Refunded"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={0.08}>
            <Panel className="flex flex-wrap items-center gap-4 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-tint text-accent"><Download size={17} /></span>
              <p className="min-w-0 flex-1 text-[14px] text-text-2">Need a GST invoice or a statement for your accountant? Ask and we will send it for any period.</p>
              <Link href="/app/help" className="btn btn-pill btn-sm shrink-0">Ask us</Link>
            </Panel>
          </Reveal>
        </div>
      )}
    </>
  );
}
