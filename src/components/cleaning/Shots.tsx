"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ShotName } from "@/lib/cleaning";
import { CLEAN } from "@/lib/photos";

export type { ShotName };

/* ════════════════════════════════════════════════════════════════
   BEFORE / AFTER — our own artwork.

   Each surface is drawn once in its clean state; the "before" is the
   identical frame with a grime layer on top. Grime is fractal noise
   rather than painted blobs, because real grease, limescale and dust
   are textures, not shapes — turbulence gets you patchy build-up,
   streaks and speckle for a few bytes each.

   Same geometry, same angle, both states: exactly the discipline the
   inspector's real photographs follow. When the first jobs are shot,
   pass `srcBefore` / `srcAfter` and the photos take over untouched.
   ════════════════════════════════════════════════════════════════ */

/* ── grime as texture, not as blobs ───────────────────────────── */
function Filters() {
  return (
    <defs>
      {/* warm brown cooking grease — patchy, uneven, runs thick in corners */}
      <filter id="gpGrease" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="9" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.34  0 0 0 0 0.22  0 0 0 0 0.06  1.5 0.7 0 0 -0.52" />
      </filter>
      {/* burnt-on carbon — darker, harder edged */}
      <filter id="gpBurn" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="3" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.14  0 0 0 0 0.10  0 0 0 0 0.04  2.2 0.9 0 0 -1.05" />
      </filter>
      {/* hard-water scale — pale ochre crust */}
      <filter id="gpScale" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="4" seed="17" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.66  0 0 0 0 0.51  0 0 0 0 0.22  1.7 0.8 0 0 -0.72" />
      </filter>
      {/* rust / iron staining — fine orange speckle */}
      <filter id="gpRust" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.34" numOctaves="2" seed="23" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.60  0 0 0 0 0.36  0 0 0 0 0.11  2.6 0 0 0 -1.45" />
      </filter>
      {/* settled dust — grey, soft, even */}
      <filter id="gpDust" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="41" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.49  0 0 0 0 0.47  0 0 0 0 0.42  1.5 0.5 0 0 -0.70" />
      </filter>
      {/* mould / moss — dark green, clings in patches */}
      <filter id="gpMould" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="4" seed="5" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.28  0 0 0 0 0.12  2.4 0.8 0 0 -1.25" />
      </filter>
      {/* run-down streaking — stretched vertically */}
      <filter id="gpStreak" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.009 0.26" numOctaves="3" seed="13" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.27  0 0 0 0 0.11  1.9 0.7 0 0 -0.80" />
      </filter>
      {/* greasy film on glass — stretched, translucent */}
      <filter id="gpFilm" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.13" numOctaves="3" seed="29" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.52  0 0 0 0 0.50  0 0 0 0 0.40  1.1 0.5 0 0 -0.34" />
      </filter>
    </defs>
  );
}

/* Server and client must serialise these to the same string, so every
   computed coordinate is rounded before it reaches an attribute. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** a grime wash, optionally clipped to one surface of the scene */
const G = ({ f, clip, o = 1 }: { f: string; clip?: string; o?: number }) => (
  <g clipPath={clip ? `url(#${clip})` : undefined} opacity={o}>
    <rect x="-10" y="-10" width="420" height="320" fill="#000" filter={`url(#${f})`} />
  </g>
);

