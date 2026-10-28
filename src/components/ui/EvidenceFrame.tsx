import { cn } from "@/lib/cn";
import { SCENE } from "@/lib/photos";

export type EvidenceVariant = "bathroom" | "kitchen" | "bedroom" | "balcony" | "electrical" | "entrance" | "living";

type Props = {
  variant?: EvidenceVariant;
  /** A photo for this frame. Left out, the room's own photo (lib/photos)
      shows, or the drawing; `null` keeps the drawing — for a scene that
      has no photo of its own yet and must not borrow the room's. */
  src?: string | null;
  id?: string;
  room?: string;
  time?: string;
  /** Annotation box in % of frame: [x, y, w, h] */
  box?: [number, number, number, number];
  boxLabel?: string;
  tone?: "fail" | "attn" | "pass";
  className?: string;
  ratio?: string;
  dense?: boolean;
};

/* Abstract room compositions — intentionally vector, so the frames stay
   crisp and cohesive until real inspection photos replace them. */
const scenes: Record<EvidenceVariant, React.ReactNode> = {
  bathroom: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="bt-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c3138" /><stop offset="1" stopColor="#1d2126" /></linearGradient>
        <pattern id="bt-tile" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="none" stroke="rgba(255,255,255,0.06)" /></pattern>
        <radialGradient id="bt-stain" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#7d5a2a" stopOpacity="0.75" /><stop offset="1" stopColor="#7d5a2a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bt-wall)" />
      <rect width="400" height="300" fill="url(#bt-tile)" />
      <rect x="0" y="210" width="400" height="90" fill="#15181c" />
      <rect x="0" y="208" width="400" height="3" fill="rgba(255,255,255,0.12)" />
      <rect x="120" y="120" width="170" height="70" rx="6" fill="#343a42" />
      <rect x="135" y="112" width="140" height="12" rx="3" fill="#41474f" />
      <rect x="195" y="70" width="10" height="44" rx="2" fill="#8b9198" />
      <path d="M200 70 q26 -14 32 12" stroke="#a9afb5" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="205" cy="232" rx="48" ry="16" fill="url(#bt-stain)" />
      <ellipse cx="240" cy="246" rx="26" ry="9" fill="url(#bt-stain)" />
      <line x1="205" y1="190" x2="205" y2="222" stroke="#535a62" strokeWidth="5" strokeDasharray="3 6" />
    </svg>
  ),
  kitchen: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><linearGradient id="kt-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2f36" /><stop offset="1" stopColor="#1b1f24" /></linearGradient></defs>
      <rect width="400" height="300" fill="url(#kt-wall)" />
      <rect x="0" y="150" width="400" height="16" fill="#3a4048" />
      <rect x="0" y="166" width="400" height="134" fill="#1f2328" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 95} y="176" width="80" height="110" rx="4" fill="#272c33" stroke="rgba(255,255,255,0.08)" />)}
      <rect x="140" y="128" width="120" height="24" rx="4" fill="#41474f" />
      <rect x="150" y="132" width="100" height="16" rx="3" fill="#191d22" />
      <path d="M200 128 v-30 q0 -18 18 -18 h8" stroke="#a9afb5" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="0" y="40" width="400" height="60" fill="#262b31" />
      <rect x="0" y="98" width="400" height="3" fill="rgba(255,255,255,0.1)" />
    </svg>
  ),
  bedroom: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#282d34" /><stop offset="1" stopColor="#1a1e23" /></linearGradient>
      <linearGradient id="bd-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a5560" stopOpacity="0.8" /><stop offset="1" stopColor="#20262d" stopOpacity="0.9" /></linearGradient></defs>
      <rect width="400" height="300" fill="url(#bd-wall)" />
      <rect x="110" y="40" width="180" height="150" rx="4" fill="url(#bd-glass)" stroke="#4c545d" strokeWidth="6" />
      <line x1="200" y1="40" x2="200" y2="190" stroke="#4c545d" strokeWidth="6" />
      <line x1="110" y1="115" x2="290" y2="115" stroke="#4c545d" strokeWidth="6" />
      <rect x="196" y="100" width="8" height="30" rx="2" fill="#c7ccd2" />
      <rect x="0" y="230" width="400" height="70" fill="#15181c" />
      <rect x="0" y="228" width="400" height="3" fill="rgba(255,255,255,0.1)" />
    </svg>
  ),
  balcony: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><linearGradient id="bl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#232830" /><stop offset="1" stopColor="#39404a" /></linearGradient></defs>
      <rect width="400" height="300" fill="url(#bl-sky)" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={i * 60 - 10} y={120 + (i % 3) * 20} width="44" height="200" fill="#1b1f25" opacity="0.9" />)}
      <rect x="0" y="190" width="400" height="6" fill="#5d6570" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => <rect key={i} x={20 + i * 40} y="196" width="4" height="70" fill="#4c545d" />)}
      <rect x="0" y="264" width="400" height="36" fill="#1f2328" />
      <path d="M150 262 q30 -10 60 0 t60 0" stroke="#6b5a2a" strokeWidth="6" fill="none" opacity="0.7" />
    </svg>
  ),
  electrical: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="400" height="300" fill="#1d2126" />
      <rect x="110" y="60" width="180" height="200" rx="6" fill="#182842" stroke="#41474f" strokeWidth="4" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={130 + (i % 3) * 50} y={90 + Math.floor(i / 3) * 70} width="34" height="50" rx="3" fill="#191d22" stroke="#4c545d" />)}
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={143 + (i % 3) * 50} y={100 + Math.floor(i / 3) * 70} width="8" height="22" rx="2" fill={i === 4 ? "#ff8f8f" : "#c9f25a"} opacity="0.85" />)}
      <path d="M200 260 v30" stroke="#4c545d" strokeWidth="6" />
    </svg>
  ),
  entrance: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="400" height="300" fill="#20252b" />
      <rect x="130" y="30" width="140" height="260" rx="4" fill="#2e343b" stroke="#41474f" strokeWidth="6" />
      <rect x="150" y="50" width="100" height="100" rx="3" fill="#272c33" />
      <rect x="150" y="165" width="100" height="105" rx="3" fill="#272c33" />
      <circle cx="245" cy="160" r="6" fill="#c7ccd2" />
      <rect x="0" y="290" width="400" height="10" fill="#15181c" />
    </svg>
  ),
  living: (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs><linearGradient id="lv-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2f36" /><stop offset="1" stopColor="#1b1f24" /></linearGradient></defs>
      <rect width="400" height="300" fill="url(#lv-wall)" />
      <rect x="0" y="200" width="400" height="100" fill="#0b1322" />
      <rect x="40" y="140" width="200" height="70" rx="10" fill="#39404a" />
      <rect x="50" y="120" width="180" height="30" rx="8" fill="#41474f" />
      <rect x="280" y="60" width="90" height="120" rx="3" fill="#4a5560" opacity="0.7" stroke="#4c545d" strokeWidth="4" />
      <path d="M60 40 q30 12 30 40" stroke="#535a62" strokeWidth="3" fill="none" />
      <ellipse cx="300" cy="46" rx="40" ry="18" fill="#6b5a2a" opacity="0.35" />
    </svg>
  ),
};

