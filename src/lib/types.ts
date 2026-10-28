/* ════════════════════════════════════════════════════════════════
   The owner app's domain, in one place.

   Every shape here is what the Postgres tables will hold, so moving
   off the local JSON store is a rewrite of `store.ts` alone — nothing
   above it changes. `store.ts` also upgrades an older store.json to
   these shapes on load, so nobody has to wipe their local data.
   ════════════════════════════════════════════════════════════════ */

import type { BhkKey } from "@/lib/cleaning";

export type Role = "owner" | "inspector" | "admin";

/* An inspector does not go from "applied" to "trusted with a key" in one
   step, and the app cannot pretend they do — the trial inspection needs
   app access *before* verification finishes, and the first five solo
   reports are read by a person before an owner ever sees them. */
export type InspectorStatus =
  | "applied"      // form in, nothing else yet — no app access
  | "screened"     // phone screen done
  | "interviewed"  // originals checked in person, police verification filed
  | "trial"        // app access, shadow and supervised jobs only
  | "probation"    // solo jobs, every report reviewed before it is published
  | "active"       // full access
  | "paused";      // rating below the bar, or a breach under review

export type User = {
  id: string;
  role: Role;
  name: string;
  /** "9876543210" for India, "+971501234567" everywhere else — see lib/phone.
      A number proved by a code: an inspector's sign-in. Owners who sign in
      with Google have none here — see contactPhone. */
  phone: string;
  email: string;
  /** the Google account an owner signs in with — its stable id, not the email */
  googleSub?: string;
  /** the number an owner gives us to be reached on — the inspector's live
      call, updates. Never used to sign anybody in. */
  contactPhone?: string;
  /** owners who sign in with an email and a password: a salted scrypt
      hash — never the password itself */
  passwordHash?: string;
  /** when they proved the email is theirs — a link we sent, a password
      reset, or Google */
  emailVerifiedAt?: string | null;
  /** bumped when the password changes, so every older session ends */
  authVersion?: number;
  livesIn: string;
  /** the zone their browser reported, so times can be shown on their clock
      next to IST */
  tz: string;
  /** which channels they want messages on; the app itself always shows everything */
  prefs: { sms: boolean; email: boolean };
  createdAt: string;
  /** owners who have not finished the welcome flow still see it */
  onboardedAt: string | null;
  /** no longer handed out: the launch offer is counted from the free
      inspections booked (lib/offer). Older rows keep what they had. */
  foundingNo: number | null;
  /** the offer is one free inspection per owner, so it is spent once */
  freeVisitUsedAt: string | null;
  /** ops cancelled their free booking as not genuine: no free one again */
  freeRevokedAt?: string | null;
  /** closed accounts keep their row — bills and reports keep their history —
      but everything personal on it is blanked */
  deletedAt: string | null;
};

export type PropertyKind = "home" | "plot" | "car";
export type HomeType = "Apartment" | "Villa" | "Independent house" | "Builder floor";

export type RoomKey = "bed" | "bath" | "living" | "kitchen" | "balcony" | "study" | "terrace" | "parking";

export type Property = {
  id: string;
  ownerId: string;
  kind: PropertyKind;
  label: string;
  address: string;
  locality: string;
  /** always normalised — see lib/city */
  city: string;
  type: HomeType | "";
  size: BhkKey;
  rooms: Record<RoomKey, number>;
  /** what the inspector needs to get in and be expected */
  accessNote: string;
  keyHolderName: string;
  keyHolderPhone: string;
  /** which vector scene stands in for the cover photo */
  cover: "entrance" | "living" | "balcony" | "kitchen";
  /** the exact spot, when somebody has marked it — see Pin */
  pin: Pin | null;
  createdAt: string;
  archivedAt: string | null;
};

/* Where the property actually stands. Every distance an inspector is
   held to is measured from here, so it records who put it there: the
   owner on a map, the owner standing at the gate, or the inspector at
   the first visit — which stays unconfirmed until the owner agrees. */
export type Pin = {
  lat: number;
  lng: number;
  /** the phone's own error radius when it came from GPS; null from a map */
  accuracyM: number | null;
  source: "map" | "gps" | "inspector";
  at: string;
  confirmedAt: string | null;
};