/* ── clean states ─────────────────────────────────────────────── */
const base: Record<ShotName, React.ReactNode> = {
  /* close-up of a chimney baffle filter, pulled out of the hood */
  chimney: (
    <>
      <rect width="400" height="300" fill="#e6e9eb" />
      <path d="M0 0 h400 v54 l-30 26 H30 L0 54 Z" fill="#c2c9ce" />
      <rect x="0" y="76" width="400" height="14" fill="#a9b2b8" />
      <rect x="30" y="100" width="340" height="176" rx="7" fill="#aab2b8" />
      <rect x="38" y="108" width="324" height="160" rx="4" fill="#d3d9dd" />
      <g clipPath="url(#cl-mesh)">
        <g stroke="#b6bec4" strokeWidth="2.2">
          {Array.from({ length: 34 }, (_, i) => <line key={`a${i}`} x1={20 + i * 14} y1="100" x2={-40 + i * 14} y2="280" />)}
          {Array.from({ length: 34 }, (_, i) => <line key={`b${i}`} x1={20 + i * 14} y1="280" x2={-40 + i * 14} y2="100" />)}
        </g>
      </g>
      <rect x="38" y="108" width="324" height="160" rx="4" fill="none" stroke="#9099a0" strokeWidth="4" />
      <rect x="176" y="252" width="48" height="11" rx="5.5" fill="#8b949b" />
      <clipPath id="cl-mesh"><rect x="38" y="108" width="324" height="160" rx="4" /></clipPath>
    </>
  ),

  /* hob from above — one burner, steel top, cast-iron grate */
  stove: (
    <>
      <rect width="400" height="300" fill="#d5dade" />
      <rect width="400" height="300" fill="url(#st-sheen)" />
      <defs>
        <linearGradient id="st-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#8c949a" stopOpacity="0.28" />
        </linearGradient>
        <clipPath id="cl-hob"><rect width="400" height="300" /></clipPath>
        <clipPath id="cl-cap"><circle cx="196" cy="146" r="44" /></clipPath>
      </defs>
      <circle cx="196" cy="146" r="104" fill="#c6ccd1" />
      <circle cx="196" cy="146" r="104" fill="none" stroke="#aeb6bc" strokeWidth="2" />
      {/* cast-iron grate */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`rotate(${i * 90 + 45} 196 146)`}>
          <rect x="196" y="139" width="112" height="14" rx="7" fill="#26292c" />
          <rect x="198" y="141" width="106" height="4" rx="2" fill="#3c4145" />
        </g>
      ))}
      <circle cx="196" cy="146" r="52" fill="none" stroke="#26292c" strokeWidth="13" />
      <circle cx="196" cy="146" r="52" fill="none" stroke="#3c4145" strokeWidth="3" />
      {/* burner */}
      <circle cx="196" cy="146" r="44" fill="#9aa1a7" />
      <circle cx="196" cy="146" r="38" fill="#c9ae74" />
      <circle cx="196" cy="146" r="30" fill="#b09755" />
      {Array.from({ length: 18 }, (_, i) => {
        const t = (i / 18) * Math.PI * 2;
        const x = r2(196 + Math.cos(t) * 34), y = r2(146 + Math.sin(t) * 34);
        return <ellipse key={i} cx={x} cy={y} rx="3.6" ry="2.6" transform={`rotate(${r2((t * 180) / Math.PI)} ${x} ${y})`} fill="#4a4033" />;
      })}
      <circle cx="196" cy="146" r="13" fill="#8e8474" />
      <circle cx="196" cy="146" r="6" fill="#5d5648" />
      {/* control knobs */}
      <circle cx="74" cy="266" r="21" fill="#f2f4f5" stroke="#bcc3c8" strokeWidth="2" />
      <rect x="72" y="250" width="4" height="12" rx="2" fill="#7d858b" />
      <circle cx="322" cy="266" r="21" fill="#f2f4f5" stroke="#bcc3c8" strokeWidth="2" />
      <rect x="320" y="250" width="4" height="12" rx="2" fill="#7d858b" />
    </>
  ),

  /* granite slab, backsplash tile and the edge of the sink */
  slab: (
    <>
      <rect width="400" height="300" fill="#efece7" />
      <defs>
        <clipPath id="cl-splash"><rect x="0" y="0" width="400" height="148" /></clipPath>
        <clipPath id="cl-slab"><rect x="0" y="148" width="400" height="98" /></clipPath>
      </defs>
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={(i % 6) * 68 - 4} y={Math.floor(i / 6) * 38 - 2} width="64" height="34" rx="2"
          fill={[0, 7, 9, 14, 19].includes(i) ? "#dfe7e4" : "#f6f4f0"} stroke="#e0dbd2" strokeWidth="1.6" />
      ))}
      <rect x="0" y="142" width="400" height="8" fill="#cdc7bc" />
      <rect x="0" y="148" width="400" height="98" fill="#43474b" />
      <g opacity="0.55" clipPath="url(#cl-slab)">
        {Array.from({ length: 26 }, (_, i) => <ellipse key={i} cx={(i * 71) % 400} cy={158 + ((i * 37) % 80)} rx={5 + (i % 5) * 4} ry={2 + (i % 3)} fill="#767b80" />)}
        {Array.from({ length: 14 }, (_, i) => <circle key={`s${i}`} cx={(i * 113) % 400} cy={156 + ((i * 53) % 84)} r={1.6} fill="#c9ced2" />)}
      </g>
      <rect x="0" y="146" width="400" height="5" rx="2" fill="#6e7378" />
      <rect x="0" y="246" width="400" height="54" fill="#dfdbd3" />
      <path d="M232 246 h168 v34 h-168 Z" fill="#b9bfc4" />
      <path d="M244 252 h150 v22 h-150 Z" fill="#9aa1a7" />
    </>
  ),

  /* inside an open fridge */
  fridge: (
    <>
      <rect width="400" height="300" fill="#cdd3d7" />
      <rect x="18" y="8" width="364" height="284" rx="8" fill="#f7f9fa" />
      <rect x="34" y="20" width="332" height="260" rx="5" fill="#eef3f5" stroke="#dde4e8" strokeWidth="2" />
      {/* glass shelves */}
      {[96, 170, 244].map((y) => (
        <g key={y}>
          <rect x="38" y={y} width="324" height="9" rx="2" fill="#cfe0e6" stroke="#b6cdd6" strokeWidth="1.5" />
          <rect x="38" y={y + 9} width="324" height="4" fill="#000" opacity="0.06" />
        </g>
      ))}
      {/* door bins */}
      <rect x="286" y="40" width="88" height="40" rx="4" fill="#e3edf1" stroke="#c6d8df" strokeWidth="2" />
      <rect x="286" y="118" width="88" height="40" rx="4" fill="#e3edf1" stroke="#c6d8df" strokeWidth="2" />
      {/* crisper */}
      <rect x="44" y="258" width="312" height="30" rx="4" fill="#e0ebf0" stroke="#c2d6de" strokeWidth="2" />
      <rect x="172" y="268" width="56" height="7" rx="3.5" fill="#b9ccd4" />
      <rect x="52" y="26" width="50" height="16" rx="3" fill="#dbe6eb" />
    </>
  ),

  /* bathroom wall tile and its grout */
  grout: (
    <>
      <rect width="400" height="300" fill="#c4c9cd" />
      <defs>
        <clipPath id="cl-lines">
          {Array.from({ length: 7 }, (_, i) => <rect key={`v${i}`} x={i * 66 - 4} y="0" width="8" height="300" />)}
          {Array.from({ length: 7 }, (_, i) => <rect key={`h${i}`} x="0" y={i * 58 - 4} width="400" height="8" />)}
        </clipPath>
        <clipPath id="cl-tiles">
          {Array.from({ length: 30 }, (_, i) => <rect key={i} x={(i % 6) * 66 + 4} y={Math.floor(i / 6) * 58 + 4} width="58" height="50" rx="2" />)}
        </clipPath>
      </defs>
      {Array.from({ length: 30 }, (_, i) => (
        <rect key={i} x={(i % 6) * 66 + 4} y={Math.floor(i / 6) * 58 + 4} width="58" height="50" rx="2" fill="#fafbfb" />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <rect key={`g${i}`} x={(i % 6) * 66 + 4} y={Math.floor(i / 6) * 58 + 4} width="58" height="16" rx="2" fill="#fff" opacity="0.7" />
      ))}
    </>
  ),

  /* WC, three-quarter view */
  wc: (
    <>
      <rect width="400" height="300" fill="#e7eaec" />
      <rect x="0" y="0" width="400" height="232" fill="#dfe3e6" />
      <rect x="0" y="232" width="400" height="68" fill="#cfd3d6" />
      <rect x="0" y="228" width="400" height="6" fill="#bfc4c8" />
      <defs>
        <clipPath id="cl-bowl"><ellipse cx="168" cy="196" rx="44" ry="21" /></clipPath>
        <clipPath id="cl-ped"><path d="M138 214 h60 l-9 62 h-42 Z" /></clipPath>
        <clipPath id="cl-body"><path d="M116 138 h104 l-9 54 q-5 20 -43 20 q-38 0 -43 -20 Z" /></clipPath>
      </defs>
      {/* cistern */}
      <rect x="104" y="34" width="128" height="96" rx="7" fill="#fcfdfd" stroke="#dbe0e3" strokeWidth="2.5" />
      <rect x="104" y="30" width="128" height="14" rx="6" fill="#f4f6f7" stroke="#dbe0e3" strokeWidth="2" />
      <rect x="150" y="14" width="36" height="12" rx="6" fill="#cfd5d9" />
      {/* seat + lid up */}
      <path d="M116 138 h104 l-9 54 q-5 20 -43 20 q-38 0 -43 -20 Z" fill="#fbfcfc" stroke="#e3e7ea" strokeWidth="2" />
      <ellipse cx="168" cy="188" rx="56" ry="27" fill="#fbfcfc" stroke="#dfe4e7" strokeWidth="3" />
      <ellipse cx="168" cy="196" rx="44" ry="21" fill="#eef3f6" />
      <ellipse cx="168" cy="200" rx="34" ry="14" fill="#dfeaf0" />
      {/* pedestal */}
      <path d="M138 214 h60 l-9 62 h-42 Z" fill="#f6f8f9" stroke="#e3e7ea" strokeWidth="2" />
      <ellipse cx="168" cy="276" rx="34" ry="8" fill="#eceff1" />
      {/* health faucet */}
      <rect x="300" y="120" width="9" height="104" rx="4.5" fill="#b5bcc1" />
      <circle cx="304" cy="112" r="11" fill="#c7ced2" />
      <path d="M304 124 q22 26 6 58" stroke="#c7ced2" strokeWidth="5" fill="none" strokeLinecap="round" />
    </>
  ),

  /* shower head, face on */
  shower: (
    <>
      <rect width="400" height="300" fill="#bfc5ca" />
      {Array.from({ length: 42 }, (_, i) => (
        <rect key={i} x={(i % 7) * 58 + 2} y={Math.floor(i / 7) * 50 + 2} width="54" height="46" rx="2" fill="#dde2e6" />
      ))}
      <defs>
        <clipPath id="cl-head"><circle cx="200" cy="170" r="84" /></clipPath>
        <clipPath id="cl-face"><circle cx="200" cy="170" r="70" /></clipPath>
      </defs>
      <rect x="186" y="0" width="28" height="58" rx="14" fill="#9fa7ad" />
      <circle cx="200" cy="66" r="18" fill="#aeb6bc" />
      <circle cx="200" cy="170" r="84" fill="#aab2b8" />
      <circle cx="200" cy="170" r="76" fill="#c8ced3" />
      <circle cx="200" cy="170" r="70" fill="#eef1f3" />
      {Array.from({ length: 60 }, (_, i) => {
        const ring = i < 8 ? 0 : i < 24 ? 1 : 2;
        const cnt = ring === 0 ? 8 : ring === 1 ? 16 : 36;
        const idx = ring === 0 ? i : ring === 1 ? i - 8 : i - 24;
        const r = [20, 40, 58][ring];
        const t = (idx / cnt) * Math.PI * 2;
        return <circle key={i} cx={r2(200 + Math.cos(t) * r)} cy={r2(170 + Math.sin(t) * r)} r="4.4" fill="#939ba1" />;
      })}
      <circle cx="200" cy="170" r="84" fill="none" stroke="#8d959b" strokeWidth="5" />
      <circle cx="200" cy="170" r="8" fill="#a8b0b6" />
    </>
  ),

  /* room floor — large format tiles and skirting */
  floor: (
    <>
      <rect width="400" height="300" fill="#f0ebe2" />
      <rect x="0" y="0" width="400" height="36" fill="#f7f4ee" />
      <rect x="0" y="36" width="400" height="12" fill="#e6dfd2" />
      <defs>
        <clipPath id="cl-floor"><rect x="0" y="48" width="400" height="252" /></clipPath>
        <clipPath id="cl-grout2">
          {Array.from({ length: 4 }, (_, i) => <rect key={`v${i}`} x={i * 133 - 3} y="48" width="7" height="252" />)}
          {Array.from({ length: 4 }, (_, i) => <rect key={`h${i}`} x="0" y={48 + i * 84 - 3} width="400" height="7" />)}
        </clipPath>
      </defs>
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={(i % 3) * 133 + 1} y={52 + Math.floor(i / 3) * 84} width="127" height="78" rx="1"
          fill={i % 2 ? "#f6f2ea" : "#f1ece1"} />
      ))}
      <g opacity="0.35">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${(i % 3) * 133 + 10} ${70 + Math.floor(i / 3) * 84} q40 ${i % 2 ? 14 : -10} 100 4`} stroke="#d9d0bf" strokeWidth="6" fill="none" strokeLinecap="round" />
        ))}
      </g>
    </>
  ),

  /* ceiling fan from below */
  fan: (
    <>
      <rect width="400" height="300" fill="#f4f2ef" />
      <defs>
        {[0, 1, 2].map((i) => (
          <clipPath key={i} id={`cl-blade${i}`}>
            <path d="M206 150 L338 118 q16 32 0 64 L206 172 Z" transform={`rotate(${i * 120} 200 150)`} />
          </clipPath>
        ))}
        <clipPath id="cl-fan">
          {[0, 1, 2].map((i) => <path key={i} d="M206 150 L338 118 q16 32 0 64 L206 172 Z" transform={`rotate(${i * 120} 200 150)`} />)}
        </clipPath>
      </defs>
      <ellipse cx="200" cy="150" rx="150" ry="150" fill="#f8f7f5" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`rotate(${i * 120} 200 150)`}>
          <path d="M206 150 L338 118 q16 32 0 64 L206 172 Z" fill="#fcfbfa" stroke="#e2ded7" strokeWidth="2" />
          <path d="M240 143 L332 121 q3 6 4 12 L240 152 Z" fill="#f4f1ec" />
        </g>
      ))}
      <circle cx="200" cy="150" r="46" fill="#f9f7f4" stroke="#e0dcd4" strokeWidth="3" />
      <circle cx="200" cy="150" r="28" fill="#efece6" />
      <circle cx="200" cy="150" r="11" fill="#e2ddd4" />
      <rect x="192" y="52" width="16" height="54" rx="3" fill="#eae6de" />
      <rect x="180" y="44" width="40" height="12" rx="5" fill="#e2ddd4" />
    </>
  ),

  /* window and the view through it */
  window: (
    <>
      <rect width="400" height="300" fill="#eae7e2" />
      <defs>
        <clipPath id="cl-glass"><rect x="52" y="38" width="296" height="214" /></clipPath>
        <clipPath id="cl-track"><rect x="34" y="252" width="332" height="22" /></clipPath>
      </defs>
      <rect x="28" y="16" width="344" height="262" rx="4" fill="#fbfaf8" stroke="#ded9d1" strokeWidth="6" />
      <g clipPath="url(#cl-glass)">
        <rect x="52" y="38" width="296" height="214" fill="#cfe6f4" />
        <rect x="52" y="38" width="296" height="90" fill="#dcf0fa" />
        <circle cx="308" cy="74" r="24" fill="#fbf4d2" />
        <path d="M52 186 q54 -34 104 -8 t76 -20 q44 -18 116 16 v78 H52 Z" fill="#9dc49b" />
        <path d="M52 216 q70 -22 132 4 t164 -10 v42 H52 Z" fill="#84b184" />
        <rect x="88" y="150" width="34" height="42" fill="#b7c3bd" />
        <rect x="262" y="140" width="44" height="52" fill="#c2ccc6" />
      </g>
      <rect x="194" y="38" width="12" height="214" fill="#fbfaf8" />
      <rect x="52" y="136" width="296" height="12" fill="#fbfaf8" />
      <rect x="34" y="252" width="332" height="22" rx="3" fill="#e9e5dd" />
      <rect x="34" y="252" width="332" height="6" fill="#d8d2c7" />
    </>
  ),

  /* three-seater fabric sofa */
  sofa: (
    <>
      <rect width="400" height="300" fill="#f1eee9" />
      <rect x="0" y="234" width="400" height="66" fill="#e4dfd6" />
      <defs>
        <clipPath id="cl-seat">
          {[0, 1, 2].map((i) => <rect key={i} x={36 + i * 111} y="176" width="103" height="56" rx="9" />)}
        </clipPath>
        <clipPath id="cl-sofa">
          <rect x="28" y="92" width="344" height="88" rx="14" />
          <rect x="20" y="170" width="360" height="66" rx="14" />
          <rect x="4" y="116" width="36" height="120" rx="14" />
          <rect x="360" y="116" width="36" height="120" rx="14" />
        </clipPath>
      </defs>
      <rect x="28" y="92" width="344" height="88" rx="14" fill="#b4b8bd" />
      {[0, 1, 2].map((i) => <rect key={i} x={40 + i * 111} y="100" width="103" height="72" rx="10" fill="#c5c9ce" stroke="#a9aeb3" strokeWidth="2" />)}
      <rect x="20" y="170" width="360" height="66" rx="14" fill="#bcc0c5" />
      {[0, 1, 2].map((i) => <rect key={i} x={36 + i * 111} y="176" width="103" height="56" rx="9" fill="#d0d4d8" stroke="#b1b6bb" strokeWidth="2" />)}
      <rect x="4" y="116" width="36" height="120" rx="14" fill="#b4b8bd" />
      <rect x="360" y="116" width="36" height="120" rx="14" fill="#b4b8bd" />
      <rect x="52" y="236" width="15" height="24" rx="4" fill="#8a7050" />
      <rect x="333" y="236" width="15" height="24" rx="4" fill="#8a7050" />
    </>
  ),

  /* mattress on a bed base */
  mattress: (
    <>
      <rect width="400" height="300" fill="#efece7" />
      <rect x="0" y="240" width="400" height="60" fill="#e2ddd4" />
      <rect x="44" y="40" width="312" height="92" rx="8" fill="#c9b18f" />
      <rect x="56" y="52" width="288" height="68" rx="5" fill="#d6c0a1" />
      <defs><clipPath id="cl-mat"><rect x="26" y="126" width="348" height="88" rx="9" /></clipPath></defs>
      <rect x="26" y="126" width="348" height="88" rx="9" fill="#fcfbf9" stroke="#e7e3db" strokeWidth="3" />
      <g fill="none" stroke="#ece8e0" strokeWidth="2.4">
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1={60 + i * 42} y1="130" x2={60 + i * 42} y2="210" />)}
        <line x1="26" y1="152" x2="374" y2="152" />
        <line x1="26" y1="188" x2="374" y2="188" />
      </g>
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={60 + (i % 8) * 42} cy={i < 8 ? 141 : i < 16 ? 170 : 199} r="2.6" fill="#ddd8ce" />)}
      <rect x="26" y="214" width="348" height="30" rx="7" fill="#5a5f64" />
      <rect x="36" y="244" width="18" height="26" rx="4" fill="#8a7050" />
      <rect x="346" y="244" width="18" height="26" rx="4" fill="#8a7050" />
    </>
  ),

  /* balcony floor and railing */
  balcony: (
    <>
      <rect width="400" height="300" fill="#c3dcec" />
      <rect x="0" y="0" width="400" height="104" fill="#d6ebf6" />
      <rect x="0" y="86" width="400" height="34" fill="#a9c3b2" opacity="0.55" />
      <defs>
        <clipPath id="cl-bfloor"><rect x="0" y="190" width="400" height="110" /></clipPath>
        <clipPath id="cl-rail">
          {Array.from({ length: 15 }, (_, i) => <rect key={i} x={8 + i * 27} y="124" width="6" height="68" />)}
          <rect x="0" y="116" width="400" height="10" rx="5" />
        </clipPath>
        <clipPath id="cl-bgrout">
          {Array.from({ length: 5 }, (_, i) => <rect key={`v${i}`} x={i * 100 - 3} y="190" width="6" height="110" />)}
          <rect x="0" y="243" width="400" height="6" />
        </clipPath>
      </defs>
      {Array.from({ length: 15 }, (_, i) => <rect key={i} x={8 + i * 27} y="124" width="6" height="68" fill="#525a61" />)}
      <rect x="0" y="116" width="400" height="10" rx="5" fill="#3d444a" />
      <rect x="0" y="186" width="400" height="8" fill="#c9c0b0" />
      <rect x="0" y="190" width="400" height="110" fill="#e8e1d3" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={(i % 4) * 100 + 1} y={192 + Math.floor(i / 4) * 53} width="96" height="49" rx="1" fill={i % 2 ? "#ece5d8" : "#e4dccd"} />
      ))}
      <circle cx="356" cy="276" r="14" fill="#bdb4a4" />
      <circle cx="356" cy="276" r="9.5" fill="#9a9184" />
      {Array.from({ length: 4 }, (_, i) => <rect key={i} x={349 + (i % 2) * 8} y={269 + Math.floor(i / 2) * 8} width="3" height="3" fill="#6f695e" />)}
    </>
  ),
};

/* ── the grime layer that makes it a "before" ─────────────────── */
const grime: Record<ShotName, React.ReactNode> = {
  chimney: (
    <>
      <G f="gpGrease" clip="cl-mesh" />
      <G f="gpStreak" clip="cl-mesh" o={0.7} />
      <G f="gpBurn" clip="cl-mesh" o={0.5} />
      <g opacity="0.3"><rect x="0" y="0" width="400" height="92" fill="#000" filter="url(#gpGrease)" /></g>
      <rect width="400" height="300" fill="#4a3411" opacity="0.08" />
    </>
  ),
  stove: (
    <>
      <G f="gpGrease" o={0.4} />
      <G f="gpBurn" clip="cl-cap" />
      <circle cx="196" cy="146" r="38" fill="#4e3a12" opacity="0.45" />
      {Array.from({ length: 18 }, (_, i) => {
        const t = (i / 18) * Math.PI * 2;
        return <ellipse key={i} cx={r2(196 + Math.cos(t) * 34)} cy={r2(146 + Math.sin(t) * 34)} rx="4.2" ry="3.2" fill="#1c1508" />;
      })}
      <circle cx="196" cy="146" r="68" fill="none" stroke="#7a5a1c" strokeWidth="22" opacity="0.3" />
      <G f="gpBurn" o={0.3} />
      <rect width="400" height="300" fill="#5c4415" opacity="0.07" />
    </>
  ),
  slab: (
    <>
      <G f="gpGrease" clip="cl-splash" o={0.6} />
      <G f="gpRust" clip="cl-splash" o={0.45} />
      <G f="gpScale" clip="cl-slab" o={0.55} />
      <G f="gpGrease" clip="cl-slab" o={0.35} />
      {[[74, 196], [186, 214], [292, 190], [344, 220]].map(([x, y], i) => (
        <g key={i} opacity="0.45">
          <ellipse cx={x} cy={y} rx={26 - i * 2} ry={11 - i} fill="none" stroke="#c2a35e" strokeWidth="3.5" />
        </g>
      ))}
      <rect width="400" height="148" fill="#7a5a1c" opacity="0.07" />
    </>
  ),
  fridge: (
    <>
      <G f="gpScale" o={0.5} />
      <G f="gpStreak" o={0.28} />
      {/* spills sit on the shelf edges, where they actually run */}
      {[96, 170, 244].map((y, i) => (
        <g key={y}>
          <rect x={44 + i * 52} y={y - 5} width={150 - i * 20} height="14" rx="4" fill="#8a6a1e" opacity="0.42" />
          <rect x="38" y={y} width="324" height="9" fill="#6b5014" opacity="0.32" />
        </g>
      ))}
      <rect x="44" y="258" width="312" height="30" rx="4" fill="#7a5c16" opacity="0.3" />
      <rect width="400" height="300" fill="#6b5a1e" opacity="0.06" />
    </>
  ),
  grout: (
    <>
      <rect width="400" height="300" fill="#7a5a18" opacity="0.62" clipPath="url(#cl-lines)" />
      <G f="gpScale" clip="cl-lines" />
      <G f="gpMould" clip="cl-lines" o={0.9} />
      <G f="gpRust" clip="cl-tiles" o={0.5} />
      <G f="gpScale" clip="cl-tiles" o={0.3} />
      <rect width="400" height="300" fill="#8a6a22" opacity="0.05" />
    </>
  ),
  wc: (
    <>
      <G f="gpScale" clip="cl-bowl" />
      <ellipse cx="168" cy="196" rx="44" ry="21" fill="#7a5716" opacity="0.45" />
      <ellipse cx="168" cy="199" rx="35" ry="15" fill="none" stroke="#5e4310" strokeWidth="5" opacity="0.55" />
      <G f="gpStreak" clip="cl-body" o={0.7} />
      <G f="gpStreak" clip="cl-ped" o={0.75} />
      <G f="gpScale" clip="cl-ped" o={0.45} />
      <rect x="104" y="34" width="128" height="96" rx="7" fill="#000" filter="url(#gpDust)" opacity="0.35" />
      <G f="gpMould" o={0.16} />
      <rect width="400" height="300" fill="#7a5a1c" opacity="0.06" />
    </>
  ),
  shower: (
    <>
      <G f="gpScale" clip="cl-head" />
      <circle cx="200" cy="170" r="70" fill="#9a7526" opacity="0.4" />
      {Array.from({ length: 60 }, (_, i) => {
        const ring = i < 8 ? 0 : i < 24 ? 1 : 2;
        const cnt = ring === 0 ? 8 : ring === 1 ? 16 : 36;
        const idx = ring === 0 ? i : ring === 1 ? i - 8 : i - 24;
        const r = [20, 40, 58][ring];
        const t = (idx / cnt) * Math.PI * 2;
        return <circle key={i} cx={r2(200 + Math.cos(t) * r)} cy={r2(170 + Math.sin(t) * r)} r="5.4" fill="#5e4310" opacity="0.8" />;
      })}
      <circle cx="200" cy="170" r="84" fill="none" stroke="#8a6a22" strokeWidth="9" opacity="0.6" />
      <G f="gpScale" o={0.22} />
      <rect width="400" height="300" fill="#7a5a1c" opacity="0.05" />
    </>
  ),
  floor: (
    <>
      <G f="gpScale" clip="cl-floor" o={0.55} />
      <G f="gpDust" clip="cl-floor" o={0.4} />
      <rect width="400" height="300" fill="#8a7440" opacity="0.2" clipPath="url(#cl-floor)" />
      <rect width="400" height="300" fill="#3f3413" opacity="0.72" clipPath="url(#cl-grout2)" />
      <g opacity="0.28">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${20 + (i % 3) * 130} ${86 + Math.floor(i / 3) * 84} q46 ${i % 2 ? 18 : -14} 96 4`} stroke="#3f3413" strokeWidth="4" fill="none" strokeLinecap="round" />
        ))}
      </g>
      <rect x="0" y="36" width="400" height="12" fill="#5b4a1c" opacity="0.32" />
    </>
  ),
  fan: (
    <>
      <G f="gpDust" clip="cl-fan" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`rotate(${i * 120} 200 150)`}>
          <path d="M240 143 L332 121 q3 6 4 12 L240 152 Z" fill="#5f594b" opacity="0.7" />
          <path d="M206 150 L338 118 q16 32 0 64 L206 172 Z" fill="#7c7566" opacity="0.32" />
        </g>
      ))}
      <circle cx="200" cy="150" r="46" fill="#7c7566" opacity="0.32" />
      <G f="gpDust" o={0.16} />
      <rect width="400" height="300" fill="#6f6857" opacity="0.06" />
    </>
  ),
  window: (
    <>
      <G f="gpFilm" clip="cl-glass" />
      <G f="gpStreak" clip="cl-glass" o={0.7} />
      <rect x="52" y="38" width="296" height="214" fill="#7d7868" opacity="0.32" />
      <G f="gpDust" clip="cl-track" />
      <rect x="34" y="252" width="332" height="22" fill="#54503f" opacity="0.45" />
      <G f="gpDust" o={0.14} />
      <rect width="400" height="300" fill="#6b6555" opacity="0.05" />
    </>
  ),
  sofa: (
    <>
      <G f="gpDust" clip="cl-sofa" o={0.75} />
      <G f="gpGrease" clip="cl-seat" o={0.8} />
      <G f="gpStreak" clip="cl-seat" o={0.45} />
      <ellipse cx="148" cy="202" rx="40" ry="18" fill="#6b5326" opacity="0.45" />
      <ellipse cx="262" cy="196" rx="26" ry="12" fill="#6b5326" opacity="0.38" />
      <rect x="20" y="168" width="360" height="10" fill="#4e3f22" opacity="0.45" />
      <rect width="400" height="300" fill="#6b5f46" opacity="0.06" />
    </>
  ),
  mattress: (
    <>
      <G f="gpScale" clip="cl-mat" />
      <ellipse cx="196" cy="172" rx="118" ry="38" fill="#a8842c" opacity="0.35" />
      <ellipse cx="150" cy="166" rx="52" ry="22" fill="#96742a" opacity="0.3" />
      <G f="gpStreak" clip="cl-mat" o={0.35} />
      <G f="gpDust" o={0.14} />
      <rect width="400" height="300" fill="#8a7440" opacity="0.05" />
    </>
  ),
  balcony: (
    <>
      <G f="gpScale" clip="cl-bfloor" o={0.6} />
      <G f="gpMould" clip="cl-bfloor" />
      <rect width="400" height="300" fill="#7b7448" opacity="0.26" clipPath="url(#cl-bfloor)" />
      <rect width="400" height="300" fill="#3c4a22" opacity="0.72" clipPath="url(#cl-bgrout)" />
      <rect x="0" y="190" width="400" height="26" fill="#44521f" opacity="0.32" />
      <G f="gpRust" clip="cl-rail" />
      <rect width="400" height="300" fill="#6b5626" opacity="0.45" clipPath="url(#cl-rail)" />
      <G f="gpDust" o={0.13} />
      <rect width="400" height="300" fill="#6b6440" opacity="0.05" />
    </>
  ),
};

