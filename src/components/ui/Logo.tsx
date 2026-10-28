import Image from "next/image";
import { cn } from "@/lib/cn";

/* Both halves are the artwork itself, matted off their cream ground so the
   letter counters and the lit window read as holes — on cream, on white
   cards, anywhere. The ratios are the trimmed bounding boxes. */
const MARK = 678 / 763;
const WORD = 1054 / 251;

/* On a dark ground the mark keeps its own colours on its cream disc — the
   favicon and the home-screen icon — rather than turning into a white
   cut-out. `size` is then the disc's diameter. */
export function Mark({ className, size = 38, inverted }: { className?: string; size?: number; inverted?: boolean }) {
  if (inverted) {
    return (
      <Image src="/logo-badge.png" alt="" aria-hidden width={size} height={size} priority className={cn("shrink-0 select-none rounded-full", className)} />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt=""
      aria-hidden
      width={Math.round(size * MARK)}
      height={size}
      priority
      className={cn("shrink-0 select-none", className)}
    />
  );
}

/* Inverted, the letters go cream and the heart stays gold (wordmark-light.png). */
export function Wordmark({ className, size = 27, inverted }: { className?: string; size?: number; inverted?: boolean }) {
  return (
    <Image
      src={inverted ? "/wordmark-light.png" : "/wordmark.png"}
      alt="Still Yours"
      width={Math.round(size * WORD)}
      height={size}
      priority
      className={cn("shrink-0 select-none", className)}
    />
  );
}

export function Logo({ className, inverted, size = 38 }: { className?: string; inverted?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Mark size={size} inverted={inverted} />
      <Wordmark size={Math.round(size * 0.72)} inverted={inverted} />
    </span>
  );
}
