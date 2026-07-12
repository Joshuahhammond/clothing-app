"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";
import { pickBestImage } from "@/lib/ai";
import { processProductImage } from "@/lib/images";

export async function addDiscoveredItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const colorHex = String(formData.get("color_hex") ?? "#808080");
  const { h, s, l } = hexToHsl(colorHex);
  const price = parseFloat(String(formData.get("price") ?? ""));

  // Best photo → transparent cutout hosted in our storage
  const candidates = formData
    .getAll("images")
    .map(String)
    .filter((u) => u.startsWith("http"));
  let imageUrl = String(formData.get("image_url") ?? "");
  if (candidates.length > 0) {
    const best = await pickBestImage(candidates);
    imageUrl = await processProductImage(candidates[best], user.id, supabase);
  } else if (imageUrl) {
    imageUrl = await processProductImage(imageUrl, user.id, supabase);
  }

  await supabase.from("items").insert({
    stylist_id: user.id,
    name: String(formData.get("name") ?? "").slice(0, 200),
    brand: String(formData.get("brand") ?? "").slice(0, 100),
    category: String(formData.get("category") ?? "other"),
    price_cents: Number.isFinite(price) ? Math.round(price * 100) : null,
    product_url: String(formData.get("product_url") ?? ""),
    image_url: imageUrl,
    color_hex: colorHex,
    hue: h,
    saturation: s,
    lightness: l,
  });

  revalidatePath("/items");
  revalidatePath("/discover");
}
