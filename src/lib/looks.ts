// Compose lookbook items into outfit "looks" and assign collage positions.
// Layout mirrors a stylist's board: garments in a row across the top,
// trousers flanking tall on the sides, shoes stacked bottom-center,
// accessories tucked into the middle gaps.

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
  /** explicit outfit number (0 = ungrouped legacy items) */
  look_no?: number;
};

/** Group by explicit outfit numbers when present, else fall back to recipe */
export function groupLookbookItems(items: LookItem[]): LookItem[][] {
  const tagged = items.filter((i) => (i.look_no ?? 0) > 0);
  if (tagged.length === 0) return groupIntoLooks(items);

  const byNo = new Map<number, LookItem[]>();
  for (const item of items) {
    const no = item.look_no && item.look_no > 0 ? item.look_no : 999; // stragglers last
    byNo.set(no, [...(byNo.get(no) ?? []), item]);
  }
  return [...byNo.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
}

export type Slot = {
  left: number; // percentages of the canvas
  top: number;
  width: number;
  height: number;
  z: number;
  rotate: number;
  /** anchor within the slot: tops hang to their hem, bottoms hang from the waist */
  align?: "top" | "bottom";
};

const take = (pools: Map<string, LookItem[]>, key: string, n: number): LookItem[] =>
  pools.get(key)?.splice(0, n) ?? [];

/**
 * Distribute items into balanced outfits. Per look: up to 3 headliner
 * garments (outerwear/dress/tops), 2 bottoms, 2 shoes, 3 accessories/other.
 */
export function groupIntoLooks(items: LookItem[]): LookItem[][] {
  const pools = new Map<string, LookItem[]>();
  for (const item of items) {
    const key = ["outerwear", "dresses", "tops", "bottoms", "shoes", "accessories"].includes(item.category)
      ? item.category
      : "other";
    pools.set(key, [...(pools.get(key) ?? []), item]);
  }

  const looks: LookItem[][] = [];
  while ([...pools.values()].some((p) => p.length > 0)) {
    const look: LookItem[] = [];
    look.push(...take(pools, "outerwear", 1));
    look.push(...take(pools, "dresses", Math.max(0, 2 - look.length)));
    look.push(...take(pools, "tops", 3 - look.length));
    look.push(...take(pools, "bottoms", 2));
    look.push(...take(pools, "shoes", 2));
    look.push(...take(pools, "accessories", 3));
    look.push(...take(pools, "other", 1));
    if (look.length === 0) break;
    looks.push(look);
  }

  if (looks.length > 1 && looks[looks.length - 1].length < 3) {
    const last = looks.pop()!;
    looks[looks.length - 1].push(...last);
  }
  return looks;
}

// Accessory subtypes place differently (bag beside the column, belt at the
// waist, sunglasses/jewelry sprinkled top-left) — classify by name
export function accKind(name: string): "bag" | "belt" | "sunglasses" | "jewelry" | "other" {
  if (/bag|tote|clutch|crossbody|crescent|satchel|hobo/i.test(name)) return "bag";
  if (/belt/i.test(name)) return "belt";
  if (/sunglass|eyewear|frames/i.test(name)) return "sunglasses";
  if (/earring|necklace|ring|bracelet|hoop|pendant|choker|chain|watch|cuff|jewel/i.test(name)) return "jewelry";
  return "other";
}

/** Only transparent cutouts belong on the collage canvas */
export const isCutout = (url: string) => url.includes("/cutouts/");

/**
 * Column-cluster composition (Stefana Silber style): the outfit reads as a
 * dressed column — top overlapping the trousers below it, shoes at the foot,
 * bag beside the column, small accessories sprinkled around the edges.
 */
export function composeLook(items: LookItem[]): Array<{ item: LookItem; slot: Slot }> {
  const withImage = items.filter((i) => i.image_url && isCutout(i.image_url));

  const dress = withImage.find((i) => i.category === "dresses");
  const heads = withImage
    .filter((i) => ["outerwear", "tops"].includes(i.category))
    .slice(0, 3);
  const bottoms = withImage.filter((i) => i.category === "bottoms").slice(0, 2);
  const shoes = withImage.filter((i) => i.category === "shoes").slice(0, 2);
  const rest = withImage.filter(
    (i) => i !== dress && !heads.includes(i) && !bottoms.includes(i) && !shoes.includes(i)
  );
  const bags = rest.filter((i) => accKind(i.name) === "bag").slice(0, 1);
  const belts = rest.filter((i) => accKind(i.name) === "belt").slice(0, 1);
  const sunnies = rest.filter((i) => accKind(i.name) === "sunglasses").slice(0, 1);
  const jewelry = rest.filter((i) => accKind(i.name) === "jewelry").slice(0, 2);
  const others = rest
    .filter((i) => ![...bags, ...belts, ...sunnies, ...jewelry].includes(i))
    .slice(0, 2);

  const placed: Array<{ item: LookItem; slot: Slot }> = [];
  const put = (item: LookItem | undefined, slot: Slot) => {
    if (item) placed.push({ item, slot });
  };

  if (dress) {
    // Dress owns the column; tops become satellites
    put(dress, { left: 30, top: 2, width: 42, height: 76, z: 3, rotate: 0 });
    put(heads[0], { left: -2, top: 4, width: 36, height: 36, z: 4, rotate: 0 });
    put(heads[1], { left: 70, top: 2, width: 32, height: 32, z: 2, rotate: 0 });
    put(bottoms[0], { left: 68, top: 34, width: 34, height: 46, z: 2, rotate: 0 });
  } else if (heads.length === 0) {
    // No garment for the column top — bottoms take the full height
    put(bottoms[0], { left: 6, top: 3, width: 42, height: 78, z: 2, rotate: 0 });
    put(bottoms[1], { left: 54, top: 5, width: 42, height: 76, z: 2, rotate: 0 });
  } else {
    // The dressed column: the top's hem meets the trouser's waistband on a
    // shared center axis, with a slight dressed overlap
    put(heads[0], { left: 16, top: 2, width: 44, height: 36, z: 4, rotate: 0, align: "bottom" });
    put(heads[1], { left: 60, top: 1, width: 38, height: 32, z: 3, rotate: 0, align: "bottom" });
    put(heads[2], { left: -2, top: 12, width: 32, height: 30, z: 2, rotate: 0, align: "bottom" });
    put(bottoms[0], { left: 18, top: 35, width: 40, height: 50, z: 2, rotate: 0, align: "top" });
    put(bottoms[1], { left: 62, top: 36, width: 34, height: 46, z: 2, rotate: 0, align: "top" });
  }

  put(shoes[0], { left: 22, top: 84, width: 28, height: 14, z: 5, rotate: 0 });
  put(shoes[1], { left: 55, top: 85, width: 26, height: 13, z: 6, rotate: 0 });

  // Satellites: bag beside the column (left when the right column is busy)
  const rightBusy = bottoms.length > 1 || Boolean(dress);
  put(bags[0], rightBusy
    ? { left: 0, top: 54, width: 26, height: 24, z: 5, rotate: 0 }
    : { left: 66, top: 50, width: 28, height: 26, z: 5, rotate: 0 });
  put(belts[0], { left: 63, top: 30, width: 22, height: 12, z: 6, rotate: -8 });
  put(sunnies[0], { left: 4, top: 1, width: 16, height: 9, z: 6, rotate: -5 });
  put(jewelry[0], { left: 2, top: 13, width: 13, height: 12, z: 6, rotate: 0 });
  put(jewelry[1], { left: 3, top: 28, width: 12, height: 11, z: 6, rotate: 4 });
  put(others[0], { left: 82, top: 62, width: 18, height: 16, z: 5, rotate: 3 });
  put(others[1], { left: 2, top: 44, width: 18, height: 15, z: 5, rotate: -4 });

  return placed;
}
