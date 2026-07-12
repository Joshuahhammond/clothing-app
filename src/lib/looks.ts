// Compose lookbook items into outfit "looks" and assign collage positions,
// mimicking a stylist's flat-lay: garments overlap on one white canvas.

export type LookItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_cents: number | null;
  product_url: string;
  image_url: string;
  color_hex: string;
  note: string;
};

export type Slot = {
  left: number; // percentages of the canvas
  top: number;
  width: number;
  height: number;
  z: number;
  rotate: number;
};

/**
 * Distribute items into balanced outfits: each round takes at most one
 * outerwear, a dress, up to two tops, one bottom, one shoes, two accessories.
 * Items keep their curated order within a category.
 */
export function groupIntoLooks(items: LookItem[]): LookItem[][] {
  const pools = new Map<string, LookItem[]>();
  for (const item of items) {
    const key = ["outerwear", "dresses", "tops", "bottoms", "shoes", "accessories"].includes(item.category)
      ? item.category
      : "other";
    pools.set(key, [...(pools.get(key) ?? []), item]);
  }

  const recipe: Array<[string, number]> = [
    ["outerwear", 1],
    ["dresses", 1],
    ["tops", 2],
    ["bottoms", 1],
    ["shoes", 1],
    ["accessories", 2],
    ["other", 1],
  ];

  const looks: LookItem[][] = [];
  while ([...pools.values()].some((p) => p.length > 0)) {
    const look: LookItem[] = [];
    for (const [category, take] of recipe) {
      const pool = pools.get(category);
      if (pool) look.push(...pool.splice(0, take));
    }
    if (look.length === 0) break;
    looks.push(look);
  }

  // A trailing look with a single item reads as an orphan — merge it back
  if (looks.length > 1 && looks[looks.length - 1].length < 2) {
    const last = looks.pop()!;
    looks[looks.length - 1].push(...last);
  }
  return looks;
}

// Hand-tuned slots on a 4:5 canvas, packed tight like a stylist's board —
// large overlapping garments, accessories filling the gaps.
const SLOTS: Record<string, Slot[]> = {
  outerwear: [
    { left: -3, top: -2, width: 52, height: 52, z: 2, rotate: 0 },
    { left: 0, top: 44, width: 42, height: 42, z: 3, rotate: 0 },
  ],
  tops: [
    { left: 22, top: -3, width: 48, height: 46, z: 3, rotate: 0 },
    { left: -2, top: 34, width: 40, height: 40, z: 4, rotate: 0 },
  ],
  dresses: [
    { left: 26, top: 0, width: 48, height: 74, z: 2, rotate: 0 },
  ],
  bottoms: [
    { left: 56, top: 6, width: 48, height: 74, z: 2, rotate: 0 },
    { left: 30, top: 36, width: 42, height: 56, z: 3, rotate: 0 },
  ],
  shoes: [
    { left: 48, top: 74, width: 34, height: 26, z: 5, rotate: 0 },
    { left: 2, top: 78, width: 30, height: 22, z: 5, rotate: -4 },
  ],
  accessories: [
    { left: 6, top: 66, width: 26, height: 26, z: 5, rotate: -6 },
    { left: 36, top: 66, width: 22, height: 22, z: 6, rotate: 5 },
    { left: 76, top: -2, width: 24, height: 22, z: 6, rotate: 8 },
  ],
  other: [
    { left: 32, top: 40, width: 32, height: 30, z: 4, rotate: 0 },
    { left: 66, top: 72, width: 30, height: 26, z: 5, rotate: 3 },
  ],
};

// When a look has no outerwear, let the first top take the big left slot
const HERO_TOP: Slot = { left: -2, top: -2, width: 52, height: 50, z: 2, rotate: 0 };

export function composeLook(items: LookItem[]): Array<{ item: LookItem; slot: Slot }> {
  const used = new Map<string, number>();
  const hasOuterwear = items.some((i) => i.category === "outerwear" && i.image_url);
  const placed: Array<{ item: LookItem; slot: Slot }> = [];

  for (const item of items) {
    if (!item.image_url) continue; // imageless pieces live in the strip below
    const key = SLOTS[item.category] ? item.category : "other";
    const idx = used.get(key) ?? 0;

    let slot: Slot | undefined;
    if (key === "tops" && !hasOuterwear && idx === 0) {
      slot = HERO_TOP;
    } else {
      slot = SLOTS[key][idx];
    }
    // Category slots exhausted → borrow a generic slot, else skip canvas
    if (!slot) slot = SLOTS.other[(used.get("other") ?? 0)];
    if (!slot) continue;
    if (slot === SLOTS.other[(used.get("other") ?? 0)] && key !== "other") {
      used.set("other", (used.get("other") ?? 0) + 1);
    }

    used.set(key, idx + 1);
    placed.push({ item, slot });
  }
  return placed;
}
