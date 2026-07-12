"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hexToHsl } from "@/lib/color";
import { planDiscovery, curateLookbook, pickBestImage } from "@/lib/ai";
import { processProductImage } from "@/lib/images";
import { SOURCES, sourceById } from "@/lib/sources";
import { fetchStoreProducts, filterByKeywords } from "@/lib/shopify";

export async function generateLookbookWithAi(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const brief = String(formData.get("brief") ?? "").trim();
  if (!brief) return;
  const clientId = String(formData.get("client_id") ?? "");
  const count = Math.min(Math.max(parseInt(String(formData.get("count") ?? "8"), 10) || 8, 2), 12);

  let clientName: string | null = null;
  if (clientId) {
    const { data } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    clientName = data?.name ?? null;
  }

  // Source REAL products via the Discover pipeline, then curate
  let curated;
  let candidates;
  try {
    const storeCatalog = SOURCES.map((s) => `${s.id}: ${s.name} — ${s.vibe}`).join("\n");
    const plan = await planDiscovery(brief, storeCatalog);
    const stores = plan.store_ids
      .map(sourceById)
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .slice(0, 6);
    const catalogs = await Promise.all(stores.map((s) => fetchStoreProducts(s)));
    candidates = filterByKeywords(catalogs.flat(), plan.keywords).slice(0, 120);
    if (candidates.length < count) {
      redirect(
        `/lookbooks?error=${encodeURIComponent("Not enough matching products in the stores — try broader wording")}`
      );
    }
    const lines = candidates
      .map(
        (p, i) =>
          `${i}. ${p.title} | ${p.productType} | ${p.storeName} | $${p.price ?? "?"} | tags: ${p.tags.slice(0, 5).join(", ")}`
      )
      .join("\n");
    curated = await curateLookbook(brief, clientName, lines, count);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI curation failed";
    redirect(`/lookbooks?error=${encodeURIComponent(message)}`);
  }

  const chosen = curated.picks
    .filter((pick) => candidates[pick.index])
    .slice(0, count);

  // Photos: vision picks the flat shot; flats become transparent cutouts
  const prepared = await Promise.all(
    chosen.map(async (pick) => {
      const product = candidates![pick.index];
      const pool = product.images.length > 0 ? product.images : [product.image];
      const best = await pickBestImage(pool);
      const chosenUrl = pool[best.index] ?? product.image;
      const imageUrl = best.flat
        ? await processProductImage(chosenUrl, user.id, supabase)
        : chosenUrl;
      return { pick, product, imageUrl };
    })
  );

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .insert(
      prepared.map(({ pick, product, imageUrl }) => {
        const { h, s, l } = hexToHsl(pick.color_hex);
        return {
          stylist_id: user.id,
          name: product.title.slice(0, 200),
          brand: product.vendor || product.storeName,
          category: pick.category,
          price_cents: product.price !== null ? Math.round(product.price * 100) : null,
          product_url: product.url,
          image_url: imageUrl,
          color_hex: pick.color_hex,
          hue: h,
          saturation: s,
          lightness: l,
        };
      })
    )
    .select("id");

  if (itemsError || !items) {
    redirect(`/lookbooks?error=${encodeURIComponent("Failed to save sourced items")}`);
  }

  const { data: lookbook, error: lookbookError } = await supabase
    .from("lookbooks")
    .insert({
      stylist_id: user.id,
      title: curated.title,
      description: curated.description,
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
      note: prepared[idx]?.pick.note ?? "",
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
