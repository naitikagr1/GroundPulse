"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EllipsisVertical, Share, SquarePlus, X } from "lucide-react";
import { Mark } from "@/components/ui/Logo";
import { usePlatform, useInstalled } from "@/components/app/usePlatform";
import { EASE } from "@/lib/motion";

type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/* "Not now" is not "never": it comes back a day later, until the app is on
   the home screen. Installed, it never shows again. */
const KEY = "sy-install-later";
const QUIET_MS = 24 * 3_600_000;
const resting = () => {
  try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < QUIET_MS; } catch { return false; }
};

/** The invitation to put StillYours on the home screen — on a phone, the
    moment the sign-in or the app opens. Android gets the browser's own
    install button when the browser offers one, and the menu spelled out
    when it has not yet; iOS has no such API, so it gets the two taps. */
export function InstallHint() {
  const platform = usePlatform();
  const installed = useInstalled();
  const [deferred, setDeferred] = useState<Prompt | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (installed) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Prompt);
      if (!resting()) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    /* a phone gets it straight away; a desktop only if its browser offers to install */
    const t = platform !== "desktop" && !resting() ? setTimeout(() => setShow(true), 300) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      if (t) clearTimeout(t);
    };
  }, [installed, platform]);

  const later = () => {
    setShow(false);
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setShow(false);
  };

  const ios = platform === "ios";

  return (
    <AnimatePresence>
      {show && !installed && (
        <motion.div
          key="install" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/35 p-3 backdrop-blur-[2px] sm:items-center print:hidden"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
          onClick={later}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-labelledby="install-title"
            initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ duration: 0.45, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-[22px] bg-white p-5 shadow-float"
          >
            <div className="flex items-start gap-3.5">
              <Mark size={44} />
              <div className="min-w-0 flex-1">
                <h2 id="install-title" className="text-[17px] font-semibold tracking-[-0.015em]">Add StillYours to your home screen</h2>
                <p className="t-small mt-1 leading-snug">It opens full screen, like an app — your property, your visits and every report one tap away.</p>
              </div>
              <button onClick={later} aria-label="Not now" className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-3 transition hover:bg-beige"><X size={16} /></button>
            </div>

            {deferred ? (
              <button onClick={install} className="btn btn-accent mt-4 w-full"><SquarePlus size={16} /> Add to home screen</button>
            ) : (
              <ol className="mt-4 grid gap-2 rounded-[14px] bg-paper p-3.5 text-[14px] leading-snug">
                {ios ? (
                  <>
                    <li className="flex items-start gap-2.5"><Step n={1} /><span>Tap <Share size={15} className="inline -translate-y-px text-accent" /> <b>Share</b> in the browser bar</span></li>
                    <li className="flex items-start gap-2.5"><Step n={2} /><span>Choose <b>Add to Home Screen</b></span></li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2.5"><Step n={1} /><span>Tap <EllipsisVertical size={15} className="inline -translate-y-px text-accent" /> <b>menu</b> at the top right</span></li>
                    <li className="flex items-start gap-2.5"><Step n={2} /><span>Choose <b>Install app</b> or <b>Add to Home screen</b></span></li>
                  </>
                )}
              </ol>
            )}

            <button onClick={later} className="mt-2 w-full py-2 text-[13.5px] font-medium text-text-2">Not now</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const Step = ({ n }: { n: number }) => (
  <span className="-mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold text-white">{n}</span>
);
