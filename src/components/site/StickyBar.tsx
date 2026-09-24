"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { EASE } from "@/lib/motion";

/** Opendoor-style persistent address bar that appears once the hero scrolls away. */
export function StickyBar() {
  const [show, setShow] = useState(false);
  const [v, setV] = useState("");
  const router = useRouter();
  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      const past = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > window.innerHeight;
      const cta = document.getElementById("cta");
      const nearEnd = cta ? cta.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      setShow(past && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.form initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}
          onSubmit={(e) => { e.preventDefault(); router.push(`/access${v ? `?address=${encodeURIComponent(v)}` : ""}`); }}
          className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[760px] sm:inset-x-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="addr addr-sm !bg-white !shadow-[0_0_0_1px_var(--line-2),0_20px_40px_-16px_rgba(35,32,29,.35)]">
            <MapPin size={16} className="shrink-0 text-text-2" />
            <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Enter your property address" aria-label="Property address" />
            <button type="submit" className="btn btn-accent h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-5" aria-label="Sign up"><span className="hidden sm:inline">Sign up</span><ArrowRight size={16} /></button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