/* A plan is bought at booking but only starts — and is only billed —
   when its first visit happens. Until then it is "pending". */
export type SubStatus = "pending" | "active" | "lapsed" | "cancelled";
export type Subscription = {
  id: string;
  ownerId: string;
  propertyId: string;
  planId: string;          // care | care-plus
  visitsTotal: number;
  /** inspections booked against the plan — done or still to come. Taken at
      booking and given back on cancel, so two bookings can never both
      take the last one. */
  visitsUsed: number;
  /** refresh cleans included in the plan year, and how many are booked */
  cleansTotal: number;
  cleansUsed: number;
  /** Care+ maintenance services, same idea */
  servicesTotal: number;
  servicesUsed: number;
  amountInr: number;
  startedAt: string;
  renewsAt: string | null;
  status: SubStatus;
  /** the owner can say "do not renew" at any point in the year */
  autoRenew: boolean;
  /** the booking that bought it — the plan is billed, and starts, with it */
  startedByVisitId: string | null;
  /** Care+ repair cover consumed this plan year */
  coverUsedInr: number;
};

/* A visit walks this line, and every screen in the app reads from it. */
export type VisitStatus =
  | "unpaid"      // booked, waiting on the 25% advance — not on the board yet
  | "scheduled"   // confirmed, nobody assigned yet
  | "assigned"    // an inspector has it
  | "en_route"    // they are on the way
  | "on_site"     // checked in, walking the checklist
  | "submitted"   // checklist done — report written, or being reviewed
  | "ready"       // report published to the owner
  | "closed"      // owner has read it and decided everything in it
  | "cancelled";

export type VisitKind = "inspection" | "cleaning" | "plot" | "car";

/** One priced line, exactly as the owner saw it when they booked. */
export type Line = { k: string; note: string; v: number; was?: number };

export type Visit = {
  id: string;
  ref: string;               // VIS-2026-0412 — what the owner quotes on a call
  ownerId: string;
  propertyId: string;
  kind: VisitKind;
  planId: string;
  /** cleaning tier when kind === "cleaning", or an add-on clean on an inspection */
  tierId: "refresh" | "deep" | "";
  addOns: Record<string, number>;
  scheduledFor: string;      // YYYY-MM-DD, a Bengaluru day
  slot: string;              // "10:00 – 13:00" IST
  status: VisitStatus;
  inspectorId: string;
  /** what this visit bills once it has happened — the plan itself included,
      when this is the booking that bought it */
  amountInr: number;
  paid: boolean;
  liveCall: boolean;
  notes: string;
  /** booked against the launch offer: nothing charged, and repairs
      flagged on it carry no StillYours fee */
  founding: boolean;
  /** the plan this visit belongs to, when it belongs to one */
  subscriptionId: string | null;
  /** takes one of the plan's inspections — the inspection line is ₹0 */
  usesPlan: boolean;
  /** a refresh clean taken from the plan's included cleans */
  planClean: boolean;
  /** a Care+ maintenance service booked onto this visit, in the owner's words */
  planService: string;
  /** the priced lines exactly as the owner saw them when booking */
  lines: Line[];
  /** what the inspector earns for it — shown on the job board before
      they claim, because nobody should have to accept work blind */
  payoutInr: number;
  /** the owner's entry code. No OTP, no checklist — the inspectors'
      own declaration, enforced here rather than trusted */
  otp: string;
  /** the second code — given back at the end, by whoever takes the keys.
      The visit only closes with it. */
  exitCode?: string;
  exitTries?: number;
  /** wrong codes tried at the door — five locks the door until ops has
      spoken to the owner */
  otpTries: number;
  claimedAt: string | null;
  /** the door: when, where (null when GPS would not work there), how
      sure the phone was, how far from the property's pin (-1 when there
      was no location or no pin to measure from), the photo, and the
      inspector's reason when they were far off or had no signal */
  checkIn: { at: string; lat: number | null; lng: number | null; accuracyM: number | null; distanceM: number; doorPhoto: Photo | null; note: string } | null;
  /** the working checklist, saved on every tap so a dropped signal
      never costs somebody a room they already walked */
  draft: DraftRoom[] | null;
  /** body camera rolling for the whole visit, when it was booked */
  recording: boolean;
  /** how the owner rated the inspector, once the report is in */
  rating: { stars: number; note: string; at: string } | null;
  createdAt: string;
  cancelledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  reportId: string | null;
  /** the 25% taken at booking; 0 when nothing was due up front */
  advanceInr: number;
  /** ₹200 for every hour past two on site — paid by us, not the owner */
  overtimeInr: number;
  /** when the inspector who held it did not turn up. The owner may then
      move or cancel it even on the day, free */
  missedAt?: string | null;
  /** what was held back from this job's pay towards the deposit */
  depositHeldInr?: number;
  /** when the inspector let the cleaning crew start — every before photo
      is taken by then, and no after photo is taken until well past it */
  crewStartedAt?: string | null;
  /** when ops sent this job's pay to the inspector's UPI */
  payoutSentAt?: string | null;
};

