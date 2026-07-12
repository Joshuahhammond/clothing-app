"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";
import { generateLookbook } from "@/lib/ai";

export async function generateLookbookWithAi(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const brief = String(formData.get("brief") ?? "").trim();
  if (!brief) return;
  const clientId = String(formData.get("client_id") ?? "");
  const count = Math.min(Math.max(parseInt(String(formData.get("count") ?? "6"), 10) || 6, 2), 12);

  let clientName: string | null = null;
  if (clientId) {
    const { data } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    clientName = data?.name ?? null;
  }

  let generated;
  try {
    generated = await generateLookbook(brief, clientName, count);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    redirect(`/lookbooks?error=${encodeURIComponent(message)}`);
  }

  // Create the library items first, then the lookbook that references them
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .insert(
      generated.items.map((g) => {
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
    )
    .select("id");

  if (itemsError || !items) {
    redirect(`/lookbooks?error=${encodeURIComponent("Failed to save generated items")}`);
  }

  const { data: lookbook, error: lookbookError } = await supabase
    .from("lookbooks")
    .insert({
      stylist_id: user.id,
      title: generated.title,
      description: generated.description,
      client_id: clientId || null,
    })
    .select("id")
    .single();

  if (lookbookError || !lookbook) {
    redirect(`/lookbooks?error=${encodeURIComponent("Failed to create lookbook")}`);
  }

  await supabase.from("lookbook_items").insert(
    items.map((item, idx) => ({
      lookbook_id: lookbook.id,
      item_id: item.id,
      note: generated.items[idx]?.note ?? "",
      position: idx + 1,
    }))
  );

  revalidatePath("/lookbooks");
  revalidatePath("/items");
  redirect(`/lookbooks/${lookbook.id}`);
}

export async function createLookbook(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const clientId = String(formData.get("client_id") ?? "");

  const { data, error } = await supabase
    .from("lookbooks")
    .insert({
      stylist_id: user.id,
      title,
      description: String(formData.get("description") ?? "").trim(),
      client_id: clientId || null,
    })
    .select("id")
    .single();

  if (error || !data) return;

  redirect(`/lookbooks/${data.id}`);
}

export async function deleteLookbook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  await supabase.from("lookbooks").delete().eq("id", id);

  revalidatePath("/lookbooks");
  redirect("/lookbooks");
}

export async function addItemToLookbook(formData: FormData) {
  const supabase = await createClient();
  const lookbookId = String(formData.get("lookbook_id") ?? "");
  const itemId = String(formData.get("item_id") ?? "");
  if (!lookbookId || !itemId) return;

  const { data: maxRow } = await supabase
    .from("lookbook_items")
    .select("position")
    .eq("lookbook_id", lookbookId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("lookbook_items").insert({
    lookbook_id: lookbookId,
    item_id: itemId,
    position: (maxRow?.position ?? 0) + 1,
  });

  revalidatePath(`/lookbooks/${lookbookId}`);
}

export async function removeItemFromLookbook(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const lookbookId = String(formData.get("lookbook_id") ?? "");

  await supabase.from("lookbook_items").delete().eq("id", id);

  revalidatePath(`/lookbooks/${lookbookId}`);
}

export async function updateLookbookItemNote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const lookbookId = String(formData.get("lookbook_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  await supabase.from("lookbook_items").update({ note }).eq("id", id);

  revalidatePath(`/lookbooks/${lookbookId}`);
}
