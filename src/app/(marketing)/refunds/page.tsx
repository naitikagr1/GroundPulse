import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Clause, LegalPage, Points, Table, type Toc } from "@/components/legal/Legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "How cancelling, moving and refunds work at StillYours — visits, yearly plans, repairs and the launch offer — and how service is delivered.",
  alternates: { canonical: "/refunds" },
  openGraph: { title: "Refund & Cancellation Policy | StillYours", description: "Cancelling, moving and refunds — visits, plans, repairs — and how service is delivered.", url: "/refunds" },
};

const toc: Toc = [
  { id: "glance", title: "At a glance" },
  { id: "visits", title: "Visits" },
  { id: "plans", title: "Yearly plans" },
  { id: "repairs", title: "Repairs" },
  { id: "offer", title: "The launch offer" },
  { id: "errors", title: "Payment problems" },
  { id: "how", title: "How refunds are paid" },
  { id: "delivery", title: "How service is delivered" },
  { id: "contact", title: "Questions" },
];

export default function Page() {
  return (
    <LegalPage
      current="/refunds"
      title="Refund & Cancellation Policy"
      lede="When you can change your mind, what comes back to you, and how fast. This policy is part of our Terms of Service."
      toc={toc}
      summary={[
        <>Move or cancel a visit free until the day before it. Cancel, and what you paid comes back automatically. On the day itself, a visit cannot be moved or cancelled.</>,
        <>If we cancel, or do not turn up, everything you paid for that visit comes back — or we come on a new day free, your choice.</>,
        <>A yearly plan can be cancelled in full before its first visit. Once it has started, you can switch off renewal instead.</>,
        <>A repair is decided within the hour during the visit and done on it. If it cannot be done that day, it is cancelled and everything you paid for it comes back — our fee too.</>,
        <>Refunds go back to the card, UPI or account you paid from.</>,
      ]}
    >
      <Clause id="glance" n={1} title="At a glance">
        <Table head={["If…", "Then"]} rows={[
          ["You move a visit, up to the day before", "Free. What you paid stays with the booking."],
          ["You cancel a visit, up to the day before", "What you paid is refunded in full, automatically."],
          ["The day of the visit comes", "It can no longer be moved or cancelled — the inspector is committed to it. What you paid is not refunded."],
          ["We cancel, or do not turn up in the booked window", "Everything you paid for that visit is refunded, or we come on a new day at no charge — your choice."],
          ["We cannot get in for reasons within your control", "After a 30-minute wait the visit counts as attempted. What you paid is kept; you can rebook."],
          ["Your report is ready", "Not refundable — the visit has been done."],
          ["A yearly plan, before its first visit", "Cancel it in full: what you paid is refunded and its booked visits are cancelled."],
          ["A yearly plan, after it has started", "No refund for the plan year. Switch off renewal and it ends at the year's close."],
          ["A repair you paid for cannot be done on the visit", "Cancelled, and everything you paid for it — our fee included — refunded automatically."],
          ["The professional has not arrived within two hours of your approval", "The same: cancelled and refunded in full, automatically."],
          ["The launch-offer inspection", "Nothing was paid. Cancelling gives the free inspection back to you."],
        ]} />
      </Clause>

      <Clause id="visits" n={2} title="Visits">
        <Points n={2} items={[
          <>A visit is booked by paying its full price.</>,
          <>You can move or cancel a visit in the app until the day before it. Cancelling refunds what you paid in full to the payment method you used, straight away — no request needed.</>,
          <>On the day of the visit it can no longer be moved or cancelled, in the app or by writing to us — the inspector is already committed to it. What you paid is not refunded.</>,
          <>If we cancel a visit, or our inspector does not arrive within the booked window, you choose: a full refund of everything paid for that visit, or a new day at no extra charge.</>,
          <>If the inspector arrives in the window but cannot get in for reasons within your control — no keys, no caretaker, gate or society permission refused — they wait at least 30 minutes. After that the visit counts as attempted, what you paid is kept, and you can book again.</>,
          <>Once the report is ready, the visit is not refundable. If a report is materially incomplete through our fault, we re-inspect the missing part at no charge or refund that part of the price.</>,
        ]} />
      </Clause>

      <Clause id="plans" n={3} title="Yearly plans">
        <Points n={3} items={[
          <>A plan is booked by paying the year&apos;s price in full. The plan year starts when the first visit&apos;s report is ready.</>,
          <>Before that first visit, you can cancel the plan from the Plan page. What you paid is refunded in full and every visit booked under it is cancelled.</>,
          <>Once the plan has started, the plan year is not refundable. You can switch off renewal at any time; the plan then ends when its year does, and everything left on it stays yours until then.</>,
          <>Visits, cleans and services not used by the end of the plan year do not carry over. Any single plan visit can be moved up to the day before it.</>,
          <>Upgrading from Care to Care+ bills only the difference for the rest of the plan year.</>,
        ]} />
      </Clause>

      <Clause id="repairs" n={4} title="Repairs">
        <Points n={4} items={[
          <>A repair is sent to you live during the visit, and paid in full when you approve it, within the hour. Nothing is booked before that.</>,
          <>If an approved repair cannot be done on the visit, it is cancelled and everything you paid for it — our fee included — is refunded automatically. Nobody comes back another day for it; you can approve it again on a later visit.</>,
          <>If the professional has not arrived within two hours of your approval, the repair is cancelled and refunded in the same way, without you asking.</>,
          <>Any cancellation or visiting charge Urban Company makes when a job is cancelled is ours to bear, never yours.</>,
          <>If a payment for a repair reaches us after the issue was already decided some other way, it is refunded in full.</>,
          <>Once a repair is completed and its after-photos are in your report, it is not refundable. If something is wrong with the work, tell us and we take it up with the professional and help put it right.</>,
          <>Where Care+ cover could no longer absorb a repair because another one used it first, the difference is shown to you as a bill before anything more is taken.</>,
        ]} />
      </Clause>

      <Clause id="offer" n={5} title="The launch offer">
        <p>
          The free inspection costs nothing, so there is nothing to refund. Cancelling it gives the free inspection back to you to book again.
          Anything paid that you add to it — cleaning, a car — follows the rules for visits above.
        </p>
      </Clause>

      <Clause id="errors" n={6} title="Payment problems">
        <Bullets items={[
          "Charged twice for the same thing: the duplicate is refunded in full.",
          "Money left your account but the app shows the booking unpaid: most such payments are confirmed or reversed automatically within minutes. If not, write to us with the date and amount and we resolve it within 2 working days.",
          "A payment that failed is never taken; if your bank shows a hold, it is released by your bank, usually within 5–7 working days.",
        ]} />
      </Clause>

      <Clause id="how" n={7} title="How refunds are paid">
        <Points n={7} items={[
          <>Refunds go back to the original payment method — the same card, UPI ID or bank account — through our payment partner, Razorpay. We do not refund in cash.</>,
          <>Automatic refunds (cancelling in the app) are started immediately. Refunds we process on request are started within 2 working days of our agreeing them.</>,
          <>Once started, a refund usually reaches you in 5–7 working days, depending on your bank. You can see its status under Billing in the app.</>,
        ]} />
      </Clause>

      <Clause id="delivery" n={8} title="How service is delivered">
        <Points n={8} items={[
          <>Our services are carried out in person at your property in {site.city} — or within our service area around it — on the day and in the time window you booked.</>,
          <>Reports are delivered digitally, in the app and — while it is in beta — on WhatsApp and by email. We aim to deliver each report within an hour of the inspector leaving.</>,
          <>Nothing physical is shipped.</>,
        ]} />
      </Clause>

      <Clause id="contact" n={9} title="Questions">
        <p>
          Write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> or use Help in the app. See our <Link href="/terms">Terms of Service</Link> and <Link href="/contact">contact page</Link>.
        </p>
      </Clause>
    </LegalPage>
  );
}
