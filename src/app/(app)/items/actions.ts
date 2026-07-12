"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";
import { generateItems } from "@/lib/ai";

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
