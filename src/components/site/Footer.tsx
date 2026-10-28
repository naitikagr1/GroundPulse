import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { footerLinks } from "@/lib/nav";
import { site } from "@/lib/site";
import { APPS_LIVE } from "@/lib/flags";
import { START, START_LABEL } from "@/lib/start";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-white">
      <div className="wrap grid grid-cols-1 gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-16">
        <div>
          <Logo />
          <p className="t-body mt-4 max-w-[34ch] text-[15px]">See the true condition of your home, your plot — even your car — from anywhere in the world, without ever stepping through the door.</p>
        </div>
        <div>
          <div className="t-label mb-3">Product</div>
          <ul className="space-y-2 text-[15px] text-text-2">
            {footerLinks.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-ink">{l.label}</Link></li>)}
            <li><Link href={START} className="hover:text-ink">{START_LABEL}</Link></li>
            <li><Link href="/platform" className="hover:text-ink">For investors & engineers</Link></li>
            {APPS_LIVE && <li><Link href="/signin" className="hover:text-ink">Sign in</Link></li>}
            {APPS_LIVE && <li><Link href="/signin?as=inspector" className="hover:text-ink">Inspector sign in</Link></li>}
          </ul>
        </div>
        <div>
          <div className="t-label mb-3">What we promise</div>
          <ul className="space-y-2 text-[15px] text-text-2">
            <li>Homes, plots &amp; land — and the car in the basement</li>
            <li>Reports within the hour</li>
            <li>100% verified inspectors & providers</li>
            <li>No repair without your approval</li>
            <li>Immutable audit trail</li>
          </ul>
        </div>
        <div>
          <div className="t-label mb-3">Contact</div>
          <ul className="space-y-2 text-[15px] text-text-2">
            <li>
              <a href={`mailto:${site.contactEmail}`} className="inline-flex items-center gap-2 hover:text-ink">
                <Mail size={17} className="shrink-0" />
                {site.contactEmail}
              </a>
            </li>
            <li>
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-ink">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                {site.instagramHandle}
              </a>
            </li>
            <li>Bengaluru (live) · Pune, Hyderabad, Jaipur next</li>
            <li>{site.address}</li>
          </ul>
        </div>
      </div>
      <div className="wrap flex flex-col gap-2 border-t border-line py-5 text-[12.5px] text-text-3 sm:flex-row sm:justify-between">
        <span>© 2026 {site.company}. Your property media is stored securely and only visible to verified, assigned users.</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/refunds" className="hover:text-ink">Refunds</Link>
          <Link href="/contact" className="hover:text-ink">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
