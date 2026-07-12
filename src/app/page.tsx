import Link from "next/link";
import { COLOR_FAMILIES } from "@/lib/color";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-xl font-semibold tracking-tight text-teal-700">Hueline</span>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-stone-700 hover:text-stone-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mb-6 flex justify-center gap-1.5">
          {COLOR_FAMILIES.map((f) => (
            <span
              key={f.key}
              className="h-3 w-8 rounded-full"
              style={{ backgroundColor: f.swatch }}
            />
          ))}
        </div>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          The toolbox for modern stylists
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Build branded lookbooks, track client wardrobes, and find pieces by
          exact color — everything you need to run your styling business in one
          place.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="rounded-md bg-teal-700 px-6 py-3 text-base font-medium text-white hover:bg-teal-800"
          >
            Create your stylist account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">Lookbooks</h2>
          <p className="mt-2 text-sm text-stone-600">
            Curate collections with notes and share them with clients through a
            private link — no client login required.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">Color search</h2>
          <p className="mt-2 text-sm text-stone-600">
            Every item is indexed by hue. Filter your library by color family to
            match a client&apos;s palette instantly.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold text-stone-900">Client wardrobes</h2>
          <p className="mt-2 text-sm text-stone-600">
            Track what each client already owns so new recommendations always
            work with their existing wardrobe.
          </p>
        </div>
      </section>
    </main>
  );
}