const toneColor = { fail: "#ff7a7a", attn: "#f4c65a", pass: "#7be3a5" };

export function EvidenceFrame({
  variant = "bathroom",
  src,
  id = "IMG_0412",
  room = "Bathroom · Sink & plumbing",
  time = "14:02:31",
  box,
  boxLabel,
  tone = "fail",
  className,
  ratio = "4 / 3",
  dense,
}: Props) {
  const color = toneColor[tone];
  /* a photo for the room when there is one; the drawing until then */
  const photo = src === null ? undefined : src ?? SCENE[variant];
  return (
    <figure
      className={cn("@container relative overflow-hidden rounded-[10px] bg-[#15181c] select-none", className)}
      style={ratio === "auto" ? undefined : { aspectRatio: ratio }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={room} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        scenes[variant]
      )}
      {/* lens vignette + scan texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,transparent_55%,rgba(10,12,14,0.7))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(255,255,255,0.35)_3px_4px)]" />
      {/* corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <span
          key={c}
          className={cn(
            "pointer-events-none absolute h-3 w-3 border-white/50",
            c === "tl" && "left-2 top-2 border-l border-t",
            c === "tr" && "right-2 top-2 border-r border-t",
            c === "bl" && "left-2 bottom-8 border-l border-b",
            c === "br" && "right-2 bottom-8 border-r border-b"
          )}
        />
      ))}
      {box && (
        <div
          className="pointer-events-none absolute"
          style={{ left: `${box[0]}%`, top: `${box[1]}%`, width: `${box[2]}%`, height: `${box[3]}%`, border: `1.5px solid ${color}`, boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 0 24px ${color}33` }}
        >
          {boxLabel && (
            <span
              className={cn(
                /* on a thumbnail the label is noise, and it has nowhere to go */
                "absolute whitespace-nowrap rounded-[4px] px-1.5 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink @max-[140px]:hidden",
                /* a box near the top edge keeps its label inside, or a short frame clips it */
                box[1] < 20 ? "left-[2px] top-[2px]" : "-top-[22px] left-[-1.5px]",
              )}
              style={{ background: color }}
            >
              {boxLabel}
            </span>
          )}
        </div>
      )}
      <figcaption
        className={cn(
          "absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-white/10 bg-[#15181c]/85 px-2.5 font-mono uppercase tracking-[0.1em] text-white/55 backdrop-blur",
          dense ? "h-6 text-[8.5px]" : "h-7 text-[9.5px]"
        )}
      >
        <span className="truncate">
          {id && <><span className="text-white/85">{id}</span> · </>}{room}
        </span>
        {time && <span className="shrink-0 tabular-nums">{time}</span>}
      </figcaption>
    </figure>
  );
}
