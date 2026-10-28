import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { reachOn } from "@/lib/phone";
import { ProfileForm } from "./ProfileForm";

export default async function Page() {
  const user = await requireOwner({ allowOnboarding: true });
  /* Onboarded and reachable: nothing to do here. Onboarded without a
     number (an account from before numbers were required) stays, to
     give one. */
  if (user.onboardedAt && reachOn(user)) redirect("/app");

  return (
    <>
      <h1 className="serif text-[clamp(2rem,4vw,2.7rem)] leading-[1.05] tracking-[-0.035em]">
        Welcome. One quick thing first.
      </h1>
      <p className="t-lede mt-3 max-w-[52ch] text-text-2">
        Your name goes on every report, and the inspector calls this number from your door. Then you are in — add a home and book your visit whenever you are ready.
      </p>
      <div className="mt-8"><ProfileForm phone={reachOn(user)} name={user.name} email={user.email} livesIn={user.livesIn} signedInAs={user.googleSub ? user.email : ""} /></div>
    </>
  );
}
