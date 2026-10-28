/* ════════════════════════════════════════════════════════════════
   Phone-OTP sign-in.

   An owner is often abroad on a foreign SIM, so any country's mobile
   works (see lib/phone) and the session lives in an httpOnly cookie
   for 30 days — long, because the whole point is opening the app at
   11 PM in another country without hunting for a password.

   Codes are sent by SMS through Fast2SMS. On a laptop no SMS is sent —
   the code is returned to the caller and shown on screen, clearly
   marked — unless SMS_IN_DEV=1.
   ════════════════════════════════════════════════════════════════ */

import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, mutate, now, uid } from "@/lib/store";
import { isAccountPhone, isIndianMobile, parsePhone, reachOn } from "@/lib/phone";
import { canInspect, ensureInspector, mayInspect, NOT_ON_ROSTER } from "@/lib/roster";
import { sweepMissed } from "@/lib/jobs";
import { sweepLive } from "@/lib/liveRepairs";
import { buttonEmail, sendEmail } from "@/lib/notify";
import { SITE_URL } from "@/lib/seo";
import type { Otp, User } from "@/lib/types";

export { prettyPhone } from "@/lib/phone";

const COOKIE = "sy_session";
const OTP_COOKIE = "sy_otp";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;

/* The brakes. Six digits is a million guesses — unless nothing stops
   somebody making them. Five wrong tries burns the code; a number can be
   sent a new code every thirty seconds, five times in fifteen minutes. */
const MAX_ATTEMPTS = 5;
const SEND_GAP_S = 30;
const MAX_SENDS = 5;
const SEND_WINDOW_MS = 15 * 60_000;
/* The per-number brake does not stop one machine asking for codes to a
   thousand different numbers — which costs a paid SMS each. So each
   address gets a ceiling too. Per server instance until the store is in
   Postgres; still a brake. */
const MAX_SENDS_PER_IP = 12;
const ipSends = new Map<string, number[]>();

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

async function ipAllowed() {
  const ip = await clientIp();
  const t = Date.now();
  const recent = (ipSends.get(ip) ?? []).filter((s) => t - s < SEND_WINDOW_MS);
  if (recent.length >= MAX_SENDS_PER_IP) return false;
  recent.push(t);
  ipSends.set(ip, recent);
  return true;
}

/* The session lives in the cookie itself, signed — not as an id looked
   up in a table.

   A stored session needs every server that might answer a request to
   see the same store. On a serverless host they do not: each instance
   has its own memory, so an owner who signed in on one instance was a
   stranger to the next and got thrown back to the sign-in page
   mid-booking. A signed cookie any instance can verify removes the
   lookup entirely — and it is the same shape a real deployment uses,
   so none of this is throwaway. */
/* Vercel holds it as SESSION_SECRET1; the older SESSION_SECRET still works
   if that is all a deployment has. The fallback below is written in this
   file for anyone to read, so anybody could forge a sign-in with it —
   fine on a laptop, never in production: there, no secret means no
   sign-in at all, loudly, on the first request that needs one. */
const DEV_SECRET = "stillyours-dev-secret-not-for-production";
function secret() {
  const s = process.env.SESSION_SECRET1 || process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET1 is not set — refusing to sign anything with the development secret.");
  return DEV_SECRET;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

/** Which app a session is in. One number can be an owner and an
    inspector; the door they came through decides, and switching is a
    button, not a second account. */
export type Side = "owner" | "inspector";
/** `a` is the account's auth version when the session began — a password
    change bumps it, and every older session stops verifying. */
type SessionPayload = { u: string; e: number; s?: Side; a?: number };

/** `<payload>.<signature>` — unreadable to nobody, unforgeable to everybody. */
function seal(userId: string, expiresAt: number, side: Side, authVersion: number) {
  const body = b64(JSON.stringify({ u: userId, e: expiresAt, s: side, a: authVersion } satisfies SessionPayload));
  return `${body}.${sign(body)}`;
}

function openSigned<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  /* Constant-time, so the comparison cannot be used to guess a signature
     one character at a time. */
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(unb64(body)) as T;
  } catch {
    return null;
  }
}

