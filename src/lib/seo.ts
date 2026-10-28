import { site } from "@/lib/site";
import { faqs } from "@/lib/faq";

/** Every absolute URL in metadata and structured data is built from this. */
export const SITE_URL = "https://www.stillyours.in";

export const abs = (path: string) => new URL(path, SITE_URL).toString();

/* Only facts the site actually states go in here. No phone, no geo, no
   opening hours and above all no aggregateRating — invented review markup is
   the one thing Google hands out manual penalties for. */
export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#organization`,
  name: site.name,
  legalName: site.company,
  slogan: site.tagline,
  url: SITE_URL,
  email: site.contactEmail,
  sameAs: [site.instagram],
  logo: abs("/logo.png"),
  image: abs("/opengraph-image.png"),
  description:
    "Verified inspectors walk your home, plot or car on a fixed day, photograph every room and send a timestamped report within the hour. No repair happens without the owner's approval.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "HSR Layout",
    addressLocality: site.city,
    postalCode: "560102",
    addressRegion: "Karnataka",
    addressCountry: "IN",
  },
  // Only list cities that are live. Search engines show this to people in these
  // cities, so an unlaunched city here sends visitors we can't serve.
  areaServed: [
    { "@type": "City", name: "Bengaluru" },
  ],
  knowsLanguage: ["en-IN", "hi-IN"],
  priceRange: "₹₹",
  currenciesAccepted: "INR",
};

export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: site.name,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-IN",
};

/** Google only shows FAQ rich results when the answers are visible on the
    page, so this is built from the same array the accordion renders. */
export const faqPageLd = (subset?: (f: { q: string }) => boolean) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.filter(subset ?? (() => true)).map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});

export const serviceLd = ({ name, description, path, serviceType }: { name: string; description: string; path: string; serviceType: string }) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  serviceType,
  url: abs(path),
  provider: { "@id": `${SITE_URL}/#organization` },
  areaServed: { "@type": "City", name: site.city },
});

export const breadcrumbLd = (trail: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: abs(t.path),
  })),
});
