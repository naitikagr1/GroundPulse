import type { Metadata } from "next";
import Link from "next/link";
import { Bullets, Clause, LegalPage, Points, Table, type Toc } from "@/components/legal/Legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal data StillYours collects, why, who sees it, how long we keep it, and your rights under India's Digital Personal Data Protection Act.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy | StillYours", description: "What we collect, why, who sees it, how long we keep it, and your rights.", url: "/privacy" },
};

const toc: Toc = [
  { id: "who", title: "Who we are" },
  { id: "collect", title: "What we collect" },
  { id: "use", title: "Why we use it" },
  { id: "basis", title: "Consent and legal basis" },
  { id: "share", title: "Who sees it" },
  { id: "where", title: "Where it is stored" },
  { id: "keep", title: "How long we keep it" },
  { id: "security", title: "How we protect it" },
  { id: "rights", title: "Your rights" },
  { id: "cookies", title: "Cookies and similar" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes to this policy" },
  { id: "grievance", title: "Grievance Officer" },
];

export default function Page() {
  return (
    <LegalPage
      current="/privacy"
      title="Privacy Policy"
      lede="You are trusting us with your home, your number and pictures of the inside of your property. This is exactly what we do with them — and what we never do."
      toc={toc}
      summary={[
        <>We collect what we need to inspect your property and send you the proof — your contact details, your property&apos;s address and access notes, and the photos and video from each visit.</>,
        <>Your property media is seen only by you, the inspector who took it, and anyone you choose to share a report with. We never sell it and never use it for advertising.</>,
        <>Visit recordings are deleted after 90 days unless you ask us to keep them.</>,
        <>No advertising trackers or analytics — just the cookies you need to stay signed in.</>,
        <>You can see, correct and delete your data, and close your account from the app at any time.</>,
      ]}
    >
      <Clause id="who" n={1} title="Who we are">
        <p>
          {site.company} is run by {site.operator}, {site.address} (&quot;StillYours&quot;, &quot;we&quot;). We run stillyours.in and the StillYours owner and inspector apps.
          For personal data you give us, we are the data fiduciary under the Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;).
          This policy applies alongside our <Link href="/terms">Terms of Service</Link>.
        </p>
      </Clause>

      <Clause id="collect" n={2} title="What we collect">
        <Table head={["Whose, and what", "Details"]} rows={[
          ["Owners — your account", "From Google sign-in: your name, email address and Google account ID — never your Google password. If you sign up with email instead: your email address and a password, which we keep only as a one-way salted hash — nobody, including us, can read it back. From you: your mobile number, the city or country you live in, your time zone, and your notification preferences."],
          ["Owners — your properties", "Addresses, map pins, size and rooms, access notes, who holds the keys, and each visit's entry code."],
          ["Visits and reports", "Photographs and video of the property, the time and — where the phone can tell — the location they were taken at, the checklist, the inspector's notes, and the inspector's location when checking in at the door."],
          ["Decisions and payments", "Bookings, approvals and declines with your reasons, ratings, support messages, bills, and payment references from Razorpay. We never receive your card number, UPI PIN or bank login."],
          ["Inspectors", "Name, mobile number, UPI ID for payouts, identity and address documents and police verification (checked in person), location during check-in, work records and ratings."],
          ["Early-access and job applications", "What you enter on our forms — name, contact details, property or background details."],
          ["Technical", "The sign-in cookies described in section 10, and your IP address, held briefly to limit how many sign-in codes can be requested."],
        ]} />
      </Clause>

      <Clause id="use" n={3} title="Why we use it">
        <Bullets items={[
          "To carry out visits: assigning an inspector, letting them in with your entry code, walking the checklist and delivering your report.",
          "To arrange and supervise repairs and cleaning you approve.",
          "To take payments, raise bills and send refunds, and to pay inspectors.",
          "To sign you in securely, and to prevent fraud and abuse — such as limiting sign-in codes.",
          "To tell you what is happening: bookings, arrivals, reports, repairs and bills.",
          "To answer your questions and complaints.",
          "To improve the service and train inspectors — using only what you have agreed to, and with anything personal removed.",
          "To meet our legal obligations, including tax and accounting records.",
        ]} />
        <p>We do not sell personal data, and we do not use it for advertising or share it with advertisers.</p>
      </Clause>

      <Clause id="basis" n={4} title="Consent and legal basis">
        <Points n={4} items={[
          <>We process your personal data with your consent, which you give when you create an account, book a visit or submit a form, and for the legitimate uses the DPDP Act allows — such as providing a service you have asked for and meeting legal obligations.</>,
          <>You can withdraw consent at any time by writing to us or closing your account. Withdrawing does not affect what was done before, and some data must still be kept for legal reasons (section 7). Without the core data we cannot provide visits.</>,
          <>Where you give us details of another person — a caretaker, key holder or family member you share a report with — please make sure they are happy for you to do so.</>,
        ]} />
      </Clause>

      <Clause id="share" n={5} title="Who sees it">
        <Table head={["Who", "What, and why"]} rows={[
          ["The inspector on your visit", "The property's address and pin, access notes, key holder, entry code, your name and number (for the live call you asked for) — only for the visits they are assigned."],
          ["Repair and cleaning professionals", "The address, the issue and the day — only for work you have approved."],
          ["People you share a report with", "The report you chose to share, through a private link you can switch off at any time."],
          ["Google", "Signs owners in. Google tells us who you are; we tell Google nothing about your properties."],
          ["Service providers who process data for us", "Hosting and database (Vercel and our database host), video storage (Cloudflare R2), payments (Razorpay), maps and address search (Ola Maps), email delivery, and SMS delivery for sign-in codes (Fast2SMS). They may use it only to provide their service to us."],
          ["Authorities", "Where the law requires it, or to protect someone's safety."],
          ["A successor business", "If StillYours is merged or sold, under the same protections as this policy."],
        ]} />
      </Clause>

      <Clause id="where" n={6} title="Where it is stored">
        <p>
          Your data is stored with the providers listed above, some of whose servers are outside India. We transfer data abroad only as the DPDP Act permits,
          and only to providers bound to protect it. Video is kept in private storage and opened only through short-lived, signed links.
        </p>
      </Clause>

      <Clause id="keep" n={7} title="How long we keep it">
        <Table head={["Data", "Kept for"]} rows={[
          ["Visit recordings (video)", "90 days after the visit, unless you ask us to keep them longer."],
          ["Reports, photos and decisions", "While your account is open — they are your property's record."],
          ["Bills and payment records", "8 years, as Indian tax law requires."],
          ["Sign-in codes", "10 minutes. IP addresses are used only to count code requests over 15 minutes, and are never written to our database."],
          ["After you close your account", "Your name, number and email are removed from it straight away, and share links are switched off. What the law requires us to keep (bills) is kept for that period; the rest is deleted or anonymised."],
        ]} />
      </Clause>

      <Clause id="security" n={8} title="How we protect it">
        <Bullets items={[
          "Everything travels over HTTPS. Sessions are signed so they cannot be forged.",
          "Video sits in private storage and is opened only through links that expire within minutes, checked against who is asking.",
          "Each person sees only their own data: an owner their own properties, an inspector only the jobs assigned to them.",
          "Photographs can only be taken live on the inspector's camera, never uploaded from a gallery.",
        ]} />
        <p>No system is perfectly secure. If a breach affects your data, we will tell you and the Data Protection Board of India as the law requires.</p>
      </Clause>

      <Clause id="rights" n={9} title="Your rights">
        <p>Under the DPDP Act you have the right to:</p>
        <Bullets items={[
          "get a summary of the personal data we hold about you and how it is used;",
          "have it corrected, completed or updated;",
          "have it erased, where we no longer need it or you withdraw consent — subject to what the law requires us to keep;",
          "have a grievance answered; and",
          "nominate someone to exercise these rights for you in case of death or incapacity.",
        ]} />
        <p>
          You can update most details yourself under Account in the app, and close your account there. For anything else, write to our Grievance Officer (section 13).
          We respond within 30 days.
        </p>
      </Clause>

      <Clause id="cookies" n={10} title="Cookies and similar">
        <Table head={["Name", "Purpose"]} rows={[
          ["sy_session", "Keeps you signed in, for up to 30 days. Essential."],
          ["sy_otp", "Inspectors: holds a scrambled sign-in code while it is entered, for 10 minutes. Essential."],
          ["sy_oauth", "Owners: holds a one-time check while you sign in with Google, for 10 minutes. Essential."],
          ["A setting in your browser", "Remembers that you dismissed the “add to home screen” hint."],
        ]} />
        <p>We use no advertising cookies, no analytics trackers and no third-party pixels.</p>
      </Clause>

      <Clause id="children" n={11} title="Children">
        <p>The Service is for adults. We do not knowingly collect personal data from anyone under 18. If you believe a child has given us data, contact us and we will delete it.</p>
      </Clause>

      <Clause id="changes" n={12} title="Changes to this policy">
        <p>If we change this policy in a way that matters, we will tell you in the app or by email before it takes effect. The date at the top shows when it last changed.</p>
      </Clause>

      <Clause id="grievance" n={13} title="Grievance Officer">
        <p>
          <b>Naitik Agrawal</b>, Grievance Officer<br />
          {site.company}<br />
          {site.address}<br />
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </p>
        <p>
          We acknowledge every request within 48 hours and resolve it within 30 days. If you are not satisfied with our response, you may complain to the Data Protection Board of India.
        </p>
      </Clause>
    </LegalPage>
  );
}