function unseal(token: string): SessionPayload | null {
  const payload = openSigned<SessionPayload>(token);
  if (!payload?.u || payload.e < Date.now()) return null;
  return payload;
}

/* Sign-in codes go out through Fast2SMS's OTP route, which reaches Indian
   mobiles only. FAST2SMS_API_KEY holds the key — in the environment, never
   in this repository.

   A laptop never sends a real SMS unless SMS_IN_DEV=1: the demo accounts
   use made-up numbers that belong to real people somewhere. */
type SmsResult = "sent" | "off" | "abroad" | "failed";

async function sendSms(phone: string, code: string): Promise<SmsResult> {
  const key = process.env.FAST2SMS_API_KEY?.trim();
  if (!key) return "off";
  if (process.env.NODE_ENV !== "production" && process.env.SMS_IN_DEV !== "1") return "off";
  /* The demo accounts' 90000000xx numbers are made up, which means they are
     somebody's real phone. Never text them, even with SMS_IN_DEV on. */
  if (/^90000000\d\d$/.test(phone)) return "off";
  if (!isIndianMobile(phone)) return "abroad";
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: key, "content-type": "application/json" },
      body: JSON.stringify({ route: "otp", variables_values: code, numbers: phone, flash: "0" }),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as { return?: boolean; message?: unknown } | null;
    if (res.ok && body?.return) return "sent";
    console.error("[sms] Fast2SMS refused the code", res.status, body?.message);
  } catch (err) {
    console.error("[sms] Fast2SMS could not be reached", err);
  }
  return "failed";
}

/* The pending code travels in its own short-lived cookie rather than in
   the store, for the same reason the session does: the instance that
   sends the code is not necessarily the one that checks it. Only an
   HMAC of the code is in the cookie, so reading it — even your own —
   tells you nothing without the server's secret.

   The counters (sends, wrong tries) are in the store. Locally that is
   exact; on a serverless host it is per instance until the store is
   Postgres — still a brake, and exact the day that lands. */
type Purpose = Otp["purpose"];
type OtpCookie = { p: string; h: string; e: number; u?: Purpose };
const otpHash = (purpose: Purpose, phone: string, code: string) => sign(`${purpose}:${phone}:${code}`);

export type StartResult =
  | { ok: true; phone: string; devCode: string | null }
  | { ok: false; error: string; phone?: string };

export async function startOtp(cc: string, rawPhone: string, purpose: Purpose = "signin"): Promise<StartResult> {
  const parsed = parsePhone(cc, rawPhone);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const phone = parsed.phone;

  const t = Date.now();
  const d = await db();
  const row = d.otps.find((o) => o.phone === phone && o.purpose === purpose);
  const recent = (row?.sends ?? []).filter((s) => t - Date.parse(s) < SEND_WINDOW_MS);
  const last = recent.length ? Date.parse(recent[recent.length - 1]) : 0;
  if (last && t - last < SEND_GAP_S * 1000) {
    const wait = Math.ceil((SEND_GAP_S * 1000 - (t - last)) / 1000);
    return { ok: false, error: `A code was just sent. Wait ${wait} seconds before asking for another.`, phone };
  }
  if (recent.length >= MAX_SENDS) {
    return { ok: false, error: "That is a lot of codes for one number. Try again in fifteen minutes.", phone };
  }
  if (!(await ipAllowed())) {
    return { ok: false, error: "Too many codes asked for from here. Try again in fifteen minutes.", phone };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hash = otpHash(purpose, phone, code);
  const expiresAt = t + OTP_MINUTES * 60_000;

  await mutate((s) => {
    s.otps = s.otps.filter((o) => !(o.phone === phone && o.purpose === purpose) && Date.parse(o.expiresAt) > t - SEND_WINDOW_MS);
    s.otps.push({ phone, purpose, hash, expiresAt: new Date(expiresAt).toISOString(), attempts: 0, sends: [...recent, now()] });
  });

  const body = b64(JSON.stringify({ p: phone, h: hash, e: expiresAt, u: purpose } satisfies OtpCookie));
  const jar = await cookies();
  jar.set(OTP_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: OTP_MINUTES * 60,
  });

  const sms = await sendSms(phone, code);
  /* Showing the code on screen is only ever for a laptop. In production a
     code that could not be sent is a failure, never a code handed to
     whoever typed the number. */
  if (sms !== "sent" && process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error: sms === "abroad"
        ? "For now we can send sign-in codes only to Indian mobile numbers. Sign in with an Indian number, or write to us and we will set you up."
        : "We could not send the code just now. Try again in a minute, or write to us.",
      phone,
    };
  }
  return { ok: true, phone, devCode: sms === "sent" ? null : code };
}

