"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { APPS_LIVE } from "@/lib/flags";
import { START } from "@/lib/start";

export function AddressBar({ className, cta = "Get an inspection" }: { className?: string; cta?: string }) {
  const [v, setV] = useState("");
  const router = useRouter();
  return (
    <form onSubmit={(e) => { e.preventDefault(); router.push(APPS_LIVE ? START : `/access${v ? `?address=${encodeURIComponent(v)}` : ""}`); }} className={cn("addr on-light w-full", className)}>
      <MapPin size={20} className="shrink-0 text-text-2" />
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Enter your property address" aria-label="Property address" />
      <button type="submit" className="btn btn-accent h-12 w-12 shrink-0 p-0 sm:w-auto sm:px-6">
        <span className="hidden sm:inline">{cta}</span><ArrowRight size={18} />
      </button>
    </form>
  );
}
