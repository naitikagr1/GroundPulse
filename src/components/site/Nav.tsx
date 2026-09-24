"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { APPS_LIVE } from "@/lib/flags";
import { EASE } from "@/lib/motion";
import { navLinks, type NavEntry } from "@/lib/nav";

/** A hover/focus dropdown. Kept in the DOM and toggled with `hidden` so
    the links stay reachable by keyboard and by a screen reader. */
function NavGroup({ entry, path, align = "left" }: { entry: NavEntry; path: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  /* A mouse already opened this on hover, so letting the click toggle as
     well just slams it shut again. Click is only for touch and keyboard,
     where no hover ever happened. */
  const hovering = useRef(false);
  /* Closing on the first mouseleave makes the menu unusable: the pointer
     has to cross the gap under the button to reach the links, and that
     counts as leaving. A short grace period covers the trip. */
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const openNow = () => { cancelClose(); setOpen(true); };
  const closeSoon = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpen(false), 160); };
  useEffect(() => cancelClose, []);

  const active = entry.items!.some((i) => i.href === path);
  return (
    <div
      className="relative"
      onMouseEnter={() => { hovering.current = true; openNow(); }}
      onMouseLeave={() => { hovering.current = false; closeSoon(); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { cancelClose(); setOpen(false); } }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => { if (!hovering.current) setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Escape" && open) { cancelClose(); setOpen(false); e.currentTarget.focus(); } }}
        className={cn("inline-flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-medium transition hover:bg-ink/[0.05] xl:px-4 xl:text-[16px]", active ? "text-ink" : "text-ink/80 hover:text-ink")}
      >
        {entry.label}
        <ChevronDown size={14} className={cn("transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div
        hidden={!open}
        /* pt-2 is the bridge — transparent, but still inside the hover target,
           so the pointer never leaves on its way down to the links */
        className={cn("absolute top-full z-50 pt-2", align === "right" ? "right-0" : "left-0")}
      >
        <div className="w-[330px] max-w-[calc(100vw-2rem)] rounded-[18px] border border-line bg-white p-2 shadow-float">
          {entry.items!.map((c) => (
            <Link key={c.href} href={c.href} onClick={() => { cancelClose(); setOpen(false); }} className={cn("block rounded-[12px] px-3.5 py-3 transition hover:bg-beige", path === c.href && "bg-accent-tint")}>
              <div className="text-[15px] font-medium">{c.label}</div>
              {c.note && <div className="mt-0.5 text-[13px] leading-snug text-text-2">{c.note}</div>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById("hero");
      setScrolled(hero ? hero.getBoundingClientRect().bottom < 80 : window.scrollY > 360);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path]);

  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className={cn("sticky top-0 z-50 bg-paper transition-shadow duration-300", scrolled && "shadow-[0_1px_0_rgba(35,32,29,0.07)]")}>
        <div className="relative mx-auto flex h-[74px] max-w-[1408px] items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Still Yours home" className="relative z-[60]"><Logo /></Link>

          <div className="flex items-center gap-1">
            <nav className="hidden items-center lg:flex" aria-label="Primary">
              {/* the logo goes home too, but only people who already know that use it */}
              <Link href="/" className={cn("rounded-full px-3 py-2 text-[15px] font-medium transition hover:bg-ink/[0.05] xl:px-4 xl:text-[16px]", path === "/" ? "text-ink" : "text-ink/80 hover:text-ink")}>
                Home
              </Link>
              {navLinks.map((l, i) => (l.items ? <NavGroup key={l.label} entry={l} path={path} align={i >= navLinks.length / 2 ? "right" : "left"} /> : (
                <Link key={l.href} href={l.href} className={cn("rounded-full px-3 py-2 text-[15px] font-medium transition hover:bg-ink/[0.05] xl:px-4 xl:text-[16px]", path === l.href ? "text-ink" : "text-ink/80 hover:text-ink")}>
                  {l.label}
                </Link>
              )))}
            </nav>
            {APPS_LIVE && <Link href="/signin" className="btn btn-ghost ml-1 hidden rounded-full px-4 text-[15px] font-medium md:inline-flex">Sign in</Link>}
            <Link href="/access" className="btn btn-pill ml-1 hidden md:inline-flex">Sign up</Link>
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="relative z-[60] ml-1 grid h-11 w-11 place-items-center rounded-full lg:hidden">
              <span className="relative block h-[10px] w-[20px]">
                <span className={cn("absolute left-0 top-0 h-[2px] w-full rounded bg-ink transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)]", open && "translate-y-[4px] rotate-45")} />
                <span className={cn("absolute left-0 top-[8px] h-[2px] w-full rounded bg-ink transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)]", open && "-translate-y-[4px] -rotate-45")} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-paper lg:hidden">
            <div className="flex min-h-full flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[96px]">
              <motion.ul initial="hidden" animate="show" exit="hidden" variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } }, hidden: {} }}>
                {[{ href: "/", label: "Home" } as NavEntry, ...navLinks].map((l) => (
                  <motion.li key={l.label} variants={{ hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } } }} className="border-b border-line py-2">
                    {l.items ? (
                      <div className="py-2">
                        <div className="t-label pb-1 pt-1 uppercase tracking-[0.08em]">{l.label}</div>
                        {l.items.map((c) => (
                          <Link key={c.href} href={c.href} className="flex items-center justify-between py-2.5 text-[1.3rem] font-medium tracking-[-0.03em]">{c.label} <ArrowRight size={17} className="text-text-3" /></Link>
                        ))}
                      </div>
                    ) : (
                      <Link href={l.href} className="flex items-center justify-between py-3 text-[1.6rem] font-medium tracking-[-0.04em]">{l.label} <ArrowRight size={18} className="text-text-3" /></Link>
                    )}
                  </motion.li>
                ))}
              </motion.ul>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: EASE }} className="mt-auto">
                <Link href="/access" className="btn btn-accent btn-lg w-full">Sign up <ArrowRight size={16} /></Link>
                {APPS_LIVE && <Link href="/signin" className="btn btn-white btn-lg mt-2 w-full">Sign in to your account</Link>}
                <p className="t-small mt-4 text-center">Takes 5 minutes · Your media stays private</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