export type ItemState = "pass" | "attn" | "fail";

/* What the inspector is filling in while they are standing in the room.
   Separate from ReportItem because a draft item has no verdict yet, and a
   report with an unanswered item must never be publishable. */
export type Photo = {
  id: string;
  /** where the 320px JPEG lives — /api/media/photo/<uuid>.jpg, from
      keepImage in lib/media. Older records hold the data URL itself. */
  thumb: string;
  at: string;
  lat: number | null;
  lng: number | null;
};
/* A clip from the inspector's camera. The file lives in object storage
   (a folder on disk in development); this is the pointer and the stamp. */
export type Video = {
  id: string;
  /** visits/<visitId>/<id>.<ext>, or repairs/<issueId>/<id>.<ext> */
  key: string;
  mime: string;
  sizeBytes: number;
  durationS: number;
  /** the first frame, a 320px JPEG — what a list shows before anybody presses play */
  poster: string;
  at: string;
  lat: number | null;
  lng: number | null;
};
/** What the same job costs on Urban Company today, looked up by the
    inspector standing in front of it. Our 15% goes on top. */
export type DraftQuote = {
  service: string;
  /** the Urban Company price for the work itself */
  price: number;
  /** parts at their rate card, if the job needs any */
  parts?: number;
  /** outside Care+ by its terms — appliance, structural, cosmetic, damage */
  excluded?: boolean;
  /** the inspector checked: Urban Company shows a slot for it today */
  slotToday?: boolean;
};
export type DraftItem = {
  t: string; s: ItemState | null; note: string; photos: Photo[]; videos: Video[]; quote?: DraftQuote | null;
  /** the live issue this item became when it was sent to the owner */
  issueId?: string;
};
export type DraftRoom = {
  name: string;
  variant: "bathroom" | "kitchen" | "bedroom" | "balcony" | "electrical" | "entrance" | "living";
  items: DraftItem[];
  /** the room's walkthrough, end to end — the visit cannot be submitted with one missing */
  video: Video | null;
  /** on a visit with a clean, the room from the same spot before the crew
      starts and after they finish. null is still to take; absent is a
      room the crew does not clean, or a visit with no clean */
  before?: Photo | null;
  after?: Photo | null;
};
/** The photographs travel with the item into the report — they are the proof. */
export type ReportItem = { t: string; s: ItemState; note?: string; photos?: Photo[]; videos?: Video[] };
export type ReportRoom = {
  name: string;
  variant: "bathroom" | "kitchen" | "bedroom" | "balcony" | "electrical" | "entrance" | "living";
  dur: string;
  /** the room's walkthrough; reports from before real video have none */
  video?: Video | null;
  /** the clean, from the same spot, when the visit had one */
  before?: Photo | null;
  after?: Photo | null;
  items: ReportItem[];
};

export type Report = {
  id: string;
  ref: string;               // RPT-2026-0412
  visitId: string;
  propertyId: string;
  ownerId: string;
  score: number;
  counts: { pass: number; attn: number; fail: number };
  rooms: ReportRoom[];
  summary: string;
  inspectorId: string;
  /** the chain of custody the whole promise rests on */
  otpAt: string;
  onSite: string;
  gps: string;
  videos: string;
  /** the front door, photographed before anybody went in */
  doorPhoto: Photo | null;
  publishedAt: string;
  readAt: string | null;
  /* An inspector on probation has every report read by a person before
     it reaches the owner. The report exists from the moment it is
     submitted; this is what keeps it — and everything flagged in it —
     out of the owner's app until then. */
  heldForReview: boolean;
  reviewedAt: string | null;
  /** a private read-only link the owner can hand to family; null when off */
  shareToken: string | null;
};

