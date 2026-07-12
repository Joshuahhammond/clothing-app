import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addWardrobeItem,
  deleteWardrobeItem,
  deleteClient,
  generateWardrobeWithAi,
} from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { CATEGORIES, type Client, type Lookbook, type WardrobeItem } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const [clientRes, wardrobeRes, lookbooksRes] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single<Client>(),
    supabase
      .from("wardrobe_items")
      .select("*")
      .eq("client_id", id)
      .order("category")
      .order("created_at", { ascending: false }),
    supabase
      .from("lookbooks")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const client = clientRes.data;
  if (!client) notFound();

  const wardrobe = (wardrobeRes.data ?? []) as WardrobeItem[];
  const lookbooks = (lookbooksRes.data ?? []) as Lookbook[];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/clients" className="text-sm text-ink/60 hover:text-ink">
        ← All clients
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">{client.name}</h1>
          {client.email && <p className="text-sm text-ink/60">{client.email}</p>}
          {client.notes && <p className="mt-2 max-w-lg text-sm text-ink/70">{client.notes}</p>}
        </div>
        <form action={deleteClient}>
          <input type="hidden" name="id" value={client.id} />
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Delete client
          </button>
        </form>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">Wardrobe</h2>
        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <form
          action={generateWardrobeWithAi}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-taupe/40 bg-bone/40 p-4"
        >
          <input type="hidden" name="client_id" value={client.id} />
          <div className="min-w-64 flex-1">
            <label htmlFor="ai-persona" className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-taupe-dark">
              ✦ Generate wardrobe with AI
            </label>
            <input
              id="ai-persona"
              name="persona"
              required
              placeholder={`Describe ${client.name} — "35, marketing exec, quiet luxury, mostly neutrals"`}
              className="w-full rounded-md border border-bone bg-white px-3 py-2 text-sm focus:border-taupe focus:outline-none"
            />
          </div>
          <div className="w-20">
            <label htmlFor="ai-count" className="mb-1 block text-xs font-medium text-ink/70">
              Items
            </label>
            <input
              id="ai-count"
              name="count"
              type="number"
              min={1}
              max={30}
              defaultValue={10}
              className="w-full rounded-md border border-bone bg-white px-3 py-2 text-sm focus:border-taupe focus:outline-none"
            />
          </div>
          <SubmitButton pendingLabel="Generating…">Generate</SubmitButton>
        </form>
        <form
          action={addWardrobeItem}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-bone bg-white p-4"
        >
          <input type="hidden" name="client_id" value={client.id} />
          <div className="min-w-36 flex-1">
            <label htmlFor="w-name" className="mb-1 block text-xs font-medium text-ink/70">
              Item
            </label>
            <input
              id="w-name"
              name="name"
              required
              placeholder="Navy blazer"
              className="w-full rounded-md border border-bone px-3 py-2 text-sm focus:border-taupe focus:outline-none"
            />
          </div>
          <div className="w-32">
            <label htmlFor="w-brand" className="mb-1 block text-xs font-medium text-ink/70">
              Brand
            </label>
            <input
              id="w-brand"
              name="brand"
              className="w-full rounded-md border border-bone px-3 py-2 text-sm focus:border-taupe focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="w-category" className="mb-1 block text-xs font-medium text-ink/70">
              Category
            </label>
            <select
              id="w-category"
              name="category"
              className="rounded-md border border-bone px-2 py-2 text-sm focus:border-taupe focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="w-color" className="mb-1 block text-xs font-medium text-ink/70">
              Color
            </label>
            <input
              id="w-color"
              name="color_hex"
              type="color"
              defaultValue="#334155"
              className="h-9 w-12 cursor-pointer rounded-md border border-bone"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-taupe-dark"
          >
            Add
          </button>
        </form>

        {wardrobe.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-bone bg-white p-6 text-center text-sm text-ink/60">
            Nothing tracked yet. Add what {client.name} already owns.
          </p>
        ) : (
          <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-bone">
            {CATEGORIES.filter((c) => wardrobe.some((w) => w.category === c)).map(
              (category, ci) => (
                <div key={category} className={ci > 0 ? "mt-8" : ""}>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.25em] text-taupe-dark">
                      {category}
                    </h3>
                    <span className="font-serif text-sm italic text-ink/40">
                      {wardrobe.filter((w) => w.category === category).length}
                    </span>
                    <div className="h-px flex-1 bg-bone" />
                  </div>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {wardrobe
                      .filter((w) => w.category === category)
                      .map((w) => (
                        <li key={w.id} className="group flex items-center gap-3 rounded-xl p-2 hover:bg-cream">
                          {w.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- arbitrary hosts
                            <img
                              src={w.image_url}
                              alt={w.name}
                              className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain mix-blend-multiply"
                            />
                          ) : (
                            <span
                              className="h-10 w-10 shrink-0 rounded-full ring-1 ring-bone"
                              style={{ backgroundColor: w.color_hex }}
                              title={w.color_hex}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">{w.name}</p>
                            <p className="truncate text-xs text-ink/50">
                              {[w.brand, w.notes].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <form action={deleteWardrobeItem}>
                            <input type="hidden" name="id" value={w.id} />
                            <input type="hidden" name="client_id" value={client.id} />
                            <button
                              type="submit"
                              aria-label={`Remove ${w.name}`}
                              className="text-xs text-ink/30 opacity-0 hover:text-red-600 group-hover:opacity-100"
                            >
                              ✕
                            </button>
                          </form>
                        </li>
                      ))}
                  </ul>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Lookbooks for {client.name}</h2>
          <Link href="/lookbooks" className="text-sm font-medium text-taupe-dark hover:underline">
            Create one
          </Link>
        </div>
        {lookbooks.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">No lookbooks for this client yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-bone rounded-xl border border-bone bg-white">
            {lookbooks.map((lb) => (
              <li key={lb.id}>
                <Link
                  href={`/lookbooks/${lb.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-cream"
                >
                  <span className="text-sm font-medium text-ink">{lb.title}</span>
                  <span className="text-xs text-ink/60">
                    {new Date(lb.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
