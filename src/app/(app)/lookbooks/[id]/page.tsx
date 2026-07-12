import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  addItemToLookbook,
  removeItemFromLookbook,
  updateLookbookItemNote,
  deleteLookbook,
} from "../actions";
import { CopyButton } from "@/components/copy-button";
import { formatPrice } from "@/lib/color";
import type { Item, Lookbook, LookbookItem } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export default async function LookbookDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [lookbookRes, entriesRes, libraryRes] = await Promise.all([
    supabase.from("lookbooks").select("*").eq("id", id).single<Lookbook>(),
    supabase
      .from("lookbook_items")
      .select("*")
      .eq("lookbook_id", id)
      .order("position"),
    supabase.from("items").select("*").order("created_at", { ascending: false }),
  ]);

  const lookbook = lookbookRes.data;
  if (!lookbook) notFound();

  const entries = (entriesRes.data ?? []) as LookbookItem[];
  const library = (libraryRes.data ?? []) as Item[];
  const itemById = new Map(library.map((i) => [i.id, i]));
  const inBook = new Set(entries.map((e) => e.item_id));
  const available = library.filter((i) => !inBook.has(i.id));

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${proto}://${host}/share/${lookbook.share_token}`;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/lookbooks" className="text-sm text-stone-500 hover:text-stone-800">
        ← All lookbooks
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">{lookbook.title}</h1>
          {lookbook.description && (
            <p className="mt-1 max-w-lg text-sm text-stone-600">{lookbook.description}</p>
          )}
        </div>
        <form action={deleteLookbook}>
          <input type="hidden" name="id" value={lookbook.id} />
          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
            Delete
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
        <span className="text-xs font-medium text-teal-900">Client share link</span>
        <code className="min-w-0 flex-1 truncate text-xs text-teal-800">{shareUrl}</code>
        <CopyButton text={shareUrl} />
        <a
          href={`/share/${lookbook.share_token}`}
          target="_blank"
          className="text-xs font-medium text-teal-700 hover:underline"
        >
          Preview ↗
        </a>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">
          In this lookbook ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
            Empty so far — add items from your library below.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {entries.map((entry) => {
              const item = itemById.get(entry.item_id);
              if (!item) return null;
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4"
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary retailer hosts
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span
                      className="h-16 w-16 shrink-0 rounded-lg border border-stone-200"
                      style={{ backgroundColor: item.color_hex }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900">{item.name}</p>
                    <p className="truncate text-xs text-stone-500">
                      {[item.brand, formatPrice(item.price_cents)].filter(Boolean).join(" · ")}
                    </p>
                    <form action={updateLookbookItemNote} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="lookbook_id" value={lookbook.id} />
                      <input
                        name="note"
                        defaultValue={entry.note}
                        placeholder="Add a styling note for your client..."
                        className="w-full flex-1 rounded-md border border-stone-200 px-2 py-1 text-xs focus:border-teal-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:border-stone-500"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                  <form action={removeItemFromLookbook}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="lookbook_id" value={lookbook.id} />
                    <button
                      type="submit"
                      aria-label={`Remove ${item.name}`}
                      className="text-xs text-stone-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-stone-900">Add from your library</h2>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            {library.length === 0 ? (
              <>
                Your library is empty —{" "}
                <Link href="/items" className="font-medium text-teal-700 hover:underline">
                  add items first
                </Link>
                .
              </>
            ) : (
              "Everything in your library is already in this lookbook."
            )}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-stone-200"
                  style={{ backgroundColor: item.color_hex }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900">{item.name}</p>
                  <p className="truncate text-xs text-stone-500">
                    {[item.brand, formatPrice(item.price_cents)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <form action={addItemToLookbook}>
                  <input type="hidden" name="lookbook_id" value={lookbook.id} />
                  <input type="hidden" name="item_id" value={item.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-teal-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-800"
                  >
                    Add
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
