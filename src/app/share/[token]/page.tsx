import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/color";
import type { SharedLookbook } from "@/lib/types";

type Props = { params: Promise<{ token: string }> };

async function getSharedLookbook(token: string): Promise<SharedLookbook | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_lookbook_by_token", {
    p_token: token,
  });
  return (data as SharedLookbook) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const lookbook = await getSharedLookbook(token);
  return {
    title: lookbook ? lookbook.title : "Lookbook",
    robots: { index: false, follow: false },
  };
}

// Cycling collage layout: varied cell sizes make the board feel hand-arranged
const CELLS = [
  "sm:col-span-3 h-72 sm:h-96",
  "sm:col-span-3 h-64 sm:h-72",
  "sm:col-span-2 h-56 sm:h-64",
  "sm:col-span-2 h-64 sm:h-80",
  "sm:col-span-2 h-56 sm:h-60",
  "sm:col-span-4 h-64 sm:h-80",
  "sm:col-span-2 h-56 sm:h-64",
];

export default async function SharedLookbookPage({ params }: Props) {
  const { token } = await params;
  const lookbook = await getSharedLookbook(token);
  if (!lookbook) notFound();

  const stylistName =
    lookbook.stylist.business_name || lookbook.stylist.full_name || "Your stylist";

  return (
    <main className="min-h-screen bg-cream">
      <header className="px-6 pb-12 pt-16 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.35em] text-taupe-dark">
          {stylistName}
        </p>
        <h1 className="mx-auto mt-5 max-w-3xl font-serif text-5xl font-medium italic tracking-tight text-ink sm:text-6xl">
          {lookbook.title}
        </h1>
        {lookbook.client_name && (
          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-ink/50">
            Curated for {lookbook.client_name}
          </p>
        )}
        {lookbook.description && (
          <p className="mx-auto mt-6 max-w-xl font-serif text-lg italic leading-relaxed text-ink/70">
            {lookbook.description}
          </p>
        )}
        <div className="mx-auto mt-8 h-px w-16 bg-taupe" />
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {lookbook.items.length === 0 ? (
          <p className="text-center text-sm text-ink/60">
            This lookbook doesn&apos;t have any pieces yet — check back soon.
          </p>
        ) : (
          <>
            {/* The look board */}
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-bone sm:p-10">
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-6">
                {lookbook.items.map((item, i) => (
                  <figure key={item.id} className={`flex flex-col ${CELLS[i % CELLS.length]}`}>
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary retailer hosts
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="min-h-0 w-full flex-1 object-contain mix-blend-multiply"
                      />
                    ) : (
                      <div
                        className="flex min-h-0 w-full flex-1 items-center justify-center rounded-xl px-4"
                        style={{ backgroundColor: item.color_hex }}
                      >
                        <span className="text-center font-serif text-lg italic text-white/95 drop-shadow-sm">
                          {item.name}
                        </span>
                      </div>
                    )}
                    <figcaption className="mt-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink/60">
                        {[item.brand, item.name].filter(Boolean).join(" · ")}
                      </p>
                      {item.note && (
                        <p className="mt-1 font-serif text-sm italic leading-snug text-taupe-dark">
                          &ldquo;{item.note}&rdquo;
                        </p>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* Shoppable pieces strip */}
            <div className="mt-14">
              <p className="text-center text-xs font-medium uppercase tracking-[0.3em] text-ink/50">
                The pieces
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {lookbook.items.map((item) => {
                  const card = (
                    <>
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary retailer hosts
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-36 w-full object-contain p-3 mix-blend-multiply"
                        />
                      ) : (
                        <div
                          className="mx-3 mt-3 h-32 rounded-lg"
                          style={{ backgroundColor: item.color_hex }}
                        />
                      )}
                      <div className="border-t border-bone px-3 py-2.5">
                        <p className="truncate text-xs font-medium text-ink">{item.name}</p>
                        <p className="truncate text-[11px] text-ink/50">
                          {[
                            item.brand,
                            item.price_cents !== null ? formatPrice(item.price_cents) : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {item.product_url && (
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-taupe-dark">
                            Shop ↗
                          </p>
                        )}
                      </div>
                    </>
                  );
                  return (
                    <li key={item.id} className="overflow-hidden rounded-xl bg-white ring-1 ring-bone">
                      {item.product_url ? (
                        <a
                          href={item.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block transition-shadow hover:shadow-md"
                        >
                          {card}
                        </a>
                      ) : (
                        card
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-bone py-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/40">
          Shared privately by {stylistName}
        </p>
        <p className="mt-2 text-xs lowercase tracking-widest text-ink/30">hammy</p>
      </footer>
    </main>
  );
}
