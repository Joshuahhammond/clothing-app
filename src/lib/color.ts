export type Hsl = { h: number; s: number; l: number };

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return {
    h: Math.round(h * 360) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export type ColorFamily = {
  key: string;
  label: string;
  /** representative swatch color for the filter chip */
  swatch: string;
  /** center hue, or null for the neutrals bucket */
  hue: number | null;
};

export const COLOR_FAMILIES: ColorFamily[] = [
  { key: "red", label: "Red", swatch: "#dc2626", hue: 0 },
  { key: "orange", label: "Orange", swatch: "#ea580c", hue: 30 },
  { key: "yellow", label: "Yellow", swatch: "#eab308", hue: 55 },
  { key: "green", label: "Green", swatch: "#16a34a", hue: 130 },
  { key: "teal", label: "Teal", swatch: "#0d9488", hue: 178 },
  { key: "blue", label: "Blue", swatch: "#2563eb", hue: 225 },
  { key: "purple", label: "Purple", swatch: "#9333ea", hue: 275 },
  { key: "pink", label: "Pink", swatch: "#db2777", hue: 330 },
  { key: "neutral", label: "Neutrals", swatch: "#a8a29e", hue: null },
];

const HUE_TOLERANCE = 28;

function isNeutral(s: number, l: number) {
  return s < 15 || l < 8 || l > 93;
}

function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Does an item's stored HSL fall inside a color family bucket? */
export function inColorFamily(
  familyKey: string,
  h: number,
  s: number,
  l: number
): boolean {
  const family = COLOR_FAMILIES.find((f) => f.key === familyKey);
  if (!family) return true;
  if (family.hue === null) return isNeutral(s, l);
  if (isNeutral(s, l)) return false;
  return hueDistance(h, family.hue) <= HUE_TOLERANCE;
}

export function formatPrice(priceCents: number | null): string {
  if (priceCents === null || priceCents === undefined) return "";
  return `$${(priceCents / 100).toFixed(priceCents % 100 === 0 ? 0 : 2)}`;
}