/* "closed": nobody decided — the hour ran out, the visit was closed first,
   or it was only noted and never sent for a decision. */
export type Decision = "pending" | "approved" | "declined" | "closed";
/* requested → the owner has approved and said when suits them
   assigned  → a verified pro and a day are confirmed
   in_progress / completed → the work, inspector present */
/* cancelled → it could not be done on the visit: refunded in full, never
   carried to another day */
export type RepairStatus = "requested" | "assigned" | "in_progress" | "completed" | "cancelled";

export type Quote = {
  labour: number; parts: number; fee: number; total: number; provider: string; trade: string;
  /** "urban-company": labour is the Urban Company price for `trade`, as
      the inspector found it — shown to the owner as exactly that */
  source?: "urban-company";
};

export type Issue = {
  id: string;
  ref: string;               // ISS-0917
  reportId: string;
  visitId: string;
  propertyId: string;
  ownerId: string;
  room: string;
  title: string;
  severity: ItemState;       // attn | fail
  body: string;
  variant: ReportRoom["variant"];
  /** the inspector's own photographs of it, and any clips */
  photos: Photo[];
  videos: Video[];
  quote: Quote | null;
  quotedAt: string | null;
  /** whether Care+ cover can apply at all — ops says no for excluded work
      (appliances, structural) and for anything flagged on the plan's
      first visit, which the cover terms leave out */
  coverEligible: boolean;
  /** what the plan absorbs — an estimate until the owner approves, then
      fixed at the number they approved */
  coveredInr: number;
  decision: Decision;
  decidedAt: string | null;
  /** why the owner said no — the site promises "decline with a reason" */
  declineReason?: string;
  /** sent to the owner live, from the property, while the inspector is
      still there — and the hour they have to decide in */
  sentAt?: string | null;
  decideBy?: string | null;
  /** why it closed without a decision */
  closedWhy?: "expired" | "visit_closed" | "not_sent";
  repair: {
    status: RepairStatus;
    providerName: string;
    trade: string;
    /** the day, chosen by the owner; "" until they have */
    scheduledFor: string;
    slot: string;
    completedAt: string | null;
    note: string;
    /** from the same spot as the before — a photo, a clip, or both */
    afterPhoto: Photo | null;
    afterVideo: Video | null;
    /** a live repair: when the professional reached the property. Two
        hours from approval without one, it is cancelled and refunded. */
    proArrivedAt?: string | null;
    cancelledAt?: string | null;
    /** the owner's rating of the finished work */
    rating?: { stars: number; note: string; at: string } | null;
  } | null;
};

/* due → paid, and for a paid bill on something that then did not happen:
   refund_due → refunded. A bill that was never paid is simply removed. */
export type InvoiceStatus = "due" | "paid" | "refund_due" | "refunded";

export type Invoice = {
  id: string;
  ref: string;               // INV-2026-0031
  ownerId: string;
  propertyId: string;
  visitId: string | null;
  issueId: string | null;
  subscriptionId: string | null;
  title: string;
  amountInr: number;
  status: InvoiceStatus;
  method: string;
  createdAt: string;
  /** which part of the money this is. Only a "balance" bill that is still
      due keeps a report closed. */
  stage?: "advance" | "balance" | "repair" | "";
  /** the Razorpay payment behind it, for a refund */
  paymentId?: string;
};

/* One attempt to pay for something. The Razorpay order carries our id;
   whichever arrives first — the browser's confirmation or the webhook —
   settles it, and settling twice does nothing. */
export type PaymentPurpose = "advance" | "repair" | "invoice";
export type Payment = {
  id: string;
  ownerId: string;
  purpose: PaymentPurpose;
  /** the visit (advance), issue (repair) or invoice it pays for */
  refId: string;
  amountInr: number;
  /** what Care+ was absorbing when the owner saw the price (repairs) */
  coveredInr: number;
  orderId: string;
  paymentId: string;
  status: "created" | "paid";
  createdAt: string;
  paidAt: string | null;
};