/** Check a code without deciding what it is for. */
async function checkOtp(rawPhone: string, rawCode: string, purpose: Purpose): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const phone = rawPhone.trim();
  const code = rawCode.replace(/\D/g, "");
  if (!isAccountPhone(phone)) return { ok: false, error: "Ask for a new code — that one has expired." };

  const jar = await cookies();
  const otp = openSigned<OtpCookie>(jar.get(OTP_COOKIE)?.value);
  if (!otp || otp.p !== phone || (otp.u ?? "signin") !== purpose) return { ok: false, error: "Ask for a new code — that one has expired." };
  if (otp.e < Date.now()) return { ok: false, error: "That code has expired. Send a new one." };

  const d = await db();
  const row = d.otps.find((o) => o.phone === phone && o.purpose === purpose && o.hash === otp.h);
  if (row && row.attempts >= MAX_ATTEMPTS) return { ok: false, error: "Too many wrong tries on that code. Send yourself a new one." };

  if (otp.h !== otpHash(purpose, phone, code)) {
    const attempts = await mutate((s) => {
      let r = s.otps.find((o) => o.phone === phone && o.purpose === purpose && o.hash === otp.h);
      if (!r) {
        r = { phone, purpose, hash: otp.h, expiresAt: new Date(otp.e).toISOString(), attempts: 0, sends: [] };
        s.otps.push(r);
      }
      r.attempts += 1;
      return r.attempts;
    });
    const left = MAX_ATTEMPTS - attempts;
    return { ok: false, error: left > 0 ? `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries on that code. Send yourself a new one." };
  }

  jar.delete(OTP_COOKIE);
  await mutate((s) => { s.otps = s.otps.filter((o) => !(o.phone === phone && o.purpose === purpose)); });
  return { ok: true, phone };
}

export async function verifyOtp(rawPhone: string, rawCode: string, side: Side = "owner") {
  /* Owners sign in with Google or an email and password; a code is only
     ever an inspector's way in. */
  if (side !== "inspector") return { ok: false as const, error: "Owners sign in with Google or their email." };
  /* The inspector door is shut to anyone off the roster — checked before
     the code is spent, and before any account is made. */
  if (side === "inspector" && !mayInspect(await db(), rawPhone.trim())) return { ok: false as const, error: NOT_ON_ROSTER };
  const res = await checkOtp(rawPhone, rawCode, "signin");
  if (!res.ok) return res;
  const { phone } = res;

  const d = await db();
  const isNew = !d.users.some((u) => u.phone === phone);

  /* One sign-in for everybody. An inspector's number is already on a
     row with role "inspector" — put there by an admin when they were
     verified — so the same six digits land them on /field instead. */
  const user = await mutate((s) => {
    let u = s.users.find((x) => x.phone === phone);
    if (!u) {
      /* Only the inspector door creates an account here. */
      u = {
        id: uid(), role: "owner", name: "", phone, email: "", livesIn: "",
        tz: "Asia/Kolkata", prefs: { sms: true, email: true },
        createdAt: now(), onboardedAt: null,
        foundingNo: null,
        freeVisitUsedAt: null, deletedAt: null,
      };
      s.users.push(u);
    }
    if (side === "inspector") ensureInspector(s, u);
    return u;
  });

  await openSession(user.id, side);
  return { ok: true as const, isNew, onboarded: !!user.onboardedAt, role: effectiveRole(user, side) };
}

/** Is this number allowed to ask for a code at the inspector door? */
export async function inspectorDoorOpen(phone: string) {
  return mayInspect(await db(), phone);
}

async function openSession(userId: string, side: Side) {
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000;
  const jar = await cookies();
  const authVersion = (await db()).users.find((x) => x.id === userId)?.authVersion ?? 0;
  jar.set(COOKIE, seal(userId, expiresAt, side, authVersion), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
  });
}

/* ── owners: Google ─────────────────────────────────────────────── */

const OAUTH_COOKIE = "sy_oauth";
const OAUTH_MINUTES = 10;
type OAuthCookie = { s: string; v: string; e: number };

/** Remember one Google attempt's state and PKCE verifier, signed, for ten minutes. */
export async function rememberGoogleAttempt(state: string, verifier: string) {
  const body = b64(JSON.stringify({ s: state, v: verifier, e: Date.now() + OAUTH_MINUTES * 60_000 } satisfies OAuthCookie));
  (await cookies()).set(OAUTH_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: OAUTH_MINUTES * 60,
  });
}

/** The verifier for this state — once. Null when it does not match or has expired. */
export async function takeGoogleAttempt(state: string): Promise<string | null> {
  const jar = await cookies();
  const c = openSigned<OAuthCookie>(jar.get(OAUTH_COOKIE)?.value);
  jar.delete(OAUTH_COOKIE);
  if (!c || c.e < Date.now() || !state || c.s !== state) return null;
  return c.v;
}

/** Sign an owner in with the Google account Google just vouched for.
    Matched by Google's own id only — never by an email typed into a
    profile, which anyone could have typed. */
export async function signInWithGoogle(g: { sub: string; email: string; name: string }) {
  const user = await mutate((s) => {
    let u = s.users.find((x) => x.googleSub === g.sub && !x.deletedAt);
    if (!u) {
      /* An owner who joined with this email and a password. Google has just
         proved the inbox is theirs, so it is one person and one account. A
         password nobody ever proved that inbox for is dropped — whoever set
         it may not have been them. */
      const same = s.users.find((x) => x.role === "owner" && !x.deletedAt && !x.googleSub && x.email === g.email);
      if (same) {
        same.googleSub = g.sub;
        if (!same.emailVerifiedAt && same.passwordHash) {
          delete same.passwordHash;
          same.authVersion = (same.authVersion ?? 0) + 1;
        }
        same.emailVerifiedAt ??= now();
        u = same;
      }
    }
    if (!u) {
      u = newOwner({ name: g.name, email: g.email, googleSub: g.sub, emailVerifiedAt: now() });
      s.users.push(u);
    }
    return u;
  });
  await openSession(user.id, "owner");
  return user;
}

/** Development only: sign in as any owner by email, so a laptop without
    Google keys can still walk the owner app. Production never gets here. */
export async function devSignInOwner(email: string) {
  if (process.env.NODE_ENV === "production") return null;
  const user = await mutate((s) => {
    let u = s.users.find((x) => x.email === email && !x.deletedAt);
    if (!u) {
      /* the same account a real sign-up makes, launch-offer number included */
      u = newOwner({ name: "", email });
      s.users.push(u);
    }
    return u;
  });
  await openSession(user.id, "owner");
  return user;
}

/** A new owner account. The launch offer is not handed out here — a
    place is taken when the free inspection is booked (lib/offer). */
function newOwner(f: Pick<User, "name" | "email"> & Partial<User>): User {
  return {
    id: uid(), role: "owner", phone: "", contactPhone: "", livesIn: "",
    tz: "Asia/Kolkata", prefs: { sms: true, email: true },
    createdAt: now(), onboardedAt: null,
    foundingNo: null,
    freeVisitUsedAt: null, deletedAt: null,
    ...f,
  };
}

/* ── owners: email and a password ───────────────────────────────────
   For owners who would rather not use Google. The password is kept only
   as a salted scrypt hash — nobody, us included, can read it back.

   Wrong passwords are braked per address and per account, and a wrong
   answer never says whether the email has an account: an unknown email
   costs the same scrypt time as a known one. Reset and verification
   links are signed like sessions and point at stillyours.in, never at
   whatever host the request claimed to be. */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;
const RESET_MINUTES = 30;
const VERIFY_DAYS = 7;
const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: ScryptOptions) => Promise<Buffer>;
/* a real hash of nothing anybody uses, so a missing account still costs a scrypt */
const DECOY_HASH = "scrypt$16384$8$1$fn7MOsxZf395lY0FtiGReA$JNKQca6mcQu62M_baNZWpqsQekcWpu_YN7IpiVUedDM";

/** One address, no lists, nothing a mail header could be tricked with. */
export const cleanEmail = (raw: string) => {
  const e = raw.trim().toLowerCase();
  return /^[^\s@,;<>"'()]+@[^\s@,;<>"'()]+\.[a-z]{2,}$/.test(e) && e.length <= 200 ? e : null;
};

export function passwordProblem(pw: string, email = "") {
  if (pw.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return "That password is too long.";
  if (email && pw.toLowerCase() === email) return "Your password cannot be your email address.";
  return null;
}

async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

async function passwordMatches(pw: string, stored: string | undefined) {
  const [, n, r, p, salt, key] = (stored || DECOY_HASH).split("$");
  const want = Buffer.from(key ?? "", "base64url");
  const got = await scryptAsync(pw, Buffer.from(salt ?? "", "base64url"), want.length || 32, { N: Number(n), r: Number(r), p: Number(p) });
  return !!stored && got.length === want.length && timingSafeEqual(got, want);
}

const pwMisses = new Map<string, number[]>();
function tooMany(key: string, limit: number, windowMs: number) {
  const t = Date.now();
  const recent = (pwMisses.get(key) ?? []).filter((x) => t - x < windowMs);
  pwMisses.set(key, recent);
  return recent.length >= limit;
}
const noteMiss = (key: string) => pwMisses.set(key, [...(pwMisses.get(key) ?? []), Date.now()]);

/** Where a link in an email points: the real site in production, this
    laptop in development. */
async function linkBase() {
  if (process.env.NODE_ENV === "production") return SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
}

/** Changes whenever the password or email does — so a reset link dies the
    moment it has been used, or the account has moved on. */
const accountPrint = (u: User) => createHash("sha256").update(`${u.passwordHash ?? "-"}|${u.email}|${u.authVersion ?? 0}`).digest("base64url").slice(0, 16);

const signToken = (payload: object) => {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
};

type MailOutcome = { devLink: string | null; error?: string };

/** Send the link, or — on a laptop with no mail set up — hand it back to
    be shown on screen, clearly marked, the way the SMS code is. */
async function mailLink(to: string, subject: string, html: string, link: string): Promise<MailOutcome> {
  const sent = await sendEmail(to, subject, html);
  if (sent === "sent") return { devLink: null };
  if (process.env.NODE_ENV !== "production") return { devLink: link };
  return { devLink: null, error: "We could not send the email just now. Try again in a minute, or write to us." };
}

async function sendVerifyLink(u: User): Promise<MailOutcome> {
  const token = signToken({ p: "verify", v: u.id, m: u.email, e: Date.now() + VERIFY_DAYS * 86_400_000 });
  const link = `${await linkBase()}/signin/verify?token=${encodeURIComponent(token)}`;
  return mailLink(u.email, "Confirm your email — StillYours",
    buttonEmail("Confirm your email", "One tap to confirm this address is yours. It is where your reports and bills go, and how you get back in if you forget your password.", "Confirm my email", link, `The link works for ${VERIFY_DAYS} days. If you did not sign up for StillYours, ignore this email.`), link);
}

export type PasswordResult = { ok: true; user: User; devLink?: string | null } | { ok: false; error: string };

/** A new owner, with an email and a password. They are in straight away;
    the email is confirmed by a link, in the background. */
export async function signUpWithPassword(rawEmail: string, password: string): Promise<PasswordResult> {
  const email = cleanEmail(rawEmail);
  if (!email) return { ok: false, error: "That email address does not look right." };
  const problem = passwordProblem(password, email);
  if (problem) return { ok: false, error: problem };
  const ip = await clientIp();
  if (tooMany(`signup:${ip}`, 10, 60 * 60_000)) return { ok: false, error: "Too many new accounts from here. Try again in an hour." };
  noteMiss(`signup:${ip}`);

  const hash = await hashPassword(password);
  const made = await mutate((s) => {
    const had = s.users.find((x) => x.email === email && !x.deletedAt && x.role !== "inspector");
    if (had) return null;
    const u = newOwner({ name: "", email, passwordHash: hash, emailVerifiedAt: null, authVersion: 0 });
    s.users.push(u);
    return u;
  });
  if (!made) return { ok: false, error: "That email already has an account. Sign in — or use “Forgot password” to set one." };
  await openSession(made.id, "owner");
  const mail = await sendVerifyLink(made);
  if (mail.devLink) console.log(`[auth] development — confirm ${made.email}: ${mail.devLink}`);
  return { ok: true, user: made, devLink: mail.devLink };
}

export async function signInWithPassword(rawEmail: string, password: string): Promise<PasswordResult> {
  const email = cleanEmail(rawEmail) ?? rawEmail.trim().toLowerCase().slice(0, 200);
  const ip = await clientIp();
  if (tooMany(`ip:${ip}`, 20, 15 * 60_000) || tooMany(`acct:${email}`, 8, 15 * 60_000)) {
    return { ok: false, error: "Too many tries. Wait fifteen minutes, or reset your password." };
  }
  const u = (await db()).users.find((x) => x.email === email && !x.deletedAt && x.role === "owner");
  const good = await passwordMatches(password.slice(0, PASSWORD_MAX), u?.passwordHash);
  if (!u || !good) {
    noteMiss(`ip:${ip}`);
    noteMiss(`acct:${email}`);
    return { ok: false, error: "That email and password do not match. If you joined with Google, use Continue with Google." };
  }
  await openSession(u.id, "owner");
  return { ok: true, user: u };
}

/** Always the same answer, whether or not the email has an account. */
export async function startPasswordReset(rawEmail: string): Promise<MailOutcome> {
  const email = cleanEmail(rawEmail);
  if (!email) return { devLink: null, error: "That email address does not look right." };
  const ip = await clientIp();
  if (tooMany(`reset:${ip}`, 5, 15 * 60_000) || tooMany(`reset:${email}`, 3, 15 * 60_000)) {
    return { devLink: null, error: "We have sent a few links already. Check your inbox and spam, or try again in fifteen minutes." };
  }
  noteMiss(`reset:${ip}`);
  noteMiss(`reset:${email}`);
  const u = (await db()).users.find((x) => x.email === email && !x.deletedAt && x.role === "owner");
  if (!u) return { devLink: null };
  const token = signToken({ p: "reset", r: u.id, h: accountPrint(u), e: Date.now() + RESET_MINUTES * 60_000 });
  const link = `${await linkBase()}/signin/reset?token=${encodeURIComponent(token)}`;
  return mailLink(u.email, "Set your password — StillYours",
    buttonEmail(u.passwordHash ? "Reset your password" : "Set a password", "Somebody asked to set a new password for your StillYours account. If it was you, use the button below.", "Choose a new password", link, `The link works for ${RESET_MINUTES} minutes and only once. If it was not you, ignore this email — nothing changes.`), link);
}

/** Whose account a reset link is for, while it is still good. */
export async function resetTarget(token: string): Promise<User | null> {
  const t = openSigned<{ p?: string; r?: string; h?: string; e?: number }>(token);
  if (t?.p !== "reset" || !t.r || (t.e ?? 0) < Date.now()) return null;
  const u = (await db()).users.find((x) => x.id === t.r && !x.deletedAt) ?? null;
  return u && accountPrint(u) === t.h ? u : null;
}

/** A new password from a reset link. It proves the inbox, so the email is
    confirmed too — and every other session on the account ends. */
export async function finishPasswordReset(token: string, password: string): Promise<PasswordResult> {
  const u0 = await resetTarget(token);
  if (!u0) return { ok: false, error: "That link has expired or been used. Ask for a new one." };
  const problem = passwordProblem(password, u0.email);
  if (problem) return { ok: false, error: problem };
  const hash = await hashPassword(password);
  const user = await mutate((s) => {
    const u = s.users.find((x) => x.id === u0.id)!;
    u.passwordHash = hash;
    u.emailVerifiedAt ??= now();
    u.authVersion = (u.authVersion ?? 0) + 1;
    return u;
  });
  await openSession(user.id, "owner");
  return { ok: true, user };
}

/** Change it from the account page: the current password first, when
    there is one. Other sessions end; this one carries on. */
export async function changePassword(userId: string, current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const u0 = (await db()).users.find((x) => x.id === userId && !x.deletedAt);
  if (!u0) return { ok: false, error: "Your session ended. Sign in again." };
  if (u0.passwordHash && !(await passwordMatches(current.slice(0, PASSWORD_MAX), u0.passwordHash))) {
    return { ok: false, error: "Your current password is not right." };
  }
  const problem = passwordProblem(next, u0.email);
  if (problem) return { ok: false, error: problem };
  const hash = await hashPassword(next);
  await mutate((s) => {
    const u = s.users.find((x) => x.id === userId)!;
    u.passwordHash = hash;
    u.authVersion = (u.authVersion ?? 0) + 1;
  });
  await openSession(userId, "owner");
  return { ok: true };
}

/** The confirm link from a sign-up email. Good only for the address it was
    sent to — an email changed since then needs a new link. */
export async function confirmEmail(token: string): Promise<boolean> {
  const t = openSigned<{ p?: string; v?: string; m?: string; e?: number }>(token);
  if (t?.p !== "verify" || !t.v || (t.e ?? 0) < Date.now()) return false;
  return mutate((s) => {
    const u = s.users.find((x) => x.id === t.v && !x.deletedAt);
    if (!u || u.email !== t.m) return false;
    u.emailVerifiedAt ??= now();
    return true;
  });
}

/** Another confirm link, from the account page. */
export async function resendVerification(userId: string): Promise<MailOutcome> {
  const u = (await db()).users.find((x) => x.id === userId && !x.deletedAt);
  if (!u?.email || u.emailVerifiedAt) return { devLink: null };
  if (tooMany(`verify:${userId}`, 3, 60 * 60_000)) return { devLink: null, error: "We have sent a few already. Check your spam folder." };
  noteMiss(`verify:${userId}`);
  return sendVerifyLink(u);
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** The signed-in user, or null. Safe to call from any server component.
    A closed account is nobody, even with a cookie that still verifies. */
export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = unseal(token);
  if (!session) return null;
  const d = await db();
  const u = d.users.find((x) => x.id === session.u) ?? null;
  if (!u || u.deletedAt) return null;
  if ((session.a ?? 0) !== (u.authVersion ?? 0)) return null;
  /* A copy, with the role this session is acting in. The stored role is
     only the default for sessions from before there were two doors. */
  /* The hash never leaves the store: callers only learn that there is one. */
  return { ...u, passwordHash: u.passwordHash ? "set" : undefined, role: effectiveRole(u, session.s) };
}

function effectiveRole(u: User, side: Side | undefined): User["role"] {
  if (u.role === "admin") return "admin";
  /* Only the roster is ever an inspector — a stored role or an older
     session without a side does not make anybody one. */
  if (side === "inspector" || (side === undefined && u.role === "inspector")) return canInspect(u) ? "inspector" : "owner";
  return "owner";
}

/** Where each kind of account lives. */
export const homeFor = (role: User["role"]) => (role === "inspector" ? "/field" : role === "admin" ? "/ops" : "/app");

/** Guard for everything under /app. Sends people to sign in, and new
    owners to the welcome flow, before any page body renders. */
export async function requireOwner(opts: { allowOnboarding?: boolean } = {}) {
  await sweepMissed();
  await sweepLive();
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "owner") redirect(homeFor(user.role));
  /* A phone number is required — the inspector calls it from the door. */
  if ((!user.onboardedAt || !reachOn(user)) && !opts.allowOnboarding) redirect("/welcome");
  return user;
}

/** Guard for everything under /field. An inspector without a profile
    row has an account but no work yet — that is a real state, not an
    error, so it is handled by the page rather than bounced. */
export async function requireInspector() {
  await sweepMissed();
  await sweepLive();
  const user = await currentUser();
  if (!user) redirect("/signin");
  if (user.role !== "inspector") redirect(homeFor(user.role));
  return user;
}

/* ── ops: one page, one password ──────────────────────────────────
   The ops console is not an account. Whoever knows OPS_PASSWORD is ops,
   for twelve hours at a time, in a cookie signed like a session. The
   password lives in the environment, never in this repository.

   Six digits is only a million guesses, so wrong ones are braked twice:
   five per address in fifteen minutes, and thirty an hour from
   everybody together — per server instance, like the SMS brakes. An
   attack locks ops out for the hour too; that is the right way round. */
const OPS_COOKIE = "sy_ops";
const OPS_HOURS = 12;
const OPS_TRIES_PER_IP = 5;
const OPS_TRIES_ALL = 30;
const opsMisses = new Map<string, number[]>();
let opsMissesAll: number[] = [];

/** Null when the password was right and the cookie is set; otherwise why not. */
export async function opsSignIn(password: string): Promise<string | null> {
  const expected = process.env.OPS_PASSWORD;
  if (!expected) return "OPS_PASSWORD is not set on this server.";
  const ip = await clientIp();
  const t = Date.now();
  const mine = (opsMisses.get(ip) ?? []).filter((s) => t - s < 15 * 60_000);
  opsMissesAll = opsMissesAll.filter((s) => t - s < 60 * 60_000);
  if (mine.length >= OPS_TRIES_PER_IP || opsMissesAll.length >= OPS_TRIES_ALL) return "Too many wrong tries. Wait a while, then try again.";

  /* hashed first, so the comparison is the same length and constant-time */
  const same = timingSafeEqual(createHash("sha256").update(password).digest(), createHash("sha256").update(expected).digest());
  if (!same) {
    opsMisses.set(ip, [...mine, t]);
    opsMissesAll.push(t);
    return "That is not the password.";
  }
  const body = b64(JSON.stringify({ ops: 1, e: t + OPS_HOURS * 3_600_000 }));
  const jar = await cookies();
  jar.set(OPS_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true, sameSite: "strict", path: "/", secure: process.env.NODE_ENV === "production", maxAge: OPS_HOURS * 3600,
  });
  return null;
}

export async function isOps() {
  const jar = await cookies();
  const p = openSigned<{ ops?: number; e?: number }>(jar.get(OPS_COOKIE)?.value);
  return p?.ops === 1 && (p.e ?? 0) > Date.now();
}

export async function opsSignOut() {
  const jar = await cookies();
  jar.delete(OPS_COOKIE);
}

/** Guard for everything ops writes. The page itself shows the password
    form instead of bouncing anywhere. */
export async function requireAdmin() {
  if (!(await isOps())) redirect("/ops");
}
