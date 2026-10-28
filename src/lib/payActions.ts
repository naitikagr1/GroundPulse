"use server";

/* ════════════════════════════════════════════════════════════════
   Paying, from the owner's side.

   The amount is always worked out here, from the store — never taken
   from the page. The browser only says what it wants to pay for.
   ════════════════════════════════════════════════════════════════ */

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import { db, mutate, now, uid } from "@/lib/store";
import { balanceDue, settlePayment } from "@/lib/payments";
import { checkoutSignatureOk, createOrder, payMode, razorpayKeyId } from "@/lib/razorpay";
import { repairBill } from "@/lib/repair";
import { isLive, liveRefusal } from "@/lib/liveRepairs";
import { liveSub } from "@/lib/plans";
import { fmtDayDate, isBookable } from "@/lib/format";
import { reachOn } from "@/lib/phone";
import type { Payment, PaymentPurpose } from "@/lib/types";

export type PayStart =
  | { ok: true; mode: "razorpay" | "dev"; paymentId: string; orderId: string; amountInr: number; keyId: string; description: string; prefill: { name: string; email: string; contact: string } }
  | { ok: false; error: string };

export async function startPayment(purpose: PaymentPurpose, refId: string): Promise<PayStart> {
  const user = await requireOwner();
  if (!["advance", "repair", "invoice"].includes(purpose) || typeof refId !== "string") return { ok: false, error: "Bad request." };
  const mode = payMode();
  if (mode === "off") return { ok: false, error: "Online payment is not switched on yet. Write to us from Help and we will sort it out." };

  const d = await db();
  let amountInr = 0;
  let coveredInr = 0;
  let description = "";

  if (purpose === "advance") {
    const v = d.visits.find((x) => x.id === refId && x.ownerId === user.id);
    if (!v || v.status !== "unpaid" || v.advanceInr <= 0) return { ok: false, error: "There is nothing to pay on this visit." };
    /* Paying days later for a visit that is now tomorrow leaves nobody
       time to take it. Move it first. */
    if (!isBookable(v.scheduledFor, 1)) return { ok: false, error: "This visit's day is too close now — move it to a new day first, then pay." };
    const p = d.properties.find((x) => x.id === v.propertyId);
    amountInr = v.advanceInr;
    description = `${p?.label ?? "Visit"} · ${fmtDayDate(v.scheduledFor)}`;
  } else if (purpose === "invoice") {
    const inv = d.invoices.find((i) => i.id === refId && i.ownerId === user.id);
    if (!inv || inv.status !== "due") return { ok: false, error: "That bill is already settled." };
    amountInr = inv.amountInr;
    description = `${inv.title} · ${inv.ref}`;
  } else {
    const iss = d.issues.find((i) => i.id === refId && i.ownerId === user.id);
    if (!iss || iss.decision !== "pending") return { ok: false, error: "This one is already decided or closed." };
    const refusal = liveRefusal(d, iss);
    if (refusal) return { ok: false, error: refusal };
    if (!isLive(iss)) {
      const rep = d.reports.find((r) => r.id === iss.reportId);
      if (!rep || rep.heldForReview) return { ok: false, error: "We could not find that issue." };
      if (balanceDue(d, iss.visitId)) return { ok: false, error: "Pay for the report first — then you can approve repairs from it." };
    }
    if (!iss.quote) return { ok: false, error: "There is no quote on this yet." };
    const visit = d.visits.find((v) => v.id === iss.visitId);
    const sub = visit?.subscriptionId ? d.subscriptions.find((x) => x.id === visit.subscriptionId) ?? null : liveSub(d.subscriptions, iss.propertyId);
    const bill = repairBill(iss, { founding: visit?.founding === true, sub });
    if (!bill || bill.payable <= 0) return { ok: false, error: "This one is fully covered — approve it without paying." };
    amountInr = bill.payable;
    coveredInr = bill.covered;
    description = `Repair · ${iss.title} · ${iss.ref}`;
  }

  const paymentId = uid();
  let orderId: string;
  try {
    orderId = mode === "razorpay"
      ? await createOrder(amountInr, paymentId, { purpose, refId, paymentId, ownerId: user.id })
      : `dev_${uid()}`;
  } catch (err) {
    console.error(err);
    return { ok: false, error: "The payment could not be started just now. Try again in a minute." };
  }

  const pay: Payment = {
    id: paymentId, ownerId: user.id, purpose, refId, amountInr, coveredInr, orderId, paymentId: "",
    status: "created", createdAt: now(), paidAt: null,
  };
  await mutate((s) => { s.payments.push(pay); });

  return {
    ok: true, mode, paymentId, orderId, amountInr, keyId: razorpayKeyId(), description,
    prefill: { name: user.name, email: user.email, contact: ((n) => (!n || n.startsWith("+") ? n : `+91${n}`))(reachOn(user)) },
  };
}

export async function confirmPayment(input: { paymentId: string; orderId: string; razorpayPaymentId: string; signature: string }): Promise<{ ok: boolean; error?: string }> {
  const user = await requireOwner();
  const d = await db();
  const pay = d.payments.find((p) => p.id === input.paymentId && p.ownerId === user.id && p.orderId === input.orderId);
  if (!pay) return { ok: false, error: "We could not match that payment. If money left your account, write to us from Help." };

  const mode = payMode();
  const genuine = mode === "razorpay"
    ? checkoutSignatureOk(pay.orderId, input.razorpayPaymentId, input.signature)
    : mode === "dev" && pay.orderId.startsWith("dev_");
  if (!genuine) return { ok: false, error: "That payment could not be verified. If money left your account, write to us from Help." };

  const method = mode === "razorpay" ? `Razorpay · ${input.razorpayPaymentId}` : "Simulated payment · development";
  await mutate((s) => {
    const p = s.payments.find((x) => x.id === pay.id);
    if (p) settlePayment(s, p, input.razorpayPaymentId || `dev_pay_${uid()}`, method);
  });
  revalidatePath("/app", "layout");
  return { ok: true };
}
