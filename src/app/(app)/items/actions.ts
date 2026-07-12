"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";

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

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  await supabase.from("items").delete().eq("id", id);

  revalidatePath("/items");
}
