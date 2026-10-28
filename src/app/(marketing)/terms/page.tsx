import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Clause, LegalPage, Points, type Toc } from "@/components/legal/Legal";
import { site } from "@/lib/site";
import { carePlusCover, damageCover, inr } from "@/lib/pricing";
import { LIMIT, terms as offerTerms } from "@/lib/offer";
import { LEAD_DAYS, WINDOW_DAYS } from "@/lib/format";
import { DEPOSIT, hoursWords, OVERTIME } from "@/lib/payout";
import { HOLD, PENALTY } from "@/lib/jobs";
import { FEE_RATE } from "@/lib/repair";
import { ADVANCE_RATE } from "@/lib/quote";
import { CHECKIN_RADIUS_M } from "@/lib/geo";
import { BEYOND_CITY_KM, HOME_CITY } from "@/lib/city";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using StillYours — visits, payments, flagged issues and repairs, the Care+ cover, recordings, what we never touch, and what we pay for if we damage something.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service | StillYours", description: "Visits, payments, repairs, Care+ cover, recordings and our responsibilities — in full.", url: "/terms" },
};

/* Every number here comes from the code that enforces it, so the page and
   the app cannot drift apart. If a line stops being true, it changes the
   same day — an owner reading this is deciding whether to hand a stranger
   their keys. */
const FEE = `${Math.round(FEE_RATE * 100)}%`;
const ADV = `${Math.round(ADVANCE_RATE * 100)}%`;
const BAL = `${100 - Math.round(ADVANCE_RATE * 100)}%`;

const toc: Toc = [
  { id: "about", title: "About these terms" },
  { id: "definitions", title: "Words we use" },
  { id: "service", title: "The service" },
  { id: "account", title: "Your account" },
  { id: "property", title: "Your property and access" },
  { id: "visit", title: "On a visit" },
  { id: "booking", title: "Booking" },
  { id: "payment", title: "Prices and payment" },
  { id: "cancel", title: "Cancellations and refunds" },
  { id: "issues", title: "Flagged issues and repairs" },
  { id: "cover", title: "Care+ repair cover" },
  { id: "offer", title: "The launch offer" },
  { id: "media", title: "Recordings, photos and reports" },
  { id: "damage", title: "If we damage something" },
  { id: "liability", title: "Our responsibility to you" },
  { id: "conduct", title: "Your responsibilities" },
  { id: "closing", title: "Suspension and closing" },
  { id: "ip", title: "Our content and brand" },
  { id: "third", title: "Other services we use" },
  { id: "changes", title: "Changes" },
  { id: "law", title: "Governing law and disputes" },
  { id: "contact", title: "Contact and grievances" },
  { id: "inspectors", title: "For inspectors" },
];

