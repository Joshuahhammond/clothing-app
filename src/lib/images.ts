import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Turn a retailer product photo into a transparent cutout and host it in
 * Supabase Storage. Falls back to the original URL if anything fails —
 * a boxed image beats a broken one.
 */
export async function processProductImage(
  imageUrl: string,
  ownerId: string,
  supabase: SupabaseClient
): Promise<string> {
  if (!imageUrl) return "";
  try {
    const { removeBackground } = await import("@imgly/background-removal-node");
    const blob = await removeBackground(imageUrl, {
      output: { format: "image/png", quality: 0.9 },
    });

    const path = `${ownerId}/${crypto.randomUUID()}.png`;
    const { error } = await supabase.storage
      .from("cutouts")
      .upload(path, await blob.arrayBuffer(), { contentType: "image/png" });
    if (error) throw error;

    const { data } = supabase.storage.from("cutouts").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("cutout failed, keeping original image:", err);
    return imageUrl;
  }
}
