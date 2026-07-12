"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";
import { generateItems, extractProductFromPage, pickBestImage, locateGarment } from "@/lib/ai";
import { processProductImage } from "@/lib/images";

async function fetchProductPage(url: string): Promise<{ head: string; ogImage: string }> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`That page returned ${res.status} — try adding the item manually`);

  const html = (await res.text()).slice(0, 200_000);
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  // Keep meta/title/JSON-LD lines only, so the AI sees signal not scripts
  const head = (headMatch ? headMatch[0] : html.slice(0, 20_000))
    .split(/\n/)
    .filter((line) => /<(meta|title|script[^>]*ld\+json)/i.test(line) || /"price"|og:|product:/i.test(line))
    .join("\n")
    .slice(0, 8000);

  const ogImage =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ??
    "";

  return { head, ogImage };
}

export async function importItemFromUrl(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) {
    redirect(`/items?error=${encodeURIComponent("Paste a full product URL (https://...)")}`);
  }

  let product;
  let ogImage = "";
  try {
    const page = await fetchProductPage(url);
    ogImage = page.ogImage;
    product = await extractProductFromPage(url, page.head);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not import that product";
    redirect(`/items?error=${encodeURIComponent(message)}`);
  }

  let cutout = "";
  if (ogImage) {
    const { flat } = await pickBestImage([ogImage]);
    const crop = flat ? null : await locateGarment(ogImage, product.name);
    if (flat || crop) {
      cutout = await processProductImage(ogImage, user.id, supabase, crop, flat);
    } // model shot with no clean crop keeps the original photo (off-canvas)
  }

  const { h, s, l } = hexToHsl(product.color_hex);
  await supabase.from("items").insert({
    stylist_id: user.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price_cents: product.price_dollars > 0 ? Math.round(product.price_dollars * 100) : null,
    product_url: url,
    image_url: cutout,
    color_hex: product.color_hex,
    hue: h,
    saturation: s,
    lightness: l,
  });

  revalidatePath("/items");
}

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const colorHex = String(formData.get("color_hex") ?? "#808080");
  const { h, s, l } = hexToHsl(colorHex);

  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : null;

  await supabase.from("items").insert({
    stylist_id: user.id,
    name,
    brand: String(formData.get("brand") ?? "").trim(),
    category: String(formData.get("category") ?? "other"),
    price_cents: Number.isFinite(price) ? price : null,
    product_url: String(formData.get("product_url") ?? "").trim(),
    image_url: String(formData.get("image_url") ?? "").trim(),
    color_hex: colorHex,
    hue: h,
    saturation: s,
    lightness: l,
  });

  revalidatePath("/items");
}

export async function generateItemsWithAi(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const brief = String(formData.get("brief") ?? "").trim();
  if (!brief) return;
  const count = Math.min(Math.max(parseInt(String(formData.get("count") ?? "8"), 10) || 8, 1), 24);

  let generated;
  try {
    generated = await generateItems(brief, count);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    redirect(`/items?error=${encodeURIComponent(message)}`);
  }

  await supabase.from("items").insert(
    generated.map((g) => {
      const { h, s, l } = hexToHsl(g.color_hex);
      return {
        stylist_id: user.id,
        name: g.name,
        brand: g.brand,
        category: g.category,
        price_cents: Math.round(g.price_dollars * 100),
        product_url: "",
        image_url: "",
        color_hex: g.color_hex,
        hue: h,
        saturation: s,
        lightness: l,
      };
    })
  );

  revalidatePath("/items");
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  await supabase.from("items").delete().eq("id", id);

  revalidatePath("/items");
}
