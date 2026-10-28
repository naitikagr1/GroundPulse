/* ════════════════════════════════════════════════════════════════
   The photographs standing in for a real inspection's, made for the
   site. One name per scene, so a better shot replaces it everywhere
   that scene appears — the sample report, the homepage, the mocks.

   Marketing pages only. The owner app keeps its drawings (src={null}):
   a realistic room that is not the owner's own would pass for it.

   The box a frame draws round a defect is in % of a 4:3 frame (the
   3:2 photo, cropped at the sides), and belongs to that photo: a new
   shot needs its box measured again.
   ════════════════════════════════════════════════════════════════ */

import type { EvidenceVariant } from "@/components/ui/EvidenceFrame";
import type { ShotName } from "@/lib/cleaning";

export const SHOT = {
  bathLeak: "/photos/inspect/bathroom-leak.jpg",
  /* the same photo, cut in on the trap and the drip */
  bathLeakClose: "/photos/inspect/bathroom-leak-close.jpg",
  /* the same frame after the plumber: new trap, dry floor */
  bathFixed: "/photos/inspect/bathroom-fixed.jpg",
  /* the window latch hanging loose — "Window locks: Attention" */
  bedroom: "/photos/inspect/bedroom.jpg",
  living: "/photos/inspect/living.jpg",
  /* locked, grill shut, flyers in the grill: nobody home for a while */
  entrance: "/photos/inspect/entrance.jpg",
  balcony: "/photos/inspect/balcony.jpg",
  /* dusty cover folded back off the bonnet — started, checked, covered again */
  car: "/photos/inspect/car-parking.jpg",
  /* one plot corner, turned and cut three ways: marker intact */
  plotNE: "/photos/inspect/plot-corner-ne.jpg",
  plotSE: "/photos/inspect/plot-corner-se.jpg",
  plotNW: "/photos/inspect/plot-corner-nw.jpg",
  /* a fence post leaning, soil washed from its base — "Attention" */
  plotSW: "/photos/inspect/plot-corner-sw.jpg",
  kitchen: "/photos/inspect/kitchen.jpg",
  /* the same kitchen, six months shut: the "before" to its "after" */
  kitchenDirty: "/photos/inspect/kitchen-dirty.jpg",
} as const;

/** The photo a frame shows for its room when it is not handed one. Only
    shots with nothing wrong in them — or nothing that reads at a glance —
    belong here: a default is seen next to "Pass". */
export const SCENE: Partial<Record<EvidenceVariant, string>> = {
  bathroom: SHOT.bathFixed,
  bedroom: SHOT.bedroom,
  living: SHOT.living,
  entrance: SHOT.entrance,
  balcony: SHOT.balcony,
  kitchen: SHOT.kitchen,
};

/** The cleaning page's before/after pairs, by surface — both frames from
    the same spot. A surface with no pair here keeps its drawing. */
export const CLEAN: Partial<Record<ShotName, { before: string; after: string }>> = {
  slab: { before: SHOT.kitchenDirty, after: SHOT.kitchen },
  chimney: { before: "/photos/clean/chimney-before.jpg", after: "/photos/clean/chimney-after.jpg" },
  stove: { before: "/photos/clean/stove-before.jpg", after: "/photos/clean/stove-after.jpg" },
  fridge: { before: "/photos/clean/fridge-before.jpg", after: "/photos/clean/fridge-after.jpg" },
  grout: { before: "/photos/clean/grout-before.jpg", after: "/photos/clean/grout-after.jpg" },
  wc: { before: "/photos/clean/wc-before.jpg", after: "/photos/clean/wc-after.jpg" },
  shower: { before: "/photos/clean/shower-before.jpg", after: "/photos/clean/shower-after.jpg" },
  floor: { before: "/photos/clean/floor-before.jpg", after: "/photos/clean/floor-after.jpg" },
  fan: { before: "/photos/clean/fan-before.jpg", after: "/photos/clean/fan-after.jpg" },
  window: { before: "/photos/clean/window-before.jpg", after: "/photos/clean/window-after.jpg" },
  sofa: { before: "/photos/clean/sofa-before.jpg", after: "/photos/clean/sofa-after.jpg" },
  balcony: { before: "/photos/clean/balcony-before.jpg", after: "/photos/clean/balcony-after.jpg" },
  mattress: { before: "/photos/clean/mattress-before.jpg", after: "/photos/clean/mattress-after.jpg" },
};

/** Where the defect sits in each shot, as [x, y, w, h] % of the frame. */
export const BOX: Record<"bathLeak" | "bathLeakClose" | "bathFixed" | "bedroomLock", [number, number, number, number]> = {
  bathLeak: [35, 47, 25, 31],
  bathLeakClose: [14, 22, 60, 62],
  bathFixed: [35, 47, 25, 31],
  bedroomLock: [46, 26, 9, 12],
};