export default function Page() {
  return (
    <LegalPage
      current="/terms"
      title="Terms of Service"
      lede="These terms cover everything you do with StillYours — the website, the owner and inspector apps, every visit, payment and repair. Please read them before you book."
      toc={toc}
      summary={[
        <>We inspect homes, plots and cars you own but cannot get to, and send you the evidence. We are not a broker and take no commission on rent.</>,
        <>Nobody goes in until you confirm, and we never open cupboards, wardrobes, lockers, safes or drawers.</>,
        <>You pay {ADV} when you book and the rest when the report is ready. Move or cancel free until the day before — the advance comes back to you.</>,
        <>Nothing is repaired without your yes on the exact amount. A repair is Urban Company&apos;s price for the same service plus {FEE} — and no fee at all on repairs your Care+ cover pays for.</>,
        <>If we damage something while we are inside, we repair or replace it at our cost — up to {inr(damageCover.perVisit)} for any one visit.</>,
        <>Your photos and recordings are yours and never sold. Recordings are deleted after 90 days unless you ask us to keep them.</>,
      ]}
    >
      <Clause id="about" n={1} title="About these terms">
        <p>
          These Terms of Service (&quot;<b>Terms</b>&quot;) are an agreement between you and {site.company}, {site.address} (&quot;<b>StillYours</b>&quot;, &quot;<b>we</b>&quot;, &quot;<b>us</b>&quot;).
          They apply to our website at stillyours.in, our owner and inspector apps, and every service we provide through them (together, the &quot;<b>Service</b>&quot;).
        </p>
        <p>
          By creating an account, booking a visit or otherwise using the Service, you agree to these Terms, our <Link href="/privacy">Privacy Policy</Link> and
          our <Link href="/refunds">Refund &amp; Cancellation Policy</Link>, which form part of them. If you do not agree, please do not use the Service.
        </p>
      </Clause>

      <Clause id="definitions" n={2} title="Words we use">
        <Bullets items={[
          <><b>Owner</b> — the person who books visits for a property, and who owns it or is authorised by its owner.</>,
          <><b>Inspector</b> — a person on the StillYours roster who carries out visits.</>,
          <><b>Property</b> — a home, plot of land or vehicle registered in your account.</>,
          <><b>Visit</b> — an inspection, cleaning supervision or plot walk on a booked day and time window.</>,
          <><b>Report</b> — the checklist, photos, video and notes produced by a visit.</>,
          <><b>Issue</b> — anything a visit marks &quot;Attention&quot; or &quot;Fail&quot;.</>,
          <><b>Repair</b> — work to fix an issue, done by an independent professional after you approve it.</>,
          <><b>Plan</b> — a yearly subscription (Care or Care+) covering a set number of visits and, for Care+, a repair cover.</>,
        ]} />
      </Clause>

      <Clause id="service" n={3} title="The service">
        <Points n={3} items={[
          <>We visit your property on the day you book, walk a structured checklist, photograph and film it, and deliver a report — our aim is within an hour of the inspector leaving.</>,
          <>We serve {HOME_CITY} and up to {BEYOND_CITY_KM} km beyond the city. We tell you at booking if a property is outside that area.</>,
          <>A report is a visual, non-invasive check of the parts of the property that are accessible on the day. It is not a structural survey, an engineering or legal opinion, a valuation, or a guarantee that nothing is wrong. We do not open walls, lift flooring, test hidden wiring or plumbing, or move heavy furniture.</>,
          <>We are not a property manager, broker, tenant-finder or insurer.</>,
          <>For now our founders carry out visits themselves. Every inspector we add later is met in person and verified first — ID, address proof, police verification and references.</>,
          <>While parts of our apps are still in beta, some of the Service may reach you on WhatsApp, email or as a PDF instead of in the app. Where something on our website describes a feature that is not yet live, the feature is not part of the Service until it is.</>,
        ]} />
      </Clause>

      <Clause id="account" n={4} title="Your account">
        <Points n={4} items={[
          <>You must be 18 or older and able to enter a binding contract to use the Service.</>,
          <>Owners sign in with their Google account, or with their email address and a password, and give us a mobile number we can reach them on — the inspector calls it from the door. Inspectors sign in with their registered mobile number and a one-time code sent to it. Keep your Google account, password and phone secure, and never share a code with anyone — we will never ask you for one.</>,
          <>The details you give us — your name, contact details and your properties — must be accurate and kept up to date.</>,
          <>You are responsible for what happens under your account. Tell us straight away if you think someone else has used it.</>,
        ]} />
      </Clause>

      <Clause id="property" n={5} title="Your property and access">
        <Points n={5} items={[
          <>You confirm that you own each property you register, or are authorised by its owner to arrange visits to it, and that you are entitled to let us in.</>,
          <>You arrange access — the keys, a caretaker, society or gate permission — for the booked day and window. Each visit has an entry code in your app; nobody goes in until it is given at the door.</>,
          <>Please lock away cash, jewellery, documents and valuables before any visit.</>,
          <>Tell us in advance about anything that could make the property unsafe — pets, exposed wiring, a weak floor or roof, gas, pests. We may decline to enter, or stop a visit, if it is not safe.</>,
          <>Keep the map pin for each property accurate. The inspector checks in at the door, and a check-in more than {CHECKIN_RADIUS_M} metres from the pin needs a written reason that is shown on your report.</>,
          <>If we arrive in the booked window and cannot get in for reasons within your control, the inspector waits at least 30 minutes. After that the visit counts as attempted — you can rebook, and the advance for the attempted visit is not refunded.</>,
        ]} />
      </Clause>

      <Clause id="visit" n={6} title="On a visit">
        <Points n={6} items={[
          <>We tell you who is coming before the visit, and you can ask for a live video call at the start and the end.</>,
          <>The inspector walks every room or area on the checklist, marks each item OK, Attention or Fail, photographs anything flagged, films a walkthrough of every room, and wears a body camera for the whole visit at no extra cost.</>,
          <>We never open cupboards, wardrobes, lockers, safes, drawers or any locked storage. We handle nothing beyond what a check needs — running a tap, flipping a switch, opening a window latch.</>,
          <>We never keep your keys overnight. They go back to your caretaker, your society office or whoever you nominate, on the same day.</>,
          <>We never let anyone else into the property. If you want a caretaker, neighbour or relative present, tell us and we will wait for them.</>,
          <>Every visit has two codes in your app: the entry code, given at the door, and the completion code, given back at the end by you or whoever takes the keys. A visit only closes with the completion code, so you always know the keys are back in the right hands.</>,
          <>Photographs are taken live on the inspector&apos;s camera, with the time and — where the phone can tell — the place. None can come from a gallery.</>,
        ]} />
      </Clause>

      <Clause id="booking" n={7} title="Booking">
        <Points n={7} items={[
          <>You can book from {LEAD_DAYS} days ahead up to {WINDOW_DAYS} days ahead, in the time windows shown in the app. Times are Indian Standard Time.</>,
          <>A booking is confirmed when its {ADV} advance is paid. Until then it is not offered to any inspector. A free launch-offer inspection with nothing added is confirmed straight away.</>,
          <>A yearly plan books its visits across the year when you buy it. You can move any of them.</>,
          <>We assign a verified inspector for the day. If the assigned inspector cannot make it, we assign another and tell you.</>,
        ]} />
      </Clause>

      <Clause id="payment" n={8} title="Prices and payment">
        <Points n={8} items={[
          <>Prices are shown on our <Link href="/pricing">pricing page</Link> and in the app before you book, in Indian rupees, inclusive of applicable taxes. The price you see when you book is the price you pay for that booking.</>,
          <><b>Visits:</b> {ADV} of the price is paid when you book. The remaining {BAL} is due when the report is ready. Until it is paid you can see the health score and how much was flagged; the full report — photos, video, notes and repair prices — opens once it is paid.</>,
          <><b>Plans:</b> {ADV} of the year&apos;s price is paid when you book, and the rest when the first visit&apos;s report is ready. The plan year starts with that first report.</>,
          <><b>Repairs:</b> paid in full when you approve them. See clause 10.</>,
          <>Payments are processed by Razorpay by card, UPI or net banking. We never see or store your card or bank details.</>,
          <>While an amount is overdue, we may pause new bookings on your account until it is paid.</>,
        ]} />
      </Clause>

      <Clause id="cancel" n={9} title="Cancellations and refunds">
        <p>
          You can move or cancel a visit free of charge until the day before it, and the advance comes back to the payment method you used.
          On the day of the visit it can no longer be moved or cancelled.
          The full rules — visits, plans, repairs, and what happens if we are the ones who cannot make it — are in our <Link href="/refunds">Refund &amp; Cancellation Policy</Link>.
        </p>
      </Clause>

      <Clause id="issues" n={10} title="Flagged issues and repairs">
        <Points n={10} items={[
          <>A flagged issue is a question, not an invoice. Each one comes to you with the room, what was found, and the inspector&apos;s photos and video.</>,
          <><b>Price.</b> Where the inspector can price a repair, the price is what Urban Company charges for the same service on the day, as checked by the inspector, plus any parts at their rate card, plus a StillYours fee of {FEE}. You see every part of that before you decide. On a launch-offer visit there is no StillYours fee; on a repair covered by Care+ there is none either (clause 11).</>,
          <><b>Decided live.</b> When the inspector finds something that can be fixed, they send it to you from the property — the photos, what they saw and the price — and can ring you to explain. You have one hour to decide. We only send repairs that can be done on the visit: smaller jobs Urban Company has a slot for that day. Larger work — waterproofing, civil work, a new appliance — is recorded in your report.</>,
          <><b>Your decision.</b> Nothing is repaired, bought or scheduled without your approval of the exact amount. You approve by paying it. You may decline with a reason — nothing is done, and your decision and reason are kept on record. If you make no decision within the hour, or the visit closes first, it closes without a repair and stays on your report.</>,
          <><b>The work.</b> An approved repair is carried out on the same visit by an independent, rated professional, with your inspector there. The inspector records after-photos from the same angle and a completion note, and you can rate the work.</>,
          <><b>If it cannot be done that day</b> — or the professional has not arrived within two hours of your approval — the repair is cancelled and everything you paid for it, our fee included, is refunded to you automatically. We do not come back another day for it; approve it again on a later visit if you still want it. Any cancellation charge Urban Company makes is ours, never yours.</>,
          <>Anything flagged that was not sent to you for a decision during the visit is recorded in your report only. The professional is responsible for the quality of their work; if something is wrong with it, tell us and we take it up with them and help put it right.</>,
          <>StillYours is not affiliated with Urban Company. We use its published prices only as a reference so that you can see a price is fair. &quot;Urban Company&quot; is a trademark of its owner.</>,
        ]} />
      </Clause>

      <Clause id="cover" n={11} title="Care+ repair cover">
        <p>If your property is on Care+, repairs to issues found on its visits are covered as follows, for each plan year:</p>
        <Points n={11} items={[
          <>Up to {inr(carePlusCover.yearly)} of repairs a year, and at most {inr(carePlusCover.perIncident)} for any one repair.</>,
          <>The work (labour) is covered in full; parts are covered up to {inr(carePlusCover.partsPerIncident)} per repair. Anything above that is shown to you and only done if you approve and pay it.</>,
          <>There is no StillYours fee on a repair the cover pays towards — including the part of it that runs past the cover.</>,
          <>The cover starts when the plan starts — with the first visit&apos;s report. Anything flagged in that first report is quoted separately and is not covered.</>,
          <>The cover applies only to repairs we arrange, done during a visit with your inspector present. Outside bills are not covered.</>,
          <>Not covered: {carePlusCover.excluded.map((x) => x.replace(/ — .*$/, "").toLowerCase()).join("; ")}.</>,
          <>Unused cover does not carry into the next plan year. Two repairs approved together cannot use the same cover twice — anything the cover can no longer take is billed to you and shown before it is.</>,
          <>Care+ cover is a benefit of a service plan. It is not an insurance policy.</>,
        ]} />
      </Clause>

      <Clause id="offer" n={12} title="The launch offer">
        <Points n={12} items={[
          ...offerTerms,
          `The offer is for the first ${LIMIT} owners to book it, one inspection each — counting those booked with us before the app opened — and closes once all ${LIMIT} are booked. Cancelling a free inspection gives its place back.`,
          "Anything paid that you add to the free inspection — cleaning, a car — is charged as usual.",
          "What we ask in return: honest feedback, and permission to share your report as a blurred example and to use what we learn to train the inspectors we take on later. You can say no to the sharing and the inspection is still free.",
        ]} />
      </Clause>

      <Clause id="media" n={13} title="Recordings, photos and reports">
        <Points n={13} items={[
          <>The photos, recordings and reports of your property are yours. You allow us to store and process them only to provide the Service to you.</>,
          <>They are visible only to you, the inspector who made them, and the people you choose to share a report link with. We never sell them or show them to anyone else.</>,
          <>Visit recordings are deleted 90 days after the visit unless you ask us to keep them. Footage is uploaded after each visit, and the inspector keeps no copy.</>,
          <>We will never use anything from your visit publicly without asking you first, and anything we do use has your name, address and anything personal removed.</>,
          <>How we handle personal data is set out in our <Link href="/privacy">Privacy Policy</Link>.</>,
        ]} />
      </Clause>

      <Clause id="damage" n={14} title="If we damage something">
        <p>
          If we break something while we are inside — a tap, a tile, a fitting, a pipe — we repair or replace it at our cost, without argument about whose fault it was — up to {inr(damageCover.perVisit)} in all for any one visit.
          This does not extend to anything already broken before we arrived, ordinary wear and tear, or damage caused by weather, tenants, neighbours or anyone else with access to the property.
          The visit recording is there so that neither of us has to guess. Tell us within 30 days of the visit.
        </p>
      </Clause>

      <Clause id="liability" n={15} title="Our responsibility to you">
        <Points n={15} items={[
          <>We will provide the Service with reasonable care and skill.</>,
          <>We are not responsible for defects that were hidden, pre-existing or outside the checklist; for anything that happens at the property between visits; for the acts of tenants, neighbours, caretakers or other third parties; or for events beyond our reasonable control.</>,
          <>Apart from clause 14, our total liability for any claim is limited to the amount you paid for the visit, plan or repair the claim is about, in the 12 months before the claim. We are not liable for indirect or consequential loss, such as loss of rent or opportunity.</>,
          <>Nothing in these Terms limits any liability that cannot be limited by law, or your rights as a consumer under Indian law.</>,
        ]} />
      </Clause>

      <Clause id="conduct" n={16} title="Your responsibilities">
        <Points n={16} items={[
          <>Use the Service lawfully and only for properties you are entitled to arrange visits to.</>,
          <>Treat inspectors and professionals with respect. We may end a visit, and suspend an account, where anyone is threatened, harassed or put at risk.</>,
          <>Do not misuse the apps — no attempts to get into other people&apos;s data, to interfere with the Service, or to book in bad faith.</>,
          <>You will make good any loss we suffer because you let us into a property you had no right to, or otherwise broke these Terms.</>,
        ]} />
      </Clause>

      <Clause id="closing" n={17} title="Suspension and closing your account">
        <Points n={17} items={[
          <>You can close your account from Account in the app at any time, except on the day of a booked visit or while one is under way. Visits not yet due are cancelled, and advances on them are refunded under the Refund &amp; Cancellation Policy.</>,
          <>We may suspend or close an account for serious or repeated breach of these Terms, for non-payment, or where required by law. Where we can, we tell you first and give you a chance to put things right.</>,
        ]} />
      </Clause>

      <Clause id="ip" n={18} title="Our content and brand">
        <p>The website, the apps, their design and code, and the StillYours name and logo belong to us. You may use them only to use the Service. Your reports and media remain yours (clause 13).</p>
      </Clause>

      <Clause id="third" n={19} title="Other services we use">
        <p>
          Parts of the Service rely on others — Razorpay for payments, map and address services, messaging for sign-in codes and updates, and hosting and storage providers.
          Their own terms apply to your use of them, and we choose them with care. The full list is in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Clause>

      <Clause id="changes" n={20} title="Changes">
        <Points n={20} items={[
          <>We may change the Service or these Terms. We will tell you of any material change in the app or by email before it takes effect.</>,
          <>A change never alters the price or terms of a booking you have already paid for. If a change affects a visit you have already booked, we tell you before the visit.</>,
        ]} />
      </Clause>

      <Clause id="law" n={21} title="Governing law and disputes">
        <Points n={21} items={[
          <>These Terms are governed by the laws of India.</>,
          <>If something goes wrong, please tell us first — most things are fixed with a message. If we cannot resolve it together within 30 days, the courts at Bengaluru have exclusive jurisdiction, without affecting your right to approach a consumer commission.</>,
        ]} />
      </Clause>

      <Clause id="contact" n={22} title="Contact and grievances">
        <p>
          Write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>, or use Help in the app. Our Grievance Officer is <b>Naitik Agrawal</b>, at the same address.
          We acknowledge every complaint within 48 hours and aim to resolve it within 30 days. See our <Link href="/contact">contact page</Link>.
        </p>
      </Clause>

      <Clause id="inspectors" n={23} title="For inspectors">
        <p>These terms apply to every inspector on the roster, in addition to the rest of these Terms. They are public on purpose — the person walking into an owner&apos;s home should be held to something the owner can read.</p>
        <Points n={23} items={[
          <>Inspectors are independent professionals engaged by StillYours visit by visit, not employees. Only numbers on the StillYours roster can sign in to the inspector app.</>,
          <>What a job pays is shown on it before you claim it. Time on site beyond the first {hoursWords(OVERTIME.included["3"])} ({hoursWords(OVERTIME.included["4"])} for a 4 BHK or larger), measured from check-in to submission, is paid at {inr(OVERTIME.perHour)} for every hour begun — by StillYours, never added to the owner&apos;s bill.</>,
          <>A day&apos;s earnings are paid to the UPI ID on your profile by the end of that day.</>,
          <>You check in only at the property, with the owner&apos;s entry code and a photo of the door. You walk every item honestly, photograph and film what the checklist asks, and never use a photo you did not take there and then.</>,
          <>Where you price a repair, you enter Urban Company&apos;s price for that service on the day, and parts at their rate card, truthfully. You never accept money, gifts or commission from an owner or a professional.</>,
          <>You send an owner only repairs Urban Company has a slot for that day. Once one is approved you book it on Urban Company straight away, stay while it is done, mark when the professional arrives, and record the after-photo. If it cannot be done on the visit, you cancel it in the app — the owner is refunded — and cancel the booking on Urban Company too.</>,
          <>You never open cupboards, wardrobes, lockers or any locked storage, never keep an owner&apos;s keys overnight, and never let anyone into a property.</>,
          <>Addresses, entry codes, photos and everything else you learn on a job are confidential. They stay in the app and are never shared, copied or posted anywhere.</>,
          <>The body camera is StillYours property, issued against a signed receipt. You wear it for the whole of every visit; footage is uploaded after each visit and wiped from the device. If it is lost or damaged, its replacement cost of ₹9,000 is deducted from your fees.</>,
          <>Your deposit is held back from your pay, never asked for in cash: {DEPOSIT.rate * 100}% of what each job pays, until it reaches {inr(DEPOSIT.target)}. Overtime is always paid in full and never held. It is returned when you leave in good standing and hand the camera back in working order, less any deduction below that has not been taken back.</>,
          <>You may hold up to {HOLD.max} claimed jobs at once — {HOLD.untilUnlock} until {inr(DEPOSIT.unlock)} of your deposit is in — no more than {HOLD.perDay} on one day and one per time window, and work one at a time.</>,
          <>Handing a claimed job back is free until {PENALTY.freeReleaseHours} hours before its window opens. After that, {inr(PENALTY.lateRelease)} comes off your deposit.</>,
          <>If a job&apos;s window closes and you have not checked in, it is a missed visit: {inr(PENALTY.noShow)} comes off your deposit, the job goes back to the board, and the owner may move or cancel it free. If you had told the owner you were on the way, you have {PENALTY.enRouteGraceMinutes} minutes past the window to check in first. {PENALTY.pauseAfter} missed visits in {PENALTY.pauseWindowDays} days pause your account until we have spoken with you.</>,
          <>A deduction that takes your deposit below {inr(DEPOSIT.target)}, or below zero, is made good from your next jobs in the same way — {DEPOSIT.rate * 100}% of each one&apos;s pay. Every deduction is listed in the app with the visit it was for. If you missed a visit because of a real emergency, tell us: we can take the deduction back, and a miss we take back does not count towards a pause.</>,
          <>A new inspector&apos;s first two visits are done with one of the founders beside them.</>,
          <>We may remove anyone from the roster who breaks these terms, puts an owner&apos;s property or trust at risk, or falls below the rating standard owners expect.</>,
        ]} />
      </Clause>
    </LegalPage>
  );
}
