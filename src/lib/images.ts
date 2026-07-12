import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GarmentBox } from "@/lib/ai";

/**
 * Turn a retailer product photo into a transparent cutout and host it in
 * Supabase Storage. Pass a crop box (percentages) for on-model shots to
 * produce a headless garment crop first. Falls back to the original URL
 * if anything fails — a boxed image beats a broken one.
 */
export async function processProductImage(
  imageUrl: string,
  ownerId: string,
  supabase: SupabaseClient,
  crop?: GarmentBox | null
): Promise<string> {
  if (!imageUrl) return "";
  try {
    const { removeBackground } = await import("@imgly/background-removal-node");

    let source: string | Blob = imageUrl;
    if (crop) {
      const sharp = (await import("sharp")).default;
      const res = await fetch(imageUrl, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const buf = Buffer.from(await res.arrayBuffer());
      const img = sharp(buf);
      const meta = await img.metadata();
      const W = meta.width ?? 0;
      const H = meta.height ?? 0;
      if (W > 0 && H > 0) {
        const left = Math.max(0, Math.round((crop.left / 100) * W));
        const top = Math.max(0, Math.round((crop.top / 100) * H));
        const width = Math.min(W - left, Math.round((crop.width / 100) * W));
        const height = Math.min(H - top, Math.round((crop.height / 100) * H));
        if (width > 40 && height > 40) {
          const out = await img.extract({ left, top, width, height }).png().toBuffer();
          source = new Blob([new Uint8Array(out)], { type: "image/png" });
        }
      }
    }

    const blob = await removeBackground(source, {
      output: { format: "image/png", quality: 0.9 },
    });
    let upload = Buffer.from(await blob.arrayBuffer());

    // Quality gate: low-contrast garments (cream on cream) get shredded by
    // segmentation — a near-empty cutout falls back to the rectangular crop.
    // High coverage just means the subject fills the frame; keep it.
    try {
      const sharp = (await import("sharp")).default;
      const stats = await sharp(upload).ensureAlpha().stats();
      const alpha = stats.channels[3];
      const coverage = (alpha?.mean ?? 255) / 255;
      if (coverage < 0.2) {
        if (source instanceof Blob) {
          upload = Buffer.from(await source.arrayBuffer());
        } else {
          return imageUrl; // no crop to fall back to — keep the original
        }
      }
    } catch {
      // stats failed — keep the cutout as-is
    }

    const path = `${ownerId}/${crypto.randomUUID()}.png`;
    const { error } = await supabase.storage
      .from("cutouts")
      .upload(path, upload, { contentType: "image/png" });
    if (error) throw error;

    const { data } = supabase.storage.from("cutouts").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error("cutout failed, keeping original image:", err);
    return imageUrl;
  }
}
