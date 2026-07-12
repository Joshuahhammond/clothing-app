import "server-only";
import type { Source } from "@/lib/sources";

export type SourceProduct = {
  storeId: string;
  storeName: string;
  title: string;
  url: string;
  image: string;
  price: number | null;
  productType: string;
  tags: string[];
  vendor: string;
};

type ShopifyProduct = {
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  variants?: Array<{ price?: string; available?: boolean }>;
  images?: Array<{ src?: string }>;
};

export async function fetchStoreProducts(
  source: Source,
  limit = 250
): Promise<SourceProduct[]> {
  try {
    const res = await fetch(`https://${source.domain}/products.json?limit=${limit}`, {
      signal: AbortSignal.timeout(9000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
      // Catalogs churn slowly; cache for an hour so repeat searches are fast
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: ShopifyProduct[] };

    return (data.products ?? [])
      .filter((p) => p.images?.[0]?.src)
      .map((p) => ({
        storeId: source.id,
        storeName: source.name,
        title: p.title,
        url: `https://${source.domain}/products/${p.handle}`,
        image: p.images![0].src!,
        price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
        productType: p.product_type ?? "",
        tags: Array.isArray(p.tags) ? p.tags : (p.tags ?? "").split(",").map((t) => t.trim()),
        vendor: p.vendor ?? source.name,
      }));
  } catch {
    return []; // a slow or blocked store shouldn't sink the whole search
  }
}

/** Cheap local keyword pass to shrink the candidate pool before AI ranking */
export function filterByKeywords(
  products: SourceProduct[],
  keywords: string[]
): SourceProduct[] {
  const needles = keywords.map((k) => k.toLowerCase()).filter(Boolean);
  if (needles.length === 0) return products;
  return products.filter((p) => {
    const haystack = `${p.title} ${p.productType} ${p.tags.join(" ")}`.toLowerCase();
    return needles.some((n) => haystack.includes(n));
  });
}
