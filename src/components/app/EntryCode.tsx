"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Share2 } from "lucide-react";
import { cn } from "@/lib/cn";

/* The owner's four-digit entry code. The inspector cannot open the
   checklist without it — so it has to be somewhere the owner can
   actually find it, copy it, and send it on to whoever holds the key. */
export function EntryCode({
  code, property, when, keyHolder, inspector, dark = false, compact = false, kind = "entry",
}: {
  code: string;
  /** "exit": the second code, that closes the visit */
  kind?: "entry" | "exit";
  property: string;
  when: string;
  keyHolder?: string;
  /** once somebody is assigned, so whoever opens the gate knows who to expect */
  inspector?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  /* The inspector never sees this code — they have to be given it. So the
     message tells whoever holds the key to expect the question, and who
     should be asking it. */
  const exit = kind === "exit";
  const who = inspector ? `${inspector} from StillYours` : "The StillYours inspector";
  const text = exit
    ? `StillYours completion code for ${property} (${when}): ${code}. When ${who} hands the keys back, they will ask you for it — the visit only closes with it. Give it only once you have the keys.`
    : `StillYours entry code for ${property} (${when}): ${code}. ${who} will ask you for it at the gate — the visit cannot start without it. Only give it to them.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard refused — the digits are on screen anyway */ }
  };
  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try { await navigator.share({ text }); return; } catch { return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div className={cn("rounded-[16px] p-4", dark ? "bg-white/[0.08]" : "border border-accent/20 bg-accent-tint")}>
      <div className={cn("flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em]", dark ? "text-white/55" : "text-accent-2/70")}>
        <KeyRound size={13} /> {exit ? "Completion code" : "Entry code"}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span aria-label={`${exit ? "Completion" : "Entry"} code ${code.split("").join(" ")}`} className={cn("font-mono font-semibold tracking-[0.35em] tabular-nums", compact ? "text-[26px]" : "text-[34px]", dark ? "text-white" : "text-accent-2")}>
          {code}
        </span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={copy} className={cn("btn btn-sm", dark ? "btn-line text-white" : "btn-white")}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
          <button type="button" onClick={share} className={cn("btn btn-sm", dark ? "btn-line text-white" : "btn-white")}>
            <Share2 size={14} /> Send
          </button>
        </div>
      </div>
      {/* when and to whom — always said, because sending it at the wrong
          moment is the one way this code can go wrong */}
      <p className={cn("mt-2.5 text-[13px] leading-snug", dark ? "text-white/70" : "text-accent-2/85")}>
        <b className={dark ? "text-white" : "text-accent-2"}>When to send it: </b>
        {exit
          ? <>only once the visit is over and the keys are back with {keyHolder || "you or your caretaker"}. Give it to {keyHolder ? keyHolder : "whoever takes the keys back"}, or read it out yourself on the call — never before.</>
          : <>on the day, when the inspector calls from your door. {keyHolder ? `Send it to ${keyHolder}, or read it out yourself.` : "Read it out yourself, or send it to whoever lets them in."}</>}
      </p>
      {!compact && (
        <p className={cn("mt-1.5 text-[12.5px] leading-snug", dark ? "text-white/55" : "text-accent-2/65")}>
          {exit
            ? "The inspector cannot close the visit without it — and anything you have not decided closes with it."
            : "The checklist does not open without it, so nobody gets in on a code you did not give."}
        </p>
      )}
    </div>
  );
}
