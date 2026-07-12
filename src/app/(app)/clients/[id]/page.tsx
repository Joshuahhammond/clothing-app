import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addWardrobeItem, deleteWardrobeItem, deleteClient } from "../actions";
import { CATEGORIES, type Client, type Lookbook, type WardrobeItem } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
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
      <Link href="/clients" className="text-sm text-stone-500 hover:text-stone-800">
        ← All clients
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{client.name}</h1>
          {client.email && <p className="text-sm text-stone-500">{client.email}</p>}
          {client.notes && <p className="mt-2 max-w-lg text-sm text-stone-600">{client.notes}</p>}
        </div>
        <form action={deleteClient}>
          <input type="hidden" name="id" value={client.id} />
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Delete client
          </button>
        </form>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">Wardrobe</h2>
        <form
          action={addWardrobeItem}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4"
        >
          <input type="hidden" name="client_id" value={client.id} />
          <div className="min-w-36 flex-1">
            <label htmlFor="w-name" className="mb-1 block text-xs font-medium text-stone-600">
              Item
            </label>
            <input
              id="w-name"
              name="name"
              required
              placeholder="Navy blazer"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div className="w-32">
            <label htmlFor="w-brand" className="mb-1 block text-xs font-medium text-stone-600">
              Brand
            </label>
            <input
              id="w-brand"
              name="brand"
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="w-category" className="mb-1 block text-xs font-medium text-stone-600">
              Category
            </label>
            <select
              id="w-category"
              name="category"
              className="rounded-md border border-stone-300 px-2 py-2 text-sm focus:border-teal-600 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="w-color" className="mb-1 block text-xs font-medium text-stone-600">
              Color
            </label>
            <input
              id="w-color"
              name="color_hex"
              type="color"
              defaultValue="#334155"
              className="h-9 w-12 cursor-pointer rounded-md border border-stone-300"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Add
          </button>
        </form>

        {wardrobe.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
            Nothing tracked yet. Add what {client.name} already owns.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wardrobe.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-stone-200"
                  style={{ backgroundColor: w.color_hex }}
                  title={w.color_hex}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{w.name}</p>
                  <p className="truncate text-xs text-stone-500">
                    {[w.brand, w.category].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <form action={deleteWardrobeItem}>
                  <input type="hidden" name="id" value={w.id} />
                  <input type="hidden" name="client_id" value={client.id} />
                  <button
                    type="submit"
                    aria-label={`Remove ${w.name}`}
                    className="text-xs text-stone-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Lookbooks for {client.name}</h2>
          <Link href="/lookbooks" className="text-sm font-medium text-teal-700 hover:underline">
            Create one
          </Link>
        </div>
        {lookbooks.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No lookbooks for this client yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {lookbooks.map((lb) => (
              <li key={lb.id}>
                <Link
                  href={`/lookbooks/${lb.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-stone-50"
                >
                  <span className="text-sm font-medium text-stone-900">{lb.title}</span>
                  <span className="text-xs text-stone-500">
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
