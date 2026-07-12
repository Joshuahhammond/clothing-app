import { planDiscovery, rankDiscovered } from "@/lib/ai";
import { SOURCES, sourceById } from "@/lib/sources";
import { fetchStoreProducts, filterByKeywords, type SourceProduct } from "@/lib/shopify";
import { addDiscoveredItem } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Discover" };

type Props = { searchParams: Promise<{ q?: string }> };

type Discovered = SourceProduct & { color_hex: string; category: string; why: string };

async function discover(brief: string): Promise<{ results: Discovered[]; storesSearched: string[] }> {
  const storeCatalog = SOURCES.map((s) => `${s.id}: ${s.name} — ${s.vibe}`).join("\n");
  const plan = await planDiscovery(brief, storeCatalog);

  const stores = plan.store_ids
    .map(sourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .slice(0, 6);

  const catalogs = await Promise.all(stores.map((s) => fetchStoreProducts(s)));
  const candidates = filterByKeywords(catalogs.flat(), plan.keywords).slice(0, 120);
  if (candidates.length === 0) return { results: [], storesSearched: stores.map((s) => s.name) };

  const lines = candidates
    .map(
      (p, i) =>
        `${i}. ${p.title} | ${p.productType} | ${p.storeName} | $${p.price ?? "?"} | tags: ${p.tags.slice(0, 5).join(", ")}`
    )
    .join("\n");
  const { picks } = await rankDiscovered(brief, lines);

  const results = picks
    .filter((pick) => candidates[pick.index])
    .map((pick) => ({
      ...candidates[pick.index],
      color_hex: pick.color_hex,
      category: pick.category,
      why: pick.why,
    }));

  return { results, storesSearched: stores.map((s) => s.name) };
}

export default async function DiscoverPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const search = q?.trim() ? await discover(q.trim()) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">Discover</h1>
      <p className="mt-1 text-sm text-ink/60">
        Real, in-stock pieces from {SOURCES.length} boutiques — found and styled by AI.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-taupe/40 bg-bone/40 p-4">
        <div className="min-w-72 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-taupe-dark">
            ✦ What are you sourcing?
          </label>
          <input
            id="q"
            name="q"
            required
            defaultValue={q ?? ""}
            placeholder="Quiet-luxury fall capsule in camel and chocolate, client budget ~$200/piece"
            className="w-full rounded-md border border-bone bg-white px-3 py-2 text-sm focus:border-taupe focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-taupe-dark"
        >
          Search the stores
        </button>
      </form>

      {search && (
        <>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-ink/50">
            {search.results.length} pieces · searched {search.storesSearched.join(", ")}
          </p>

          {search.results.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-bone bg-white p-8 text-center text-sm text-ink/60">
              Nothing matched — try broader wording or fewer constraints.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {search.results.map((p) => (
                <li key={p.url} className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-bone">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element -- retailer CDNs */}
                    <img src={p.image} alt={p.title} className="h-56 w-full object-cover" loading="lazy" />
                  </a>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 text-xs font-medium text-ink">{p.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink/50">
                      {p.storeName}
                      {p.price !== null && ` · $${p.price.toFixed(0)}`}
                    </p>
                    <p className="mt-1 font-serif text-xs italic text-taupe-dark">{p.why}</p>
                    <form action={addDiscoveredItem} className="mt-auto pt-2">
                      <input type="hidden" name="name" value={p.title} />
                      <input type="hidden" name="brand" value={p.vendor || p.storeName} />
                      <input type="hidden" name="category" value={p.category} />
                      <input type="hidden" name="price" value={p.price ?? ""} />
                      <input type="hidden" name="product_url" value={p.url} />
                      <input type="hidden" name="image_url" value={p.image} />
                      {p.images.map((img) => (
                        <input key={img} type="hidden" name="images" value={img} />
                      ))}
                      <input type="hidden" name="color_hex" value={p.color_hex} />
                      <SubmitButton
                        pendingLabel="Adding…"
                        className="w-full rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-cream hover:bg-taupe-dark disabled:opacity-60"
                      >
                        + Add to library
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