function Frame({ name, dirty, src }: { name: ShotName; dirty: boolean; src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  }
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <Filters />
      {base[name]}
      {dirty && <g style={{ mixBlendMode: "multiply" }}>{grime[name]}</g>}
      <rect width="400" height="300" fill="url(#gpVig)" />
      <defs>
        <radialGradient id="gpVig" cx="0.5" cy="0.34" r="0.78">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ── the draggable split ───────────────────────────────────────── */
export function BeforeAfter({
  name, label, time = ["11:14", "15:40"], ratio = "4 / 3", className, srcBefore, srcAfter, compact, start = 50,
}: {
  name: ShotName;
  label: string;
  time?: [string, string];
  ratio?: string;
  className?: string;
  srcBefore?: string;
  srcAfter?: string;
  compact?: boolean;
  start?: number;
}) {
  const [x, setX] = useState(start);
  /* the surface's photo pair when there is one (lib/photos), the drawing until then */
  const pair = CLEAN[name];
  const before = srcBefore ?? pair?.before;
  const after = srcAfter ?? pair?.after;
  return (
    <figure className={cn("group relative select-none overflow-hidden rounded-[12px] bg-[#15181c] ring-1 ring-black/10", className)} style={{ aspectRatio: ratio }}>
      <Frame name={name} dirty={false} src={after} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}>
        <Frame name={name} dirty src={before} />
      </div>

      <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10.5px] font-medium text-white backdrop-blur">Before</span>
      <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-medium text-white">After</span>

      <div className="pointer-events-none absolute inset-y-0 w-[2px] bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.5)]" style={{ left: `${x}%` }}>
        <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-float transition group-hover:scale-110">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M5 3 L1.5 7 L5 11 M9 3 L12.5 7 L9 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </div>
      <input
        type="range" min={0} max={100} value={x} onChange={(e) => setX(Number(e.target.value))}
        aria-label={`${label} — drag to compare before and after`}
        className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
      />

      <figcaption className={cn("pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-white/10 bg-[#15181c]/85 px-2.5 font-mono uppercase tracking-[0.1em] text-white/55 backdrop-blur", compact ? "h-6 text-[8.5px]" : "h-7 text-[9.5px]")}>
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums">{time[0]} → {time[1]}</span>
      </figcaption>
    </figure>
  );
}
