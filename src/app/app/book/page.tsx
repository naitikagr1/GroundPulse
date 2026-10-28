import { requireOwner } from "@/lib/auth";
import { freeSpotsLeft, properties, subscriptions } from "@/lib/queries";
import { BookingForm, type PlanInfo } from "@/components/app/BookingForm";
import { PageHead } from "@/components/app/ui";
import { Steps } from "@/components/app/Steps";
import { allowanceLeft, liveSub, planName } from "@/lib/plans";

export const metadata = { title: "Book a visit" };

export default async function Page({ searchParams }: PageProps<"/app/book">) {
  const user = await requireOwner();
  const sp = await searchParams;
  const [mine, subs, freeLeft] = await Promise.all([properties(user.id), subscriptions(user.id), freeSpotsLeft()]);
  const welcome = sp.welcome === "1";

  /* What each property's plan still has to give — the form offers those
     first, so nobody buys a second plan for a home already on one. */
  const planInfo: Record<string, PlanInfo> = {};
  for (const p of mine) {
    const sub = liveSub(subs, p.id);
    if (sub) planInfo[p.id] = { name: planName(sub.planId), planId: sub.planId, total: sub.visitsTotal, left: allowanceLeft(sub) };
  }

  return (
    <>
      {welcome && <div className="pb-6"><Steps at={3} /></div>}
      <PageHead
        eyebrow={welcome ? "Last step" : "New visit"}
        title={welcome ? "Book the first visit." : "Book a visit"}
        lede="Pick the day, and we find a verified inspector for it. The report is with you within the hour of them leaving."
      />
      <BookingForm
        user={user}
        freeLeft={freeLeft}
        properties={mine}
        planInfo={planInfo}
        initialProperty={typeof sp.property === "string" ? sp.property : undefined}
        initialPlan={typeof sp.plan === "string" ? sp.plan : undefined}
        welcome={welcome}
      />
    </>
  );
}
