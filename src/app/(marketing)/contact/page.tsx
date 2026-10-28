import type { Metadata } from "next";
import Link from "next/link";
import { Clause, LegalPage } from "@/components/legal/Legal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach StillYours — email, Instagram, our registered address and our Grievance Officer.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact | StillYours", description: "Email, Instagram, address and Grievance Officer.", url: "/contact" },
};

export default function Page() {
  return (
    <LegalPage
      current="/contact"
      title="Contact us"
      lede="A person reads every message. We reply within one working day — usually much sooner."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { k: "Email", v: <a href={`mailto:${site.contactEmail}`} className="text-accent underline underline-offset-2">{site.contactEmail}</a>, n: "Bookings, visits, bills, anything at all." },
          { k: "In the app", v: "Help, in the owner app", n: "Kept with the visit it is about, so nothing is lost." },
          { k: "Instagram", v: <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">{site.instagramHandle}</a>, n: "Messages open." },
          { k: "Address", v: site.address, n: `${site.company} · run by ${site.operator}` },
        ].map((c) => (
          <div key={c.k} className="card border border-line bg-white p-5">
            <div className="t-label">{c.k}</div>
            <div className="mt-1.5 text-[16px] font-medium">{c.v}</div>
            <p className="t-small mt-1">{c.n}</p>
          </div>
        ))}
      </div>

      <Clause id="grievance" n={1} title="Grievance Officer">
        <p>
          For complaints about the service or about your personal data: <b>Naitik Agrawal</b>, Grievance Officer, {site.company}, {site.address} —{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. We acknowledge within 48 hours and resolve within 30 days.
        </p>
      </Clause>

      <Clause id="legal" n={2} title="Our policies">
        <p>
          <Link href="/terms">Terms of Service</Link> · <Link href="/privacy">Privacy Policy</Link> · <Link href="/refunds">Refund &amp; Cancellation Policy</Link>
        </p>
      </Clause>
    </LegalPage>
  );
}
