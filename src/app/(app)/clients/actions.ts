"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";

export async function addClient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await supabase.from("clients").insert({
    stylist_id: user.id,
    name,
    email: String(formData.get("email") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  revalidatePath("/clients");
}

export async function deleteClient(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  await supabase.from("clients").delete().eq("id", id);

  revalidatePath("/clients");
  redirect("/clients");
}

export async function addWardrobeItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clientId = String(formData.get("client_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!clientId || !name) return;

  const colorHex = String(formData.get("color_hex") ?? "#808080");
  const { h, s, l } = hexToHsl(colorHex);

  await supabase.from("wardrobe_items").insert({
    client_id: clientId,
    stylist_id: user.id,
    name,
    brand: String(formData.get("brand") ?? "").trim(),
    category: String(formData.get("category") ?? "other"),
    color_hex: colorHex,
    hue: h,
    saturation: s,
    lightness: l,
    notes: String(formData.get("notes") ?? "").trim(),
  });

  revalidatePath(`/clients/${clientId}`);
}

export async function deleteWardrobeItem(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");

  await supabase.from("wardrobe_items").delete().eq("id", id);

  revalidatePath(`/clients/${clientId}`);
}
