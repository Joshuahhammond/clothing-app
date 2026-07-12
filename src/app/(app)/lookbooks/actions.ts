"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