/* One append-only stream. The property timeline, the notification bell and
   the "who decided what" audit are three readings of this same table. */
export type EventType =
  | "property.added" | "property.updated" | "property.archived" | "property.pinned"
  | "visit.booked" | "visit.moved" | "visit.cancelled" | "visit.assigned" | "visit.en_route"
  | "visit.started" | "visit.submitted" | "report.ready" | "report.shared"
  | "issue.raised" | "issue.quoted" | "issue.approved" | "issue.declined"
  | "repair.scheduled" | "repair.assigned" | "repair.started" | "repair.completed"
  | "plan.started" | "plan.upgraded" | "plan.renewal" | "plan.cancelled"
  | "invoice.paid" | "invoice.refund"
  | "ticket.opened" | "ticket.answered"
  | "account.updated" | "message";

export type Event = {
  id: string;
  ownerId: string;
  propertyId: string | null;
  visitId: string | null;
  type: EventType;
  title: string;
  body: string;
  href: string;
  at: string;
  /** shows in the bell until opened */
  readAt: string | null;
  /** an event the owner has to act on outranks one that is just news */
  action: boolean;
};

export type InspectorDoc = { name: string; ok: boolean; expiresAt: string | null };

export type Inspector = {
  id: string;
  /** set the moment they are given app access — this is what turns a
      phone number into a sign-in that lands on /field */
  userId: string | null;
  name: string;
  initials: string;
  phone: string;
  /** human summary, shown to owners */
  area: string;
  /** where they start their day, for the nearby sort */
  city: string;
  baseLocality: string;
  /** localities they will travel to — the job board is filtered by city,
      then sorted by distance from base */
  areas: string[];
  rating: number;
  visits: number;
  since: string;
  bg: string;
  verified: boolean;
  status: InspectorStatus;
  docs: InspectorDoc[];
  depositInr: number;
  availability: string[];
  /** how many of the five probation reports a person has already read */
  reviewedReports: number;
  /** where the day's earnings go, by the end of that day */
  upiId: string;
  /** deductions from the deposit — a missed visit, a job handed back late */
  penalties?: Penalty[];
};

export type Penalty = {
  id: string;
  at: string;
  visitId: string;
  /** the visit's ref, as the inspector would recognise it */
  ref: string;
  kind: "no_show" | "late_release";
  amountInr: number;
  /** taken back by ops — a real emergency. It no longer counts towards a pause */
  waivedAt?: string | null;
  waivedWhy?: string | null;
  /** of a waived amount, what the deposit had no room for — sent to their UPI */
  refundInr?: number;
  /** when ops sent that refund */
  refundSentAt?: string | null;
};

/* "Something went wrong with this visit" — written by the owner, answered
   by a person on the ops side, and kept with the visit it is about. */
export type TicketStatus = "open" | "answered" | "closed";
export type Ticket = {
  id: string;
  ref: string;               // TCK-0101
  ownerId: string;
  propertyId: string | null;
  visitId: string | null;
  reportId: string | null;
  topic: string;
  body: string;
  status: TicketStatus;
  reply: string;
  repliedAt: string | null;
  createdAt: string;
};

export type Session = { id: string; userId: string; createdAt: string; expiresAt: string };

/* Sign-in codes are checked against the signed cookie; these rows are the
   brakes — how many codes a number has been sent lately, and how many
   wrong guesses the current one has had. */
export type Otp = { phone: string; purpose: "signin" | "change"; hash: string; expiresAt: string; attempts: number; sends: string[] };

export type DB = {
  /** bumped whenever a shape above changes; store.ts upgrades older files */
  version: number;
  users: User[];
  properties: Property[];
  subscriptions: Subscription[];
  visits: Visit[];
  reports: Report[];
  issues: Issue[];
  invoices: Invoice[];
  events: Event[];
  inspectors: Inspector[];
  tickets: Ticket[];
  sessions: Session[];
  otps: Otp[];
  payments: Payment[];
};
