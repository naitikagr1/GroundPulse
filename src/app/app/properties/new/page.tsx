import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { PropertyForm } from "@/components/app/PropertyForm";
import { mapConfig } from "@/lib/ola";
import { PageHead } from "@/components/app/ui";

export const metadata = { title: "Add a property" };

export default async function Page({ searchParams }: PageProps<"/app/properties/new">) {
  await requireOwner();
  /* from the free-visit card: once it is saved, straight on to booking it */
  const thenBook = (await searchParams).then === "book";
  return (
    <>
      <Link href="/app/properties" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-text-2 transition hover:text-ink"><ArrowLeft size={14} /> Properties</Link>
      <PageHead
        eyebrow="New"
        title="Add a property"
        lede="What it is, where it is, and how somebody gets in. The rooms you list become the checklist an inspector walks."
      />
      <PropertyForm map={mapConfig()} welcome={thenBook} />
    </>
  );
}
