"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Phone, ShieldCheck } from "lucide-react";
import { confirmCode, requestCode, type FormState } from "@/lib/actions";
import { SubmitButton } from "@/components/app/SubmitButton";
import { COUNTRIES, prettyPhone } from "@/lib/phone";
import { EASE } from "@/lib/motion";

const blank: FormState = { ok: false };

/* Remounting the inner form is what "use a different number" does — it
   is the only honest way to throw away a code that was sent. */
export function SignInForm({ side = "owner" }: { side?: "owner" | "inspector" }) {
  const [round, setRound] = useState(0);
  return <Inner key={round} side={side} restart={() => setRound((r) => r + 1)} />;
}

function Inner({ side, restart }: { side: "owner" | "inspector"; restart: () => void }) {
  const inspector = side === "inspector";
  const [sent, sendCode] = useActionState(requestCode, blank);
  const [checked, verify] = useActionState(confirmCode, blank);
  const [cc, setCc] = useState("91");
  const [phone, setPhone] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  const stage: "phone" | "code" = sent.ok ? "code" : "phone";
  useEffect(() => { if (stage === "code") codeRef.current?.focus(); }, [stage]);

  /* Somebody pasting "+971 50 123 4567" has told us the country already.
     Nothing typed is ever cut short — the server checks the length. */
  const onPhone = (raw: string) => {
    const t = raw.trim();
    if (t.startsWith("+") || t.startsWith("00")) {
      const digits = t.replace(/\D/g, "").replace(/^00/, "");
      const hit = [...COUNTRIES].sort((a, b) => b.cc.length - a.cc.length).find((c) => digits.startsWith(c.cc));
      if (hit) {
        setCc(hit.cc);
        setPhone(digits.slice(hit.cc.length));
        return;
      }
    }
    setPhone(raw.replace(/[^\d\s-]/g, "").slice(0, 18));
  };

  return (
    <div className="w-full max-w-[400px]">
      <AnimatePresence mode="wait">
        {stage === "phone" ? (
          <motion.div key="phone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            {inspector ? (
              <>
                <h1 className="serif flex items-center gap-2.5 text-[clamp(1.8rem,4vw,2.3rem)] leading-[1.05] tracking-[-0.035em]">
                  <ShieldCheck size={26} className="shrink-0 text-accent" /> Inspector sign in
                </h1>
                <p className="t-small mt-2.5">Only numbers on the StillYours inspector roster open this door — we add yours after we have met you.</p>
              </>
            ) : (
              <>
                <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">Sign in.</h1>
                <p className="t-small mt-2.5">Your number is the account — any country&apos;s mobile works. We send a six-digit code, so there is no password to forget at 2 AM in another timezone.</p>
              </>
            )}

            <form action={sendCode} className="mt-7">
              <input type="hidden" name="as" value={side} />
              <input type="hidden" name="cc" value={inspector ? "91" : cc} />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-text-2">{inspector ? "Your registered mobile number" : "Mobile number"}</span>
                <div className="flex items-center gap-2 rounded-[12px] border border-line-2 bg-white pl-3 pr-4 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
                  <Phone size={15} className="shrink-0 text-text-3" />
                  {inspector ? (
                    <span className="h-12 shrink-0 pr-1 text-[15px] leading-[48px] text-text-2">+91</span>
                  ) : (
                    <select
                      aria-label="Country code" value={cc} onChange={(e) => setCc(e.target.value)}
                      className="h-12 shrink-0 bg-transparent pr-1 text-[15px] text-text-2 outline-none"
                    >
                      {COUNTRIES.map((c) => <option key={c.cc} value={c.cc}>+{c.cc} {c.name}</option>)}
                    </select>
                  )}
                  <input
                    name="phone" inputMode="tel" autoComplete="tel-national" autoFocus required
                    value={phone} onChange={(e) => onPhone(e.target.value)}
                    onPaste={(e) => { e.preventDefault(); onPhone(e.clipboardData.getData("text")); }}
                    placeholder={inspector || cc === "91" ? "98765 43210" : "Number without the country code"}
                    className="h-12 w-full min-w-0 bg-transparent text-[15px] tracking-[0.02em] outline-none placeholder:text-text-3"
                  />
                </div>
              </label>
              {sent.error && <p className="mt-2 text-[13px] text-fail" role="alert">{sent.error}</p>}
              <Submit label={inspector ? "Verify and send code" : "Send code"} />
            </form>
          </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
            <h1 className="serif text-[clamp(2rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.035em]">Check your phone.</h1>
            <p className="t-small mt-2.5">
              Six digits sent to <b className="text-ink">{prettyPhone(sent.phone ?? "")}</b>.{" "}
              <button type="button" onClick={restart} className="font-medium text-accent underline underline-offset-4">Use a different number</button>
            </p>

            {sent.devCode && (
              <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-gold/40 bg-gold-soft px-4 py-3">
                <Lock size={14} className="mt-0.5 shrink-0 text-gold-2" />
                <div className="text-[13px] leading-snug text-[#7a5209]">
                  Development: no SMS is sent from this server, so here is the code: <b className="font-mono text-[15px] tracking-[0.1em]">{sent.devCode}</b>
                  <div className="mt-0.5 text-[11.5px] opacity-80">In production the code only ever arrives by SMS.</div>
                </div>
              </div>
            )}

            <form action={verify} className="mt-6">
              <input type="hidden" name="as" value={side} />
              <input type="hidden" name="phone" value={sent.phone ?? ""} />
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium text-text-2">Six-digit code</span>
                <input
                  ref={codeRef} name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6}
                  placeholder="······"
                  className="h-14 w-full rounded-[12px] border border-line-2 bg-white px-4 text-center font-mono text-[24px] tracking-[0.5em] text-ink outline-none transition placeholder:tracking-[0.3em] placeholder:text-text-3 focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </label>
              {checked.error && <p className="mt-2 text-[13px] text-fail" role="alert">{checked.error}</p>}
              <Submit label="Sign in" />
            </form>

            <ResendCode phone={sent.phone ?? ""} side={side} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Its own form and its own state, so a "wait 30 seconds" never knocks
   the person back off the code screen they are on. */
function ResendCode({ phone, side }: { phone: string; side: "owner" | "inspector" }) {
  const [state, resend] = useActionState(requestCode, blank);
  return (
    <form action={resend} className="mt-3 text-center">
      <input type="hidden" name="as" value={side} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="cc" value={phone.startsWith("+") ? "" : "91"} />
      <button className="text-[13px] font-medium text-text-2 underline underline-offset-4 transition hover:text-ink">Send a new code</button>
      {state.error && <p className="mt-2 text-[12.5px] text-fail" role="alert">{state.error}</p>}
      {state.ok && <p className="mt-2 text-[12.5px] text-pass">New code sent{state.devCode ? ` — ${state.devCode}` : ""}. The old one no longer works.</p>}
    </form>
  );
}

const Submit = ({ label }: { label: string }) => (
  <SubmitButton className="mt-4 w-full" icon={<ArrowRight size={16} />}>{label}</SubmitButton>
);
